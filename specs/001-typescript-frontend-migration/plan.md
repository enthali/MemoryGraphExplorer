# Implementation Plan: TypeScript Migration for Frontend

**Branch**: `001-typescript-frontend-migration` | **Date**: 2025-12-16 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-typescript-frontend-migration/spec.md`

## Summary

Migrate the frontend JavaScript codebase (15 files, ~3000 LOC) from ES6 modules to TypeScript while preserving all existing functionality, D3.js visualization, and Vite build tooling. No user-facing changes.

## Technical Context

**Language/Version**: TypeScript 5.3+, targeting ES2022  
**Primary Dependencies**: D3.js ^7.8.5 (keep), Vite ^5.0.0 (keep), @types/d3 ^7.4.0 (add)  
**Storage**: N/A (frontend only)  
**Testing**: Playwright (existing), manual validation  
**Target Platform**: Modern browsers (ES2022 support)  
**Project Type**: Web application frontend  
**Performance Goals**: No regression from current performance  
**Constraints**: Zero breaking changes, preserve all exports  
**Scale/Scope**: 15 JS files, ~3000 lines of code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | ✅ PASS | TypeScript adds complexity but Constitution mandates it |
| II. Developer Experience | ✅ PASS | Better IDE support, autocomplete |
| III. AI-Native Architecture | ✅ PASS | Self-documenting through types |
| IV. Test-Driven Quality | ✅ PASS | Must run tests after migration |
| V. Observability | ✅ PASS | No impact |
| VI. Documentation Standards | ✅ PASS | Types serve as documentation |
| Technical: TypeScript for Frontend | ✅ PASS | This migration fulfills the requirement |

**GATE RESULT**: ✅ PASS - Proceed with implementation

## Project Structure

### Documentation (this feature)

```text
specs/001-typescript-frontend-migration/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Type definitions
├── quickstart.md        # Phase 1: Setup guide
└── contracts/           # N/A for this migration
```

### Source Code (migration target)

```text
frontend/web_viewer/
├── src/
│   └── types/              # NEW: Type definitions
│       ├── index.ts
│       ├── graph.ts
│       ├── d3-graph.ts
│       ├── events.ts
│       ├── state.ts
│       ├── renderer.ts
│       └── global.d.ts     # D3 global declaration
├── modules/
│   ├── core/               # 4 files → .ts
│   ├── features/           # 5 files → .ts
│   ├── graph/              # 3 files → .ts
│   └── services/           # 2 files → .ts
├── main.ts                 # Was main.js
├── tsconfig.json           # NEW
└── vite.config.ts          # Was vite.config.js
```

**Structure Decision**: Keep existing module structure, add `src/types/` for shared type definitions.

## Implementation Phases

### Phase 1: Setup (PR #1)
- Add `tsconfig.json` with strict configuration
- Add TypeScript and `@types/d3` to `package.json`
- Create `src/types/` with all type definitions
- Create `global.d.ts` for D3 global

### Phase 2: Services Migration (PR #2)
- Convert `modules/services/mcp-client.js` → `.ts`
- Convert `modules/services/color-service.js` → `.ts`

### Phase 3: Core Migration (PR #3)
- Convert `modules/core/event-bus.js` → `.ts`
- Convert `modules/core/state-manager.js` → `.ts`
- Convert `modules/core/data-manager.js` → `.ts`
- Convert `modules/core/app-controller.js` → `.ts`

### Phase 4: Features Migration (PR #4)
- Convert all 5 files in `modules/features/` → `.ts`

### Phase 5: Graph Migration (PR #5)
- Convert `modules/graph/graph-renderer.js` → `.ts`
- Convert `modules/graph/graph-interactions.js` → `.ts`
- Convert `modules/graph/graph-controller.js` → `.ts`

### Phase 6: Finalization (PR #6)
- Convert `main.js` → `main.ts`
- Convert `vite.config.js` → `vite.config.ts`
- Update `index.html` script references
- Final validation

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| D3.js type complexity | Medium | Medium | Use `any` sparingly, refine later |
| Breaking module exports | Low | High | Test after each file |
| Build failures | Medium | Medium | Incremental PRs |

## Success Criteria

- [ ] `npm run build` succeeds without TypeScript errors
- [ ] `npm run dev` works with hot reload
- [ ] All existing Playwright tests pass
- [ ] No runtime behavior changes
- [ ] Zero `any` types (except D3.js interop where necessary)

---

**Next Step**: Run `/speckit.tasks` to generate detailed task list for each phase.
