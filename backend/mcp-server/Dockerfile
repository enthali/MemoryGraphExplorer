FROM node:22.12-alpine AS builder

# Copy package files
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy source code
COPY index.ts ./
COPY src/ ./src/

WORKDIR /

# Install dependencies
RUN npm ci

# Build the TypeScript code
RUN npm run build

FROM node:22-alpine AS release

# Copy built application and package files
COPY --from=builder /dist /app/dist
COPY --from=builder /package.json /app/package.json
COPY --from=builder /package-lock.json /app/package-lock.json

ENV NODE_ENV=production

WORKDIR /app

# Install only production dependencies
RUN npm ci --ignore-scripts --omit-dev

# Expose the port
EXPOSE 3001

# Start the server
ENTRYPOINT ["node", "dist/index.js"]