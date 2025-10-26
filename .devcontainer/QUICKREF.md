# Memory Graph Explorer - Devcontainer Quick Reference

## 🚀 Getting Started

### Open in Devcontainer

**GitHub Codespaces:**
```
Click: Code → Codespaces → Create codespace on main
```

**Local VS Code:**
```
Press: F1 → Dev Containers: Reopen in Container
```

## 📦 Common Commands

### Services

```bash
# Production
docker compose up

# Development  
docker compose -f docker-compose.dev.yml up

# Both simultaneously (2 terminals)
docker compose up                           # Terminal 1
docker compose -f docker-compose.dev.yml up # Terminal 2

# Stop services
docker compose down
```

### Testing

```bash
# All tests
node tests/run-tests.js

# API tests
node tests/test-api-endpoints.js

# MCP tests
node tests/test-mcp-http.js

# Feature tests (requires running services)
npm run test:features
```

### Building

```bash
# Build backend
cd backend/mcp-server
npm run build

# Watch mode (auto-rebuild)
npm run watch

# Install dependencies
npm install
```

### Frontend

```bash
# Install Python dependencies
pip3 install -r requirements.txt

# Run web server directly (for testing)
cd frontend/web_viewer
python server.py --host 0.0.0.0 --port 8080 --mcp-url http://localhost:3001/mcp
```

## 🔍 Validation

```bash
# Validate setup
bash .devcontainer/validate-setup.sh

# Check API health
curl http://localhost:8080/api/health

# Check MCP server
curl -H "Accept: application/json, text/event-stream" http://localhost:3001/mcp
```

## 🌐 URLs

| Service | URL | Port |
|---------|-----|------|
| Web UI (Prod) | http://localhost:8080 | 8080 |
| Web UI (Dev) | http://localhost:8081 | 8081 |
| MCP Server (Prod) | http://localhost:3000/mcp | 3000 |
| MCP Server (Dev) | http://localhost:3001/mcp | 3001 |

## 🛠️ Troubleshooting

### Rebuild Container

```
F1 → Dev Containers: Rebuild Container
```

### Manual Setup

```bash
# Backend
cd backend/mcp-server
npm install
npm run build

# Frontend
pip3 install -r requirements.txt

# Validate
bash .devcontainer/validate-setup.sh
```

### Check Logs

```bash
# Docker logs
docker compose logs -f

# Specific service
docker compose logs -f mcp-server
docker compose logs -f memory-graph-explorer
```

## 📝 File Locations

```
.devcontainer/          # Container configuration
├── devcontainer.json   # VS Code settings
├── Dockerfile          # Container image
├── post-create.sh      # Auto setup script
└── README.md          # Documentation

backend/mcp-server/     # TypeScript backend
├── src/               # Source code
├── dist/              # Built files
└── package.json       # Dependencies

frontend/web_viewer/   # Python frontend
├── server.py          # Flask server
└── index.html         # Web interface

tests/                 # Test scripts
data/                  # Knowledge graph data
```

## 🎯 Quick Tasks

### Create New Entity

```bash
# Via MCP tools (GitHub Copilot)
"Create a new entity called 'DevContainer' with observation 'Isolated development environment'"
```

### Search Graph

```bash
# Via web interface
Open http://localhost:8080 → Search box

# Via API
curl http://localhost:8080/api/search?query=DevContainer
```

### View All Entities

```bash
# Via API
curl http://localhost:8080/api/graph
```

## 🔧 Development Tips

- **Format on save** is enabled by default
- **Auto-reload**: Web server auto-reloads on Python changes
- **TypeScript watch**: Use `npm run watch` for auto-compilation
- **Test often**: Run tests before committing
- **Use Copilot**: GitHub Copilot is pre-configured

## 📚 Documentation

- [Devcontainer README](.devcontainer/README.md)
- [Main README](../README.md)
- [System Architecture](../docs/design/system-architecture.md)
- [Testing Strategy](../docs/design/testing-strategy.md)
