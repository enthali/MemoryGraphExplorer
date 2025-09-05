# GitHub Issue: Implement UUID-Based Storage Layer

## Issue Title
**[Feature] Implement UUID-based storage layer for entity management**

## Issue Description

### Problem Statement
Currently, the MCP server uses entity names as primary identifiers, which prevents entity renaming without breaking all related connections. This limitation makes the system unsuitable for production use where entities need to be updated.

**Example of the problem:**
```json
// Current system - if we rename "Max Mustermann" to "Max Schmidt"
{"name": "Max Mustermann", "type": "Person"}
{"from": "Max Mustermann", "to": "TechCorp", "relationType": "employedAt"} // ❌ Breaks!
```

### Proposed Solution
Implement a transparent UUID-based storage layer that maintains name-based API compatibility while using internal IDs for referential integrity.

### Architecture Overview
The solution consists of three main components:

1. **ID Manager**: Sequential UUID generation and initialization
2. **Name Mapping**: Bidirectional name-to-ID resolution 
3. **Storage Layer**: Transparent ID management with name-based API

### Technical Requirements

#### 1. ID Management Interface
```typescript
interface IDManager {
  createNewId(): string;                  // Generate new sequential ID
  getHighestId(): string;                 // Find max ID for initialization
}
```

#### 2. Name-ID Mapping Interface
```typescript
interface NameMapping {
  nameToId: Map<string, string>;     // "Max Mustermann" → "1"
  idToName: Map<string, string>;     // "1" → "Max Mustermann"
  
  // Simple access methods:
  getId(name: string): string | undefined;
  getName(id: string): string | undefined;
  
  // Management methods:
  addMapping(name: string, id: string): void;
  removeMapping(name: string): void;
  updateName(oldName: string, newName: string): void;
}
```

#### 3. Storage Layer Interface
```typescript
interface StorageLayer {
  // Entity Management
  createEntity(name: string, type: string, observations: string[]): string;
  renameEntity(oldName: string, newName: string): void;
  deleteEntity(name: string): void;
  
  // Relation Management  
  createRelation(from: string, relationType: string, to: string): string;  // Returns relation ID
  deleteRelation(relationId: string): void;                                // Delete by ID
  updateRelation(relationId: string, newType: string): void;               // Update relation type
  
  // Query Functions
  findEntityById(id: string): Entity | null;
  findEntityByName(name: string): Entity | null;
  searchEntities(query: string): Entity[];
  
  // Initialization
  loadFromFile(filePath: string): void;
  saveToFile(filePath: string): void;
  initializeIdCounter(): void;           // Scan file for highest ID
}
```

### Implementation Tasks

#### Phase 1: Add ID Support
- [ ] Implement `IDManager` class with sequential ID generation
- [ ] Implement `NameMapping` class with bidirectional maps
- [ ] Add `id` field to all new entities (keep existing entities unchanged for now)
- [ ] Build name-to-ID mapping from existing entities

#### Phase 2: Update Relations
- [ ] Convert relation `from`/`to` fields to use IDs internally
- [ ] Maintain API compatibility by resolving names to IDs
- [ ] Update all existing MCP tools to use new storage layer

#### Phase 3: Add New Features
- [ ] Implement `rename_entity` MCP tool
- [ ] Add entity renaming functionality to frontend
- [ ] Test referential integrity after renames

#### Phase 4: Migration & Cleanup
- [ ] Design migration strategy for all item types (entities, relations, types)
- [ ] Create migration script that assigns continuous IDs to all items
- [ ] Add comprehensive tests for all scenarios
- [ ] Update documentation

### File Changes Required

```
backend/mcp-server/src/
├── storage/
│   ├── IDManager.ts                    # NEW
│   ├── NameMapping.ts                  # NEW
│   ├── StorageLayer.ts                 # NEW
│   └── index.ts                        # NEW
├── tools/
│   ├── rename-entity.ts                # NEW
│   └── [update all existing tools]    # MODIFY
├── KnowledgeGraphManager.ts            # MODIFY (use StorageLayer)
└── types/index.ts                      # MODIFY (add storage interfaces)
```

### Data Format Changes

#### Internal Storage (with IDs)
```json
{"type": "entity", "id": "1", "name": "Max Mustermann", "entityType": "Person", "observations": ["..."]}
{"type": "entity", "id": "2", "name": "TechCorp", "entityType": "Company", "observations": ["..."]}
{"type": "relation", "id": "3", "from": "1", "to": "2", "relationType": "employedAt"}
{"type": "relation", "id": "4", "from": "1", "to": "2", "relationType": "responsibleFor"}
{"type": "typeDefinition", "id": "5", "name": "Person", "objectType": "entityType"}
{"type": "typeDefinition", "id": "6", "name": "employedAt", "objectType": "relationType"}
```

#### API Output (unchanged for compatibility)
```json
{"name": "Max Mustermann", "type": "Person", "observations": ["..."]}
{"from": "Max Mustermann", "to": "TechCorp", "relationType": "employedAt"}
```

### Expected Benefits

1. **Entity Renaming**: Change names without breaking relations
2. **Referential Integrity**: Relations survive entity updates
3. **API Compatibility**: Existing frontend continues working unchanged
4. **Performance**: Faster lookups with ID-based relations
5. **Production Ready**: Robust system for real-world usage

### Acceptance Criteria

- [ ] All existing MCP tools continue working unchanged
- [ ] New `rename_entity` tool successfully renames entities
- [ ] Relations remain intact after entity renames  
- [ ] Frontend displays updated entity names correctly
- [ ] No breaking changes to external API
- [ ] Comprehensive test coverage for all scenarios
- [ ] Migration script successfully converts existing data to continuous ID format

### Technical Notes

- Use sequential IDs (1, 2, 3...) for ALL items (entities, relations, and types)
- Single ID counter ensures no collisions across different item types
- IDs are purely internal - never exposed through API
- Maintain backward compatibility with existing name-based API
- Implement lazy loading of name mappings for performance
- Add comprehensive error handling for ID conflicts
- TypeDefinition IDs are assigned but may not be actively used initially

### Related Files
- `docs/design/storage-layer.md` - Detailed architecture specification
- `backend/mcp-server/src/KnowledgeGraphManager.ts` - Current implementation
- `data/memory-test.json` - Test data in current format
- `scripts/migrate-to-ids.js` - Migration script (implemented)

### Estimated Effort
**Medium-Large** (2-3 days implementation + testing)

### Labels
- `enhancement`
- `backend`
- `breaking-change` (internal only)
- `architecture`

### Assignee
GitHub Copilot Coding Agent / Development Team
