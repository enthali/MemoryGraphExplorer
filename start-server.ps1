#!/usr/bin/env pwsh
# Start Memory Graph Explorer (Containerized)
# Modern Docker-based deployment with unified StreamableHTTP MCP architecture

param(
    [switch]$Build = $false,
    [switch]$Background = $false,
    [switch]$Logs = $false
)

Write-Host "🚀 Starting Memory Graph Explorer (Containerized)..." -ForegroundColor Green

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "📦 Using Docker Compose for unified StreamableHTTP architecture..." -ForegroundColor Cyan
Write-Host ""

# Build containers if requested
if ($Build) {
    Write-Host "🔨 Building containers..." -ForegroundColor Yellow
    docker-compose build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
}

# Start containers
Write-Host "🚀 Starting containers..." -ForegroundColor Green
if ($Background) {
    docker-compose up -d
} else {
    Write-Host "📡 Services starting:" -ForegroundColor Cyan
    Write-Host "   🔧 MCP Server (StreamableHTTP): http://localhost:3001/mcp" -ForegroundColor Gray
    Write-Host "   🌐 Web Interface: http://localhost:8080" -ForegroundColor Gray
    Write-Host "   🤖 GitHub Copilot: Configure VS Code with memory-graph server" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Gray
    Write-Host ""
    
    docker-compose up
}

# Show logs if requested
if ($Logs) {
    Write-Host "� Showing logs..." -ForegroundColor Cyan
    docker-compose logs -f
}

Write-Host ""
Write-Host "✅ Memory Graph Explorer stopped" -ForegroundColor Green
