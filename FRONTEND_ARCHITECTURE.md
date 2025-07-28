# Memory Graph Explorer - Frontend Architecture

## Overview

The frontend is a **read-only** web-based interactive knowledge graph visualization built with vanilla JavaScript and D3.js. This document outlines the modular architecture for better maintainability and user experience.

### Read-Only Architecture

- **Data Flow**: MCP Server → Frontend (one-way)
- **Modifications**: All graph modifications happen via MCP server through LLM interactions
- **Frontend Role**: Pure visualization, filtering, and search - no data manipulation
- **User Interactions**: View, filter, search, zoom, pan, select - no create/update/delete operations

## Target Architecture

### Core Principles

1. **Single Responsibility** - Each module has one clear purpose
2. **Unidirectional Data Flow** - State flows down, events flow up
3. **Separation of Concerns** - Search ≠ Filtering ≠ Rendering
4. **Stateful Architecture** - Central state management
5. **Event-Driven** - Loose coupling through events

### Search vs Filtering Philosophy

#### Search: "Find specific nodes"

- **Purpose**: Locate specific entities by name/content within current filtered dataset
- **UX**: Search input with clear button → show only matching nodes (visual filter)
- **Behavior**: Live visual filtering as user types, no graph redraw/rebuild
- **Independence**: Works within current filter set (search + filter combination)
- **Persistence**: Search persists until cleared (clear button or empty input)
- **State**: Search query, visible nodes
- **Example**: Filter "Projects" + Search "Web" → shows only web projects, user clicks to center

#### Filtering: "Show subset of graph"

- **Purpose**: View only certain types of entities and relations
- **UX**: Separate dropdowns for entity types and relation types
- **Behavior**: Rebuilds graph with filtered dataset (both entities and relations)
- **Independence**: Entity and relation filters work independently
- **State**: Selected entity types, selected relation types, filtered data
- **Example**: "Show People + Projects" + "Only work relationships" → graph with people/projects connected by work relations only

### New Module Structure

```
frontend/web_viewer/
├── index.html                 # Main HTML structure
├── main.js                   # App coordinator (50-75 lines)
├── modules/
│   ├── core/
│   │   ├── state-manager.js   # Central state management
│   │   ├── data-manager.js    # Data loading & filtering
│   │   ├── event-bus.js       # Event coordination
│   │   └── app-controller.js  # Main app coordination
│   ├── graph/
│   │   ├── graph-controller.js # Graph state & coordination
│   │   ├── graph-renderer.js  # D3.js rendering logic
│   │   └── graph-interactions.js # Mouse/touch interactions
│   ├── features/
│   │   ├── search-manager.js  # Search functionality
│   │   ├── filter-manager.js  # Entity type filtering
│   │   ├── info-panel.js     # Entity details panel
│   │   └── legend.js         # Legend rendering
│   └── services/
│       ├── mcp-client.js     # MCP server communication
│       └── color-service.js  # Color management
├── styles/
│   ├── base.css              # Reset, variables, base styles
│   ├── components.css        # Reusable component styles
│   ├── layout.css           # Layout-specific styles
│   └── graph.css            # Graph-specific styles
└── assets/                   # Icons, images, etc.
```

## Root Entity Management

### Dynamic Root Entity Discovery

The graph center is determined dynamically using a flexible observation-based system:

1. **Priority Order**:
   - Entity with observation `"rootEntity": true` (highest priority)
   - First entity in the dataset (fallback)

2. **User Control**:
   - Users can set any entity as root by adding the `rootEntity` observation
   - Only one entity should have this observation at a time
   - Can be changed dynamically without code modifications

3. **Implementation**:
   ```javascript
   // In DataManager
   findRootEntity(entities) {
     // Search for entity with rootEntity observation
     const rootEntity = entities.find(entity => 
       entity.observations.some(obs => obs === "rootEntity: true")
     );
     
     // Fallback to first entity
     return rootEntity || entities[0];
   }
   ```

4. **Benefits**:
   - **Personalization**: Each user can set their preferred center via MCP/LLM
   - **Flexibility**: Change root dynamically by adding observations via LLM
   - **Data-driven**: No hard-coded entity names
   - **Persistence**: Stored in the knowledge graph itself

## State Management Architecture

