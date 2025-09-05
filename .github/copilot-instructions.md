# Memory Graph Explorer - GitHub Copilot Instructions

A containerized knowledge graph visualization system with hybrid MCP (Model Context Protocol) architecture. Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Quick Start (Recommended)
- **Local Development Setup (FASTEST)**:
  - `cd backend/mcp-server && npm install` -- takes ~8 seconds. NEVER CANCEL.
  - `pip3 install --user --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt` -- takes ~30 seconds if SSL issues exist. NEVER CANCEL.
  - Start MCP server: `cd backend/mcp-server && MEMORY_FILE_PATH="../../data/memory-test.json" PORT=3001 node dist/index.js`
  - Start web server: `cd frontend/web_viewer && python server.py --host 0.0.0.0 --port 8080 --mcp-url http://localhost:3001/mcp`

### Docker Setup (Production)
- **Production**: `docker compose up` -- **WARNING: May fail due to SSL certificate issues in sandboxed environments**
- **Development**: `docker compose -f docker-compose.dev.yml up` 
- **Build Time**: 5-15 minutes depending on network. NEVER CANCEL. Set timeout to 30+ minutes.
- **Known Issue**: Docker builds may fail with SSL certificate errors. Use local development setup as fallback.

### Port Configuration
- **Production**: MCP server (port 3000), Web UI (port 8080)
- **Development**: MCP server (port 3001), Web UI (port 8081)  
- **Local Development**: MCP server (port 3001), Web UI (port 8080)

## Testing & Validation

### Run Tests (ALWAYS do this after changes)
- **Full test suite**: `node tests/run-tests.js` -- takes ~0.5 seconds. NEVER CANCEL.
- **Feature tests**: `npm run test:features` -- requires services to be running first
- **Individual tests**: `node tests/test-api-endpoints.js`, `node tests/test-mcp-http.js`

### Manual Validation Steps
- **ALWAYS test after code changes**: Start services, run test suite, verify API endpoints
- **API Health Check**: `curl http://localhost:8080/api/health` should return full knowledge graph data
- **MCP Server Check**: `curl -H "Accept: application/json, text/event-stream" http://localhost:3001/mcp` 
- **Web Interface**: Navigate to `http://localhost:8080` (D3.js may be blocked but UI structure should load)

### Critical Test Scenarios
- **Knowledge Graph Operations**: Create entity, add relations, search nodes, validate integrity
- **MCP Protocol**: Initialize session, list tools (should show 15 tools), call tools with proper JSON-RPC format
- **Web APIs**: Test all 5 endpoints (/api/graph, /api/search, /api/entity, /api/node-relations, /api/health)

## Architecture & Components

### Core Components
- **Backend**: TypeScript MCP server (`/backend/mcp-server/`) - 15 memory tools for GitHub Copilot
- **Frontend**: Python Flask + D3.js web viewer (`/frontend/web_viewer/`) - interactive visualization
- **Data**: JSON-based knowledge graph (`/data/memory-test.json` for dev, external file for prod)
- **Tests**: Node.js test scripts (`/tests/`) - comprehensive API and MCP validation

### MCP Tools Available (15 total)
- `create_entities`, `create_relations`, `add_observations`
- `delete_entities`, `delete_relations`, `delete_observations`  
- `read_graph`, `search_graph`, `open_nodes`, `get_node_relations`
- `rename_entity`, `validate_integrity`, `list_types`, `create_type`, `delete_type`

## Build Process

### Local Development (Recommended)
```bash
# Backend (Node.js) - 8 seconds
cd backend/mcp-server
npm install --no-fund --no-audit

# Frontend (Python) - 30 seconds  
pip3 install --user --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt
```

### TypeScript Build
- **Auto-build**: Runs automatically via `npm install` (prepare script)
- **Manual build**: `cd backend/mcp-server && npm run build`
- **Watch mode**: `cd backend/mcp-server && npm run watch`

## Common Issues & Solutions

### SSL Certificate Issues
- **Docker builds fail**: Use local development setup instead
- **Pip install fails**: Add `--trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org`
- **npm install fails**: Usually works locally, use Docker as fallback

### D3.js Visualization Issues  
- **D3.js blocked**: Expected in sandboxed environments, API functionality remains intact
- **Web interface loads with error**: Normal - backend APIs work correctly for programmatic access

### Service Connection Issues
- **Tests fail with ECONNREFUSED**: Start services first (MCP server on port 3001, web server on port 8080)
- **MCP session errors**: Ensure proper headers: `Accept: application/json, text/event-stream`

## Development Workflow

### Making Changes
1. **Start services locally** (fastest development cycle)
2. **Run full test suite**: `node tests/run-tests.js` 
3. **Test specific functionality**: Use individual test scripts
4. **Validate manually**: Check health endpoint, test UI, verify MCP tools
5. **ALWAYS test real scenarios**: Create entities, add relations, search, validate integrity

### File Structure Reference
```
MemoryGraphExplorer/
├── backend/mcp-server/          # TypeScript MCP server
│   ├── src/tools/              # Individual MCP tool implementations
│   ├── index.ts                # Main server entry point
│   └── package.json            # Node.js dependencies
├── frontend/web_viewer/        # Python Flask web server
│   ├── server.py              # Main Flask application
│   ├── modules/               # Frontend JavaScript modules  
│   └── index.html             # Web interface
├── tests/                     # Test scripts
│   ├── run-tests.js          # Master test runner
│   └── test-*.js             # Individual test suites
├── data/memory-test.json      # Test knowledge graph data
├── docker-compose.yml         # Production deployment
└── docker-compose.dev.yml     # Development deployment
```

## Validation Requirements

### Before Completing Any Task
- **CRITICAL**: Run `node tests/run-tests.js` - must complete in ~0.5 seconds with 2/2 tests passing
- **API Validation**: `curl http://localhost:8080/api/health` - must return knowledge graph with entities and relations
- **MCP Validation**: Test GitHub Copilot integration with available tools
- **Manual Testing**: Exercise actual user workflows (search, create entities, explore relations)

### Performance Expectations
- **Local builds**: Node.js ~8 seconds, Python ~30 seconds. NEVER CANCEL.
- **Tests**: Full suite ~0.5 seconds. Individual tests ~0.1-0.2 seconds.
- **Service startup**: ~2-5 seconds for both MCP server and web server.
- **Docker builds**: 5-15 minutes (may fail due to SSL issues). NEVER CANCEL. Set timeout 30+ minutes.

## NPM Scripts Available
- `npm start` - Start production with docker compose
- `npm run build` - Build containers  
- `npm run test:features` - Run feature tests (requires running services)
- `npm run logs` - View container logs

## Critical Reminders
- **NEVER CANCEL long-running operations** - builds may take 15+ minutes
- **Always use trusted hosts for pip** in restricted environments
- **Test locally first** before attempting Docker builds
- **Validate every change** with the complete test suite
- **Services must run before tests** - start MCP server and web server first