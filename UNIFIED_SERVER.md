# Unified Server Implementation - Single Flask Server

## ✅ SIMPLIFIED: From 2 Servers to 1 Server

We have successfully simplified the architecture from **2 separate servers** to **1 unified Flask server**.

## Architecture Comparison

### ✅ **1 Unified Server**

``` text
Browser ↔ Unified Flask Server (port 8080) ↔ MCP Memory
        │                                   │
        │ Static files + API endpoints      │ memory.json
        │ Flask with static & API routes    │
```

## Benefits Achieved

### 🎯 **Simplified Architecture**

- **1 server instead of 2** - No inter-server communication
- **1 port instead of 2** - Everything on [http://localhost:8080](http://localhost:8080)
- **1 startup command** - Single process to manage

### 🚀 **Better Performance**

- **No network overhead** - Direct function calls instead of HTTP requests
- **Faster response times** - No extra hop between servers
- **Less resource usage** - Single Python process

### 🧹 **Cleaner Code**

- **Simpler deployment** - One server to start/stop
- **Easier debugging** - All logs in one place
- **Reduced complexity** - No CORS issues between servers

## New Files Created

### **Unified Server:**

- `web_viewer/unified_server.py` - Single Flask server handling both static files and API
- `web_viewer/requirements.txt` - Python dependencies (flask, flask-cors)

### **New Startup Scripts:**

- `start-unified-server.ps1` - PowerShell startup for unified server
- `start-unified-server.bat` - Batch startup for unified server

## How It Works

### **Static File Routes:**

```python
@app.route('/')
def index():
    return send_file('index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(WEB_VIEWER_DIR, filename)
```

### **API Routes:**

```python
@app.route('/api/graph')
def get_full_graph():
    return jsonify(mcp.read_memory_json())

@app.route('/api/search')
def search_nodes():
    query = request.args.get('q', '')
    return jsonify(mcp.search_nodes(query))
```

### **MCP Integration:**

```python
class MCPInterface:
    def read_memory_json(self):
        # Direct file reading - no HTTP calls needed
        # Parses memory.json and returns structured data
```

## Usage

### **Start the Unified Server:**

```powershell
# PowerShell
./start-unified-server.ps1

# Batch
start-unified-server.bat

# Manual
cd web_viewer
python unified_server.py
```

### **Access Points:**

- **Web Interface:** [http://localhost:8080](http://localhost:8080)
- **API Endpoints:** [http://localhost:8080/api/](http://localhost:8080/api/)
- **Health Check:** [http://localhost:8080/api/health](http://localhost:8080/api/health)

## API Endpoints (Same as Before)

- `GET /` - Main web interface (index.html)
- `GET /<filename>` - Static files (CSS, JS, images)
- `GET /api/graph` - Full knowledge graph (20 entities, 28 relations)
- `GET /api/search?q=query` - Search entities
- `GET /api/entity?name=EntityName` - Entity details
- `GET /api/health` - Server status

## Updated Web Viewer

The web viewer code (`mcp-data.js`) was updated to use the new unified server:

```javascript
// BEFORE
this.baseUrl = 'http://localhost:8081/api';

// AFTER  
this.baseUrl = 'http://localhost:8080/api';
```

All other functionality remains identical - the web viewer still gets real data from your knowledge graph.

## Dependencies

The unified server requires Flask:

```bash
pip install flask flask-cors
```

Dependencies are automatically installed by the startup scripts.

## What to Delete (Optional Cleanup)

Now that we have the unified server, these files are no longer needed:

### **Old 2-Server Architecture:**

- `mcp_data_server.py` - Old separate MCP API server
- `start-mcp-web-viewer.ps1` - Old 2-server startup script
- `start-mcp-web-viewer.bat` - Old 2-server startup script
- `mcp_memory_read_graph.py` - Replaced by MCPInterface class
- `mcp_memory_search_nodes.py` - Replaced by MCPInterface class  
- `mcp_memory_open_nodes.py` - Replaced by MCPInterface class

### **Keep for Now:**

We should keep the old files temporarily to ensure the unified server works perfectly, then clean them up later.

## Testing Results

✅ **Static files loading** - HTML, CSS, JS served correctly  
✅ **API endpoints working** - `/api/graph` returns 20 entities, 28 relations  
✅ **MCP integration** - Reading real data from memory.json  
✅ **Web interface functional** - Graph visualization working  
✅ **Single port** - Everything accessible at [http://localhost:8080](http://localhost:8080)  

## Conclusion

✅ **MISSION ACCOMPLISHED:** We've successfully simplified from a **2-server architecture** to a **1-server unified Flask solution**.

The system is now:

- **Simpler to use** - One startup command
- **Faster** - No inter-server communication
- **More maintainable** - Single codebase
- **Just as functional** - All features preserved

This is a much cleaner and more professional architecture! 🎉
