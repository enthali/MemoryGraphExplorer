# System Architecture - Memory Graph Explorer

## Overview

Memory Graph Explorer implements a **hybrid protocol architecture** that serves different client types with their optimal protocol while maintaining a unified backend. Web browsers use HTTP/REST for compatibility, while AI clients use MCP protocol for enhanced capabilities.

## Architectural Overview

### Hybrid Protocol Architecture

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

## Design Rationale

### Why Hybrid Architecture?

#### Web Browser Clients (HTTP/REST)
- **Same-origin policy compliance** - Web assets and API from single endpoint
- **Standard HTTP semantics** - Familiar to web developers
- **Caching support** - JSON responses cacheable by browsers and CDNs
- **No connection management** - Simple request/response pattern

#### AI Clients (Direct MCP)
- **Streaming capabilities** - Efficient for large knowledge graphs
- **Rich metadata** - Tool discovery and type information
- **Session management** - Built-in state handling
- **Request/Response efficiency** - Optimized JSON-RPC protocol

### Protocol Selection Strategy

The system automatically serves the most appropriate protocol:

- **Web browsers** → HTTP/REST API for compatibility
- **AI clients** → MCP streaming for performance
- **Cloud deployments** → HTTP/REST for scalability
- **Development tools** → MCP for rich tooling support

## Technical Architecture

### Layer 1: Frontend - Client Layer

#### Web Browser + Web Server (HTTP/REST)
- **Flask Web Server** (Port 8080)
  - Static asset serving (HTML, CSS, JS)
  - REST API endpoints (`/api/graph`, `/api/search`, etc.)
  - Internal MCP client to backend server
  - Same-origin policy compliance

#### AI Clients (Direct MCP)
- **GitHub Copilot** - VS Code integration via MCP configuration
- **Claude Desktop** - Direct MCP connection
- **Future AI Clients** - Standardized MCP protocol

### Layer 2: Backend - MCP Server

#### MCP Server (StreamableHTTP) - Port 3001
- **Express.js Server** with TypeScript
- **Standard MCP Methods**:
  - `initialize()` - Client handshake
  - `tools/list()` - Available memory operations
  - `tools/call()` - Execute memory operations
- **Session Management** - Isolated client state
- **Memory Tools** - Complete CRUD operations on knowledge graph

#### KnowledgeGraphManager
- **JSON Storage** - Persistent graph data
- **Entity Management** - Create, read, update, delete entities
- **Relation Management** - Link entities with typed relationships
- **Search & Query** - Full-text search and graph traversal

## Key Benefits

- 🌐 **Web-Friendly** - Standard HTTP for universal browser compatibility
- 📡 **AI-Optimized** - MCP streaming for real-time AI interactions
- 🔒 **Security** - Same-origin policy compliance, proper session isolation
- 🚀 **Performance** - Protocol-specific optimizations for each client type
- ☁️ **Cloud-Ready** - Designed for seamless Azure deployment
- 📦 **Container-First** - Production-ready Docker deployment

## Container Architecture

### Docker Compose Orchestration
```yaml
services:
  mcp-server:          # Backend MCP Server
    build: ./backend
    ports: ["3001:3001"]
    
  web-interface:       # Frontend Web Server
    build: ./frontend
    ports: ["8080:8080"]
    depends_on: [mcp-server]
```

### Service Communication
- **Internal Docker Network** - Services communicate via container names
- **External Access** - Both services exposed on localhost
- **Health Checks** - Automated service health monitoring
- **Volume Mapping** - Persistent data storage

## Deployment Scenarios

### Development
- `docker-compose up` - Local development with hot reload
- **Ports**: Web Interface (8080), MCP Server (3001)
- **Data**: Local volume mapping for `memory.json`

### Production (Azure)
- **Azure Container Instances** or **Azure Container Apps**
- **Same-origin policy** ensures CORS-free deployment
- **Load balancing** supported through HTTP/REST interface
- **Monitoring** via Azure Application Insights

## Technology Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** for HTTP server
- **MCP Protocol** implementation
- **JSON file storage**

### Frontend
- **Python Flask** web server
- **Vanilla JavaScript** with D3.js
- **REST API client** for backend communication
- **Responsive CSS** for mobile support

### DevOps
- **Docker** containerization
- **Docker Compose** orchestration

---

**Last Updated**: August 2025
