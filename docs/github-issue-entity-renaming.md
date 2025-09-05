# GitHub Issue: Add Entity Renaming Feature

## Issue Title
**[Feature] Add entity renaming functionality to MCP server and frontend**

## Issue Description

### Problem Statement
After implementing the UUID-based storage layer, we can now support entity renaming without breaking relations. This feature will make the system much more user-friendly and production-ready.

### Dependencies
- **Requires**: UUID-based storage layer implementation to be completed first
- **Blocks**: Advanced entity management features

### Proposed Solution
Add a new MCP tool and frontend functionality to rename entities while preserving all relations and referential integrity.

### Technical Requirements

#### 1. Backend MCP Tool
```typescript
// New MCP tool: rename-entity
interface RenameEntityTool {
  name: "rename_entity";
  description: "Rename an entity while preserving all relations";
  inputSchema: {
    oldName: string;
    newName: string;
  };
}
```

#### 2. Storage Layer Integration
```typescript
interface StorageLayer {
  renameEntity(oldName: string, newName: string): void;
  // Updates name mapping: oldName -> newName but keeps same ID
  // All relations remain intact because they use IDs
}
```

### Implementation Tasks

#### Phase 1: Backend Implementation
- [ ] Implement `rename_entity` MCP tool in `tools/rename-entity.ts`
- [ ] Add `renameEntity` method to storage layer
- [ ] Update name-to-ID mapping while preserving ID
- [ ] Add validation (check entity exists, new name not taken)
- [ ] Add comprehensive error handling

#### Phase 2: Frontend Integration
- [ ] Add "Rename Entity" button to entity info panel
- [ ] Implement rename dialog with validation
- [ ] Update entity display after successful rename
- [ ] Add confirmation dialog for safety
- [ ] Handle error cases with user feedback

#### Phase 3: Testing & Validation
- [ ] Test renaming with complex relation networks
- [ ] Verify all relations remain intact after rename
- [ ] Test edge cases (duplicate names, special characters)
- [ ] Add comprehensive test coverage
- [ ] Validate frontend updates correctly

### Expected Benefits

1. **User-Friendly**: Easy entity name corrections
2. **Data Integrity**: Relations survive renames
3. **Production Ready**: Robust entity management
4. **Error Prevention**: Validation prevents conflicts

### Acceptance Criteria

- [ ] `rename_entity` MCP tool works correctly
- [ ] Relations remain intact after entity renames
- [ ] Frontend displays updated entity names immediately
- [ ] Proper validation prevents duplicate names
- [ ] Error handling provides clear feedback
- [ ] No data loss or corruption during renames
- [ ] Comprehensive test coverage

### Example Usage

```json
// MCP call
{
  "tool": "rename_entity",
  "arguments": {
    "oldName": "Max Mustermann",
    "newName": "Max Schmidt"
  }
}

// Before rename:
{"type": "entity", "id": "9", "name": "Max Mustermann", "entityType": "Person"}
{"type": "relation", "id": "21", "from": "9", "to": "10", "relationType": "owns"}

// After rename:
{"type": "entity", "id": "9", "name": "Max Schmidt", "entityType": "Person"}
{"type": "relation", "id": "21", "from": "9", "to": "10", "relationType": "owns"}
// ↑ Relation unchanged - still uses same ID!
```

### Technical Notes

- Entity ID remains unchanged, only name mapping updates
- All relations automatically work with renamed entity
- Name validation prevents conflicts and invalid names
- Frontend should refresh entity lists after rename
- Consider undo/redo functionality for future enhancement

### File Changes Required

```
backend/mcp-server/src/
├── tools/
│   └── rename-entity.ts                # NEW
└── storage/
    └── StorageLayer.ts                 # MODIFY (add renameEntity)

frontend/web_viewer/modules/
├── features/
│   └── info-panel.js                   # MODIFY (add rename button)
└── core/
    └── data-manager.js                 # MODIFY (handle renames)
```

### Related Files
- Depends on UUID storage layer implementation
- `docs/github-issue-storage-layer.md` - Prerequisites
- `frontend/web_viewer/modules/features/info-panel.js` - UI integration

### Estimated Effort
**Small-Medium** (1-2 days after UUID storage layer is complete)

### Labels
- `enhancement`
- `frontend`
- `backend`
- `depends-on-uuid-storage`
- `user-feature`

### Assignee
GitHub Copilot Coding Agent / Development Team
