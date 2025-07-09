# Knowledge Graph Tools

Modern tools for working with your professional knowledge graph using the **MCP Memory Server** and interactive web visualization.

## Overview

This directory provides a complete solution for managing and visualizing your professional network, projects, and relationships through:

- **Direct Memory File Access** - Reads your knowledge graph data from memory.json files
- **Interactive Web Visualization** - Modern D3.js-based graph viewer with real-time data  
- **MCP-Compatible Functions** - Same function interface as MCP Memory Server, but with direct file access
- **RESTful API** - HTTP endpoints for programmatic access

## Quick Start

### Start the Interactive Web Viewer

```powershell
# PowerShell (Recommended)
./start-memory-explorer.ps1

# With custom memory file
./start-memory-explorer.ps1 -MemoryFile "path/to/your/memory.json"
```

**Access Points:**
- **Web Interface:** http://localhost:8080
- **REST API:** http://localhost:8080/api

## Interactive Web Viewer

### 🌐 Features

- **Real-time data** from your memory.json file
- **Interactive D3.js visualization** with force-directed layout
- **Entity-centered views** - click any entity to re-center the graph
- **Live search** - find entities by name, type, or content
- **Multi-select filtering** - filter by entity types with checkboxes
- **Refresh capability** - reload data from memory file without page refresh
- **Professional styling** - modern, responsive UI design

### 🔧 Components

- `index.html` - Main web interface
- `main.js` - Application logic and UI handling
- `graph.js` - D3.js visualization engine
- `mcp-data.js` - MCP Data Provider with real API integration
- `mcp_data_server.py` - Python HTTP server providing MCP data via REST API

## Memory File Functions (MCP-Compatible)

### Core Functions

These functions work exactly like MCP Memory Server functions, but read directly from your memory.json file:

- `mcp_memory_search_nodes(query)` - Search for entities and relations in memory file
- `mcp_memory_read_graph()` - Get the complete knowledge graph from memory file  
- `mcp_memory_open_nodes([entity_names])` - Get specific entities from memory file
- `mcp_memory_get_node_relations(entity_name)` - **Enhanced!** Get all relations for a specific entity

### Management Functions

- `mcp_memory_create_entities(entities)` - Add new entities
- `mcp_memory_create_relations(relations)` - Add new relationships
- `mcp_memory_add_observations(observations)` - Add observations to entities
- `mcp_memory_delete_entities(entity_names)` - Remove entities
- `mcp_memory_delete_relations(relations)` - Remove relationships

## Python Helper Tools

### 📁 `mcp_helpers.py`

Utility functions for processing and formatting MCP memory data:

- `format_mcp_search_results()` - Format search results for display
- `get_entity_connections()` - Extract connections for an entity
- `format_entity_connections()` - Format connections for display
- `generate_mermaid_diagram()` - Create Mermaid diagrams
- `print_graph_stats()` - Display graph statistics

### 📁 `demo_mcp_helpers.py`

Working examples demonstrating the helper functions with sample data.

### 📁 `mcp_kg_query.py`

Structured interface for common MCP memory operations and queries.

## API Endpoints

When the Memory Explorer is running (via startup script), the following REST API endpoints are available:

- `GET /api/graph` - Full knowledge graph (entities and relations)
- `GET /api/search?q=query` - Search entities by name, type, or content
- `GET /api/entity?name=EntityName` - Get specific entity details and relations
- `GET /api/health` - Server health check and status

## Usage Examples

### 1. Start the Web Viewer

```powershell
./start-memory-explorer.ps1
```

Open http://localhost:8080 to access the interactive visualization.

### 2. Search for Entities (Python)

```python
# Search for all entities related to "Microsoft"
results = mcp_memory_search_nodes("Microsoft")
print(format_mcp_search_results(results, "Microsoft"))
```

### 3. Get Entity Connections (Python)

```python
# Get connections for a specific person
graph_data = mcp_memory_read_graph()
connections = get_entity_connections(graph_data, "Your Name")
print(format_entity_connections(connections, "Your Name"))
```

### 4. API Access (HTTP)

```bash
# Get full graph data
curl http://localhost:8080/api/graph

# Search for entities
curl "http://localhost:8080/api/search?q=automotive"

# Get specific entity
curl "http://localhost:8080/api/entity?name=Your%20Name"
```

## Benefits

- **Live Data Access** - Always current information from your memory.json file
- **Interactive Visualization** - Modern web interface for exploring connections  
- **Enhanced Graph Traversal** - Advanced `get_node_relations` function for better entity exploration
- **Programmatic Access** - Python functions and HTTP API for automation
- **Rich Querying** - Advanced search and filtering capabilities
- **No External Dependencies** - Works directly with memory files, no MCP server needed


## Architecture & Setup

This project provides a web-based visualization for knowledge graphs stored in MCP Memory Server format.

### Current Implementation

**Simple & Effective Architecture:**

```text
memory.json → Python API → Web Interface
```

1. **Data Storage**: `memory.json` file (JSONL format) containing entities and relations
2. **Python API Layer**: `mcp_memory_functions.py` - Direct file access with MCP-compatible functions
3. **Web Server**: `unified_server.py` - Flask server providing both static files and API endpoints
4. **Frontend**: Interactive D3.js-based graph visualization

### Key Features

✅ **All MCP Memory Functions**: Read graph, search nodes, get relations, entity details
✅ **Enhanced Graph Traversal**: `get_node_relations` for discovering entity connections
✅ **Live Web Interface**: Real-time interactive visualization
✅ **RESTful API**: HTTP endpoints for integration
✅ **Direct File Access**: Fast, simple, no complex MCP client needed

### Available API Endpoints

- `GET /api/graph` - Full knowledge graph
- `GET /api/search?q=query` - Search nodes
- `GET /api/entity?name=EntityName` - Entity details
- `GET /api/node-relations?name=EntityName` - **Enhanced**: Get all relations for a specific node
- `GET /api/health` - Health check

### Data Source

The system reads from your existing `memory.json` file (JSONL format). You can use any MCP Memory Server to create and maintain this file, or work with it directly.

**Compatible with:**

- Original MCP Memory Server
- Enhanced MCP Memory Server (with additional features)
- Direct memory.json file manipulation
- Any JSONL-formatted knowledge graph data

## Documentation

- `web_viewer/MCP_INTEGRATION.md` - Detailed implementation information
- `MCP_IMPLEMENTATION_COMPLETE.md` - Complete development summary
- `STARTUP_CLEANUP.md` - Information about simplified startup process
