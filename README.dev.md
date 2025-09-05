
Development setup
=================

This project supports running **Production** and **Development** environments simultaneously on different ports:

**Port Overview:**
- **Production MCP Server**: Host port `3000` → http://localhost:3000/mcp  
- **Production Web UI**: Host port `8080` → http://localhost:8080
- **Development MCP Server**: Host port `3001` → http://localhost:3001/mcp
- **Development Web UI**: Host port `8081` → http://localhost:8081

The development setup uses `data/memory-test.json` instead of live data, so you can safely experiment without affecting your production knowledge graph.

Quick start (PowerShell)
------------------------

**Start Production (uses live data from C:/workspace/Journal/memory.json):**

    docker compose up --build

**Start Development (uses test data from data/memory-test.json):**

    docker compose -f docker-compose.dev.yml up --build

**Run both simultaneously:**

    # Terminal 1: Start production
    docker compose up --build
    
    # Terminal 2: Start development  
    docker compose -f docker-compose.dev.yml up --build

2) Open the Web Viewers:

- **Production**: http://localhost:8080 (connected to MCP on port 3000)
- **Development**: http://localhost:8081 (connected to MCP on port 3001)


