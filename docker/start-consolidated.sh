#!/bin/bash
# Startup script for consolidated container
# Runs both MCP Server and Web UI

set -e

echo "🚀 Starting Memory Graph Explorer (Consolidated Mode)"

# Start MCP Server in the background
echo "📡 Starting MCP Server on port ${MCP_SERVER_PORT:-3000}..."
cd /app/mcp-server
PORT=${MCP_SERVER_PORT:-3000} node dist/index.js &
MCP_PID=$!

# Wait a moment for MCP server to start
sleep 2

# Check if MCP server is running
if ! kill -0 $MCP_PID 2>/dev/null; then
    echo "❌ MCP Server failed to start"
    exit 1
fi

echo "✅ MCP Server started successfully (PID: $MCP_PID)"

# Start Web UI in the foreground
echo "🌐 Starting Web UI on port ${WEB_UI_PORT:-8080}..."
cd /app/web_viewer
python server.py \
    --host 0.0.0.0 \
    --port ${WEB_UI_PORT:-8080} \
    --mcp-url http://localhost:${MCP_SERVER_PORT:-3000}/mcp

# If Web UI exits, clean up MCP server
echo "🛑 Shutting down..."
kill $MCP_PID 2>/dev/null || true
wait $MCP_PID 2>/dev/null || true
