# Data Model: TypeScript Migration

**Feature**: 001-typescript-frontend-migration  
**Date**: 2025-12-16

## Core Type Definitions

### Entity Types (from MCP Server)

```typescript
// types/graph.ts

export interface Entity {
  id: string;
  name: string;
  entityType: string;
  observations: string[];
}

export interface Relation {
  id: string;
  from: string;
  to: string;
  relationType: string;
}

export interface GraphData {
  entities: Entity[];
  relations: Relation[];
}
```

### D3 Node/Link Types

```typescript
// types/d3-graph.ts

import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  observations: string[];
  // D3 adds these at runtime
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}
```

### Event Types

```typescript
// types/events.ts

export interface EventMap {
  // Data events
  'data-loaded': { entities: Entity[]; relations: Relation[] };
  'data-updated': { entities: Entity[]; relations: Relation[] };
  
  // Selection events
  'node-selected': { nodeId: string; node: GraphNode };
  'node-deselected': void;
  'edge-selected': { edgeId: string; edge: GraphLink };
  
  // UI events
  'filter-changed': { activeTypes: string[] };
  'search-performed': { query: string; results: GraphNode[] };
  'theme-changed': { theme: 'light' | 'dark' };
  
  // State events
  'loading-state': { isLoading: boolean; message?: string };
  'error-occurred': { error: Error; context?: string };
}
```

### State Types

```typescript
// types/state.ts

export interface AppState {
  // Graph data
  entities: Entity[];
  relations: Relation[];
  
  // UI state
  selectedNode: GraphNode | null;
  hoveredNode: GraphNode | null;
  activeFilters: string[];
  searchQuery: string;
  
  // Settings
  theme: 'light' | 'dark';
  showLabels: boolean;
}
```

### Renderer Options

```typescript
// types/renderer.ts

export interface RendererOptions {
  width: number;
  height: number;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode) => void;
  onNodeLeave?: (node: GraphNode) => void;
  onEdgeHover?: (edge: GraphLink) => void;
  onEdgeLeave?: (edge: GraphLink) => void;
  entityTypeColorMap?: Record<string, string>;
}
```

## File Structure

```
frontend/web_viewer/
├── src/
│   └── types/
│       ├── index.ts          # Re-exports all types
│       ├── graph.ts          # Entity, Relation, GraphData
│       ├── d3-graph.ts       # GraphNode, GraphLink
│       ├── events.ts         # EventMap
│       ├── state.ts          # AppState
│       ├── renderer.ts       # RendererOptions
│       └── global.d.ts       # Global d3 declaration
├── modules/
│   ├── core/
│   │   ├── app-controller.ts
│   │   ├── data-manager.ts
│   │   ├── event-bus.ts
│   │   └── state-manager.ts
│   ├── features/
│   │   ├── filter-manager.ts
│   │   ├── info-panel.ts
│   │   ├── legend.ts
│   │   ├── search-manager.ts
│   │   └── theme-manager.ts
│   ├── graph/
│   │   ├── graph-controller.ts
│   │   ├── graph-interactions.ts
│   │   └── graph-renderer.ts
│   └── services/
│       ├── color-service.ts
│       └── mcp-client.ts
├── main.ts
├── tsconfig.json
└── vite.config.ts
```
