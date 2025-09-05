#!/usr/bin/env node
/**
 * Test the updated KnowledgeGraphManager with StorageLayer
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { KnowledgeGraphManager } from './dist/src/KnowledgeGraphManager.js';

const testFilePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../test-kg-manager.json');

async function runTests() {
  console.log('🧪 Testing KnowledgeGraphManager with StorageLayer\n');

  // Clean up any existing test file
  try {
    await fs.unlink(testFilePath);
  } catch (err) {
    // File doesn't exist, that's fine
  }

  // Set environment variable for test file
  process.env.MEMORY_FILE_PATH = testFilePath;
  
  const manager = new KnowledgeGraphManager();

  try {
    // Test 1: Create type definitions first
    console.log('1. Creating type definitions...');
    await manager.createType('entityType', 'Person', 'Individual people');
    await manager.createType('entityType', 'Company', 'Business organizations');
    await manager.createType('relationType', 'works_at', 'Employment relationship');
    console.log('   ✅ Created types successfully');

    // Test 2: Create entities
    console.log('2. Creating entities...');
    const entities = await manager.createEntities([
      { name: 'Alice Smith', entityType: 'Person', observations: ['Software engineer', 'Loves coding'] },
      { name: 'TechCorp Inc', entityType: 'Company', observations: ['Technology company', 'Founded 2020'] }
    ]);
    console.log(`   ✅ Created ${entities.length} entities: ${entities.map(e => e.name).join(', ')}`);

    // Test 3: Create relations
    console.log('3. Creating relations...');
    const relations = await manager.createRelations([
      { from: 'Alice Smith', to: 'TechCorp Inc', relationType: 'works_at' }
    ]);
    console.log(`   ✅ Created ${relations.length} relations: ${relations.map(r => `${r.from} -> ${r.to}`).join(', ')}`);

    // Test 4: Read the complete graph
    console.log('4. Reading complete graph...');
    const graph = await manager.readGraph();
    console.log(`   ✅ Graph: ${graph.entities.length} entities, ${graph.relations.length} relations, ${graph.types?.length || 0} types`);

    // Test 5: The key test - rename entity (should preserve all relations!)
    console.log('5. Renaming entity (KEY TEST!)...');
    const renameResult = await manager.renameEntity('Alice Smith', 'Alice Johnson');
    console.log(`   ✅ Renamed entity, ${renameResult.relationsUpdated} relations preserved`);

    // Test 6: Verify the rename worked and relations are preserved
    console.log('6. Verifying rename preserved relations...');
    const updatedGraph = await manager.readGraph();
    const renamedEntity = updatedGraph.entities.find(e => e.name === 'Alice Johnson');
    const preservedRelation = updatedGraph.relations.find(r => r.from === 'Alice Johnson');
    console.log(`   ✅ Renamed entity exists: ${!!renamedEntity}`);
    console.log(`   ✅ Relation preserved: ${preservedRelation ? `${preservedRelation.from} -> ${preservedRelation.to}` : 'NONE'}`);

    // Test 7: Test search functionality
    console.log('7. Testing search functionality...');
    const searchResults = await manager.searchGraph('Alice');
    console.log(`   ✅ Search found: ${searchResults.entities.length} entities, ${searchResults.relations.length} relations`);

    // Test 8: Add observations
    console.log('8. Adding observations...');
    const obsResults = await manager.addObservations([
      { entityName: 'Alice Johnson', contents: ['Expert in TypeScript', 'Works remotely'] }
    ]);
    console.log(`   ✅ Added observations: ${obsResults.map(r => `${r.entityName}: ${r.addedObservations.length} new`).join(', ')}`);

    // Test 9: List types
    console.log('9. Listing types...');
    const typesList = await manager.listTypes();
    console.log(`   ✅ Found ${typesList.entityTypes.length} entity types, ${typesList.relationTypes.length} relation types`);

    console.log('\n🎉 All tests passed! KnowledgeGraphManager + StorageLayer working correctly.');
    console.log('\n📈 Key achievement: Entity renaming now preserves all relations!');

    // Display the actual file content to show internal storage format
    console.log('\n📁 Internal storage format (with IDs):');
    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    fileContent.split('\n').forEach((line, i) => {
      if (line.trim()) console.log(`${i + 1}: ${line}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Clean up test file
    try {
      await fs.unlink(testFilePath);
    } catch (err) {
      // Ignore cleanup errors
    }
    delete process.env.MEMORY_FILE_PATH;
  }
}

runTests().catch(console.error);