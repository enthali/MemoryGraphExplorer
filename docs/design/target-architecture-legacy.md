# Target Architecture - Memory Graph Explorer v2

## Vision Statement

Create a **unified, containerized MCP server** that serves all AI clients (GitHub Copilot, Claude Desktop, Web Interface) through a single **Streamable HTTP** endpoint, eliminating the need for multiple protocols and deployment complexities.

## Architectural Target


###  Unified Streamable HTTP Architecture
```
✅ Target Unified Approach:
┌─────────────────┐               ┌──────────────────────┐
│ GitHub Copilot  │──────────────▶│                      │
├─────────────────┤               │   MCP Server         │
│ Claude Desktop  │──Streamable──▶│ (Streamable HTTP)    │
├─────────────────┤     HTTP      │                      │
│ Web Interface   │──────────────▶│  localhost:3001/mcp  │
├─────────────────┤               │                      │
│ Future Clients  │──────────────▶│  Docker Container    │
└─────────────────┘               └──────────────────────┘

Benefits:
• Single protocol (MCP over Streamable HTTP)
• Single codebase to maintain
• Containerized deployment
• Firewall/proxy friendly
• Scalable and debuggable
```

## Technical Architecture

### **Layer 1: Transport Layer**
```typescript
// Streamable HTTP Transport (Port 3001)
app.post('/mcp', handleMCPRequest);   // JSON-RPC requests
app.get('/mcp', handleSSEStream);     // Server-sent events
app.delete('/mcp', handleSessionEnd); // Session cleanup

// Session Management
const sessions: Map<string, MCPSession> = new Map();
// Each client gets unique session ID for state isolation
```

### **Layer 2: MCP Protocol Layer**
```typescript
// Standard MCP JSON-RPC Methods
- initialize()           // Client handshake
- tools/list()          // Available memory operations
- tools/call()          // Execute memory operations
- resources/list()      // Available memory resources
- notifications/*       // Progress updates, errors
```

### **Layer 3: Memory Business Logic**
```typescript
class MemoryService {
  // Core Operations
  async searchNodes(query: string): Promise<SearchResult>
  async getNodeRelations(nodeName: string): Promise<RelationResult>  
  async createEntities(entities: Entity[]): Promise<CreateResult>
  async readGraph(): Promise<GraphData>
  
  // Validation & Integrity
  validateEntityReferences(relations: Relation[]): ValidationResult
  enforceDataConsistency(): Promise<void>
  
  // Graph Algorithms  
  findShortestPath(from: string, to: string): Path[]
  getConnectedComponents(): Component[]
}
```

### **Layer 4: Data Access Layer**
```typescript
interface DataAdapter {
  loadGraph(): Promise<GraphData>
  saveGraph(data: GraphData): Promise<void>
  backup(): Promise<string>
  migrate(version: string): Promise<void>
}

// Implementation options:
class JSONDataAdapter implements DataAdapter    // Phase 1
class SQLiteDataAdapter implements DataAdapter  // Phase 2  
class PostgreSQLAdapter implements DataAdapter  // Phase 3
```

## Container Architecture

### **Single Container Design**
```dockerfile
# Dockerfile - Unified MCP Server
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

# Expose HTTP port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Run MCP server
CMD ["node", "dist/index.js"]
```

### **Docker Compose Setup**
```yaml
version: '3.8'

services:
  mcp-memory-server:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mcp-memory-server
    ports:
      - "3001:3001"
    volumes:
      # Mount memory.json from current location
      - C:/workspace/Journal/memory.json:/app/data/memory.json
    environment:
      - NODE_ENV=production
      - MEMORY_FILE_PATH=/app/data/memory.json
      - PORT=3001
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Web UI container (if we want to separate static serving)
  web-interface:
    image: nginx:alpine
    container_name: memory-web-ui
    ports:
      - "8080:80"  
    volumes:
      - ./frontend/web_viewer:/usr/share/nginx/html:ro
    depends_on:
      - mcp-memory-server
    restart: unless-stopped
```

## Client Configuration

### **GitHub Copilot Configuration**
```json
// mcp.json
{
  "mcpServers": {
    "memory": {
      "url": "http://localhost:3001/mcp",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }
}
```