### Central State Structure
```javascript
{
  // Data State - Only filtered data loaded from server
  currentData: { entities: [], relations: [] },
  
  // Graph State
  centerEntity: null, // Determined dynamically: rootEntity observation > first entity
  selectedEntity: null,
  rootEntity: null, // Entity with "rootEntity: true" observation, or first entity as fallback
  
  // Filter State
  selectedEntityTypes: ['person', 'project'], 
  availableEntityTypes: ['person', 'project', 'company'], // Loaded once, cached
  selectedRelationTypes: ['works_at', 'collaborates_with'],
  availableRelationTypes: ['works_at', 'collaborates_with', 'manages', 'reports_to'], // Loaded once, cached
  
  // Search State
  searchQuery: '',
  searchResults: [],
  highlightedNodes: [],
  
  // UI State
  isLoading: false,
  error: null,
  infoPanelVisible: false,
  filterDropdownOpen: false,
  
  // Visual State
  colorMap: new Map(),
  zoom: 1.0,
  pan: { x: 0, y: 0 }
}
```

### Data Flow

```
User Action (click, type, select)
    ↓
Event Bus (standardized events)
    ↓
Feature Manager (search/filter/etc)
    ↓
State Manager (updates filter state)
    ↓
Data Manager (immediate server calls for filtered data)
    ↓
MCP Server (returns only matching entities/relations)
    ↓
Event Bus (data-loaded event)
    ↓
Graph Controller (manages graph state)
    ↓
Graph Renderer (D3.js updates with filtered dataset)
```

## Detailed Module Responsibilities

### Core Modules

#### `state-manager.js`
```javascript
class StateManager {
  // Centralized state management
  // setState(), getState(), subscribe()
  // Immutable state updates
  // Event emission on state changes
}
```

#### `data-manager.js`
```javascript
class DataManager {
  // Server-side data loading with type-based filtering
  // loadFilteredData(entityTypes, relationTypes) -> calls MCP server immediately
  // Simple, direct server calls - no debouncing or caching initially
  // Type metadata loading (availableEntityTypes, availableRelationTypes)
  // findRootEntity() -> searches for entity with "rootEntity: true" observation
  // READ-ONLY: No data modification, only server-side filtering
}
```

#### `app-controller.js`
```javascript
class AppController {
  // Coordinates between all managers
  // Handles high-level user actions
  // Orchestrates complex workflows (including root entity discovery on startup)
  // Error handling and loading states
  // initializeApp() -> loads data, finds root entity, sets initial state
}
```

### Event Bus Implementation

```javascript
// event-bus.js - Simple event communication
class EventBus {
  constructor() {
    this.events = {};
  }
  
  // Subscribe to events
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }
  
  // Publish events
  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => callback(data));
    }
  }
  
  // Unsubscribe (for cleanup)
  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  }
}

// Usage Example:
// filterManager.emit('filter-changed', { entityTypes: [...], relationTypes: [...] });
// dataManager.on('filter-changed', (data) => this.loadFilteredData(data));
```

### Feature Modules

#### `search-manager.js`
```javascript
class SearchManager {
  // Live search query processing (as user types)
  // Finding matching entities in current filtered dataset
  // Visual filtering - show/hide DOM elements
  // Search persistence and clear functionality
  // NO data modification - pure visual filtering
}
```

#### `filter-manager.js`
```javascript
class FilterManager {
  // Entity type and relation type selection state
  // Dual filter UI rendering and interaction (separate dropdowns)
  // Triggers data re-filtering for both entities and relations
  // Updates available filter options for both types
}
```

#### `graph-controller.js`
```javascript
class GraphController {
  // Graph rendering coordination
  // Node/link interaction handling
  // View state management (zoom, pan)
  // Animation coordination
}
```

## Implementation Strategy

### Phase 1: Foundation (Week 1)
1. Create new module structure
2. Implement `EventBus` for communication (core architecture)
3. Implement `StateManager` with basic state
4. Basic `DataManager` with simple server calls (no debouncing)

