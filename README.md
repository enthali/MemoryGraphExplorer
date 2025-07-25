# Memory Graph Explorer

A modern, containerized knowledge graph visualization and management system with unified StreamableHTTP MCP architecture.

## ✨ Features

- 🎯 **Interactive Knowledge Graph Visualization** - Explore your memory graph with dynamic, interactive visuals
- 🔍 **Smart Search & Filtering** - Find nodes and relationships quickly  
- 📊 **Entity Relationship Explorer** - Deep dive into connections between entities
- 🚀 **Real-time Graph Updates** - Live data through unified HTTP transport
- 🎨 **Modern Clean UI** - Beautiful, responsive web interface
- ⚡ **High Performance** - Direct StreamableHTTP MCP integration
- 🤖 **GitHub Copilot Integration** - Access all memory tools via VS Code
- 📦 **One-Command Deployment** - `docker-compose up` and you're running!

## 🏗️ Architecture

**Unified StreamableHTTP MCP Architecture:**

``` text
┌─────────────────────────────────────────────────────────────────┐
│                    AI Clients (MCP Protocol)                    │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│  Graph Explorer │ GitHub Copilot  │ Claude Desktop  │    ...    │
│      (Web)      │  (Agent Mode)   │     (Chat)      │           │
└─────────────────┼─────────────────┼─────────────────┼───────────┘
                  │                 │                 │
                  ▼                 ▼                 ▼
     ┌───────────────────────────────────────────────────────┐
     │              MCP Protocol Interface                   │
     └─────────────────────┬─────────────────────────────────┘
                           ▼
     ┌───────────────────────────────────────────────────────┐
     │                Memory Tool Service                    │
     │  ┌─────────────────────────────────────────────────┐  │
     │  │           MCP Server Layer                      │  │
     │  │     (get_node_relations, create_entities...)    │  │
     │  └─────────────────┬───────────────────────────────┘  │
     │                    ▼                                  │
     │  ┌─────────────────────────────────────────────────┐  │
     │  │        Business Logic Layer                     │  │
     │  │  • Consistency validation                       │  │
     │  │  • Graph algorithms                             │  │
     │  │  • Complex queries                              │  │
     │  │  • Data integrity rules                         │  │
     │  └─────────────────┬───────────────────────────────┘  │
     │                    ▼                                  │
     │  ┌─────────────────────────────────────────────────┐  │
     │  │         Database Layer                          │  │
     │  │  • PostgreSQL / MongoDB / SQLite                │  │
     │  │  • Optimized graph queries                      │  │
     │  │  • ACID transactions                            │  │
     │  │  • Indexing & performance                       │  │
     │  └─────────────────────────────────────────────────┘  │
     └───────────────────────────────────────────────────────┘
                   ▲ (All containerized)
```

**Key Benefits:**
- 🔄 **Unified HTTP Transport** - Single protocol for all clients
- 🏗️ **Modular Architecture** - Clean separation of concerns
- 📦 **Container-First** - Production-ready deployment
- 🤖 **Multi-Client Support** - Web UI + GitHub Copilot + more

## 🚀 Quick Start

### The Only Step You Need:

```bash
docker-compose up
```

That's it! 🎉

**What this starts:**
- 🔧 **MCP Server** on port 3001 (StreamableHTTP)
- 🌐 **Web Interface** on port 8080 
- 📊 **Knowledge Graph** loaded from your data
- 🤖 **GitHub Copilot** ready to connect

### Access Your System:

- **Web Interface:** http://localhost:8080
- **GitHub Copilot:** Configure VS Code with the MCP server at `http://localhost:3001/mcp` (see setup below)
- **Health Check:** http://localhost:8080/api/health

## 🤖 GitHub Copilot Integration

### Setup Instructions:

1. **Start the system:** `docker-compose up`
2. **Configure VS Code:** Add this to your workspace settings (`.vscode/settings.json` or workspace file):

```json
{
    "mcp": {
        "servers": {
            "memory-graph": {
                "url": "http://localhost:3001/mcp",
                "type": "http"
            }
        },
        "inputs": []
    }
}
```

3. **Use GitHub Copilot:** Start asking questions about your knowledge graph!

### Available Memory Tools:
- `create_entities` - Create new entities with observations
- `create_relations` - Link entities with relationships  
- `add_observations` - Add observations to existing entities
- `read_graph` - Get complete knowledge graph
- `search_nodes` - Search entities by name/content
- `open_nodes` - Get specific entity details
- `get_node_relations` - Get all relations for an entity
- `delete_entities` - Remove entities
- `delete_relations` - Remove relationships
- `delete_observations` - Remove observations
- `rename_entity` - Rename entities and update relations
- `validate_integrity` - Check and fix graph integrity
- `list_types` - List all entity and relation types
- `create_type` - Create new entity or relation types
- `delete_type` - Remove entity or relation types

