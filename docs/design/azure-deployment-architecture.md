# Azure Deployment Architecture Design

## Overview

This document outlines the architectural design for deploying Memory Graph Explorer to Azure Container Apps with a unified single-port architecture, optimized for cost-effectiveness and seamless development workflow.

## Design Goals

- **Cost Optimization**: Scale-to-zero capabilities for personal/demo usage (~$3-5/month)
- **Development Parity**: Identical local and production environments
- **Simplified Architecture**: Single external port with internal MCP proxy
- **Professional Workflow**: GitOps deployment pipeline with GitHub Actions

## Architecture Overview

### Current State (Dual Environment)

```
Development Environment:
├── Port 8081: Flask web server (external)
├── Port 3001: MCP server (external)
└── Separate containers for isolation

Production Environment:
├── Port 8080: Flask web server (external)  
├── Port 3000: MCP server (external)
└── Dual port exposure complexity
```

### Target State (Identical Containers - "Test What You Fly, Fly What You Test")

```
Development/Testing Container (Local):
├── Port 8080: Flask web server + MCP proxy (external)
├── Port 3000: MCP server (container-internal only)
├── Git Repository: memory-graph-test-data (public)
└── Full Git workflow identical to production

Production Container (Azure):
├── Port 8080: Flask web server + MCP proxy (external)
├── Port 3000: MCP server (container-internal only)
├── Git Repository: memory-graph-data (private)
└── Identical container, different data source
```

## Single-Port Architecture

### Component Design

```
┌─────────────────────────────────────────┐
│              Azure Container Apps        │
│  ┌─────────────────────────────────────┐ │
│  │         Single Container            │ │
│  │  ┌─────────────┐  ┌─────────────────┤ │
│  │  │ Flask       │  │ MCP Server      │ │
│  │  │ Web Server  │  │ (Node.js)       │ │
│  │  │ Port 8080   │  │ Port 3000       │ │
│  │  │             │  │ (internal only) │ │
│  │  └─────────────┘  └─────────────────┤ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
       │
       │ Single Ingress (Port 8080)
       │
┌─────────────────────────────────────────┐
│            External Access             │
├─────────────────────────────────────────┤
│ /                → Web Interface        │
│ /api/*          → REST endpoints        │
│ /mcp            → MCP StreamableHTTP    │
└─────────────────────────────────────────┘
```

### Request Flow

1. **Web Interface Requests**: `https://app.azurecontainerapps.io/` → Flask (Port 8080)
2. **REST API Requests**: `https://app.azurecontainerapps.io/api/*` → Flask (Port 8080)
3. **MCP Protocol Requests**: `https://app.azurecontainerapps.io/mcp` → Flask Proxy → MCP Server (Port 3000)

## Implementation Design

### Flask MCP Proxy

```python
@app.route('/mcp', methods=['GET', 'POST', 'OPTIONS'])
@app.route('/mcp/<path:subpath>', methods=['GET', 'POST', 'OPTIONS'])
def mcp_proxy(subpath=''):
    """
    Proxy MCP StreamableHTTP requests to internal MCP server
    Maintains streaming, headers, and MCP protocol compatibility
    """
    
    # Handle CORS preflight for MCP clients
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response
    
    # Construct internal MCP server URL
    internal_url = f'http://localhost:3000/mcp'
    if subpath:
        internal_url += f'/{subpath}'
    
  try:
    # Forward request with streaming support
    resp = requests.request(
      method=request.method,
      url=internal_url,
      # Iterate header pairs and drop Host before forwarding
      headers={k: v for k, v in request.headers.items() if k.lower() != 'host'},
      data=request.get_data(),
      params=request.args,
      stream=True,  # Critical for StreamableHTTP
      timeout=30
    )
        
        # Stream response back to client
        def generate():
            for chunk in resp.iter_content(chunk_size=1024):
                if chunk:
                    yield chunk
                    
        return Response(
            generate(),
            status=resp.status_code,
            headers=dict(resp.headers)
        )
        
    except Exception as e:
        return jsonify({
            "error": f"MCP proxy error: {str(e)}",
            "internal_url": internal_url
        }), 500
```

