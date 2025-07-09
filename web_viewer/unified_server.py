#!/usr/bin/env python3
"""
Unified Knowledge Graph Web Server
Single Flask server that serves both static files and MCP API endpoints
Connects to MCP Memory Server for real-time data access
"""

import json
import sys
import os
from flask import Flask, send_from_directory, jsonify, request, send_file
from flask_cors import CORS
import asyncio
from typing import Dict, List, Any

# Add the parent directory to the path so we can import mcp functions
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get the directory where this script is located (web_viewer)
WEB_VIEWER_DIR = os.path.dirname(os.path.abspath(__file__))

class MCPInterface:
    """Interface to MCP Memory Server - connects to running MCP server"""
    def __init__(self, mcp_server_available=True):
        self.mcp_server_available = mcp_server_available
        # In a real implementation, you'd check for MCP server availability here
        
    def read_memory_json(self) -> Dict[str, Any]:
        """Get the complete knowledge graph from MCP server"""
        try:
            # Use the MCP memory function that should be available
            if hasattr(self, '_test_mode') and self._test_mode:
                return self._get_test_data()
            
            # Try to call the MCP server function
            # This should call mcp_memory_read_graph() when properly connected
            try:
                from mcp_memory_functions import mcp_memory_read_graph
                result = mcp_memory_read_graph()
                print(f"📡 Retrieved {len(result.get('entities', []))} entities and {len(result.get('relations', []))} relations from MCP server")
                return result
            except ImportError:
                print("⚠️  MCP functions not available - falling back to direct file access")
                return self._read_file_fallback()
                
        except Exception as e:
            print(f"❌ Error reading from MCP server: {e}")
            return self._read_file_fallback()
    
    def search_nodes(self, query: str) -> Dict[str, Any]:
        """Search nodes using MCP server"""
        try:
            # Try to call the MCP server function
            try:
                from mcp_memory_functions import mcp_memory_search_nodes
                result = mcp_memory_search_nodes(query)
                print(f"📡 MCP search '{query}': found {len(result.get('entities', []))} entities, {len(result.get('relations', []))} relations")
                return result
            except ImportError:
                print("⚠️  MCP search not available - using local search")
                return self._search_fallback(query)
                
        except Exception as e:
            print(f"❌ Error searching MCP server: {e}")
            return self._search_fallback(query)
    
    def get_entity_details(self, entity_name: str) -> Dict[str, Any]:
        """Get entity details and relations using MCP server"""
        try:
            # Try to use enhanced get_node_relations function
            try:
                from mcp_memory_functions import mcp_memory_open_nodes, mcp_memory_get_node_relations
                # First get the entity
                open_result = mcp_memory_open_nodes([entity_name])
                entity = None
                if open_result.get('entities'):
                    entity = open_result['entities'][0]
                
                # Try to get relations using enhanced function
                try:
                    relations_result = mcp_memory_get_node_relations(entity_name)
                    relations = relations_result.get('outgoing', []) + relations_result.get('incoming', [])
                    print(f"📡 Enhanced: Retrieved entity '{entity_name}' with {len(relations)} relations")
                except:
                    # Fallback to open_nodes relations
                    relations = open_result.get('relations', [])
                    print(f"📡 Standard: Retrieved entity '{entity_name}' with {len(relations)} relations")
                
                return {
                    'entity': entity,
                    'relations': relations
                }
            except ImportError:
                print("⚠️  MCP functions not available - using fallback")
                return self._get_entity_fallback(entity_name)
                
        except Exception as e:
            print(f"❌ Error getting entity details from MCP server: {e}")
            return self._get_entity_fallback(entity_name)
    
    def _read_file_fallback(self) -> Dict[str, Any]:
        """Fallback to reading memory.json directly"""
        entities = []
        relations = []
        
        # Try to find memory.json in common locations
        possible_paths = [
            os.path.join(os.path.dirname(os.path.dirname(WEB_VIEWER_DIR)), 'memory.json'),
            os.path.join(os.path.dirname(WEB_VIEWER_DIR), 'memory.json'),
            'memory.json'
        ]
        
        for memory_file in possible_paths:
            if os.path.exists(memory_file):
                try:
                    with open(memory_file, 'r', encoding='utf-8') as f:
                        for line in f:
                            line = line.strip()
                            if line:
                                item = json.loads(line)
                                if item.get('type') == 'entity':
                                    entities.append({
                                        'name': item['name'],
                                        'entityType': item['entityType'],
                                        'observations': item.get('observations', [])
                                    })
                                elif item.get('type') == 'relation':
                                    relations.append({
                                        'from': item['from'],
                                        'to': item['to'],
                                        'relationType': item['relationType']
                                    })
                    
                    print(f"📁 Fallback: Read {len(entities)} entities and {len(relations)} relations from {memory_file}")
                    break
                    
                except Exception as e:
                    print(f"❌ Error reading {memory_file}: {e}")
        
        return {
            'entities': entities,
            'relations': relations
        }
    
    def _search_fallback(self, query: str) -> Dict[str, Any]:
        """Fallback search using local data"""
        full_graph = self._read_file_fallback()
        query_lower = query.lower()
        
        # Filter entities
        matching_entities = []
        for entity in full_graph['entities']:
            if (query_lower in entity['name'].lower() or 
                query_lower in entity['entityType'].lower() or
                any(query_lower in obs.lower() for obs in entity.get('observations', []))):
                matching_entities.append(entity)
        
        # Filter relations involving matching entities
        entity_names = {e['name'] for e in matching_entities}
        matching_relations = []
        for rel in full_graph['relations']:
            if rel['from'] in entity_names and rel['to'] in entity_names:
                matching_relations.append(rel)
        
        return {
            'entities': matching_entities,
            'relations': matching_relations
        }
    
    def _get_entity_fallback(self, entity_name: str) -> Dict[str, Any]:
        """Fallback to get entity details from local data"""
        full_graph = self._read_file_fallback()
        
        # Find the entity
        entity = None
        for e in full_graph['entities']:
            if e['name'] == entity_name:
                entity = e
                break
        
        # Find relations involving this entity
        relations = []
        for rel in full_graph['relations']:
            if rel['from'] == entity_name or rel['to'] == entity_name:
                relations.append(rel)
        
        return {
            'entity': entity,
            'relations': relations
        }

