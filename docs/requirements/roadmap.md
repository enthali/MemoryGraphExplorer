# Memory Graph Explorer - Development Roadmap

## Vision

Evolve the Memory Graph Explorer into a sophisticated memory management platform with enterprise-grade features, advanced analytics, and multiple deployment options.

## Current State

The Memory Graph Explorer is **fully operational** with:

- ✅ Hybrid HTTP/REST + MCP architecture
- ✅ Docker containerized deployment  
- ✅ GitHub Copilot integration via MCP
- ✅ Web visualization interface
- ✅ Complete CRUD operations on knowledge graphs
- ✅ JSON-based data persistence

**Ready for**: Feature extensions and scaling enhancements

## Future Development 

### Deployment as Azure Docker Service

**Goal:** Deploy Memory Graph Explorer as a cost-effective Azure service with single-port architecture and scale-to-zero capabilities for personal/demo use

**Architecture Strategy:**
- Single port exposure (8080) with internal MCP proxy
- Scale-to-zero Azure Container Apps for cost optimization  
- Unified Flask server handling both web interface and MCP protocol
- GitHub/Microsoft authentication integration

**Tasks:**

**Phase 1: Single-Port Architecture**
- [ ] Implement MCP proxy endpoint in Flask server (`/mcp` → `localhost:3001/mcp`)
- [ ] Add StreamableHTTP request forwarding with proper headers
- [ ] Handle CORS configuration for MCP client access
- [ ] Test GitHub Copilot connectivity through proxy endpoint
- [ ] Update container startup script for unified single-container deployment
- [ ] Validate all 15 MCP tools work through proxy

**Phase 2: Azure Container Apps Configuration**  
- [ ] Create Azure Container Apps deployment configuration (YAML/Bicep)
- [ ] Configure scale-to-zero settings (minReplicas: 0, maxReplicas: 1)
- [ ] Set up single ingress on port 8080 with custom domain
- [ ] Configure environment variables for Azure deployment
- [ ] Set up persistent storage for memory.json data
- [ ] Test cold start performance and scale-to-zero behavior

**Phase 3: Authentication & Security**
- [ ] Choose authentication method (Azure Easy Auth vs API Key)
- [ ] Implement GitHub OAuth integration for personal access
- [ ] Add Microsoft Account authentication as alternative
- [ ] Secure MCP endpoints with authentication middleware
- [ ] Configure HTTPS and custom domain (optional)
- [ ] Test authentication flow with GitHub Copilot

**Phase 4: Cost Optimization & Monitoring**
- [ ] Implement proper health checks for Container Apps
- [ ] Configure Azure Monitor and logging
- [ ] Set up cost alerts and usage monitoring
- [ ] Document expected costs (~$3-8/month with scale-to-zero)
- [ ] Create deployment automation (GitHub Actions)
- [ ] Test full deployment pipeline

**Success Criteria:**
- Single public URL serves both web interface and MCP protocol
- Container scales to zero during idle periods (16+ hours daily)
- GitHub Copilot can access all MCP tools through HTTPS
- Authentication prevents unauthorized access
- Monthly costs under $10 for personal usage
- No functionality regression from local Docker deployment

**Alternative Options Considered:**
- Azure Container Instances (always-on, higher cost)
- GitHub Codespaces (free tier, development-focused)
- Dual-port Container Apps (complex networking)

**Updated mcp.json Target:**
```json
{
  "mcpServers": {
    "reference": {
      "transport": {
        "type": "http",
        "url": "https://memory-graph-explorer.azurecontainerapps.io/mcp"
      },
      "env": {
        "MEMORY_FILE_PATH": "/app/data/memory.json"
      }
    }
  }
}
```


###  Business Logic Layer Separation

**Goal:** Separate business logic from MCP protocol interface for better maintainability