### Phase 2: Search & Filter Separation (Week 2)
1. Implement proper search functionality (highlight, don't filter)
2. Implement true data filtering (rebuild graph)
3. Update UI components for new behavior
4. Test both search and filter independently

### Phase 3: Graph Enhancement (Week 3)
1. Refactor graph rendering for better performance
2. Improve filter UI/UX
3. Add advanced search features
4. Polish interactions and animations

### Phase 4: Advanced Features (Week 4)
1. Multiple search results navigation
2. Filter combinations (AND/OR logic)
3. Saved filter presets
4. Search history

## User Experience Flows

### Initial Graph Loading Flow
```
App starts
    ↓
DataManager loads available entity and relation types (cached)
    ↓
DataManager loads default filtered data (e.g., all types initially)
    ↓
DataManager searches for entity with "rootEntity: true" observation
    ↓
If found: uses that entity; If not found: uses first entity
    ↓
StateManager updates centerEntity and rootEntity
    ↓
GraphController centers graph on root entity
    ↓
User sees graph centered on their preferred entity
```

### Set Root Entity Flow (via MCP/LLM)
```
User asks LLM: "Set Georg Doll as my root entity"
    ↓
LLM calls MCP server: add_observations([{entityName: "Georg Doll", contents: ["rootEntity: true"]}])
    ↓
LLM calls MCP server: delete_observations for any other entity with "rootEntity: true"
    ↓
Frontend polls/refreshes data from MCP server
    ↓
DataManager finds new root entity with "rootEntity: true" observation
    ↓
StateManager updates rootEntity and centerEntity
    ↓
GraphController animates to center on new root entity
    ↓
Root entity preference persists in knowledge graph
```

### Search Flow
```
User types "John" in search input (live)
    ↓
SearchManager finds matching entities in current dataset
    ↓
StateManager updates visibleNodes (visual filter)
    ↓
GraphController applies display:none to non-matching nodes
    ↓
GraphRenderer shows only matching nodes (no redraw)
    ↓
User sees only "John" nodes, clicks on desired one to center
    ↓
Search persists until user clicks clear button or empties input
```

### Filter Flow
```
User unchecks "Company" entities and "manages" relations
    ↓
FilterManager updates selectedEntityTypes and selectedRelationTypes
    ↓
FilterManager emits 'filter-changed' event via EventBus
    ↓
DataManager receives event, calls MCP server immediately with filter: entityTypes=['person','project'], relationTypes=['works_at','collaborates_with']
    ↓
MCP server returns only matching entities and relations
    ↓
DataManager emits 'data-loaded' event via EventBus
    ↓
GraphController receives event, rebuilds with server-filtered data
    ↓
GraphRenderer draws new graph (people + projects, work + collaboration relations only)
```

### Combined Flow
```
User filters to "Projects only" + searches "WebApp"
    ↓
Filter: DataManager calls MCP server → only project entities loaded
    ↓
GraphController rebuilds graph with server-filtered project data
    ↓
Search: SearchManager applies visual filter to current graph
    ↓
GraphRenderer hides non-matching projects (display:none)
    ↓
Result: Only "WebApp" projects visible, user clicks to center
```

## Performance Considerations

### Data Management
- **Server-side filtering**: Only load data matching current filter criteria
- **Immediate requests**: Call server immediately on filter changes (no debouncing initially)
- **Simple data flow**: Load types once, filter data on demand
- **Co-located architecture**: Frontend + MCP server in same Docker environment for minimal latency

### Rendering
- **Virtual scrolling**: For large filter lists
- **Debounced search**: Avoid excessive re-renders
- **Animation queuing**: Smooth transitions between states

## Testing Strategy

### Unit Tests
- Each manager can be tested independently
- Mock state and event dependencies
- Test data filtering logic separately from UI

### Integration Tests
- Test event flow between managers
- Test state management consistency
- Test search + filter combinations

### End-to-End Tests
- Test complete user workflows
- Visual regression tests for graph rendering
- Performance tests with large datasets

## Benefits of New Architecture

1. **🔧 Maintainable**: Small, focused modules
2. **🧪 Testable**: Clear interfaces and separation
3. **🎯 User-Friendly**: Distinct search vs filter behavior
4. **🚀 Performant**: Efficient data flow and server-side filtering
5. **📈 Scalable**: Memory efficient, works with large knowledge graphs
6. **🐛 Debuggable**: Clear state and event flow
7. **👤 Personalizable**: Dynamic root entity based on user preferences
8. **💾 Persistent**: Root entity preference stored in knowledge graph
9. **🧠 Memory Efficient**: Only load filtered data, not entire graph
10. **⚡ Fast**: Co-located architecture minimizes server call latency

## Migration Plan

This refactoring can be done incrementally:
1. Keep existing `main.js` working
2. Build new modules alongside
3. Gradually move functionality
4. Replace old components one by one
5. Remove old code when all features migrated

## Questions for Discussion

1. Should we start with state management or data filtering?
2. How granular should the event system be?
3. Any specific UI improvements you want during refactoring?
4. Should we add any new features during the refactoring?
