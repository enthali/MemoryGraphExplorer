#!/usr/bin/env pwsh
# Start Web Server with MCP Integration
# The web server will automatically start and connect to the MCP Memory Server
# If MCP server connection fails, clear error messages will be shown to the user

param(
    [string]$MemoryFile = ""
)

Write-Host "🚀 Starting Knowledge Graph Web Server with MCP Integration..." -ForegroundColor Green

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Set memory file path if provided
if ($MemoryFile -ne "") {
    $env:MEMORY_FILE_PATH = $MemoryFile
    Write-Host "📄 Using memory file: $MemoryFile" -ForegroundColor Cyan
}

# Start the web server in foreground (it will start its own MCP server)
Write-Host "🌐 Starting web server (will auto-start MCP server)..." -ForegroundColor Green
Write-Host ""
Write-Host "📡 Web Interface will be available at: http://localhost:8080" -ForegroundColor Cyan
Write-Host "📡 The web server will read mcp.json and start the MCP Memory Server automatically" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers..." -ForegroundColor Gray
Write-Host ""

# Change to web_viewer directory and start web server
$WebViewerDir = Join-Path $ScriptDir "web_viewer"
Set-Location $WebViewerDir

try {
    python server.py --host localhost --port 8080
} catch {
    Write-Host "🛑 Web server stopped" -ForegroundColor Yellow
} finally {
    Write-Host ""
    Write-Host "✅ All servers stopped" -ForegroundColor Green
}
