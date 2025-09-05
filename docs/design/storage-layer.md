# Storage Layer Architecture

## Overview

The Storage Layer provides transparent UUID-based entity management while maintaining a name-based API. This layer handles:

- **Entity ID Management**: Auto-generated sequential IDs
- **Name-to-ID Mapping**: Bidirectional resolution
- **Referential Integrity**: Relations use IDs internally, names externally
- **Entity Renaming**: Update names without breaking relations

## Architecture Components

### 1. ID Management
```typescript
interface IDManager {
  createNewId(): string;                  // Generate new sequential ID
  getHighestId(): string;                 // Find max ID for initialization
}
```

### 2. Name-ID Mapping
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

### 3. Storage Interface
```typescript
interface StorageLayer {
  // Entity Management
  createEntity(name: string, type: string, observations: string[]): string;
  renameEntity(oldName: string, newName: string): void;
  deleteEntity(name: string): void;
  
  // Relation Management  
  createRelation(from: string, relationType: string, to: string): void;
  deleteRelation(from: string, relationType: string, to: string): void;
  
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

## File Format

### Internal Storage (with IDs)
```json
{"type":"entity","id":"1","name":"Max Mustermann","entityType":"Person","observations":[...]}
{"type":"entity","id":"2","name":"Mustermann GmbH","entityType":"Company","observations":[...]}
{"type":"relation","from":"1","relationType":"owns","to":"2"}
```

### API Output (name-based)
```json
{"name":"Max Mustermann","entityType":"Person","observations":[...]}
{"from":"Max Mustermann","relationType":"owns","to":"Mustermann GmbH"}
```

## Key Features

### Transparent ID Management
- **API unchanged**: Users still work with names
- **Internal IDs**: All relations use sequential IDs
- **Automatic resolution**: Storage layer handles name ↔ ID mapping

### Entity Renaming
```typescript
renameEntity("Max Mustermann", "Max Schmidt");
// All relations automatically show new name in API output
// No relation updates needed - they reference ID "1"
```

### Referential Integrity  
- Relations survive entity renames
- Broken references detectable (ID exists but no entity)
- Cascade delete options for entity removal

## Migration Strategy

### Phase 1: Add ID Support
- Add `id` field to all entities
- Assign sequential IDs to existing data
- Build name-to-ID mappings

### Phase 2: Update Relations
- Convert relation `from`/`to` to use IDs
- Maintain API compatibility with name resolution

### Phase 3: Add New Features
- Implement `rename_entity` MCP tool
- Add entity search by ID
- Enhanced validation and integrity checks

## Search Functions Required

```typescript
// ID-based search
findEntityById(id: string): Entity | null
findEntitiesByIds(ids: string[]): Entity[]

// Name-based search (existing)
findEntityByName(name: string): Entity | null
searchEntitiesByName(pattern: string): Entity[]

// Initialization helpers
getHighestId(): string                    // Scan file for max ID
rebuildMappings(): void                   // Reconstruct name↔ID maps
validateIntegrity(): IntegrityReport      // Check for broken references
```

## Implementation Notes

### Initialization Process
1. Load all entities from file
2. Find highest existing ID: `Math.max(...entities.map(e => parseInt(e.id)))`
3. Set `nextId = highestId + 1`
4. Build bidirectional name↔ID mappings

### Backward Compatibility
- Support files without IDs (auto-assign on load)
- Gradual migration: new entities get IDs, old ones updated on access
- API remains 100% compatible

### Performance Considerations
- In-memory Maps for fast name↔ID resolution
- Sequential ID generation (no UUID overhead)
- Batch operations for bulk updates

## Future Enhancements

### Database Migration Readiness
- Storage layer abstracts persistence mechanism
- Easy to swap file-based storage for PostgreSQL/MongoDB
- ID-based relations translate directly to foreign keys

### Advanced Features
- Entity versioning (append-only with ID+version)
- Soft deletes (mark entities as deleted, keep IDs)
- Audit trail (track who renamed what when)
- Entity merging (combine duplicates, update relations)
