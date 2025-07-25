# Testing Strategy - Memory Graph Explorer

## Current State Issues ⚠️

### Data Management Problems
- **Live Data Testing**: Tests run against real `memory.json` from Journal workspace
- **No Test Isolation**: Changes during testing affect live professional network data
- **Hardcoded Paths**: Docker compose has fixed volume mount to live data
- **Git Safety**: While data is in Git, we shouldn't test on live professional relationships

## Proposed Solutions 🚀

### 1. Environment-Based Configuration
```yaml
# docker-compose.yml - Base configuration
# docker-compose.test.yml - Test overrides 
# docker-compose.prod.yml - Production overrides
```

### 2. Test Data Strategy
```
data/
├── memory.json.template     # Clean template for tests
├── memory-test.json        # Test dataset with sample entities
├── memory-production.json  # Symlink or copy of live data
└── test-scenarios/         # Specific test data scenarios
    ├── empty-graph.json
    ├── invalid-data.json
    └── large-dataset.json
```

### 3. Configuration Management
```bash
# Environment variables for data selection
MEMORY_FILE_PATH=/app/data/memory-test.json     # For testing
MEMORY_FILE_PATH=/app/data/memory-production.json  # For production
```

### 4. Docker Compose Profiles
```yaml
services:
  mcp-server:
    profiles: ["prod", "test"]
    volumes:
      - ${MEMORY_DATA_PATH}:/app/data/memory.json
```

### 5. npm Scripts for Easy Switching
```json
{
  "scripts": {
    "test": "MEMORY_DATA_PATH=./data/memory-test.json docker-compose up",
    "prod": "MEMORY_DATA_PATH=/workspace/Journal/memory.json docker-compose up",
    "test:integration": "npm run test && node tests/test-copilot-features.js"
  }
}
```

## Implementation Priority 📋

1. **Short-term (Next Sprint)**:
   - Create `memory-test.json` with sample data
   - Add environment variable for data path
   - Create test-specific docker-compose override

2. **Medium-term**:
   - Implement proper test data management
   - Add data validation and schema checking
   - Create test scenarios for edge cases

3. **Long-term**:
   - Consider proper database backend (SQLite/PostgreSQL)
   - Implement data migrations and versioning
   - Add automated backup strategies

## Testing Workflow 🔄

### Current (Risky)
```bash
# Tests run on live data!
docker-compose up
node tests/test-copilot-features.js
```

### Proposed (Safe)
```bash
# Use test data
npm run test
# Or manually:
MEMORY_DATA_PATH=./data/memory-test.json docker-compose up
```

## Data Safety Measures 🛡️

1. **Test Data Creation**: 
   - Sanitized version of real data structure
   - No real personal/professional information
   - Realistic relationships for testing

2. **Backup Before Testing**:
   - Automatic backup of live data before any test runs
   - Git commit check before dangerous operations

3. **Read-Only Mode**:
   - Option to run MCP server in read-only mode for safe testing
   - Separate permissions for test vs production

## Migration Strategy 🔄

1. **Phase 1**: Create test data and environment switching
2. **Phase 2**: Update all tests to use test data by default
3. **Phase 3**: Add production data protection safeguards
4. **Phase 4**: Consider database backend migration

---

**Priority**: HIGH - We should implement basic test data separation before next major testing cycle.