### Container Configuration

```dockerfile
FROM node:20-alpine as mcp-builder
WORKDIR /app/backend
COPY backend/mcp-server/package*.json ./
COPY backend/mcp-server/tsconfig.json ./
COPY backend/mcp-server/src ./src/
COPY backend/mcp-server/index.ts ./
RUN npm ci && npm run build

FROM python:3.12-slim as final
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app

# Copy MCP server
COPY --from=mcp-builder /app/backend/dist ./backend/dist/
COPY --from=mcp-builder /app/backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy Flask server  
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY frontend/web_viewer ./frontend/


# Unified startup script
# NOTE: The following demonstrates the recommended pattern. In a real Dockerfile,
# add a start.sh file to your build context and COPY it into the image.
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Example start.sh (add this to your repo and adjust COPY path if needed):
```
#!/bin/bash
# Start MCP server (internal)
cd /app/backend && node dist/index.js &
MCP_PID=$!

# Start Flask server with MCP proxy (external)
cd /app/frontend
python server.py --host 0.0.0.0 --port 8080 --mcp-url http://localhost:3000/mcp &
FLASK_PID=$!

# Keep container alive, restart on failure
wait_and_restart() {
  wait $MCP_PID $FLASK_PID
  echo "Process died, restarting container..."
  exit 1
}

wait_and_restart
```

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["/app/start.sh"]
```

## Development Workflow

### Identical Container Strategy ("Test What You Fly, Fly What You Test")

**Local Development** (identical to production):
```bash
git checkout <current dev branch>
docker-compose up
# Access: http://localhost:8080 (web interface)
# Access: http://localhost:8080/mcp (MCP proxy)
# Repository: memory-graph-test-data (public)
# Git workflow: Full clone, commit, push operations
```

**Production Deployment** (same container, different repo):
```bash
git checkout main
git merge <current dev branch>
git push origin main  # Triggers GitHub Actions deployment
# Access: https://memory-graph-explorer.azurecontainerapps.io/mcp
# Repository: memory-graph-data (private)
# Git workflow: Identical to development testing
```

### Maximum Confidence Deployment

- ✅ **Same Container Image**: Identical Docker image for both environments
- ✅ **Same Git Workflow**: Clone, commit, push operations tested locally
- ✅ **Same Code Paths**: No environment-specific branches in logic
- ✅ **Same Network Architecture**: Single-port proxy in both environments
- ✅ **Proven Configuration**: What passes tests locally works in production

### Environment Configuration

```yaml
# docker-compose.yml (unified for both environments)
services:
  memory-graph:
    build: .
    ports:
      - "8080:8080"  # Single external port
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - MEMORY_REPO=${MEMORY_REPO:-memory-graph-test-data}
      - GIT_TOKEN=${GIT_TOKEN}
      - GIT_EMAIL=${GIT_EMAIL:-memory-graph@yourdomain.com}
```

```bash
# .env.development (local testing)
NODE_ENV=development
MEMORY_REPO=your-username/memory-graph-test-data
GIT_TOKEN=<test-repo-token>

# Azure Container Apps (production)
NODE_ENV=production
MEMORY_REPO=your-username/memory-graph-data
GIT_TOKEN=<private-repo-token>
```

## Azure Container Apps Configuration

### Deployment Specification

```yaml
# container-app.bicep
resource memoryGraphApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'memory-graph-explorer'
  location: location
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      secrets: [
        {
          name: 'github-client-secret'
          value: githubClientSecret
        }
      ]
    }
    template: {
      containers: [
        {
          image: '${registryUrl}/memory-graph-explorer:${imageTag}'
          name: 'memory-graph-explorer'
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'MEMORY_FILE_PATH'
              value: '/app/data/memory.json'
            }
            {
              name: 'FLASK_ENV'
              value: 'production'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0  # Scale-to-zero for cost optimization
        maxReplicas: 1
        rules: [
          {
            name: 'http-scaler'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}
```



## Git-Based Storage Strategy

### Repository Architecture ("Test What You Fly" Principle)

