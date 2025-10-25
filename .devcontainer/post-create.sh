#!/bin/bash
# Post-create script for Memory Graph Explorer devcontainer
set -e

echo "🚀 Setting up Memory Graph Explorer development environment..."

# Ensure we're in the workspace directory
cd /workspaces/MemoryGraphExplorer || cd /workspace/MemoryGraphExplorer || exit 1

# Install backend dependencies
echo "📦 Installing backend MCP server dependencies..."
cd backend/mcp-server
npm install --no-fund --no-audit
npm run build
cd ../..

# Install frontend dependencies
echo "🐍 Installing frontend Python dependencies..."
pip install -r requirements.txt

# Create test data directory if it doesn't exist
echo "📁 Setting up data directories..."
mkdir -p data

# Create test data file if it doesn't exist
if [ ! -f "data/memory-test.json" ]; then
    echo "📝 Creating test data file..."
    cat > data/memory-test.json << 'EOF'
{
  "entities": [
    {
      "name": "GitHub Copilot",
      "entityType": "tool",
      "observations": [
        "AI pair programming tool",
        "Developed by GitHub and OpenAI",
        "Integrated with VS Code"
      ]
    },
    {
      "name": "Memory Graph Explorer",
      "entityType": "project",
      "observations": [
        "Knowledge graph visualization system",
        "Uses MCP protocol for AI integration",
        "Built with Node.js and Python"
      ]
    }
  ],
  "relations": [
    {
      "from": "GitHub Copilot",
      "to": "Memory Graph Explorer",
      "relationType": "uses"
    }
  ]
}
EOF
fi

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Quick Start Commands:"
echo "  Production:   docker compose up"
echo "  Development:  docker compose -f docker-compose.dev.yml up"
echo "  Tests:        node tests/run-tests.js"
echo ""
echo "📚 More info: See README.md and README.dev.md"
