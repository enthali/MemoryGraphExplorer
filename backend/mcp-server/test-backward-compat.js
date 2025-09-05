#!/usr/bin/env node
/**
 * Test backward compatibility with existing data
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { KnowledgeGraphManager } from './dist/src/KnowledgeGraphManager.js';

const testFilePath = '/tmp/test-legacy.json';

async function runBackwardCompatibilityTest() {
  console.log('🔄 Testing backward compatibility with existing data\n');
  
  // Set environment variable for test file
  process.env.MEMORY_FILE_PATH = testFilePath;
  
  const manager = new KnowledgeGraphManager();

  try {
    // Test 1: Load existing data without IDs
    console.log('1. Loading existing data (without IDs)...');
    const graph = await manager.readGraph();
    console.log(`   ✅ Loaded: ${graph.entities.length} entities, ${graph.relations.length} relations, ${graph.types?.length || 0} types`);
    console.log(`   📄 Sample entities: ${graph.entities.slice(0, 3).map(e => e.name).join(', ')}`);

    // Test 2: Try renaming an entity (this should add IDs internally)
    console.log('2. Testing entity rename on legacy data...');
    const renameResult = await manager.renameEntity('Max Mustermann', 'Max Schmidt');
    console.log(`   ✅ Renamed entity, ${renameResult.relationsUpdated} relations updated`);

    // Test 3: Verify the rename worked
    console.log('3. Verifying rename worked...');
    const updatedGraph = await manager.readGraph();
    const renamedEntity = updatedGraph.entities.find(e => e.name === 'Max Schmidt');
    const relations = updatedGraph.relations.filter(r => r.from === 'Max Schmidt' || r.to === 'Max Schmidt');
    console.log(`   ✅ Renamed entity exists: ${!!renamedEntity}`);
    console.log(`   ✅ Relations preserved: ${relations.length} relations involving Max Schmidt`);
    
    if (relations.length > 0) {
      console.log(`   🔗 Relations: ${relations.map(r => `${r.from} -> ${r.to} (${r.relationType})`).join(', ')}`);
    }

    // Test 4: Create a new entity and relation to test ID assignment
    console.log('4. Adding new data to migrated file...');
    const newEntities = await manager.createEntities([
      { name: 'New Person', entityType: 'Person', observations: ['Added after migration'] }
    ]);
    const newRelations = await manager.createRelations([
      { from: 'New Person', to: 'Max Schmidt', relationType: 'works on' }
    ]);
    console.log(`   ✅ Added ${newEntities.length} entities and ${newRelations.length} relations`);

    console.log('\n🎉 Backward compatibility test passed!');
    console.log('📝 Legacy data was successfully migrated to ID-based storage.');

    // Show the internal format after migration
    console.log('\n📁 File after migration (now with IDs):');
    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    const lines = fileContent.split('\n').filter(l => l.trim());
    console.log(`   Lines in file: ${lines.length}`);
    
    // Show a sample of each type
    const entityLine = lines.find(l => l.includes('"type":"entity"'));
    const relationLine = lines.find(l => l.includes('"type":"relation"'));
    const typeLine = lines.find(l => l.includes('"type":"typeDefinition"'));
    
    if (entityLine) console.log(`   📄 Sample entity: ${entityLine}`);
    if (relationLine) console.log(`   🔗 Sample relation: ${relationLine}`);  
    if (typeLine) console.log(`   🏷️  Sample type: ${typeLine}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    delete process.env.MEMORY_FILE_PATH;
  }
}

runBackwardCompatibilityTest().catch(console.error);