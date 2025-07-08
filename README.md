# Knowledge Graph Tools

Modern tools for working with your professional knowledge graph using the **MCP Memory Server** and interactive web visualization.

## Overview

This directory provides a complete solution for managing and visualizing your professional network, projects, and relationships through:

- **MCP Memory Server Integration** - Direct access to your knowledge graph data
- **Interactive Web Visualization** - Modern D3.js-based graph viewer with real-time data
- **Helper Functions** - Python utilities for data processing and analysis
- **RESTful API** - HTTP endpoints for programmatic access

## Quick Start

### Start the Interactive Web Viewer

```powershell
# PowerShell (Recommended)
./start-mcp-web-viewer.ps1

# Command Prompt / Batch
start-mcp-web-viewer.bat
```

**Access Points:**
- **Web Interface:** http://localhost:8080
- **MCP API:** http://localhost:8080/api

## Interactive Web Viewer

### 🌐 Features

- **Real-time data** from your MCP Memory Server
- **Interactive D3.js visualization** with force-directed layout
- **Entity-centered views** - click any entity to re-center the graph
- **Live search** - find entities by name, type, or content
- **Multi-select filtering** - filter by entity types with checkboxes
- **Refresh capability** - reload data from MCP server without page refresh
- **Professional styling** - modern, responsive UI design

### 🔧 Components

- `index.html` - Main web interface
- `main.js` - Application logic and UI handling
- `graph.js` - D3.js visualization engine
- `mcp-data.js` - MCP Data Provider with real API integration
- `mcp_data_server.py` - Python HTTP server providing MCP data via REST API

## MCP Memory Server Functions

### Core Functions

- `mcp_memory_search_nodes(query)` - Search for entities and relations
- `mcp_memory_read_graph()` - Get the complete knowledge graph
- `mcp_memory_open_nodes([entity_names])` - Get specific entities

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

When the MCP Data Server is running (via startup scripts), the following REST API endpoints are available:

- `GET /api/graph` - Full knowledge graph (entities and relations)
- `GET /api/search?q=query` - Search entities by name, type, or content
- `GET /api/entity?name=EntityName` - Get specific entity details and relations
- `GET /api/health` - Server health check and status

## Usage Examples

### 1. Start the Web Viewer

```powershell
./start-mcp-web-viewer.ps1
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

- **Live Data Access** - Always current information from your knowledge graph
- **Interactive Visualization** - Modern web interface for exploring connections
- **Programmatic Access** - Python functions and HTTP API for automation
- **Rich Querying** - Advanced search and filtering capabilities
- **Professional Integration** - RESTful API ready for other tools and workflows


## MCP Memory Server Setup

This project requires an MCP Memory Server as its backend for knowledge graph data. The MCP Memory Server is an open-source server that provides a RESTful API for storing and querying knowledge graphs.

To set up and run the MCP Memory Server, follow the instructions in the official repository:

👉 [MCP Memory Server on GitHub](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)

You must have the server running and accessible to use the MemoryGraphExplorer web viewer and API tools.

## Documentation

- `web_viewer/MCP_INTEGRATION.md` - Detailed implementation information
- `MCP_IMPLEMENTATION_COMPLETE.md` - Complete development summary
- `STARTUP_CLEANUP.md` - Information about simplified startup process
