# Dockerfile for MCP Memory Server
FROM node:20-alpine

WORKDIR /app

# Copy MCP server files
COPY backend/mcp-server/package*.json ./
COPY backend/mcp-server/tsconfig.json ./
COPY backend/mcp-server/index.ts ./

# Install dependencies
RUN npm install

# Build TypeScript
RUN npm run build

# Expose port for HTTP server
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Default to main StreamableHTTP server
CMD ["node", "dist/index.js"]
