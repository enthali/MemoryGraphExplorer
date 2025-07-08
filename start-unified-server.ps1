
param(
    [string]$MemoryFile = ""
)

#!/usr/bin/env pwsh
# Start Knowledge Graph Web Viewer (Unified Server)
# Single Flask server that handles both static files and MCP API
Write-Host "🚀 Starting Knowledge Graph Web Viewer (Unified Server)..." -ForegroundColor Green

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WebViewerDir = Join-Path $ScriptDir "web_viewer"

# Check if web_viewer directory exists
if (-not (Test-Path $WebViewerDir)) {
    Write-Host "❌ Error: web_viewer directory not found at $WebViewerDir" -ForegroundColor Red
    Write-Host "   Please run this script from the scripts/knowledge_graph directory" -ForegroundColor Yellow
    exit 1
}

# Change to web_viewer directory
Set-Location $WebViewerDir

# Check if required files exist
if (-not (Test-Path "index.html")) {
    Write-Host "❌ Error: index.html not found in web_viewer directory" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "unified_server.py")) {
    Write-Host "❌ Error: unified_server.py not found in web_viewer directory" -ForegroundColor Red
    exit 1
}

# Check if Flask is installed
Write-Host "🔍 Checking Flask installation..." -ForegroundColor Yellow
$flaskCheck = python -c "import flask; print('Flask available')" 2>$null
if (-not $flaskCheck) {
    Write-Host "⚠️  Flask not found. Installing required dependencies..." -ForegroundColor Yellow
    python -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies. Please run: pip install flask flask-cors" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}

Write-Host "📂 Serving from: $WebViewerDir" -ForegroundColor Cyan
Write-Host ""

# Start the unified Flask server
Write-Host "🌐 Starting Unified Flask Server on port 8080..." -ForegroundColor Yellow
Write-Host "   • Static files (HTML, CSS, JS) served from /" -ForegroundColor Gray
Write-Host "   • MCP API endpoints available at /api/" -ForegroundColor Gray
Write-Host ""



# Run server in foreground - user can stop with Ctrl+C
try {
    if ($MemoryFile -ne "") {
        Write-Host "📄 Using memory file: $MemoryFile" -ForegroundColor Cyan
        python unified_server.py --host localhost --port 8080 --memory-file "$MemoryFile"
    } else {
        python unified_server.py --host localhost --port 8080
    }
} catch {
    Write-Host "🛑 Server stopped" -ForegroundColor Yellow
} finally {
    Write-Host ""
    Write-Host "✅ Knowledge Graph Web Viewer (Unified Server) stopped" -ForegroundColor Green
}

Write-Host "✅ Unified server started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Knowledge Graph Web Viewer: " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:8080" -ForegroundColor White
Write-Host "📡 API Endpoints: " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:8080/api/" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Available API endpoints:" -ForegroundColor Yellow
Write-Host "   GET /api/graph - Full knowledge graph" -ForegroundColor Gray
Write-Host "   GET /api/search?q=query - Search nodes" -ForegroundColor Gray
Write-Host "   GET /api/entity?name=EntityName - Entity details" -ForegroundColor Gray
Write-Host "   GET /api/health - Health check" -ForegroundColor Gray
Write-Host ""

# Try to open in default browser
try {
    Start-Process "http://localhost:8080"
    Write-Host "🚀 Browser opened successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not open browser automatically. Please navigate to http://localhost:8080 manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Knowledge Graph Web Viewer (Unified Server) is running!" -ForegroundColor Green
Write-Host "   • Single Flask server handles both static files and MCP API" -ForegroundColor White
Write-Host "   • Real-time data from MCP Memory Server" -ForegroundColor White
Write-Host "   • Interactive graph visualization centered on entities" -ForegroundColor White
Write-Host "   • Click '🔄 Refresh Data' to reload from MCP server" -ForegroundColor White
Write-Host "   • Use search and filters to explore your network" -ForegroundColor White
Write-Host "   • Press Ctrl+C to stop the server" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""


