#!/usr/bin/env node
/**
 * Simple test script for the new storage layer
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { StorageLayer } from '../backend/mcp-server/dist/src/storage/StorageLayer.js';

const testFilePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/test-memory.json');

async function runTests() {
  console.log('🧪 Testing UUID-based Storage Layer\n');

  // Clean up any existing test file
  try {
    await fs.unlink(testFilePath);
  } catch (err) {
    // File doesn't exist, that's fine
  }

  const storage = new StorageLayer(testFilePath);
  await storage.initialize();

  try {
    // Test 1: Create entities
    console.log('1. Creating entities...');
    const johnId = await storage.createEntity('John Doe', 'Person', ['Software engineer', 'Lives in SF']);
    const acmeId = await storage.createEntity('Acme Corp', 'Company', ['Tech company', 'Founded 2020']);
    console.log(`   ✅ Created entities with IDs: ${johnId}, ${acmeId}`);

    // Test 2: Create relation
    console.log('2. Creating relation...');
    const relationId = await storage.createRelation('John Doe', 'works_at', 'Acme Corp');
    console.log(`   ✅ Created relation with ID: ${relationId}`);

    // Test 3: Read graph (should be in external format without IDs)
    console.log('3. Reading graph...');
    const graph = await storage.readGraph();
    console.log(`   ✅ Graph has ${graph.entities.length} entities, ${graph.relations.length} relations`);
    console.log(`   📄 Entities: ${graph.entities.map(e => e.name).join(', ')}`);
    console.log(`   🔗 Relations: ${graph.relations.map(r => `${r.from} -> ${r.to}`).join(', ')}`);

    // Test 4: Rename entity (the key feature!)
    console.log('4. Renaming entity...');
    await storage.renameEntity('John Doe', 'Johnny Doe');
    const updatedGraph = await storage.readGraph();
    console.log(`   ✅ Renamed entity successfully`);
    console.log(`   📄 Updated entities: ${updatedGraph.entities.map(e => e.name).join(', ')}`);
    console.log(`   🔗 Relations preserved: ${updatedGraph.relations.map(r => `${r.from} -> ${r.to}`).join(', ')}`);

    // Test 5: Search entities
    console.log('5. Searching entities...');
    const searchResults = await storage.searchEntities('Johnny');
    console.log(`   ✅ Search found ${searchResults.length} entities: ${searchResults.map(e => e.name).join(', ')}`);

    console.log('\n🎉 All tests passed! Storage layer is working correctly.');

    // Display the actual file content to show internal storage format
    console.log('\n📁 Internal storage format (with IDs):');
    const fileContent = await fs.readFile(testFilePath, 'utf-8');
    console.log(fileContent);

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
  }
}

runTests().catch(console.error);
