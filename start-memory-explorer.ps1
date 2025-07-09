#!/usr/bin/env pwsh
# Start Memory Graph Explorer Web Server
# This runs the unified server that provides both web interface and API access to memory.json

param(
    [string]$MemoryFile = ""
)

Write-Host "🚀 Starting Memory Graph Explorer..." -ForegroundColor Green

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WebViewerDir = Join-Path $ScriptDir "web_viewer"

# Change to web viewer directory
Set-Location $WebViewerDir

# Check if required files exist
if (-not (Test-Path "unified_server.py")) {
    Write-Host "❌ Error: unified_server.py not found in web_viewer directory" -ForegroundColor Red
    exit 1
}

# Set memory file path
if ($MemoryFile -ne "") {
    $MemoryFilePath = $MemoryFile
    Write-Host "📄 Using memory file: $MemoryFile" -ForegroundColor Cyan
} else {
    $MemoryFilePath = Join-Path $ScriptDir "..\..\Journal\memory.json"
    Write-Host "📄 Using default memory file: $MemoryFilePath" -ForegroundColor Cyan
}

# Check if memory file exists
if (-not (Test-Path $MemoryFilePath)) {
    Write-Host "⚠️  Memory file not found: $MemoryFilePath" -ForegroundColor Yellow
    Write-Host "   The server will start but no data will be available" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🌐 Starting Memory Graph Explorer Web Server..." -ForegroundColor Yellow
Write-Host "   • Direct memory.json file access" -ForegroundColor Gray
Write-Host "   • All MCP Memory functions available" -ForegroundColor Gray
Write-Host "   • Enhanced get_node_relations functionality" -ForegroundColor Gray
Write-Host ""
Write-Host "📡 Web Interface: http://localhost:8080" -ForegroundColor Green
Write-Host "📡 API Endpoints: http://localhost:8080/api" -ForegroundColor Green
Write-Host ""

# Start the unified Flask server
try {
    if ($MemoryFile -ne "") {
        python unified_server.py --host localhost --port 8080 --memory-file "$MemoryFile"
    } else {
        python unified_server.py --host localhost --port 8080
    }
} catch {
    Write-Host "🛑 Web server stopped" -ForegroundColor Yellow
} finally {
    Write-Host ""
    Write-Host "✅ Memory Graph Explorer stopped" -ForegroundColor Green
}