**Tasks:**
- [ ] Create business logic layer (MemoryService class)
- [ ] Extract validation logic (entity existence checks)
- [ ] Extract graph algorithms (get_node_relations, search optimization)
- [ ] Create data access interface (still using JSON)
- [ ] Update MCP server to use business logic layer
- [ ] Add comprehensive error handling
- [ ] Test consistency validation (prevent graph explorer breakage)

**Success Criteria:**
- Clean separation: MCP Protocol ↔ Business Logic ↔ Data Access
- Graph explorer no longer breaks on invalid data
- All existing functionality preserved
- ✅ Error messages when trying to create invalid relations (IMPLEMENTED Sept 2025)

**Architecture Target:**
```
MCPServer → MemoryService → JSONDataAdapter → memory.json
```

### Relation Observations

**Goal:** Enable observations on relations for richer relationship context and type consolidation

**Use Case:** Replace specific relation types with generic types + detailed observations
```json
// Instead of: "CEO_of", "Senior_Account_Manager_at", "Developer_at"
// Use: "employed_by" + observations: ["CEO"], ["Senior Account Manager"], ["Developer"]
```

**Tasks:**
- [ ] Extend TypeScript `Relation` interface with optional `observations?: string[]`
- [ ] Create `add_observations_to_relations` MCP tool
- [ ] Create `delete_observations_from_relations` MCP tool  
- [ ] Extend `search_nodes` to include relation observations
- [ ] Update KnowledgeGraphManager for relation observation management
- [ ] Test with GitHub Copilot integration

**Success Criteria:**
- Optional observations on relations (backward compatible)
- No data migration required for existing 400+ relations
- Relation type consolidation possible (e.g. multiple "employed_by" with different observation details)
- Search functionality includes relation observations
- GitHub Copilot can add/remove relation observations

**Benefits:**
- Reduces relation type explosion
- Enables richer relationship context
- Maintains data consistency with entity observation patterns
- Facilitates data cleanup and consolidation

### Database Backend Options

**Goal:** Add database backend options for better performance and features

**Options (in priority order):**
1. **SQLite** - Local, file-based, better performance than JSON
2. **PostgreSQL** - Production-ready, excellent graph extensions
3. **Cosmos DB** - Experimentation with cloud graph database

**Tasks:**
- [ ] Create DatabaseAdapter interface
- [ ] Implement SQLiteAdapter
- [ ] Add database migration scripts
- [ ] Create environment-based database selection
- [ ] Performance testing and comparison
- [ ] Optional: PostgreSQL adapter
- [ ] Optional: Cosmos DB adapter with Gremlin API

**Success Criteria:**
- Runtime database switching via environment variables
- Performance improvement for large graphs
- Data migration path from JSON
- All adapters pass the same test suite

### Advanced Features

**Goal:** Enterprise-grade features and advanced analytics

**Features:**
- **CI/CD Pipeline:** Automated testing and deployment
- **Graph Algorithms:** Shortest path, clustering, community detection
- **Advanced Visualization:** Timeline views, filtering, search interface
- **Multi-user Support:** Authentication and data isolation
- **Graph Analytics:** Statistics, relationship patterns, insights
- **API Extensions:** REST API alongside MCP protocol
- **Cloud Deployment:** Azure Container Instances, Kubernetes

## Development Constraints

- **Available Time:** 2-4 hours per week
- **Priority:** Tool must remain usable throughout development
- **Approach:** Incremental improvements, no big-bang rewrites
- **Testing:** Use real memory.json data throughout development

## Development Principles

### Architecture Decisions
- **MCP Protocol:** Universal interface for all AI clients
- **Step-by-step approach:** Prioritize working tool over complete architecture
- **JSON-first:** Start with current format, migrate to databases later
- **Docker-first:** Containerization before architectural changes

### Quality Focus
- **Focus on value:** Each phase must improve the tool's usability
- **No regression:** Tool must work throughout development
- **Documentation:** Capture decisions and progress for future reference

---

*Last Updated: September 2025*
