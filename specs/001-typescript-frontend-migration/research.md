# Research: TypeScript Migration for Frontend

**Feature**: 001-typescript-frontend-migration  
**Date**: 2025-12-16

## Research Tasks Completed

### 1. D3.js TypeScript Integration

**Question**: How to use D3.js with TypeScript when loaded as global?

**Decision**: Use `@types/d3` and create a global declaration file.

**Rationale**: 
- D3.js is loaded via CDN as a global variable
- TypeScript needs to know about global `d3` object
- `@types/d3` provides complete type definitions

**Implementation**:
```typescript
// src/types/global.d.ts
declare const d3: typeof import('d3');
```

**Alternatives Considered**:
- Import D3 as ESM module → Would require changing how D3 is loaded
- Use `any` for D3 → Loses type safety benefits

---

### 2. Vite TypeScript Configuration

**Question**: How to configure Vite for TypeScript?

**Decision**: Vite has built-in TypeScript support, just rename config to `.ts`.

**Rationale**:
- Vite natively supports TypeScript without plugins
- Only need `tsconfig.json` for TypeScript compiler options
- Hot module replacement works out of the box

**Implementation**:
- Rename `vite.config.js` → `vite.config.ts`
- Add `tsconfig.json` with `"module": "ESNext"`, `"moduleResolution": "bundler"`

---

### 3. Event Bus Typing Pattern

**Question**: How to type a custom event bus with dynamic events?

**Decision**: Use generic interface with event map.

**Rationale**: Type-safe event emission and subscription.

**Implementation**:
```typescript
interface EventMap {
  'data-loaded': { entities: Entity[]; relations: Relation[] };
  'node-selected': { nodeId: string };
  'error-occurred': { error: Error };
  // ... more events
}

class EventBus {
  on<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void): void;
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void;
}
```

---

### 4. Class Property Typing

**Question**: Best practice for class properties in TypeScript?

**Decision**: Use explicit property declarations with types.

**Rationale**: Clear contracts, better IDE support.

**Implementation**:
```typescript
export class GraphRenderer {
  private container: d3.Selection<HTMLElement, unknown, null, undefined>;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private simulation: d3.Simulation<Node, Link> | null = null;
  private nodes: Node[] = [];
  private links: Link[] = [];
  // ...
}
```

---

### 5. Module Interface Consistency

**Question**: How to ensure consistent exports during migration?

**Decision**: Create interface files first, then implement.

**Rationale**: 
- Contracts defined before implementation
- Ensures no breaking changes to module consumers
- Enables incremental migration

**Implementation Order**:
1. Create `types/index.ts` with all interfaces
2. Migrate services first (least dependencies)
3. Migrate core modules
4. Migrate features
5. Migrate graph modules (most complex)

---

## Dependency Versions

| Package | Current | Action |
|---------|---------|--------|
| `typescript` | - | Add `^5.3.0` |
| `@types/d3` | - | Add `^7.4.0` |
| `d3` | `^7.8.5` | Keep |
| `vite` | `^5.0.0` | Keep |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| D3.js type complexity | Start with `any`, refine incrementally |
| Breaking existing functionality | Run tests after each file migration |
| Build failures | Commit after each successful module migration |
