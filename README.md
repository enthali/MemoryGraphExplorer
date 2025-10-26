# Memory Graph Explorer

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/enthali/MemoryGraphExplorer)

A modern, containerized knowledge graph visualization and management system with hybrid protocol architecture optimized for both web browsers and AI clients.

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

**Hybrid Protocol Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                  Frontend - Client Layer                        │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Web Browser    │ GitHub Copilot  │   Future AI Clients         │
│  (HTTP/REST)    │     (MCP)       │        (MCP)                │
│                 │                 │                             │
│  Web Server     │                 │                             │
│  (MCP)          │                 │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              │
                    MCP (StreamableHTTP)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Backend - MCP Server                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                Memory Tools                             │    │
│  │  • create_entities    • read_graph                      │    │
│  │  • create_relations   • search_nodes                    │    │
│  │  • add_observations   • get_relations                   │    │
│  │  • delete_entities    • open_nodes                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            KnowledgeGraphManager                        │    │
│  │                 JSON Storage                            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Key Benefits

- 🌐 **Hybrid Protocol Design** - HTTP/REST for browsers, MCP for AI clients
- 🔒 **Same-Origin Policy** - Web assets and API from single endpoint
- 🏗️ **Modular Architecture** - Clean separation of concerns
- 📦 **Container-First** - Production-ready deployment
- ☁️ **Cloud-Ready** - Designed for Azure deployment without CORS issues
- 🤖 **Multi-Client Support** - Optimized protocols for each client type

## 🚀 Quick Start

### Development Container (Recommended for Development)

For an isolated, consistent development environment:

**GitHub Codespaces:**
1. Click **Code** → **Codespaces** → **Create codespace on main**
2. Wait for automatic setup (~3-5 minutes)
3. Start developing! 🎉

**Local VS Code:**
1. Install Docker Desktop and VS Code Dev Containers extension
2. Open repository in VS Code
3. Press `F1` → **Dev Containers: Reopen in Container**
4. Wait for automatic setup
5. Start developing! 🎉

See [`.devcontainer/README.md`](.devcontainer/README.md) for detailed information.

### Direct Docker Deployment (Production/Quick Test)

```bash
docker-compose up
```

That's it! 🎉

**What this starts:**

- 🔧 **MCP Server** on port 3000 (StreamableHTTP)
- 🌐 **Web Interface** on port 8080
- 📊 **Knowledge Graph** loaded from your data
- 🤖 **GitHub Copilot** ready to connect

### Access Your System

- **Web Interface:** <http://localhost:8080>
- **GitHub Copilot:** Configure VS Code with the MCP server at `http://localhost:3001/mcp` (see setup below)
- **Health Check:** <http://localhost:8080/api/health>

## 🤖 GitHub Copilot Integration

### Setup Instructions

1. **Start the system:** `docker-compose up`
2. **Configure VS Code:** Add this to your workspace settings (`.vscode/settings.json` or workspace file):

```json
{
    "mcp": {
        "servers": {
            "memory-graph": {
                "url": "http://localhost:3000/mcp",
                "type": "http"
            }
        },
        "inputs": []
    }
}
```

3. **Use GitHub Copilot:** Start asking questions about your knowledge graph!

### Available Memory Tools

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

### Example Copilot Usage

- "Show me all entities related to Github"
- "Create a new entity for John Doe with email john@example.com"
- "What connections does John Doe have?"
- "Search for automotive companies in my knowledge graph"
- "Add an observation to the John doe entity that he works at Microsoft"

**💡 Pro Tip:** The MCP server is automatically ready after `docker-compose up` - no additional setup needed!

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
│   └── Dockerfile.http        # Web server container
├── docker-compose.yml         # Complete orchestration
├── mcp.json                   # VS Code MCP configuration
└── README.md                  # This file
```

## 🔧 Configuration

### API Authentication

**⚠️ Security Notice:** All API endpoints are protected with API Key authentication. You **must** configure authentication before deployment.

**Quick Setup:**

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Generate a strong API key:
   ```bash
   openssl rand -hex 32
   ```

3. Update `.env` with your key:
   ```bash
   AUTH_ENABLED=true
   API_KEYS="your-generated-key:YourName:read,write"
   ```

4. Use the key in your requests:
   ```bash
   curl -H "X-API-Key: your-generated-key" http://localhost:8080/api/health
   ```

**📖 For detailed authentication documentation, see:** [`docs/design/api-authentication.md`](docs/design/api-authentication.md)

**Key Points:**
- 🔒 All `/api/*` and `/mcp` endpoints require authentication
- 🌐 Web UI (static files) remains public
- 🔑 Use `X-API-Key` header or `Authorization: Bearer` token
- 🛡️ For production, use Azure Key Vault or Container Apps secrets
- 🤖 M365 Copilot Studio: Configure API Key (Header) authentication

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
      - "3000:3000"  # Change first port for different host port
```

**Web Interface Port:**
```yaml
# docker-compose.yml  
services:
  memory-graph-explorer:
    ports:
      - "8080:8080"  # Change first port for different host port
```

## 📚 Documentation

For comprehensive documentation, see the **[docs/](docs/)** directory:

- **[System Architecture](docs/design/system-architecture.md)** - Detailed hybrid protocol architecture
- **[Frontend Architecture](docs/design/frontend-architecture.md)** - Web interface design patterns  
- **[Testing Strategy](docs/design/testing-strategy.md)** - Quality assurance approach
- **[Project Roadmap](docs/requirements/roadmap.md)** - Future enhancements and timeline

Temporary task drafts
---------------------

The repository may contain temporary issue/task drafts under `docs/tasks/` while issues are being prepared for GitHub. These files are ignored by git by default (see `.gitignore`) so you can draft locally without committing them to the main project history. Once an issue is finalized, create it on GitHub and remove the local draft.

If you prefer to keep reusable templates, consider adding a canonical template under `.github/ISSUE_TEMPLATE/` instead.

**External Analysis:**
- **[DeepWiki Project Analysis](https://deepwiki.com/enthali/MemoryGraphExplorer)** - AI-powered project documentation and Q&A

## 📝 About

Memory Graph Explorer is a production-ready, containerized knowledge graph system built with modern web technologies and unified MCP architecture. The system provides both a web interface for visual exploration and programmatic access through GitHub Copilot integration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test with `docker-compose up --build`
4. Submit a pull request

---

**Built with Express.js, Flask, MCP StreamableHTTP, and Docker** 🚀

## 🙏 Acknowledgments

This project is inspired by the [MCP Memory Server](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) from the Model Context Protocol project. This project extends the concept with a hybrid architecture and web visualization capabilities.