### **Web Interface Configuration**
```javascript  
// JavaScript client
const mcpClient = new MCPStreamableHTTPClient({
  url: 'http://localhost:3001/mcp',
  sessionId: generateSessionId()
});

await mcpClient.initialize();
const tools = await mcpClient.listTools();
const result = await mcpClient.callTool('search_memory', { query: 'meetings' });
```

## Development Phases

### **Phase 1: Streamable HTTP Migration** ⏳
**Goal:** Replace current mixed architecture with unified Streamable HTTP

**Tasks:**
- [ ] Create new MCP server using `StreamableHTTPServerTransport`
- [ ] Port existing memory operations to MCP tool format
- [ ] Implement session management with proper cleanup
- [ ] Create Dockerfile and docker-compose setup
- [ ] Test with GitHub Copilot using HTTP configuration
- [ ] Update web interface to use MCP client instead of custom HTTP API
- [ ] Validate no regression in functionality

**Success Criteria:**
- ✅ GitHub Copilot works via HTTP MCP connection
- ✅ Web interface works via same MCP endpoint  
- ✅ Docker deployment with `docker-compose up`
- ✅ All existing memory operations preserved
- ✅ Session isolation between multiple clients

### **Phase 2: Business Logic Separation** 🔮
**Goal:** Extract memory operations into clean business logic layer

**Tasks:**
- [ ] Create `MemoryService` class with all business logic
- [ ] Implement data validation and consistency checks
- [ ] Add comprehensive error handling and logging
- [ ] Create `DataAdapter` interface for storage abstraction
- [ ] Implement `JSONDataAdapter` as current storage backend
- [ ] Add unit tests for business logic layer
- [ ] Add integration tests for MCP endpoints

### **Phase 3: Database Options** 🚀
**Goal:** Add SQLite and PostgreSQL storage options

**Tasks:**
- [ ] Implement `SQLiteDataAdapter` with migration support
- [ ] Add database schema versioning system
- [ ] Implement `PostgreSQLAdapter` for production deployments
- [ ] Add performance benchmarking between storage options
- [ ] Create data migration tools (JSON → SQLite → PostgreSQL)
- [ ] Add environment-based storage selection

## Benefits of This Architecture

### **🔧 Development Benefits**
- **Single Codebase:** One MCP server handles all clients
- **Modern Protocol:** Streamable HTTP is current MCP standard (not deprecated SSE)
- **Standard Debugging:** HTTP requests visible in browser dev tools, curl, Postman
- **Container Native:** Designed for modern deployment practices

### **🚀 Operational Benefits**  
- **Infrastructure Friendly:** HTTP passes through firewalls, proxies, load balancers
- **Scalable:** Each client session is isolated, server can handle multiple clients
- **Resilient:** Connection interruptions resume via event store mechanism
- **Observable:** Standard HTTP metrics, logging, and monitoring

### **👥 User Benefits**
- **Consistent Experience:** All clients use same underlying memory operations
- **Real-time Updates:** SSE streams provide live progress feedback
- **Multi-client:** GitHub Copilot and web interface can operate simultaneously
- **Future Proof:** Easy to add new AI clients (Claude Desktop, etc.)

## Migration Strategy

### **Risk Mitigation**
1. **Incremental Rollout:** Keep existing system running during development
2. **Feature Parity Testing:** Validate each memory operation works identically
3. **Performance Benchmarking:** Ensure no performance regression
4. **Rollback Plan:** Docker tags and git branches for quick reversion

### **Data Safety**
- **No Data Migration Required:** Continue using existing `memory.json`
- **Backup Strategy:** Automated backups before any data modifications
- **Validation Layer:** Prevent corrupt data from breaking graph visualization

---

## Decision Record

**Date:** July 23, 2025  
**Decision:** Adopt Streamable HTTP as unified MCP transport  
**Rationale:** 
- GitHub Copilot supports HTTP MCP configuration
- Streamable HTTP is current MCP standard (SSE deprecated)
- Eliminates dual-protocol maintenance burden
- Container-native deployment model
- Better debugging and monitoring capabilities

**Next Review:** After Phase 1 completion

---

*This document represents our evolved understanding of MCP architecture and containerization requirements. It should be updated as we learn more during implementation.*