```
Application Repository (Public):
├── MemoryGraphExplorer
├── Application code, tests, documentation
├── Fallback test data: ./data/memory-test.json
└── Container configuration (identical for both environments)

Development/Testing Data Repository:
├── memory-graph-test-data (public)
├── Test dataset (~50KB)
├── Safe for automated testing and CI/CD
└── Full Git workflow testing

Production Data Repository:
├── memory-graph-data (private)
├── Production data (~130KB+)
├── Privacy-protected real data
└── Identical Git workflow as testing
```

### Environment-Based Repository Selection

**Development/Testing Environment:**
- Container: Identical to production
- Repository: `memory-graph-test-data` (public)
- Git Operations: Full workflow (clone, commit, push)
- Confidence: Tests real Git integration

**Production Environment:**
- Container: Identical to development
- Repository: `memory-graph-data` (private)
- Git Operations: Same as tested in development
- Confidence: Known working configuration

### Container Startup Process

```
1. Container starts (identical image for both environments)
2. Git repository selection based on environment
3. Clone appropriate repository (test-data or production-data)
4. Start services with linked memory.json
5. Begin Git-integrated operations
```

## GitHub Actions Deployment Pipeline

```yaml
# .github/workflows/deploy-azure.yml
name: Deploy to Azure Container Apps
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
      
    - name: Log in to Azure Container Registry
      uses: azure/docker-login@v1
      with:
        login-server: ${{ secrets.ACR_LOGIN_SERVER }}
        username: ${{ secrets.ACR_USERNAME }}
        password: ${{ secrets.ACR_PASSWORD }}
        
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ secrets.ACR_LOGIN_SERVER }}/memory-graph-explorer:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        
    - name: Deploy to Azure Container Apps
      uses: azure/container-apps-deploy-action@v1
      with:
        appSourcePath: ${{ github.workspace }}
        containerAppName: memory-graph-explorer
        resourceGroup: memory-graph-rg
        imageToDeploy: ${{ secrets.ACR_LOGIN_SERVER }}/memory-graph-explorer:${{ github.sha }}
```

## Testing Strategy

### Confidence Metrics

- ✅ **Container Parity**: 100% identical image and configuration
- ✅ **Git Workflow**: Full clone, commit, push tested locally
- ✅ **Network Architecture**: Same single-port proxy tested
- ✅ **Data Operations**: All 15 MCP tools validated
- ✅ **Performance**: Git operations (clone ~1s, commit ~0.1s) verified

## Cost Analysis

### Git-Based Storage Benefits

**No Azure Storage Costs**:
- ✅ **Git repositories**: $0 (GitHub included)
- ✅ **Container storage**: Ephemeral, no persistent volumes
- ✅ **Data backup**: Built into Git workflow
- ✅ **Version control**: Native Git history

**Azure Container Apps Pricing**:
- **Idle time**: $0 (scale-to-zero capability)
- **Active time**: ~$0.10-0.30 per hour
- **Total estimate**: $3-5/month for personal usage

### Cost Comparison

| Component | Git-Based | Traditional Storage |
|-----------|-----------|-------------------|
| **Container Apps** | $3-5/month | $3-5/month |
| **Data Storage** | $0 | $1-2/month (Azure Files) |
| **Backup** | $0 (Git history) | $0.50-1/month |
| **Total** | **$3-5/month** | **$4.50-8/month** |

## Security Considerations

- **Authorization Methods**: Implement both OAuth and token-based authorization to ensure secure access to the MCP server and web interface.

- **Git Workflow Validation**: Validate Git operations to ensure that only authorized changes are made to the repository.

- **Token Management**: Ensure that tokens are securely stored and managed to prevent unauthorized access.

- **Access Control**: Implement role-based access control to restrict access to sensitive operations and data.

- **Audit Logging**: Maintain logs of all authorization attempts and Git operations for security auditing purposes.

- **Regular Security Reviews**: Conduct regular reviews of the security measures in place to adapt to new threats and vulnerabilities.


## Authentication

This deployment uses two complementary authentication mechanisms:

