# Memory Graph Explorer - GitHub Copilot Instructions

A containerized knowledge graph visualization system with hybrid MCP (Model Context Protocol) architecture. Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## General Guidelines

- **Language**: All documentation, comments, and commit messages MUST be in English
- **Code Style**: Follow existing patterns in the codebase
- **Testing**: Always run tests after changes

## 🏗️ Architecture Overview (CONSOLIDATED CONTAINER)

**IMPORTANT**: The system uses a **single consolidated container** containing both the MCP Server (Node.js) and Web UI (Python Flask).

**Container Structure:**

- **MCP Server** (Node.js) - runs internally on port 3000
- **Flask Web UI** (Python) - exposed on port 8080
- Flask proxies `/mcp` requests to the internal MCP Server
- Only port 8080 is exposed externally

### Port Configuration

| Environment     | Host Port   | Container Web | Container MCP   | MCP Access                            |
| --------------- | ----------- | ------------- | --------------- | ------------------------------------- |
| **Production**  | 8080        | 8080          | 3000 (internal) | `http://localhost:8080/mcp` (proxied) |
| **Development** | 8081        | 8080          | 3000 (internal) | `http://localhost:8081/mcp` (proxied) |
| **Local Dev**   | 8080 + 3001 | 8080          | 3001            | `http://localhost:3001/mcp` (direct)  |

## 🚀 Working Effectively

### Development Container (RECOMMENDED)

- **GitHub Codespaces**: "Create codespace on main" - automatic setup in ~3-5 minutes
- **Local VS Code**: `F1` → "Dev Containers: Reopen in Container" - automatic setup
- **Benefits**: Isolated environment, all dependencies pre-installed, consistent
- **Spec Kit**: Automatically installed for structured AI-assisted development
- **See**: `.devcontainer/README.md` for details

### Quick Start (Local Development)

```bash
# Backend (Node.js) - ~8 seconds
cd backend/mcp-server && npm install --no-fund --no-audit

# Frontend (Python) - ~30 seconds
pip install -r requirements.txt

# Start MCP Server (Terminal 1)
cd backend/mcp-server && MEMORY_FILE_PATH="../../data/memory-test.json" PORT=3001 node dist/index.js

# Start Web Server (Terminal 2)
cd frontend/web_viewer && python server.py --host 0.0.0.0 --port 8080 --mcp-url http://localhost:3001/mcp
```

### Docker Setup

```bash
# Production (Host Port 8080)
docker compose up

# Development (Host Port 8081)
docker compose -f docker-compose.dev.yml up
```

**⚠️ Note**: Docker builds can take 5-15 minutes. NEVER cancel.

## 🧪 Testing & Validation

### Running Tests (ALWAYS after changes)

```bash
# Full test suite (~0.5 seconds)
node tests/run-tests.js

# Individual tests
node tests/test-api-endpoints.js
node tests/test-mcp-http.js
```

### Manual Validation

```bash
# Health Check (should return Knowledge Graph)
curl http://localhost:8080/api/health

# Check MCP Endpoint
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test"}}}'
```

## 🔧 Core Components

### Backend: MCP Server (`/backend/mcp-server/`)

TypeScript-based MCP Server with 15 Memory Tools:

| Tool                                                         | Description                           |
| ------------------------------------------------------------ | ------------------------------------- |
| `create_entities`                                            | Create new entities                   |
| `create_relations`                                           | Create relationships between entities |
| `add_observations`                                           | Add observations to entities          |
| `delete_entities`, `delete_relations`, `delete_observations` | Delete operations                     |
| `read_graph`                                                 | Read entire graph                     |
| `search_graph`                                               | Search in graph                       |
| `open_nodes`                                                 | Open specific nodes                   |
| `get_node_relations`                                         | Get relations of a node               |
| `rename_entity`                                              | Rename entity                         |
| `validate_integrity`                                         | Validate graph integrity              |
| `list_types`, `create_type`, `delete_type`                   | Type management                       |

