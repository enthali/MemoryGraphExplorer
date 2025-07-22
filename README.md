# Memory Graph Explorer

A clean, modern web-based interface for exploring and visualizing knowledge graphs with access though the MCP Server memory (with proposed enhanements).

## ✨ Features

- 🎯 **Interactive Knowledge Graph Visualization** - Explore your memory graph with dynamic, interactive visuals
- 🔍 **Smart Search & Filtering** - Find nodes and relationships quickly
- 📊 **Entity Relationship Explorer** - Deep dive into connections between entities
- 🚀 **Real-time Graph Updates** - Live data from your MCP Memory Server
- 🎨 **Modern Clean UI** - Beautiful, responsive web interface
- ⚡ **High Performance** - Direct MCP server integration via JSON-RPC

## 🏗️ Architecture

**Clean KISS Architecture:**

- **Web Server** (`server.py`) - Flask server with MCPClient for HTTP ↔ JSON-RPC translation
- **MCP Memory Server** - Started automatically by web server using `mcp.json` configuration
- **Frontend** - Modern web interface for graph visualization and interaction

``` text
HTTP API ← Web Server (MCPClient) ← JSON-RPC ← MCP Memory Server ← memory.json
```

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** (for MCP Memory Server)
- **Python 3.8+** (for web server)
- **MCP Memory Server** installed and configured

### 2. Install Dependencies

```powershell
cd web_viewer
npm install
pip install flask flask-cors
```

### 3. Configure Memory Path

Edit `mcp.json` to point to your memory file:

```json
{
  "mcpServers": {
    "memory": {
      "command": "node",
      "args": ["C:/path/to/memory/server/index.js"],
      "env": {
        "MEMORY_FILE_PATH": "C:/path/to/your/memory.json"
      }
    }
  }
}
```

### 4. Start the Server

```powershell
.\start-server.ps1
```

### 5. Open Your Browser

Navigate to <http://localhost:8080> and explore your knowledge graph!

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/graph` | Full knowledge graph data |
| `GET /api/search?q=query` | Search nodes by query |
| `GET /api/entity?name=EntityName` | Get specific entity details |
| `GET /api/node-relations?name=EntityName` | Get all relations for a node |
| `GET /api/health` | Health check and system status |

## �️ Development

### Run in Debug Mode

```powershell
cd web_viewer
python server.py --debug
```

### Test MCP Connection

```powershell
cd testscripts
python test_mcp_server.py
```

### Project Structure

```text
MemoryGraphExplorer/
├── mcp.json                    # MCP server configuration
├── start-server.ps1           # Startup script
├── web_viewer/
│   ├── server.py              # Flask web server with MCPClient
│   ├── index.html             # Main web interface
│   ├── main.js                # Frontend JavaScript
│   ├── graph.js               # Graph visualization
│   ├── styles.css             # Styling
│   └── package.json           # Frontend dependencies
└── testscripts/
    └── test_mcp_server.py     # MCP server testing
```

## 🔧 Configuration

### Memory File Path

Set your memory file location in `mcp.json`:

```json
{
  "mcpServers": {
    "memory": {
      "env": {
        "MEMORY_FILE_PATH": "/path/to/your/memory.json"
      }
    }
  }
}
```

### Server Options

```powershell
python server.py --host 0.0.0.0 --port 3000 --debug
```

## 🎯 How It Works

1. **Web Server Startup** - Reads `mcp.json` and starts its own MCP Memory Server process
2. **MCP Connection** - Establishes JSON-RPC communication over stdio
3. **HTTP API** - Translates REST calls to MCP tool calls
4. **Frontend** - Interactive visualization of graph data
5. **Cleanup** - Properly terminates MCP server on shutdown

## 🧪 Testing

The system includes comprehensive testing:

- **`test_mcp_server.py`** - Direct MCP server protocol testing
- **Health endpoint** - Runtime system validation
- **Error handling** - Graceful failure and recovery

## 🔄 MCP Protocol

This implementation follows the **Model Context Protocol (MCP)** standard:

- Each client starts its own MCP server process (no shared instances)
- Communication via JSON-RPC over stdio
- Standard MCP tool interface for memory operations

**Official MCP Memory Server:** [modelcontextprotocol/servers/src/memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)

## 📝 License

See `LICENSE` file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## Built  using Flask, MCP, and modern web technologies**

## 🏆 Key Achievement: Standard MCP Protocol Implementation

**This is the biggest win:** We implement the **standard Model Context Protocol (MCP)** with **zero proprietary extensions**!

✅ **Standard MCP JSON-RPC Protocol** - Full compliance with MCP specification  
✅ **Standard MCP Memory Server** - Works with any compliant MCP Memory Server ([official implementation](https://github.com/modelcontextprotocol/servers/tree/main/src/memory))  
✅ **Standard Tool Interface** - Uses official MCP tool names and parameters  
✅ **Future-Proof Architecture** - Automatically benefits from upstream MCP improvements  

**This means:**

- 🔄 **Interoperability** - Works with any MCP Memory Server implementation
- 🚀 **Upstream Benefits** - Server improvements automatically improve our system
- 📈 **Extensibility** - Easy to add support for other MCP servers/tools
- 🛠️ **Maintainability** - Standard protocol means predictable behavior

**Related Links:**

- 📋 **MCP Memory Server:** [Official Repository](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)
- 🔧 **API Enhancement PR:** [Enhanced node relations support](https://github.com/modelcontextprotocol/servers/pull/2310)

*While we do propose API enhancements to the MCP Memory Server, these are optional and submitted upstream for community benefit.*
