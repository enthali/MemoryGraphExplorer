#!/bin/bash
# Validation script for devcontainer setup
set -e

echo "🔍 Validating Memory Graph Explorer devcontainer setup..."
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
node --version || { echo "❌ Node.js not found"; exit 1; }

# Check npm
echo "✓ Checking npm..."
npm --version || { echo "❌ npm not found"; exit 1; }

# Check Python
echo "✓ Checking Python..."
python3 --version || { echo "❌ Python not found"; exit 1; }

# Check pip
echo "✓ Checking pip..."
pip3 --version || { echo "❌ pip not found"; exit 1; }

# Check Docker
echo "✓ Checking Docker..."
docker --version || { echo "❌ Docker not found"; exit 1; }

# Check docker-compose
echo "✓ Checking docker-compose..."
docker compose version || { echo "❌ docker-compose not found"; exit 1; }

# Check TypeScript
echo "✓ Checking TypeScript..."
tsc --version || { echo "❌ TypeScript not found"; exit 1; }

# Check backend dependencies
echo "✓ Checking backend dependencies..."
if [ -d "backend/mcp-server/node_modules" ]; then
    echo "  - node_modules found"
else
    echo "  ⚠️  node_modules not found (run: cd backend/mcp-server && npm install)"
fi

# Check backend build
echo "✓ Checking backend build..."
if [ -d "backend/mcp-server/dist" ]; then
    echo "  - dist/ found"
else
    echo "  ⚠️  dist/ not found (run: cd backend/mcp-server && npm run build)"
fi

# Check Python packages
echo "✓ Checking Python packages..."
python3 -c "import flask" 2>/dev/null && echo "  - Flask installed" || echo "  ⚠️  Flask not found"
python3 -c "import flask_cors" 2>/dev/null && echo "  - Flask-CORS installed" || echo "  ⚠️  Flask-CORS not found"
python3 -c "import requests" 2>/dev/null && echo "  - Requests installed" || echo "  ⚠️  Requests not found"

# Check test data
echo "✓ Checking test data..."
if [ -f "data/memory-test.json" ]; then
    echo "  - data/memory-test.json found"
else
    echo "  ⚠️  data/memory-test.json not found"
fi

echo ""
echo "✅ Devcontainer validation complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Run services:    docker compose up"
echo "  2. Run tests:       node tests/run-tests.js"
echo "  3. Open Web UI:     http://localhost:8080"
echo ""
