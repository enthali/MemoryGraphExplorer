#!/usr/bin/env python3
"""
Knowledge Graph Web Server (HTTP Version)
Flask server that serves static files and provides HTTP API endpoints
Connects to MCP Memory Server via StreamableHTTP interface
"""

import json
import requests
import os
import uuid
from flask import Flask, send_from_directory, jsonify, request, send_file, Response, make_response
from flask_cors import CORS
from typing import Dict, List, Any

# Import authentication middleware
from auth import require_auth, require_admin, auth_manager

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get the directory where this script is located (web_viewer)
WEB_VIEWER_DIR = os.path.dirname(os.path.abspath(__file__))

class MCPHTTPClient:
    """MCP Client for StreamableHTTP protocol"""
    
    def __init__(self, base_url: str = None):
        # Allow overriding the MCP server URL via environment variable for Docker/Compose
        env_url = os.environ.get('MCP_SERVER_URL')
        if env_url:
            self.base_url = env_url
        else:
            self.base_url = base_url or "http://localhost:3001/mcp"
        self.session_id = None
        self.session = requests.Session()
        self.connected = False
        self.request_id = 0
        
        # Configure session with reasonable timeouts
        self.session.timeout = 30
        
    def connect(self):
        """Initialize connection to the StreamableHTTP MCP server"""
        try:
            print("📡 Connecting to StreamableHTTP MCP Memory Server...")
            
            # Initialize a new session with the MCP server
            init_request = {
                "jsonrpc": "2.0",
                "id": self._next_id(),
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "clientInfo": {
                        "name": "web-server-client",
                        "version": "1.0.0"
                    }
                }
            }
            
            # POST request to initialize session
            response = self.session.post(
                self.base_url,
                json=init_request,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json, text/event-stream"
                },
                timeout=10
            )
            
            if response.status_code not in [200, 202]:
                raise RuntimeError(f"HTTP {response.status_code}: {response.text}")
            
            # Parse SSE response format
            init_response = self._parse_sse_response(response.text)
            
            if init_response and "error" in init_response:
                raise RuntimeError(f"MCP initialization failed: {init_response['error']}")
            
            # Extract session ID from response headers
            self.session_id = response.headers.get('mcp-session-id')
            if not self.session_id:
                # Generate a session ID if not provided
                self.session_id = str(uuid.uuid4())
                print(f"🆔 Generated session ID: {self.session_id}")
            
            # Send initialized notification
            initialized_notification = {
                "jsonrpc": "2.0",
                "method": "notifications/initialized"
            }
            
            # Notifications don't expect a response, so we don't parse the result
            self._send_notification(initialized_notification)
            
            self.connected = True
            print(f"✅ Connected to StreamableHTTP MCP Server (session: {self.session_id})")
            print(f"🌐 Base URL: {self.base_url}")
            
        except Exception as e:
            print(f"❌ Failed to connect to MCP server: {e}")
            self.connected = False
            raise
            
    def _next_id(self) -> int:
        """Generate next request ID"""
        self.request_id += 1
        return self.request_id
        
    def _send_notification(self, notification: Dict[str, Any]):
        """Send a notification to the MCP server"""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        }
        
        if self.session_id:
            headers["mcp-session-id"] = self.session_id
        
        response = self.session.post(
            self.base_url,
            json=notification,
            headers=headers,
            timeout=10
        )
        
        if response.status_code not in [200, 202]:
            raise RuntimeError(f"HTTP {response.status_code}: {response.text}")
    
    def _parse_sse_response(self, sse_text: str) -> Dict[str, Any]:
        """Parse Server-Sent Events response format"""
        # Handle empty responses (like notifications)
        if not sse_text.strip():
            return {}
            
        lines = sse_text.strip().split('\n')
        data_line = None
        
        for line in lines:
            if line.startswith('data: '):
                data_line = line[6:]  # Remove 'data: ' prefix
                break
        
        if not data_line:
            # Return empty dict for notifications or empty responses
            return {}
        
        try:
            return json.loads(data_line)
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Failed to parse JSON from SSE data: {data_line}, error: {e}")
            
    def call_tool(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Call a tool on the MCP server via StreamableHTTP"""
        if not self.connected:
            raise RuntimeError("Not connected to MCP server")
            
        try:
            # Map our tool names to MCP tool names
            tool_mapping = {
                "memory_read_graph": "read_graph",
                "memory_search_nodes": "search_nodes",
                "memory_search_graph": "search_graph",  # NEW comprehensive search tool
                "memory_open_nodes": "open_nodes",
                "memory_get_node_relations": "get_node_relations",
                "health_check": "read_graph"  # Use read_graph as health check
            }
            
            mcp_tool_name = tool_mapping.get(tool_name, tool_name)
            
            # Convert params to MCP format
            mcp_params = self._convert_params(tool_name, params)
            
            request = {
                "jsonrpc": "2.0",
                "id": self._next_id(),
                "method": "tools/call",
                "params": {
                    "name": mcp_tool_name,
                    "arguments": mcp_params
                }
            }
            
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream"
            }
            
            if self.session_id:
                headers["mcp-session-id"] = self.session_id
            
            print(f"🔧 Calling tool: {mcp_tool_name} with params: {mcp_params}")
            
            response = self.session.post(
                self.base_url,
                json=request,
                headers=headers,
                timeout=30
            )
            
            if response.status_code not in [200, 202]:
                raise RuntimeError(f"HTTP {response.status_code}: {response.text}")
                
            # Parse SSE response format
            response_data = self._parse_sse_response(response.text)
            
            if response_data and "error" in response_data:
                raise RuntimeError(f"MCP tool call failed: {response_data['error']}")
                
            # Extract result from the response
            if "result" in response_data:
                tool_result = response_data["result"]
                if "content" in tool_result and tool_result["content"]:
                    # Parse the JSON content from the tool response
                    content_text = tool_result["content"][0]["text"]
                    parsed_result = json.loads(content_text)
                    print(f"✅ Tool {mcp_tool_name} completed successfully")
                    return parsed_result
                else:
                    print(f"✅ Tool {mcp_tool_name} completed (empty result)")
                    return {}
            elif response_data:
                # Some tools might return results directly
                print(f"✅ Tool {mcp_tool_name} completed with direct result")
                return response_data
            else:
                print(f"✅ Tool {mcp_tool_name} completed (no response data)")
                return {}
                
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Failed to parse JSON response: {e}")
        except requests.RequestException as e:
            raise RuntimeError(f"HTTP request failed: {e}")
        except Exception as e:
            print(f"❌ Tool call failed: {e}")
            raise RuntimeError(f"Tool call failed: {e}")
            
    def _convert_params(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Convert our parameter format to MCP format"""
        # Most tools use the same parameter names, but we can adjust here if needed
        if tool_name == "memory_get_node_relations":
            # Convert node_name to nodeName if needed
            if "node_name" in params:
                return {"nodeName": params["node_name"]}
        
        return params
    
    def disconnect(self):
        """Disconnect from the MCP server"""
        self.connected = False
        self.session.close()

# Global MCP client instance
mcp_client = MCPHTTPClient()

# Static file routes
@app.route('/')
def index():
    """Serve the main HTML file"""
    return send_file(os.path.join(WEB_VIEWER_DIR, 'index.html'))

@app.route('/<path:filename>')
def static_files(filename):
    """Serve static files (CSS, JS, etc.)"""
    try:
        return send_from_directory(WEB_VIEWER_DIR, filename)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

# API routes
@app.route('/api/graph')
@require_auth('read')  # Graph data requires read permission
def get_full_graph():
    """Get the complete knowledge graph"""
    try:
        graph_data = mcp_client.call_tool("memory_read_graph", {})
        print(f"✅ Served full knowledge graph: {len(graph_data.get('entities', []))} entities, {len(graph_data.get('relations', []))} relations")
        return jsonify(graph_data)
    except Exception as e:
        print(f"❌ Error serving full graph: {e}")
        return jsonify({'error': f'Failed to load graph data: {str(e)}'}), 500

@app.route('/api/search')
@require_auth('read')  # Search requires read permission
def search_graph():
    """Search graph for entities and relations based on query parameter"""
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({"entities": [], "relations": []})
    
    try:
        search_results = mcp_client.call_tool("memory_search_graph", {"query": query})
        print(f"✅ Search '{query}': found {len(search_results.get('entities', []))} entities, {len(search_results.get('relations', []))} relations")
        return jsonify(search_results)
    except Exception as e:
        print(f"❌ Error searching graph: {e}")
        return jsonify({'error': f'Failed to search graph: {str(e)}'}), 500

@app.route('/api/entity')
@require_auth('read')
def get_entity():
    """Get details for a specific entity (requires authentication with 'read' permission)"""
    entity_name = request.args.get('name', '')
    
    if not entity_name:
        return jsonify({'error': 'Entity name required'}), 400
    
    try:
        # Get entity details using open_nodes
        open_result = mcp_client.call_tool("memory_open_nodes", {"names": [entity_name]})
        entity = None
        if open_result.get('entities'):
            entity = open_result['entities'][0]
        
        # Get relations using get_node_relations
        relations_result = mcp_client.call_tool("memory_get_node_relations", {"node_name": entity_name})
        relations = relations_result.get('outgoing', []) + relations_result.get('incoming', [])
        
        if not entity:
            return jsonify({'error': f'Entity not found: {entity_name}'}), 404
        
        entity_data = {
            'entity': entity,
            'relations': relations
        }
        
        print(f"✅ Served entity details for '{entity_name}' with {len(relations)} relations")
        return jsonify(entity_data)
    except Exception as e:
        print(f"❌ Error getting entity details: {e}")
        return jsonify({'error': f'Failed to get entity details: {str(e)}'}), 500

@app.route('/api/node-relations')
@require_auth('read')
def get_node_relations():
    """Get all relations for a specific node - Enhanced API (requires authentication with 'read' permission)"""
    entity_name = request.args.get('name', '')
    
    if not entity_name:
        return jsonify({'error': 'Entity name required'}), 400
    
    try:
        relations_data = mcp_client.call_tool("memory_get_node_relations", {"node_name": entity_name})
        
        # Add some metadata
        total_relations = len(relations_data.get('outgoing', [])) + len(relations_data.get('incoming', []))
        
        response = {
            'entity_name': entity_name,
            'outgoing_relations': relations_data.get('outgoing', []),
            'incoming_relations': relations_data.get('incoming', []),
            'connected_entities': relations_data.get('connected_entities', []),
            'total_relations': total_relations,
            'enhanced_api': True,
            'transport': 'StreamableHTTP'
        }
        
        print(f"✅ Enhanced API: Served relations for '{entity_name}' - {total_relations} total relations")
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Error getting node relations: {e}")
        return jsonify({'error': f'Failed to get node relations: {str(e)}'}), 500

@app.route('/api/health')
@require_auth('read')
def health_check():
    """Health check endpoint (requires authentication with 'read' permission)"""
    try:
        # Test connection to MCP server
        health_result = mcp_client.call_tool("health_check", {})
        
        health_data = {
            "status": "healthy",
            "service": "Knowledge Graph Web Server (StreamableHTTP)",
            "timestamp": "2025-07-23T00:00:00Z",
            "transport": "StreamableHTTP",
            "mcp_server_url": mcp_client.base_url,
            "mcp_server": health_result,
            "mcp_client_connected": mcp_client.connected,
            "session_id": mcp_client.session_id,
            "features": ["memory_read_graph", "memory_search_nodes", "memory_search_graph", "memory_open_nodes", "memory_get_node_relations"],
            "endpoints": [
                "/api/graph",
                "/api/search",
                "/api/entity", 
                "/api/node-relations",
                "/api/health"
            ]
        }
        return jsonify(health_data)
        
    except Exception as e:
        health_data = {
            "status": "unhealthy",
            "service": "Knowledge Graph Web Server (StreamableHTTP)",
            "timestamp": "2025-07-23T00:00:00Z",
            "transport": "StreamableHTTP",
            "mcp_server_url": mcp_client.base_url,
            "mcp_server": {"status": "unavailable", "error": str(e)},
            "mcp_client_connected": mcp_client.connected,
            "session_id": mcp_client.session_id,
            "features": [],
            "endpoints": ["/api/health"]
        }
        return jsonify(health_data), 503

# MCP Proxy Route (Phase 1 Implementation)
@app.route('/mcp', methods=['GET', 'POST', 'OPTIONS'])
@app.route('/mcp/<path:subpath>', methods=['GET', 'POST', 'OPTIONS'])
@require_auth('read')  # MCP requires at least read permission
def mcp_proxy(subpath=''):
    """
    Proxy MCP StreamableHTTP requests to internal MCP server
    Maintains streaming, headers, and MCP protocol compatibility
    
    Authentication: Requires API key with 'read' permission
    """
    
    # Handle CORS preflight for MCP clients
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response
    
    # Construct internal MCP server URL
    # Prefer an explicit env override (useful for compose service names),
    # otherwise fall back to the MCP client base URL (already configured at startup).
    internal_url = os.environ.get('MCP_PROXY_INTERNAL_URL') or getattr(mcp_client, 'base_url', None) or 'http://localhost:3001/mcp'
    # Ensure no duplicate slashes and append subpath when provided
    internal_url = internal_url.rstrip('/')
    if subpath:
        internal_url = f"{internal_url}/{subpath}"
    
    try:
        # Forward request with streaming support
        resp = requests.request(
            method=request.method,
            url=internal_url,
            # Iterate header pairs and drop Host before forwarding
            headers={k: v for k, v in request.headers.items() if k.lower() != 'host'},
            data=request.get_data(),
            params=request.args,
            stream=True,  # Critical for StreamableHTTP
            timeout=30
        )
        
        # Handle Authorization header validation if tokens are present
        auth_header = request.headers.get('Authorization')
        if auth_header:
            # For Phase 1, we just pass through the auth header
            # Future phases can add token validation here
            print(f"🔐 MCP request with Authorization header detected")
            
        # Stream response back to client
        def generate():
            for chunk in resp.iter_content(chunk_size=1024):
                if chunk:
                    yield chunk
                    
        return Response(
            generate(),
            status=resp.status_code,
            headers=dict(resp.headers)
        )
        
    except Exception as e:
        print(f"❌ MCP proxy error: {e}")
        return jsonify({
            "error": f"MCP proxy error: {str(e)}",
            "internal_url": internal_url
        }), 500

def run_server(host='localhost', port=8080, debug=False):
    """Run the Flask web server"""
    print(f"🚀 Starting Knowledge Graph Web Server (StreamableHTTP) on http://{host}:{port}")
    print(f"📂 Serving static files from: {WEB_VIEWER_DIR}")
    print(f"📡 API endpoints available at: http://{host}:{port}/api/")
    print(f"📊 Web interface available at: http://{host}:{port}/")
    print(f"🌐 MCP Server URL: {mcp_client.base_url}")
    print(f"🔧 Available API endpoints:")
    print(f"   GET /api/graph - Full knowledge graph")
    print(f"   GET /api/search?q=query - Search nodes")
    print(f"   GET /api/entity?name=EntityName - Entity details")
    print(f"   GET /api/node-relations?name=EntityName - Enhanced node relations")
    print(f"   GET /api/health - Health check")
    print(f"   POST /mcp - MCP proxy to internal server (Phase 1)")
    print(f"🔄 Press Ctrl+C to stop")
    
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        print(f"\n🛑 Knowledge Graph Web Server stopped")
    finally:
        # Clean up MCP connection
        print("🧹 Cleaning up MCP connection...")
        mcp_client.disconnect()
        print("✅ Cleanup complete")

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Knowledge Graph Web Server (StreamableHTTP)')
    parser.add_argument('--host', default='localhost', help='Host to bind to (default: localhost)')
    parser.add_argument('--port', type=int, default=8080, help='Port to bind to (default: 8080)')
    parser.add_argument('--mcp-url', default='http://localhost:3001/mcp', help='MCP server URL (default: http://localhost:3001/mcp)')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')

    args = parser.parse_args()

    print("🚀 Starting Knowledge Graph Web Server (StreamableHTTP)")
    print("📡 This server connects to your MCP Memory Server via StreamableHTTP")
    print("✨ Modern architecture: HTTP → StreamableHTTP protocol")
    
    # Initialize MCP client with custom URL if provided
    mcp_client = MCPHTTPClient(args.mcp_url)
    
    # Connect to MCP server
    try:
        mcp_client.connect()
        print("✅ StreamableHTTP MCP Memory Server connection established")
    except Exception as e:
        print(f"❌ Failed to connect to MCP server: {e}")
        print("💡 Make sure the StreamableHTTP MCP Memory Server is running on port 3001")
        print("💡 You can start it with: docker-compose up -d")
        exit(1)

    run_server(host=args.host, port=args.port, debug=args.debug)
