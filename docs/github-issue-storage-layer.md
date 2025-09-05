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
- [ ] Ensure all existing functionality works unchanged

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

### Testing & Validation

#### Testing Strategy
```bash
# Start test container with test data
docker-compose -f docker-compose.test.yml up -d

# Run API tests to verify compatibility
npm test

# Test MCP tools via HTTP endpoint
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "create_entities", "arguments": {...}}}'
```

#### Container-Based Testing
GitHub Copilot can use the existing Docker setup for end-to-end validation:
- `docker-compose.test.yml` provides isolated test environment
- `data/memory-test.json` contains test data in current format
- `data/memory-test-universal-ids.json` contains test data with IDs (already created)

### Acceptance Criteria

- [ ] All existing MCP tools continue working unchanged
- [ ] No breaking changes to external API
- [ ] Internal storage uses IDs while API remains name-based
- [ ] Migration script successfully converts existing data to continuous ID format
- [ ] Comprehensive test coverage for storage layer
- [ ] Performance is maintained or improved
- [ ] Container-based testing validates complete system integration
- [ ] All HTTP API endpoints work with new storage layer

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
**Medium** (1-2 days implementation + testing)

Storage layer is purely internal, no frontend changes needed.

### Labels
- `enhancement`
- `backend`
- `breaking-change` (internal only)
- `architecture`

### Assignee
GitHub Copilot Coding Agent / Development Team