### Frontend: Web UI (`/frontend/web_viewer/`)

Python Flask Server with D3.js visualization:

- **API Endpoints**: `/api/graph`, `/api/search`, `/api/entity`, `/api/node-relations`, `/api/health`
- **MCP Proxy**: `/mcp` - forwards requests to internal MCP Server
- **Static Files**: HTML, CSS, JavaScript for interactive graph visualization

### Data Storage

- **Development**: `/data/memory-test.json`
- **Production**: External volume (e.g., `C:/workspace/Journal/memory.json`)

## 📁 File Structure

```
MemoryGraphExplorer/
├── .devcontainer/              # Dev Container configuration
├── .github/
│   ├── copilot-instructions.md # This file
│   ├── agents/                 # Spec Kit agent definitions
│   └── prompts/                # Spec Kit prompt templates
├── .specify/                   # Spec Kit project structure
│   ├── memory/                 # Constitution and context
│   ├── scripts/                # Spec Kit helper scripts
│   └── templates/              # Spec/Plan/Tasks templates
├── backend/mcp-server/         # TypeScript MCP Server
│   ├── src/
│   │   ├── tools/              # 15 MCP tool implementations
│   │   ├── storage/            # Persistence layer
│   │   └── types/              # TypeScript types
│   ├── index.ts                # Server entry point
│   └── package.json
├── frontend/web_viewer/        # Python Flask + D3.js
│   ├── server.py               # Flask application
│   ├── modules/                # JavaScript ES6 modules
│   │   ├── core/               # App controller, state, events
│   │   ├── features/           # Filter, search, legend, info panel
│   │   ├── graph/              # D3.js graph rendering
│   │   └── services/           # MCP client, color service
│   └── index.html
├── tests/                      # Test scripts
├── data/                       # Knowledge graph data
├── docs/                       # Architecture documentation
├── Dockerfile                  # Consolidated image
├── docker-compose.yml          # Production
├── docker-compose.dev.yml      # Development
└── start-consolidated.sh       # Container startup script
```

## 🔍 Common Issues & Solutions

### Service Connection Issues

- **ECONNREFUSED**: Start services first
- **MCP Session Errors**: Check headers: `Accept: application/json, text/event-stream`
- **Proxy Issues**: `/mcp` endpoint uses internal proxy to port 3000

### Docker Issues

- **SSL Errors**: Use local development instead
- **Long Build Times**: Normal (5-15 min), never cancel

### D3.js Issues

- **Blocked in Sandbox**: Normal - API still works

## 📋 Spec Kit Integration

This project uses [Spec Kit](https://github.com/github/spec-kit) for structured, AI-assisted development.

### Available Commands

- `/speckit.constitution` - Define project principles
- `/speckit.specify` - Specify features
- `/speckit.plan` - Create implementation plan
- `/speckit.tasks` - Generate task list
- `/speckit.implement` - Execute tasks

### Resuming After Breaks

1. Read `.specify/memory/constitution.md`
2. Check current specs in `.specify/specs/`
3. Review open tasks

## ✅ Validation Requirements

### Before Completing Any Task

1. **Tests**: `node tests/run-tests.js` - 2/2 tests must pass
2. **Health Check**: `curl http://localhost:8080/api/health` - must return graph
3. **Manual Testing**: Test real workflows (Search, Create, Explore)

### Performance Expectations

- **Local Builds**: Node ~8s, Python ~30s
- **Tests**: ~0.5 seconds
- **Service Startup**: ~2-5 seconds
- **Docker Build**: 5-15 minutes

## 🎯 Critical Reminders

- **NEVER** cancel long-running operations
- **ALWAYS** run tests after changes
- **Services must be running** before executing tests
- **One Container** - MCP is internal, Web UI is exposed
- **/mcp Endpoint** - uses proxy, not direct MCP access in Docker
