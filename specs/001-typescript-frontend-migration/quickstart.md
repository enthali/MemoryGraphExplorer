# Quickstart: TypeScript Migration

**Feature**: 001-typescript-frontend-migration

## Prerequisites

- Node.js 18+
- npm or pnpm

## Setup Commands

```bash
# Navigate to frontend
cd frontend/web_viewer

# Install TypeScript dependencies
npm install --save-dev typescript @types/d3

# Initialize TypeScript (or copy tsconfig.json from spec)
npx tsc --init
```

## Build & Run

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

## Migration Order

1. **Setup** (10 min)
   - Add `tsconfig.json`
   - Add TypeScript to `package.json`
   - Create `src/types/` directory

2. **Types** (15 min)
   - Create type definition files
   - Create `global.d.ts` for D3

3. **Services** (20 min)
   - `mcp-client.js` → `.ts`
   - `color-service.js` → `.ts`

4. **Core** (30 min)
   - `event-bus.js` → `.ts`
   - `state-manager.js` → `.ts`
   - `data-manager.js` → `.ts`
   - `app-controller.js` → `.ts`

5. **Features** (30 min)
   - All 5 feature modules

6. **Graph** (45 min)
   - `graph-renderer.js` → `.ts` (most complex)
   - `graph-interactions.js` → `.ts`
   - `graph-controller.js` → `.ts`

7. **Config** (5 min)
   - `vite.config.js` → `.ts`
   - `main.js` → `.ts`

## Validation

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Test (from repo root)
node tests/run-tests.js
```

## Troubleshooting

### D3 types not found
Ensure `@types/d3` is installed and `global.d.ts` declares:
```typescript
declare const d3: typeof import('d3');
```

### Import errors after rename
Update all imports from `.js` to `.ts` or remove extension entirely.

### Strict mode errors
Address one by one, use `// @ts-expect-error` temporarily if needed.
