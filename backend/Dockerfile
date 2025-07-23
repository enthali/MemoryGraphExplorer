# Dockerfile for MCP Memory Server
FROM node:20-alpine

WORKDIR /app

# Copy MCP server files
COPY mcp-server/package*.json ./
COPY mcp-server/tsconfig.json ./
COPY mcp-server/index.ts ./

# Install dependencies
RUN npm install

# Build TypeScript
RUN npm run build

# Expose port for stdio communication (not actually used for MCP but good practice)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Run the MCP server
CMD ["node", "dist/index.js"]
