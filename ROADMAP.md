# Memory Graph Explorer - Development Roadmap

## Vision

Transform the Memory Graph Explorer into a sophisticated, containerized memory management tool with clean architecture, proper separation of concerns, and multiple database backend options.

**Target Architecture:**

```
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

**Target directory structure**
```
memory-graph-explorer/ # Your existing project enhanced
├── frontend/ # Current React/D3 visualization
│ ├── web_viewer/ # Your current code
│ └── Dockerfile # New: Containerize frontend
│
├── backend/ # Enhanced memory layer
│ ├── memory-service/ # New: Your business logic
│ │ ├── validation/ # Consistency checks
│ │ ├── graph-algorithms/ # get_node_relations, etc.
│ │ └── data-access/ # Database adapters
│ ├── mcp-server/ # Enhanced MCP interface
│ │ └── index.ts # Your improved server
│ └── Dockerfile # New: Containerize backend
│
├── data/ # Database layer
│ ├── json/ # Current JSON file storage
│ ├── sqlite/ # New: SQLite option
│ └── migrations/ # Database setup scripts
│
├── docker-compose.yml # New: Full stack deployment
└── README.md # Enhanced documentation
```

## Current State

✅ **Working Components:**

- Memory Graph Explorer with D3.js visualization
- Enhanced MCP server with `get_node_relations` function
- JSON file-based storage (`memory.json`)
- Basic MCP integration

❌ **Known Issues:**

- Graph explorer breaks with inconsistent data (relations to non-existent entities)
- No data validation layer
- Monolithic architecture (MCP server + business logic mixed)
- Native deployment only (no containerization)

## Roadmap

### Phase 1: Containerization

**Goal:** Get current system running in Docker containers

**Tasks:**

- [ ] Create project structure for memory-toolkit
- [ ] Copy enhanced memory server to new structure
- [ ] Create Dockerfile for memory server
- [ ] Create Dockerfile for graph explorer
- [ ] Create docker-compose.yml for full stack
- [ ] Test deployment with existing memory.json
- [ ] Update documentation

**Success Criteria:**

- `docker-compose up` starts the entire system
- Graph explorer works through containerized memory server
- Existing memory.json data loads correctly
- No functionality regression

**Files to Create:**

- `memory-server/Dockerfile`
- `graph-explorer/Dockerfile`
- `docker-compose.yml`
- Updated `README.md`

### Phase 2: Logic Layer Extraction

**Goal:** Separate business logic from MCP protocol interface

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
- Error messages when trying to create invalid relations

**Architecture:**

```typescript
MCPServer → MemoryService → JSONDataAdapter → memory.json
```

### Phase 3: Database Migration (Future - When Ready)

**Goal:** Add database backend options for better performance and features

**Options (in priority order):**

1. **SQLite** - Local, file-based, better performance than JSON
2. **PostgreSQL** - Production-ready, excellent graph extensions
3. **Cosmos DB** - Experimentation with cloud graph database (~$30-80/month)

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

## Time Budget & Constraints

- **Available Time:** 2-4 hours per week
- **Priority:** Tool must remain usable throughout development
- **Approach:** Incremental improvements, no big-bang rewrites
- **Testing:** Use real memory.json data throughout development

## Success Metrics

### Phase 1 Success

- Docker deployment works reliably
- Development environment is containerized
- Tool is easier to deploy and share

### Phase 2 Success

- Graph explorer never breaks due to data inconsistency
- Clear error messages for invalid operations
- Code is properly separated and maintainable

### Phase 3 Success

- Improved performance with larger datasets
- Flexible database backend selection
- Production-ready deployment options

## Future Enhancements (Beyond Core Roadmap)

- **CI/CD Pipeline:** Automated testing and deployment
- **Graph Algorithms:** Shortest path, clustering, community detection
- **Advanced Visualization:** Timeline views, filtering, search interface
- **Multi-user Support:** Authentication and data isolation
- **Graph Analytics:** Statistics, relationship patterns, insights
- **API Extensions:** REST API alongside MCP protocol
- **Cloud Deployment:** Azure Container Instances, Kubernetes

## Decision Log

### Architecture Decisions

- **MCP Protocol:** Keep as universal interface for all AI clients
- **Step-by-step approach:** Prioritize working tool over complete architecture
- **JSON-first:** Start with current format, migrate to databases later
- **Docker-first:** Containerization before architectural changes

### Database Selection

- **SQLite:** Best first database upgrade (local, reliable, SQL)
- **PostgreSQL:** Production choice for complex queries and reliability
- **Cosmos DB:** Experimentation platform for learning cloud graph databases

### Time Management

- **Focus on value:** Each phase must improve the tool's usability
- **No regression:** Tool must work throughout development
- **Documentation:** Capture decisions and progress for future reference

---

*Last Updated: July 23, 2025*
*Next Review: After Phase 1 completion*