# Initialize MCP interface (will be overwritten in __main__ if run as script)
mcp = None

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
        graph_data = mcp.read_memory_json()
        print(f"✅ Served full knowledge graph: {len(graph_data['entities'])} entities, {len(graph_data['relations'])} relations")
        return jsonify(graph_data)
    except Exception as e:
        print(f"❌ Error serving full graph: {e}")
        return jsonify({'error': 'Failed to load graph data'}), 500

@app.route('/api/search')
def search_nodes():
    """Search nodes based on query parameter"""
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({"entities": [], "relations": []})
    
    try:
        search_results = mcp.search_nodes(query)
        print(f"✅ Search '{query}': found {len(search_results['entities'])} entities, {len(search_results['relations'])} relations")
        return jsonify(search_results)
    except Exception as e:
        print(f"❌ Error searching nodes: {e}")
        return jsonify({'error': 'Failed to search nodes'}), 500

@app.route('/api/entity')
def get_entity():
    """Get details for a specific entity"""
    entity_name = request.args.get('name', '')
    
    if not entity_name:
        return jsonify({'error': 'Entity name required'}), 400
    
    try:
        entity_data = mcp.get_entity_details(entity_name)
        
        if not entity_data['entity']:
            return jsonify({'error': f'Entity not found: {entity_name}'}), 404
        
        print(f"✅ Served entity details for '{entity_name}' with {len(entity_data['relations'])} relations")
        return jsonify(entity_data)
    except Exception as e:
        print(f"❌ Error getting entity details: {e}")
        return jsonify({'error': 'Failed to get entity details'}), 500

@app.route('/api/node-relations')
def get_node_relations():
    """Get all relations for a specific node (Enhanced API)"""
    entity_name = request.args.get('name', '')
    
    if not entity_name:
        return jsonify({'error': 'Entity name required'}), 400
    
    try:
        from mcp_memory_functions import mcp_memory_get_node_relations
        
        relations_data = mcp_memory_get_node_relations(entity_name)
        
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
        
    except ImportError:
        print("⚠️  Enhanced get_node_relations not available")
        return jsonify({'error': 'Enhanced API not available'}), 503
    except Exception as e:
        print(f"❌ Error getting node relations: {e}")
        return jsonify({'error': 'Failed to get node relations'}), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    try:
        from mcp_memory_functions import mcp_server_health_check
        mcp_health = mcp_server_health_check()
        
        health_data = {
            "status": "healthy",
            "service": "Knowledge Graph Web Server (MCP Enhanced)",
            "timestamp": "2025-07-09T00:00:00Z",
            "mcp_server": mcp_health,
            "enhanced_api": True,
            "features": ["get_node_relations", "search_nodes", "read_graph", "open_nodes"],
            "endpoints": [
                "/api/graph",
                "/api/search",
                "/api/entity", 
                "/api/node-relations",
                "/api/health"
            ]
        }
    except ImportError:
        health_data = {
            "status": "degraded",
            "service": "Knowledge Graph Web Server (Fallback Mode)",
            "timestamp": "2025-07-09T00:00:00Z",
            "mcp_server": {"status": "unavailable", "connected": False},
            "enhanced_api": False,
            "features": ["file_fallback"],
            "endpoints": ["/api/graph", "/api/search", "/api/entity", "/api/health"]
        }
    
    return jsonify(health_data)

def run_server(host='localhost', port=8080, debug=False):
    """Run the unified Flask server"""
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

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Knowledge Graph Web Server (MCP Enhanced)')
    parser.add_argument('--host', default='localhost', help='Host to bind to (default: localhost)')
    parser.add_argument('--port', type=int, default=8080, help='Port to bind to (default: 8080)')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--mcp-server', action='store_true', help='Use MCP server connection (default: true)')
    parser.add_argument('--fallback-only', action='store_true', help='Use only file fallback mode')

    args = parser.parse_args()

    print("🚀 Starting Knowledge Graph Web Server (MCP Enhanced)")
    print("📡 This server connects to your MCP Memory Server")
    print("✨ Enhanced with get_node_relations functionality")
    
    if args.fallback_only:
        print("⚠️  Running in fallback mode (file access only)")
    
    # Initialize MCP interface
    mcp_interface = MCPInterface(mcp_server_available=not args.fallback_only)
    
    # Set the global 'mcp' variable used by Flask routes
    globals()['mcp'] = mcp_interface

    run_server(host=args.host, port=args.port, debug=args.debug)