### Example Copilot Usage:
- "Show me all entities related to Github"
- "Create a new entity for John Doe with email john@example.com" 
- "What connections does John Doe have?"
- "Search for automotive companies in my knowledge graph"
- "Add an observation to the John doe entity that he works at Microsoft"

**💡 Pro Tip:** The MCP server is automatically ready after `docker-compose up` - no additional setup needed!

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/graph` | Full knowledge graph data |
| `GET /api/search?q=query` | Search nodes by query |
| `GET /api/entity?name=EntityName` | Get specific entity details |
| `GET /api/node-relations?name=EntityName` | Get all relations for a node |
| `GET /api/health` | Health check and system status |

## 🛠️ Development

### Local Development

```bash
# Start in development mode
docker-compose up --build

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

### Project Structure

```
MemoryGraphExplorer/
├── backend/                    # StreamableHTTP MCP Server
│   ├── mcp-server/
│   │   ├── index.ts           # Main server entry
│   │   ├── src/               # Modular architecture
│   │   │   ├── KnowledgeGraphManager.ts
│   │   │   ├── tools/         # Individual tool handlers
│   │   │   └── types/         # TypeScript interfaces
│   │   └── package.json
│   └── Dockerfile             # MCP server container
├── frontend/                  # Web Interface  
│   ├── web_viewer/
│   │   ├── server.py          # Flask server with HTTP client
│   │   ├── index.html         # Web interface
│   │   ├── main.js            # Frontend JavaScript
│   │   └── styles.css         # Styling
│   └── Dockerfile             # Web server container
├── docker-compose.yml         # Complete orchestration
├── mcp.json                   # VS Code MCP configuration
└── README.md                  # This file
```

## 🔧 Configuration

### Memory Data Location

Your knowledge graph data is stored in `/app/data/memory.json` inside the container. To use your own data:

1. Place your `memory.json` file in the project directory
2. Update `docker-compose.yml` volume mapping if needed
3. Restart with `docker-compose up --build`

### Advanced Configuration

**MCP Server Port:**
```yaml
# docker-compose.yml
services:
  mcp-server:
    ports:
      - "3001:3001"  # Change first port for different host port
```

**Web Interface Port:**
```yaml
# docker-compose.yml  
services:
  memory-graph-explorer:
    ports:
      - "8080:8080"  # Change first port for different host port
```

## 🧪 Testing

**Run All Tests:**

```bash
# Single command to run complete test suite
node tests/run-tests.js
```

**Individual Tests:**

```bash
# Comprehensive API endpoint tests
node tests/test-api-endpoints.js

# MCP StreamableHTTP transport tests
node tests/test-mcp-http.js

# UI screenshot tests (requires Playwright)
npx playwright test tests/test-screenshot.spec.js
```

**Manual Health Checks:**

```bash
# Quick health check
curl http://localhost:8080/api/health

# Test MCP connection
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**GitHub Copilot Test:**

- Open VS Code in this directory
- Ask Copilot: "Show me the current knowledge graph"
- All 15 memory tools should be available

**Test Coverage:**

- ✅ **API Endpoints** - All web interface APIs (`/api/graph`, `/api/search`, etc.)
- ✅ **MCP Protocol** - StreamableHTTP transport and tool calls
- ✅ **UI Functionality** - Visual regression and interaction testing
- ✅ **Error Handling** - Invalid requests and edge cases

## 🔄 MCP Protocol

This implementation follows the **Model Context Protocol (MCP)** standard with StreamableHTTP transport:

- **Transport:** HTTP with Server-Sent Events (SSE)
- **Protocol:** JSON-RPC 2.0 over HTTP
- **Session Management:** HTTP headers and session IDs
- **Standard Tools:** Full compatibility with MCP memory tool interface

**Key Advantages:**

- 🌐 **HTTP-Based** - Web-friendly, firewall-friendly
- 📡 **Real-time** - Server-Sent Events for live updates  
- 🔒 **Session Management** - Proper client isolation
- 🚀 **Performance** - Direct HTTP, no stdio overhead

## 📝 About

Memory Graph Explorer is a production-ready, containerized knowledge graph system built with modern web technologies and unified MCP architecture. The system provides both a web interface for visual exploration and programmatic access through GitHub Copilot integration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test with `docker-compose up --build`
4. Submit a pull request

---

**Built with Express.js, Flask, MCP StreamableHTTP, and Docker** 🚀
