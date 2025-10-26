#!/bin/bash
set -e

echo "🚀 Starting Memory Graph Explorer (Consolidated Container)"
echo "=================================================="

# Start MCP Server in background
echo "📡 Starting MCP Server on port ${MCP_SERVER_PORT:-3000}..."
cd /app/mcp-server
MEMORY_FILE_PATH="${MEMORY_FILE_PATH:-/app/data/memory.json}" \
PORT="${MCP_SERVER_PORT:-3000}" \
node dist/index.js > /var/log/mcp-server.log 2>&1 &
MCP_PID=$!
echo "✓ MCP Server started (PID: $MCP_PID)"

# Wait a moment for MCP server to start
sleep 2

# Check if MCP server is running
if ! kill -0 $MCP_PID 2>/dev/null; then
    echo "❌ MCP Server failed to start"
    cat /var/log/mcp-server.log
    exit 1
fi

# Start Flask Web UI in foreground
echo "🌐 Starting Web UI on port ${WEB_UI_PORT:-8080}..."
cd /app/web_viewer
exec python server.py --host 0.0.0.0 --port "${WEB_UI_PORT:-8080}" --mcp-url "${MCP_SERVER_URL:-http://localhost:3000/mcp}"
