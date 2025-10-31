# Memory Graph Explorer - GitHub Copilot Instructions

A containerized knowledge graph visualization system with hybrid MCP (Model Context Protocol) architecture. Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Development Environment
- **PRIMARY**: Use GitHub Codespaces or VS Code Devcontainer for full development (all dependencies pre-installed)
- **SECONDARY**: Use `docker compose` for testing or production deployment

### Docker Compose
- **Production**: `docker compose up` 
- **Development**: `docker compose -f docker-compose.dev.yml up` 
- **Build Time**: 5-15 minutes depending on network. NEVER CANCEL. Set timeout to 30+ minutes.
- **Known Issue**: Docker builds may fail with SSL certificate errors. Use devcontainer as primary development environment.

### Port Configuration
- **Production (docker-compose.yml)**: Web UI (port 8080)
- **Development (docker-compose.dev.yml)**: Web UI (port 8081)

## Testing & Validation

### Tests (Currently Smoke Tests Only)
- **⚠️ WARNING**: Tests are basic smoke tests only - **NOT guaranteed to work!**
- **Tests location**: `/tests/` directory
- **Status**: Use with extreme caution, may be outdated or broken
- **Run**: `node tests/run-tests.js` (requires services running)

## Architecture & Components

### Core Components
- **Backend**: TypeScript MCP server (`/backend/mcp-server/`) 
- **Frontend**: Python Flask + D3.js web viewer (`/frontend/web_viewer/`) - interactive visualization only
- **Data**: JSON-based knowledge graph
  - Dev Local: `c:\workspace\web_Projects\MemoryGraphExplorer\data\memory-test.json`
  - Dev Container Mount: `C:/workspace/web_Projects/MemoryGraphExplorer/data` → `/app/data/memory-test.json`
  - Prod Local: `C:/workspace/Journal/memory.json`
  - Prod Container Mount: `C:/workspace/Journal/memory.json` → `/app/data/memory.json`
  - Container Internal Path: `/app/data/memory.json` (see MEMORY_FILE_PATH in Dockerfile)
- **Tests**: Node.js test scripts (`/tests/`) - smoke tests only

## Build Process

- **Devcontainer**: Post-create script handles everything automatically
- **Docker Compose**: `docker compose up` (prod) or `docker compose -f docker-compose.dev.yml up` (dev)
- **Build details**: See Dockerfile for exact build steps

## Development Workflow

### Making Changes
1. **Start services**: Use devcontainer or `docker compose -f docker-compose.dev.yml up`
2. **ALWAYS test real scenarios**: Create entities, add relations, search, validate integrity
3. Tests available in `/tests/` but use with caution (smoke tests only)

### File Structure Reference
```
MemoryGraphExplorer/
├── backend/mcp-server/          # TypeScript MCP server
│   ├── src/tools/              # Individual MCP tool implementations
│   └── index.ts                # Main server entry point
├── frontend/web_viewer/        # Python Flask web server
│   ├── server.py              # Main Flask application
│   └── modules/               # Frontend JavaScript modules  
├── tests/                     # Test scripts
├── data/memory-test.json      # Test knowledge graph data
└── docker-compose*.yml        # Deployment configs
```