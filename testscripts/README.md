# Test Scripts

This folder contains various test scripts for the Memory Graph Explorer project.

## Test Files

### `test_mcp_server.py`
- **Purpose**: Tests the stdio MCP server implementation
- **Transport**: Standard input/output (subprocess communication)
- **Usage**: `python testscripts/test_mcp_server.py`
- **Tests**: Initialization, tool listing, memory operations via stdio

### `test-mcp-http.js`
- **Purpose**: Tests the HTTP StreamableHTTP MCP server implementation  
- **Transport**: HTTP with Server-Sent Events (StreamableHTTP)
- **Usage**: `node testscripts/test-mcp-http.js`
- **Requires**: Docker container running on localhost:3001
- **Tests**: Session management, initialization, tool calls via HTTP

### `test-screenshot.spec.js`
- **Purpose**: Tests the web UI and captures screenshots
- **Transport**: Playwright browser automation
- **Usage**: `npx playwright test testscripts/test-screenshot.spec.js`
- **Requires**: Web server running on localhost:8000
- **Tests**: UI rendering, search, filtering, visual regression

## Running Tests

1. **Start the MCP HTTP server**: `docker-compose up mcp-server`
2. **Start the web server**: `docker-compose up memory-graph-explorer` 
3. **Run HTTP MCP test**: `node testscripts/test-mcp-http.js`
4. **Run stdio MCP test**: `python testscripts/test_mcp_server.py` (requires original MCP server setup)
5. **Run UI tests**: `npx playwright test testscripts/test-screenshot.spec.js`
