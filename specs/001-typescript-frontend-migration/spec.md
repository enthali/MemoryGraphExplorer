# Feature Specification: TypeScript Migration for Frontend

**Feature ID**: 001-typescript-frontend-migration  
**Date**: 2025-12-16  
**Status**: Draft  
**Author**: GitHub Copilot

## Summary

Migrate the frontend JavaScript codebase (`frontend/web_viewer/`) from JavaScript (ES6 modules) to TypeScript while preserving all existing functionality, libraries (D3.js, Vite), and user-facing behavior.

## Problem Statement

The frontend currently uses plain JavaScript with ES6 modules. While functional, this lacks:
- Static type checking
- Better IDE support and autocompletion
- Compile-time error detection
- Self-documenting code through type definitions

The Constitution has been updated to mandate TypeScript for Frontend development.

## Requirements

### Functional Requirements
- **FR-1**: All existing functionality must be preserved
- **FR-2**: No changes to user-facing behavior
- **FR-3**: Keep all current libraries (D3.js, Vite, Playwright)
- **FR-4**: Maintain ES6 module structure

### Non-Functional Requirements
- **NFR-1**: Strict TypeScript configuration (`strict: true`)
- **NFR-2**: No `any` types except where absolutely necessary (D3.js interop)
- **NFR-3**: Build must succeed without errors
- **NFR-4**: All existing tests must pass

## Scope

### In Scope
| File | Lines | Complexity |
|------|-------|------------|
| `main.js` | ~50 | Low |
| `modules/core/app-controller.js` | 421 | High |
| `modules/core/data-manager.js` | ~200 | Medium |
| `modules/core/event-bus.js` | ~100 | Low |
| `modules/core/state-manager.js` | ~150 | Medium |
| `modules/features/filter-manager.js` | ~150 | Medium |
| `modules/features/info-panel.js` | ~200 | Medium |
| `modules/features/legend.js` | ~150 | Medium |
| `modules/features/search-manager.js` | ~150 | Medium |
| `modules/features/theme-manager.js` | ~100 | Low |
| `modules/graph/graph-controller.js` | ~300 | High |
| `modules/graph/graph-interactions.js` | ~200 | Medium |
| `modules/graph/graph-renderer.js` | 514 | High |
| `modules/services/color-service.js` | ~100 | Low |
| `modules/services/mcp-client.js` | 173 | Medium |
| `vite.config.js` | 17 | Low |

**Total**: 15 JS files + config

### Out of Scope
- Backend MCP Server (already TypeScript)
- Python Flask server
- Test files (can remain JS for now)
- HTML/CSS changes

## Technical Constraints

- **Keep D3.js**: Use `@types/d3` for type definitions
- **Keep Vite**: Add TypeScript plugin
- **Global D3**: D3 is loaded via CDN as global, need type declarations
- **No Breaking Changes**: Preserve all exports and module interfaces

## Acceptance Criteria

- [ ] All `.js` files in `frontend/web_viewer/modules/` converted to `.ts`
- [ ] `tsconfig.json` created with strict configuration
- [ ] TypeScript and `@types/d3` added to `package.json`
- [ ] `vite.config.ts` configured for TypeScript
- [ ] `npm run build` succeeds
- [ ] `npm run dev` works
- [ ] All existing tests pass
- [ ] No runtime behavior changes