- OAuth (GitHub) for user-facing web logins. Use standard OAuth authorization code flows for users accessing the web UI and admin features.
- Token-based authentication for MCP clients and automated services. MCP clients must include a valid token in the Authorization header when connecting to `/mcp`.

Guidance and best practices:

- Store client secrets and production tokens in a server-side secret store (Azure Key Vault, or environment secrets managed by the runtime). Do not store production tokens in editor-level stores such as VS Code secrets.
- Prefer short-lived tokens and rotate them regularly. For stronger security consider mutual TLS or managed identities for service-to-service auth where applicable.
- Restrict CORS origins for production to the known web UI domain(s) instead of using a wildcard origin.
- Ensure the MCP proxy validates Authorization headers and rejects unauthenticated requests before forwarding them to the internal MCP server.

```yaml
ingress:
  external: true
  transport: 'http'  # HTTPS termination handled by Container Apps
  customDomains: [
    {
      name: 'memory-graph.yourdomain.com'
      certificateId: '/subscriptions/.../certificates/ssl-cert'
    }
  ]
```

## Migration Path

### Phase 1: Local Implementation
1. Implement MCP proxy in Flask server
2. Test locally with existing development ports (8081/3001)
3. Validate all 15 MCP tools work through proxy
4. Update local testing to use proxy endpoint

### Phase 2: Port Unification
1. Switch local development to production ports (8080/3000)
2. Update docker-compose.yml for unified configuration
3. Test complete workflow with unified ports
4. Remove development-specific port configurations

### Phase 3: Azure Deployment
1. Create Azure Container Apps resources
2. Set up GitHub Actions deployment pipeline
3. Configure persistent storage and environment variables
4. Deploy and test production environment

### Phase 4: Authentication & Monitoring
1. Implement authentication (GitHub OAuth recommended)
2. Set up monitoring and cost alerts
3. Configure custom domain (optional)
4. Document deployment and maintenance procedures

## Success Criteria

- ✅ **Identical Containers**: Same image runs in development and production
- ✅ **Proven Git Workflow**: Clone, commit, push operations tested locally
- ✅ **Single URL serves both web interface and MCP protocol**
- ✅ **Container scales to zero during idle periods (cost optimization)**
- ✅ **GitHub Copilot can access all MCP tools through HTTPS**
- ✅ **No functionality regression from current dual-port setup**
- ✅ **Monthly costs under $5 for personal usage**
- ✅ **Automated deployment pipeline with GitHub Actions**
- ✅ **Maximum deployment confidence** ("test what you fly" principle)

## Repository Strategy Summary

### Two-Repository Architecture

```
Development/Testing:
├── Container: memory-graph-explorer:latest
├── Repository: memory-graph-test-data (public)
├── Access: http://localhost:8080/mcp
└── Purpose: Full Git workflow testing

Production:
├── Container: memory-graph-explorer:latest (identical)
├── Repository: memory-graph-data (private)
├── Access: https://app.azurecontainerapps.io/mcp
└── Purpose: Real data with proven workflow
```

**Key Insight**: Identical containers with different Git repository targets provide maximum confidence that tested functionality will work in production without surprises.

## Future Enhancements

- **Custom Domain**: Configure professional domain name
- **Advanced Monitoring**: Application Insights integration
- **Multi-Environment**: Staging environment for testing
- **CDN Integration**: Azure Front Door for global distribution
- **Backup Strategy**: Automated memory.json backups to Azure Blob

---

*Last Updated: September 24, 2025*

## Authentication Strategy (high level)

1. User Authentication: users authenticate via GitHub (OAuth authorization code flow) and are redirected back to the application with an authorization code.
2. Token Exchange: the server performs the code→token exchange server-side and receives an access token (and refresh token if applicable).
3. Token Storage: store production tokens and client secrets in a secure server-side store (Azure Key Vault or container-managed secrets). Avoid storing production credentials in local/editor stores.
4. Token Usage: the web server and MCP server include tokens in Authorization headers when calling upstream APIs. The MCP proxy validates incoming client tokens and rejects unauthenticated requests.

*Next Review: Upon Phase 1 completion*