# Consolidated Dockerfile for Azure Deployment
# Combines MCP Server (Node.js) and Web UI (Python) into a single container

# Stage 1: Build MCP Server
FROM node:22-alpine AS mcp-builder

WORKDIR /mcp-build

# Copy MCP server files
COPY backend/mcp-server/package.json backend/mcp-server/package-lock.json ./
COPY backend/mcp-server/tsconfig.json ./
COPY backend/mcp-server/index.ts ./
COPY backend/mcp-server/src/ ./src/

# Install dependencies and build
RUN apk update && apk upgrade && \
    npm ci && \
    npm run build

# Stage 2: Build Frontend (TypeScript → JavaScript)
FROM node:22-alpine AS frontend-builder

WORKDIR /frontend-build

# Copy frontend files
COPY frontend/web_viewer/package.json frontend/web_viewer/package-lock.json ./
COPY frontend/web_viewer/tsconfig.json ./
COPY frontend/web_viewer/vite.config.ts ./
COPY frontend/web_viewer/index.html ./
COPY frontend/web_viewer/styles.css ./
COPY frontend/web_viewer/main.ts ./
COPY frontend/web_viewer/modules/ ./modules/
COPY frontend/web_viewer/src/ ./src/

# Install dependencies and build
RUN npm ci && npm run build

# Stage 3: Final consolidated image
FROM python:3.12-slim

WORKDIR /app

# Install Node.js (required for MCP server runtime)
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy built MCP server from builder stage
COPY --from=mcp-builder /mcp-build/dist /app/mcp-server/dist
COPY --from=mcp-builder /mcp-build/package.json /app/mcp-server/package.json
COPY --from=mcp-builder /mcp-build/package-lock.json /app/mcp-server/package-lock.json

# Install MCP server production dependencies
WORKDIR /app/mcp-server
RUN npm ci --ignore-scripts --omit-dev

# Copy and install Python dependencies for Web UI
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy built frontend from builder stage
COPY --from=frontend-builder /frontend-build/dist ./web_viewer/

# Copy server.py separately (not part of Vite build)
COPY frontend/web_viewer/server.py ./web_viewer/

# Create data directory for memory.json
RUN mkdir -p /app/data

# Copy startup script
COPY start-consolidated.sh /app/start-consolidated.sh
RUN chmod +x /app/start-consolidated.sh

# Expose only the Web UI port (MCP server is internal)
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production \
    FLASK_ENV=production \
    PYTHONPATH=/app \
    PORT=3000 \
    MCP_SERVER_PORT=3000 \
    WEB_UI_PORT=8080 \
    MEMORY_FILE_PATH=/app/data/memory.json \
    MCP_SERVER_URL=http://localhost:3000/mcp \
    MCP_PROXY_INTERNAL_URL=http://localhost:3000/mcp

# Start both services
CMD ["/app/start-consolidated.sh"]
