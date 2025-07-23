#!/usr/bin/env python3
"""
Knowledge Graph Web Server
Flask server that serves static files and provides HTTP API endpoints
Connects to MCP Memory Server via JSON-RPC over stdio
"""

import json
import subprocess
import os
from flask import Flask, send_from_directory, jsonify, request, send_file
from flask_cors import CORS
from typing import Dict, List, Any

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get the directory where this script is located (web_viewer)
WEB_VIEWER_DIR = os.path.dirname(os.path.abspath(__file__))

class MCPClient:
    """Simple MCP Client for HTTP to JSON-RPC protocol translation"""
    
    def __init__(self):
        self.process = None
        self.connected = False
        self.request_id = 0
        
    def connect(self):
        """Connect to the MCP server"""
        try:
            print("📡 Connecting to MCP Memory Server...")
            
            # Read MCP configuration
            mcp_config_path = os.path.join(os.path.dirname(WEB_VIEWER_DIR), "mcp.json")
            if not os.path.exists(mcp_config_path):
                raise RuntimeError(f"MCP configuration not found at {mcp_config_path}")
            
            print(f"📄 Reading MCP configuration from: {mcp_config_path}")
            with open(mcp_config_path, 'r') as f:
                mcp_config = json.load(f)
            
            # Get memory server configuration
            memory_server_config = mcp_config.get("mcpServers", {}).get("memory")
            if not memory_server_config:
                raise RuntimeError("'memory' server not found in mcp.json")
            
            # Build server command
            server_command = [memory_server_config["command"]] + memory_server_config["args"]
            
            # Set environment variables
            env = os.environ.copy()
            if "env" in memory_server_config:
                env.update(memory_server_config["env"])
            
            # Resolve server path (use forward slashes for cross-platform compatibility)
            server_path = server_command[1]  # First arg is usually the server script
            if not os.path.isabs(server_path):
                # Relative path - resolve relative to mcp.json directory
                server_path = os.path.join(os.path.dirname(mcp_config_path), server_path)
            # Normalize path for the current OS
            server_path = os.path.normpath(server_path)
            server_command[1] = server_path
            
            server_dir = os.path.dirname(server_path)
            
            print(f"📂 Server directory: {server_dir}")
            print(f"🎯 Server command: {' '.join(server_command)}")
            print(f"📄 Memory file: {env.get('MEMORY_FILE_PATH', 'Not set')}")
            
            # Start the MCP server process
            self.process = subprocess.Popen(
                server_command,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=server_dir,
                env=env
            )
            
            # Initialize the MCP connection
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
            
            self._send_request(init_request)
            init_response = self._read_response()
            
            if "error" in init_response:
                raise RuntimeError(f"MCP initialization failed: {init_response['error']}")
            
            # Send initialized notification
            initialized_notification = {
                "jsonrpc": "2.0",
                "method": "notifications/initialized"
            }
            
            self._send_request(initialized_notification)
            
            self.connected = True
            print("✅ Connected to MCP Memory Server")
            
        except Exception as e:
            print(f"❌ Failed to connect to MCP server: {e}")
            if self.process:
                self.process.terminate()
                self.process = None
            raise
            
    def call_tool(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Call a tool on the MCP server via JSON-RPC"""
        if not self.connected:
            raise RuntimeError("Not connected to MCP server")
            
        try:
            # Map our tool names to MCP tool names
            tool_mapping = {
                "memory_read_graph": "read_graph",
                "memory_search_nodes": "search_nodes", 
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
            
            self._send_request(request)
            response = self._read_response()
            
            if "error" in response:
                raise RuntimeError(f"MCP tool call failed: {response['error']}")
            
            # Parse the result
            return self._parse_tool_result(tool_name, response)
            
        except Exception as e:
            print(f"❌ Error calling MCP tool {tool_name}: {e}")
            raise
    
    def _next_id(self) -> int:
        """Get next request ID"""
        self.request_id += 1
        return self.request_id
    
    def _send_request(self, request: Dict[str, Any]) -> None:
        """Send a JSON-RPC request to the MCP server"""
        if not self.process or not self.process.stdin:
            raise RuntimeError("MCP process not available")
            
        request_str = json.dumps(request) + "\n"
        self.process.stdin.write(request_str)
        self.process.stdin.flush()
    
    def _read_response(self) -> Dict[str, Any]:
        """Read a JSON-RPC response from the MCP server"""
        if not self.process or not self.process.stdout:
            raise RuntimeError("MCP process not available")
            
        response_line = self.process.stdout.readline()
        if not response_line:
            raise RuntimeError("No response from MCP server")
            
        try:
            return json.loads(response_line.strip())
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Invalid JSON response: {response_line}, error: {e}")
    
    def _convert_params(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Convert our parameter format to MCP format"""
        # Most tools use the same parameter names, but we can adjust here if needed
        if tool_name == "memory_get_node_relations":
            # Convert node_name to nodeName if needed
            if "node_name" in params:
                return {"nodeName": params["node_name"]}
        
        return params
    
    def _parse_tool_result(self, tool_name: str, response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse MCP tool result into our expected format"""
        if "result" not in response:
            raise RuntimeError("No result in MCP response")
        
        result = response["result"]
        
        # Handle content-based responses (like read_graph)
        if "content" in result:
            content = result["content"]
            if isinstance(content, list) and len(content) > 0:
                # Parse JSON content
                try:
                    return json.loads(content[0]["text"])
                except (json.JSONDecodeError, KeyError, IndexError) as e:
                    raise RuntimeError(f"Failed to parse MCP content: {e}")
        
        # Handle direct JSON responses
        return result
    
    def disconnect(self):
        """Disconnect from the MCP server"""
        if self.process:
            self.process.terminate()
            self.process.wait()
            self.process = None
        self.connected = False

# Global MCP client instance
mcp_client = MCPClient()

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
def search_nodes():
    """Search nodes based on query parameter"""
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({"entities": [], "relations": []})
    
    try:
        search_results = mcp_client.call_tool("memory_search_nodes", {"query": query})
        print(f"✅ Search '{query}': found {len(search_results.get('entities', []))} entities, {len(search_results.get('relations', []))} relations")
        return jsonify(search_results)
    except Exception as e:
        print(f"❌ Error searching nodes: {e}")
        return jsonify({'error': f'Failed to search nodes: {str(e)}'}), 500

@app.route('/api/entity')
def get_entity():
    """Get details for a specific entity"""
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
def get_node_relations():
    """Get all relations for a specific node (Enhanced API)"""
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
            'enhanced_api': True
        }
        
        print(f"✅ Enhanced API: Served relations for '{entity_name}' - {total_relations} total relations")
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Error getting node relations: {e}")
        return jsonify({'error': f'Failed to get node relations: {str(e)}'}), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    try:
        # Test connection to MCP server
        health_result = mcp_client.call_tool("health_check", {})
        
        health_data = {
            "status": "healthy",
            "service": "Knowledge Graph Web Server (MCP Client)",
            "timestamp": "2025-07-09T00:00:00Z",
            "mcp_server": health_result,
            "mcp_client_connected": mcp_client.connected,
            "features": ["memory_read_graph", "memory_search_nodes", "memory_open_nodes", "memory_get_node_relations"],
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
            "service": "Knowledge Graph Web Server (MCP Client)",
            "timestamp": "2025-07-09T00:00:00Z",
            "mcp_server": {"status": "unavailable", "error": str(e)},
            "mcp_client_connected": mcp_client.connected,
            "features": [],
            "endpoints": ["/api/health"]
        }
        return jsonify(health_data), 503

def run_server(host='localhost', port=8080, debug=False):
    """Run the Flask web server"""
    print(f"🚀 Starting Knowledge Graph Web Server on http://{host}:{port}")
    print(f"📂 Serving static files from: {WEB_VIEWER_DIR}")
    print(f"📡 API endpoints available at: http://{host}:{port}/api/")
    print(f"📊 Web interface available at: http://{host}:{port}/")
    print(f"🔧 Available API endpoints:")
    print(f"   GET /api/graph - Full knowledge graph")
    print(f"   GET /api/search?q=query - Search nodes")
    print(f"   GET /api/entity?name=EntityName - Entity details")
    print(f"   GET /api/node-relations?name=EntityName - Enhanced node relations")
    print(f"   GET /api/health - Health check")
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

    parser = argparse.ArgumentParser(description='Knowledge Graph Web Server (MCP Client)')
    parser.add_argument('--host', default='localhost', help='Host to bind to (default: localhost)')
    parser.add_argument('--port', type=int, default=8080, help='Port to bind to (default: 8080)')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')

    args = parser.parse_args()

    print("🚀 Starting Knowledge Graph Web Server (MCP Client)")
    print("📡 This server connects to your MCP Memory Server via JSON-RPC")
    print("✨ Clean architecture: HTTP → JSON-RPC protocol translation")
    
    # Connect to MCP server
    try:
        mcp_client.connect()
        print("✅ MCP Memory Server connection established")
    except Exception as e:
        print(f"❌ Failed to connect to MCP server: {e}")
        print("💡 Make sure the MCP Memory Server is running")
        exit(1)

    run_server(host=args.host, port=args.port, debug=args.debug)
