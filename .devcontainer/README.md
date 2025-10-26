# Memory Graph Explorer - Development Container

This directory contains the development container configuration for Memory Graph Explorer, providing a consistent and isolated development environment for both local development and GitHub Codespaces.

## Features

✅ **Node.js 20** - Backend MCP server runtime  
✅ **Python 3** - Frontend Flask server  
✅ **Docker-in-Docker** - Run docker-compose inside the devcontainer  
✅ **Pre-configured VS Code** - Extensions and settings optimized for this project  
✅ **Automatic Setup** - Dependencies installed on container creation  
✅ **Port Forwarding** - All service ports pre-configured  
✅ **GitHub Codespaces Ready** - Works seamlessly in the cloud

## Quick Start

### GitHub Codespaces (Recommended)

1. Click **Code** → **Codespaces** → **Create codespace on main**
2. Wait for the container to build (~3-5 minutes first time)
3. The post-create script will automatically install dependencies
4. Start developing! 🚀

### Local Development with VS Code

1. Install **Docker Desktop** and **VS Code**
2. Install the **Dev Containers** extension in VS Code
3. Open this repository in VS Code
4. Press `F1` → Select **Dev Containers: Reopen in Container**
5. Wait for the container to build
6. Start developing! 🚀

## What Gets Installed

### System Tools

- **Node.js 20** with npm
- **Python 3** with pip
- **Docker** and docker-compose
- **Git** for version control
- Build tools (gcc, make, etc.)

### Development Tools

- **TypeScript** and ts-node
- **Prettier** for code formatting
- **ESLint** for JavaScript linting
- **Black** for Python formatting
- **Pylint** for Python linting
- **markdownlint-cli** for markdown validation

### VS Code Extensions

- Python language support with Pylance
- TypeScript/JavaScript support
- Docker extension
- GitHub Copilot
- Markdown linting
- GitHub Actions support

## Development Workflow

### After Container Starts

The post-create script automatically:

1. Installs backend dependencies (`npm install` in `backend/mcp-server`)
2. Builds the TypeScript code (`npm run build`)
3. Installs frontend dependencies (`pip install -r requirements.txt`)
4. Creates test data file if missing

### Running the Application

#### Production Mode

```bash
docker compose up
```

Access at:
- **MCP Server**: http://localhost:3000/mcp
- **Web UI**: http://localhost:8080

#### Development Mode

```bash
docker compose -f docker-compose.dev.yml up
```

Access at:
- **MCP Server**: http://localhost:3001/mcp
- **Web UI**: http://localhost:8081

#### Running Both Simultaneously

```bash
# Terminal 1
docker compose up

# Terminal 2
docker compose -f docker-compose.dev.yml up
```

### Testing

```bash
# Run all tests
node tests/run-tests.js

# Run specific tests
node tests/test-api-endpoints.js
node tests/test-mcp-http.js
```

## Port Access

When you run `docker compose up` inside the devcontainer, Docker binds the ports directly to the container's localhost. You can access the services at:

- **Production MCP Server**: http://localhost:3000/mcp
- **Development MCP Server**: http://localhost:3001/mcp
- **Production Web UI**: http://localhost:8080
- **Development Web UI**: http://localhost:8081

In **GitHub Codespaces**, these ports are automatically detected and forwarded. You'll see them in the "Ports" panel with public URLs.

## File Structure

```
.devcontainer/
├── devcontainer.json    # Main configuration
├── Dockerfile          # Container image definition
├── post-create.sh      # Automatic setup script
├── .dockerignore       # Files to exclude from build
└── README.md          # This file
```

## Customization

### Adding VS Code Extensions

Edit `devcontainer.json`:

```json
"extensions": [
    "existing.extensions",
    "your.new-extension"
]
```

### Modifying System Packages

Edit `Dockerfile` to add apt packages:

```dockerfile
RUN apt-get update && apt-get install -y \
    your-package-here \
    && rm -rf /var/lib/apt/lists/*
```

### Changing Node.js Version

Edit `Dockerfile` and change the `NODE_VERSION` build arg:

```dockerfile
ARG NODE_VERSION=20  # Change to your desired version
```

## Troubleshooting

### Container Build Fails

1. **Check Docker Desktop is running**
2. **Ensure you have enough disk space** (~2GB for container)
3. **Try rebuilding**: `F1` → **Dev Containers: Rebuild Container**

### Dependencies Not Installing

1. **Check internet connection**
2. **Manually run post-create script**:
   ```bash
   bash .devcontainer/post-create.sh
   ```

### Docker Commands Not Working

The devcontainer uses Docker-in-Docker. Ensure:

1. Docker Desktop is running on your host
2. You're running commands inside the devcontainer terminal
3. Your user has Docker permissions (automatically configured)

### Port Already in Use

If ports 3000, 3001, 8080, or 8081 are already in use:

1. Stop conflicting services on your host
2. Or modify the port mappings in `docker-compose.yml`

## Performance Tips

### Codespaces

- **Use at least 4-core machine** for best performance
- **Prebuild configuration** speeds up container creation
- **Stop unused codespaces** to save resource quota

### Local Development

- **Allocate more resources to Docker Desktop** (Settings → Resources)
- **Use SSD storage** for better build performance
- **Enable WSL2 backend** on Windows for better performance

## Best Practices

### Daily Workflow

1. **Open in devcontainer** - Consistent environment every time
2. **Pull latest changes** - Keep your code up to date
3. **Run tests** - Verify everything works before making changes
4. **Make incremental commits** - Small, focused changes
5. **Test in both modes** - Production and development

### Code Quality

- **Format on save** - Enabled by default
- **Run linters** - ESLint, Pylint, markdownlint
- **Review test output** - Fix failing tests immediately
- **Use GitHub Copilot** - Integrated and ready to use

## Additional Resources

- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Docker-in-Docker Best Practices](https://github.com/microsoft/vscode-dev-containers/tree/main/script-library/docs)

## Support

For issues specific to the devcontainer setup, open an issue on GitHub with:

- Your environment (Codespaces or local)
- Error messages from the build or post-create log
- Your Docker Desktop version (if local)
