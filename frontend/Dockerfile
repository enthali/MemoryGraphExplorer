# Dockerfile for Web Viewer Frontend
FROM python:3.12-slim

# Install Node.js for MCP server
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy MCP server
COPY backend/mcp-server/ ./mcp-server/
WORKDIR /app/mcp-server

# Fix tsconfig.json to be standalone
RUN echo '{ \
  "compilerOptions": { \
    "target": "es2022", \
    "module": "es2022", \
    "moduleResolution": "node", \
    "outDir": "./dist", \
    "rootDir": ".", \
    "strict": true, \
    "esModuleInterop": true, \
    "skipLibCheck": true, \
    "forceConsistentCasingInFileNames": true, \
    "downlevelIteration": true \
  }, \
  "include": ["./**/*.ts"] \
}' > tsconfig.json
RUN npm install && npm run build

# Copy web viewer files
WORKDIR /app
COPY frontend/web_viewer/ ./web_viewer/

# Create mcp.json for container
RUN echo '{ \
  "mcpServers": { \
    "memory": { \
      "command": "node", \
      "args": ["/app/mcp-server/dist/index.js"], \
      "env": { \
        "MEMORY_FILE_PATH": "/app/data/memory.json" \
      } \
    } \
  } \
}' > ./mcp.json

# Set working directory to web_viewer
WORKDIR /app/web_viewer

# Expose port for Flask server
EXPOSE 8080

# Set environment variables
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Run the Flask server
CMD ["python", "server.py", "--host", "0.0.0.0", "--port", "8080"]
