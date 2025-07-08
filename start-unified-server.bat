@echo off
REM Start Knowledge Graph Web Viewer (Unified Server)
REM Single Flask server that handles both static files and MCP API

echo 🚀 Starting Knowledge Graph Web Viewer (Unified Server)...
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set WEB_VIEWER_DIR=%SCRIPT_DIR%web_viewer

REM Check if web_viewer directory exists
if not exist "%WEB_VIEWER_DIR%" (
    echo ❌ Error: web_viewer directory not found at %WEB_VIEWER_DIR%
    echo    Please run this script from the scripts/knowledge_graph directory
    pause
    exit /b 1
)

REM Change to web_viewer directory
cd /d "%WEB_VIEWER_DIR%"

REM Check if required files exist
if not exist "index.html" (
    echo ❌ Error: index.html not found in web_viewer directory
    pause
    exit /b 1
)

if not exist "unified_server.py" (
    echo ❌ Error: unified_server.py not found in web_viewer directory
    pause
    exit /b 1
)

REM Check if Flask is installed
echo 🔍 Checking Flask installation...
python -c "import flask; print('Flask available')" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Flask not found. Installing required dependencies...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Failed to install dependencies. Please run: pip install flask flask-cors
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
)

echo 📂 Serving from: %WEB_VIEWER_DIR%
echo.

REM Start the unified Flask server
echo 🌐 Starting Unified Flask Server on port 8080...
echo    • Static files (HTML, CSS, JS) served from /
echo    • MCP API endpoints available at /api/
echo.

REM Start server in background
start "Knowledge Graph Server" /min python unified_server.py --host localhost --port 8080

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

echo ✅ Unified server started successfully!
echo.
echo 📊 Knowledge Graph Web Viewer: http://localhost:8080
echo 📡 API Endpoints: http://localhost:8080/api/
echo.
echo 🔧 Available API endpoints:
echo    GET /api/graph - Full knowledge graph
echo    GET /api/search?q=query - Search nodes
echo    GET /api/entity?name=EntityName - Entity details
echo    GET /api/health - Health check
echo.
echo 🚀 Opening browser...

REM Open browser
start "" "http://localhost:8080"

echo.
echo 📊 Knowledge Graph Web Viewer (Unified Server) is running!
echo    • Single Flask server handles both static files and MCP API
echo    • Real-time data from MCP Memory Server
echo    • Interactive graph visualization centered on entities
echo    • Click '🔄 Refresh Data' to reload from MCP server
echo    • Use search and filters to explore your network
echo.
echo 🛑 Press any key to stop the server...
pause >nul

echo.
echo 🛑 Stopping server...

REM Kill the background process
taskkill /f /fi "WindowTitle eq Knowledge Graph Server*" >nul 2>&1

echo ✅ Knowledge Graph Web Viewer (Unified Server) stopped
pause
