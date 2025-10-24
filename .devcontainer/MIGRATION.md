# Migrating to Devcontainer Setup

This guide helps existing contributors migrate from local development to the new devcontainer setup.

## Why Use Devcontainer?

✅ **Consistent Environment** - Same setup for everyone, regardless of OS  
✅ **Isolated Dependencies** - No conflicts with your system Python/Node  
✅ **Quick Onboarding** - New contributors up and running in minutes  
✅ **Codespaces Ready** - Develop anywhere with just a browser  
✅ **Pre-configured Tools** - All extensions and settings included

## Migration Path

### Option 1: GitHub Codespaces (Easiest)

1. **Open GitHub repository in browser**
2. **Click:** Code → Codespaces → Create codespace on main
3. **Wait** for automatic setup (~3-5 minutes)
4. **Start developing** - all dependencies pre-installed!

### Option 2: Local VS Code Dev Container

1. **Install prerequisites:**
   - Docker Desktop (https://www.docker.com/products/docker-desktop)
   - VS Code (https://code.visualstudio.com)
   - Dev Containers extension (ms-vscode-remote.remote-containers)

2. **Open repository in VS Code**

3. **Reopen in container:**
   - Press `F1`
   - Select "Dev Containers: Reopen in Container"
   - Wait for build and setup (~5-10 minutes first time)

4. **Start developing** - everything installed automatically!

### Option 3: Keep Using Local Setup

You can continue using your existing local setup! The devcontainer is optional.

Just be aware:
- Other contributors may be using devcontainer
- CI/CD may test in devcontainer environment
- You'll need to manage dependencies manually

## What Gets Installed Automatically

The devcontainer post-create script installs:

- ✅ Backend dependencies (`npm install` in backend/mcp-server)
- ✅ TypeScript build (`npm run build`)
- ✅ Frontend dependencies (`pip install -r requirements.txt`)
- ✅ Test data file (`data/memory-test.json`)

## Differences from Local Setup

### Before (Local Setup)

```bash
# Manual setup
cd backend/mcp-server && npm install
pip3 install -r requirements.txt
cd backend/mcp-server && npm run build

# Start services
cd backend/mcp-server && MEMORY_FILE_PATH="../../data/memory-test.json" PORT=3001 node dist/index.js
cd frontend/web_viewer && python server.py --port 8080 --mcp-url http://localhost:3001/mcp
```

### After (Devcontainer)

```bash
# Setup: AUTOMATIC on container creation!

# Start services (same as before)
docker compose up
# or
docker compose -f docker-compose.dev.yml up
```

## Your Workflow Changes

### Git Operations
✅ **Same as before** - Git works exactly the same way

### Code Editing
✅ **Same as before** - VS Code works the same, just inside container

### Running Tests
✅ **Same as before** - All test commands work identically

### Docker Commands
✅ **Better!** - Docker-in-Docker means you can run docker-compose inside devcontainer

## Common Questions

### Q: Will my existing local setup work?
**A:** Yes! The devcontainer is optional. Your local setup continues to work.

### Q: Do I need to delete my local dependencies?
**A:** No. They're separate. Devcontainer has its own isolated dependencies.

### Q: Can I use both local and devcontainer?
**A:** Yes! Switch between them as needed. Your code is shared, dependencies are isolated.

### Q: What about my VS Code settings?
**A:** Devcontainer includes recommended settings. Your personal settings still apply.

### Q: Does this work on Windows/Mac/Linux?
**A:** Yes! That's the whole point - consistent environment everywhere.

### Q: What if I don't have Docker Desktop?
**A:** Use GitHub Codespaces (browser-based) or continue with local setup.

## Troubleshooting Migration

### Container Build Fails

**Problem:** Devcontainer fails to build  
**Solution:**
1. Check Docker Desktop is running
2. Ensure you have ~2GB free disk space
3. Try: `F1` → "Dev Containers: Rebuild Container"

### Dependencies Not Installing

**Problem:** Post-create script fails  
**Solution:**
1. Check internet connection
2. Manually run: `bash .devcontainer/post-create.sh`
3. Check logs in VS Code Output panel

### Port Conflicts

**Problem:** Ports 3000, 3001, 8080, 8081 already in use  
**Solution:**
1. Stop services running on those ports on your host
2. Or modify `docker-compose.yml` port mappings

### Slow Performance

**Problem:** Container feels slow  
**Solution:**
1. Allocate more resources to Docker Desktop (Settings → Resources)
2. Use SSD storage if available
3. On Windows: Enable WSL2 backend

### Can't Access Services

**Problem:** Can't reach http://localhost:8080  
**Solution:**
1. Check VS Code's "Ports" panel (View → Ports)
2. Verify services are running inside container
3. Try refreshing port forwards

## Performance Comparison

| Setup Type | Initial Setup | Rebuild Time | Consistency |
|------------|---------------|--------------|-------------|
| Local | 5-10 min | N/A | Varies by system |
| Devcontainer (Local) | 5-10 min | 2-3 min | 100% consistent |
| Codespaces | 3-5 min | Instant | 100% consistent |

## Best Practices

### Daily Workflow

1. **Open in devcontainer** (or Codespaces)
2. **Pull latest changes**
3. **Run tests** to verify everything works
4. **Make your changes**
5. **Test again** before committing
6. **Push changes**

### When to Rebuild

Rebuild your devcontainer when:
- `.devcontainer/Dockerfile` changes
- `.devcontainer/devcontainer.json` changes
- Dependencies have major updates
- Something feels "off" about the environment

### Resource Management

**Local Docker:**
- Stop containers when not in use: `docker compose down`
- Periodically clean up: `docker system prune`

**Codespaces:**
- Stop codespace when done (saves quota)
- Delete unused codespaces
- Use 4-core machines for best performance

## Getting Help

### Documentation
- [Devcontainer README](.devcontainer/README.md)
- [Quick Reference](.devcontainer/QUICKREF.md)
- [VS Code Docs](https://code.visualstudio.com/docs/devcontainers/containers)

### Support Channels
- Create GitHub issue with `devcontainer` label
- Check existing issues for known problems
- Ask in project discussions

## Gradual Migration Strategy

### Week 1: Try Codespaces
- Open a codespace for a small task
- Get comfortable with browser-based development
- Compare experience with local setup

### Week 2: Use Local Devcontainer
- Install Docker Desktop and Dev Containers extension
- Open project in devcontainer for a feature branch
- Experience the automated setup

### Week 3: Make It Primary
- Use devcontainer as your main development environment
- Keep local setup as backup
- Help others migrate

## Feedback Welcome!

If you encounter issues or have suggestions:
- Open a GitHub issue
- Contribute improvements to `.devcontainer/`
- Share your experience with the team

---

**Happy coding in your new isolated environment!** 🚀
