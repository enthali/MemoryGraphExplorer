# Memory Graph Explorer - Project Constitution

## 🎯 Project Purpose

Memory Graph Explorer is a knowledge graph visualization system that enables GitHub Copilot to store and retrieve persistent context via the Model Context Protocol (MCP). The system serves as a "long-term memory" for AI-assisted development.

## Core Principles

### I. Simplicity First
- **One Container** - MCP Server and Web UI are consolidated
- **Minimal Dependencies** - Only what's truly needed
- **Clear Interfaces** - MCP Protocol for AI, REST API for Web

### II. Developer Experience
- **Dev Container Ready** - Fully configured for VS Code and Codespaces
- **Fast Setup** - Local development possible without Docker
- **Comprehensive Tests** - Automated validation of all features

### III. AI-Native Architecture (NON-NEGOTIABLE)
- **MCP First** - Primary interface for GitHub Copilot
- **Structured Context** - Spec Kit for project documentation
- **Self-Documenting** - Code and architecture are clearly documented

### IV. Test-Driven Quality
- **All changes** must pass tests: `node tests/run-tests.js`
- **API Endpoints** must be validated
- **MCP Tools** must be functionally tested

### V. Observability & Debugging
- JSON-based logging
- Health endpoints for all services
- Clear error messages

### VI. Documentation Standards
- **Language**: All documentation MUST be in English
- **Comments**: Code comments in English
- **Commit Messages**: Written in English

## Technical Standards

### Code Quality
- TypeScript for Backend (MCP Server) - strict typing
- Python for Web Server - Flask with clear structure
- ES6 Modules for Frontend - modern JavaScript patterns
- No Magic Numbers - all configuration via environment variables

### Documentation Requirements
- `.github/copilot-instructions.md` - Primary reference for AI assistants
- `.specify/` - Spec Kit structure for context preservation
- `docs/` - Architecture and design documentation
- Inline comments for complex logic

## Architecture Decisions

### ADR-001: Consolidated Container
**Decision**: MCP Server and Web UI in one container.
**Rationale**: Simpler deployment, less network complexity, better developer productivity.
**Consequence**: `/mcp` endpoint is proxied through Flask.

### ADR-002: JSON-based Storage
**Decision**: Knowledge Graph is persisted as JSON file.
**Rationale**: Simple, portable, human-readable, no database dependencies.
**Consequence**: Not suitable for very large graphs (>10MB).

### ADR-003: MCP StreamableHTTP
**Decision**: StreamableHTTP instead of stdio for MCP.
**Rationale**: Web-compatible, debuggable, multi-client capable.
**Consequence**: Requires HTTP server, session management.

## Development Workflow

### Feature Development (Spec-Driven)
1. Create branch from `main`
2. Use Spec Kit: `/speckit.specify` → `/speckit.plan` → `/speckit.tasks`
3. Implement and test
4. **Update documentation** (see Documentation Rule below)
5. Create PR

### Documentation Rule (NON-NEGOTIABLE)
Every PR that changes functionality MUST include documentation updates:
- **Architecture changes** → Update `docs/design/` and `.github/copilot-instructions.md`
- **New features** → Add to relevant `docs/` files
- **API changes** → Update API documentation
- **Config changes** → Update README or copilot-instructions

PRs without required docs updates will be rejected.

### Quick Iterations
1. Start local services (not Docker for fast feedback)
2. Make changes
3. Run tests: `node tests/run-tests.js`
4. Validate

### Resuming After Breaks
1. Read this Constitution
2. Check `.github/copilot-instructions.md` for architecture overview
3. Review current specs in `.specify/specs/`
4. Check open tasks

## Success Metrics

- **Fast Start**: Dev Container < 5 minutes
- **Fast Tests**: Test suite < 1 second
- **Reliable Integration**: MCP tools work consistently
- **Good DX**: Copilot can work effectively with the system

## Governance

This Constitution defines the core principles of the project:
- All PRs must adhere to the principles
- Changes to the Constitution require documentation
- In conflicts: Simplicity > Features

**Version**: 1.0.0 | **Ratified**: 2025-12-16 | **Last Amended**: 2025-12-16
