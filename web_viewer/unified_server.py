#!/usr/bin/env python3
"""
Unified Knowledge Graph Web Server
Single Flask server that serves both static files and MCP API endpoints
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
    """Interface to MCP Memory Server functions"""
    def __init__(self, memory_file):
        self.memory_file = memory_file
    
    def read_memory_json(self) -> Dict[str, Any]:
        """Read and parse memory.json file"""
        entities = []
        relations = []
        
        try:
            with open(self.memory_file, 'r', encoding='utf-8') as f:
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
            
            print(f"📁 Read {len(entities)} entities and {len(relations)} relations from memory.json")
            
        except Exception as e:
            print(f"❌ Error reading memory.json: {e}")
        
        return {
            'entities': entities,
            'relations': relations
        }
    
    def search_nodes(self, query: str) -> Dict[str, Any]:
        """Search nodes based on query"""
        full_graph = self.read_memory_json()
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
            if rel['from'] in entity_names or rel['to'] in entity_names:
                matching_relations.append(rel)
        
        return {
            'entities': matching_entities,
            'relations': matching_relations
        }
    
    def get_entity_details(self, entity_name: str) -> Dict[str, Any]:
        """Get details for a specific entity"""
        full_graph = self.read_memory_json()
        
        entity = next((e for e in full_graph['entities'] if e['name'] == entity_name), None)
        if not entity:
            return {"entity": None, "relations": []}
        
        # Get relations involving this entity
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

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    health_data = {
        "status": "healthy",
        "service": "Knowledge Graph Web Server",
        "timestamp": "2025-07-08T00:00:00Z",
        "mcp_available": True,
        "memory_file": os.path.exists(mcp.memory_file)
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
    print(f"   GET /api/health - Health check")
    print(f"🔄 Press Ctrl+C to stop")
    
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        print(f"\n🛑 Knowledge Graph Web Server stopped")

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Knowledge Graph Web Server')
    parser.add_argument('--host', default='localhost', help='Host to bind to (default: localhost)')
    parser.add_argument('--port', type=int, default=8080, help='Port to bind to (default: 8080)')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--memory-file', default=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(WEB_VIEWER_DIR))), 'memory.json'), help='Path to memory.json file')

    args = parser.parse_args()


    # Pass the memory file path to MCPInterface
    mcp_interface = MCPInterface(memory_file=args.memory_file)
    # Set the global 'mcp' variable used by Flask routes
    globals()['mcp'] = mcp_interface

    run_server(host=args.host, port=args.port, debug=args.debug)
