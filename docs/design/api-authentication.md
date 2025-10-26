# API Authentication Guide

## Overview

The Memory Graph Explorer API uses **API Key authentication** to protect all endpoints. This document describes how to configure and use authentication.

## Authentication Method

**API Key (Header-based)**
- Header Name: `X-API-Key`
- Alternative: `Authorization: Bearer <key>`

## Configuration

### Environment Variables

1. **AUTH_ENABLED** (default: `true` in production, `false` in dev)
   - Set to `true` to enable authentication
   - Set to `false` to disable (local development only)

2. **API_KEYS** - Pipe-separated list of API keys
   - Format: `key:name:permissions|key2:name2:permissions`
   - Permissions: `read`, `write`, `admin` (comma-separated)

### Example Configuration

```bash
# .env file
AUTH_ENABLED=true
API_KEYS="abc123:Georg:read,write|xyz789:Admin:read,write,admin|def456:Bot:read"
```

### Docker Compose

```yaml
environment:
  - AUTH_ENABLED=true
  - API_KEYS=${API_KEYS:-}
```

For production, use Azure Key Vault or Container Apps secrets instead of environment variables.

## Protected Endpoints

All API endpoints require authentication with at least `read` permission:

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/mcp` | POST | `read` | MCP proxy to internal server |
| `/api/graph` | GET | `read` | Full knowledge graph |
| `/api/search` | GET | `read` | Search nodes |
| `/api/entity` | GET | `read` | Entity details |
| `/api/node-relations` | GET | `read` | Node relations |
| `/api/health` | GET | `read` | Health check |

### Public Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Web UI (static files) |
| `/<path>` | Static resources |

## Usage Examples

### cURL

```bash
# Using X-API-Key header
curl -H "X-API-Key: abc123" http://localhost:8080/api/health

# Using Authorization Bearer
curl -H "Authorization: Bearer abc123" http://localhost:8080/api/graph
```

### JavaScript (Fetch API)

```javascript
const response = await fetch('http://localhost:8080/api/graph', {
  headers: {
    'X-API-Key': 'abc123'
  }
});
```

### Python (requests)

```python
import requests

headers = {'X-API-Key': 'abc123'}
response = requests.get('http://localhost:8080/api/health', headers=headers)
```

## M365 Copilot Studio Integration

When configuring M365 Copilot Studio:

1. **API Type**: REST API
2. **Authentication**: API Key (Header)
3. **Header Name**: `X-API-Key`
4. **Header Value**: One of your API keys (with appropriate permissions)
5. **Base URL**: Your Azure Container Apps URL
   - Example: `https://memory-graph-explorer.azurecontainerapps.io`

## Permission Levels

- **read**: Can read knowledge graph data
  - Required for: `/api/graph`, `/api/search`, `/api/entity`, `/api/node-relations`, `/api/health`, `/mcp` (read operations)
  
- **write**: Can modify knowledge graph data
  - Required for: MCP write operations (create_entities, create_relations, etc.)
  
- **admin**: Full administrative access
  - Required for: Future admin operations (user management, etc.)

## Security Best Practices

1. **Never commit API keys to version control**
   - Use `.env` files (excluded via `.gitignore`)
   - Use Azure Key Vault for production

2. **Use strong, random API keys**
   - Minimum 32 characters
   - Mix of letters, numbers, special characters
   - Example: `openssl rand -hex 32`

3. **Rotate keys regularly**
   - Update keys every 90 days
   - Use multiple keys to enable rotation without downtime

4. **Use least privilege**
   - Grant only necessary permissions
   - Use read-only keys for monitoring/reporting
   - Use write keys only for trusted services

5. **Monitor API usage**
   - Log all authentication attempts
   - Alert on failed authentication
   - Review access patterns regularly

## Troubleshooting

### 401 Unauthorized

**Symptom**: API returns 401 status code

**Causes**:
- Missing `X-API-Key` header
- Invalid or expired API key
- Key doesn't have required permissions

**Solution**:
```bash
# Check your API key format
echo $API_KEYS

# Test with correct header
curl -v -H "X-API-Key: your-key" http://localhost:8080/api/health
```

### AUTH_ENABLED not working

**Symptom**: Authentication still required when `AUTH_ENABLED=false`

**Causes**:
- Environment variable not set correctly
- Container using cached environment

**Solution**:
```bash
# Rebuild container
docker compose down
docker compose build --no-cache
docker compose up
```

### Health check failing

**Symptom**: Docker health check reports unhealthy

**Cause**: Health check endpoint now requires authentication

**Solution**: Health check uses root endpoint `/` (no auth required) instead of `/api/health`

## Future Roadmap

- **OAuth 2.0** (Planned for Phase 2)
  - Azure AD / Entra ID integration
  - Token-based authentication
  - Refresh token support
  
- **Role-based Access Control (RBAC)**
  - Granular permissions
  - User groups
  - Audit logging

## Support

For issues or questions:
- GitHub Issues: https://github.com/enthali/MemoryGraphExplorer/issues
- Documentation: `/docs/README.md`
