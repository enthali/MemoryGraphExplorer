#!/usr/bin/env node

/**
 * Data Migration Script: Convert name-based to ID-based storage
 * 
 * This script converts the existing NDJSON memory graph format from name-based
 * entity identification to UUID-based identification while maintaining all data.
 * 
 * Before: {"name": "Max", "type": "Person"}
 * After:  {"id": "1", "name": "Max", "type": "Person"}
 * 
 * Usage: node migrate-to-ids.js <input-file> <output-file>
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * @typedef {Object} Entity
 * @property {'entity'} type
 * @property {string} name
 * @property {string} entityType
 * @property {string[]} observations
 * @property {string} [id]
 */

/**
 * @typedef {Object} Relation
 * @property {'relation'} type
 * @property {string} from
 * @property {string} to
 * @property {string} relationType
 * @property {string} [id]
 */

/**
 * @typedef {Object} TypeDefinition
 * @property {'typeDefinition'} type
 * @property {string} name
 * @property {'entityType'|'relationType'} objectType
 * @property {string} [description]
 */

class DataMigrator {
  constructor() {
    this.nameToIdMap = new Map();
    this.idCounter = 1;  // Single counter for all items
  }

  /**
   * Generate a new sequential ID for any item type
   */
  generateNextId() {
    return (this.idCounter++).toString();
  }

  /**
   * Read and parse NDJSON file
   */
  async readNDJSON(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const lines = data.split('\n').filter(line => line.trim() !== '');
      return lines.map(line => JSON.parse(line));
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        console.log(`File ${filePath} not found. Starting with empty data.`);
        return [];
      }
      throw error;
    }
  }

  /**
   * Write data to NDJSON file
   */
  async writeNDJSON(filePath, items) {
    const lines = items.map(item => JSON.stringify(item));
    await fs.writeFile(filePath, lines.join('\n') + '\n');
  }

  /**
   * Create backup of original file
   */
  async createBackup(originalPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = originalPath.replace('.json', `-backup-${timestamp}.json`);
    
    try {
      await fs.copyFile(originalPath, backupPath);
      console.log(`✅ Backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.log(`⚠️  Could not create backup: ${error}`);
      return '';
    }
  }

  /**
   * Phase 1: Process entities and build name-to-ID mapping
   */
  processEntities(items) {
    const entities = items.filter(item => item.type === 'entity');
    
    console.log(`\n📋 Processing ${entities.length} entities...`);
    
    const processedEntities = [];
    
    for (const entity of entities) {
      // Generate new ID
      const id = this.generateNextId();
      
      // Build name-to-ID mapping
      this.nameToIdMap.set(entity.name, id);
      
      // Create new entity with ID
      const newEntity = {
        ...entity,
        id: id
      };
      
      processedEntities.push(newEntity);
      console.log(`  → "${entity.name}" → ID: ${id}`);
    }
    
    return processedEntities;
  }

  /**
   * Phase 2: Process relations and convert name references to IDs
   */
  processRelations(items) {
    const relations = items.filter(item => item.type === 'relation');
    
    console.log(`\n🔗 Processing ${relations.length} relations...`);
    
    const processedRelations = [];
    
    for (const relation of relations) {
      // Generate new relation ID
      const relationId = this.generateNextId();
      
      // Convert from/to names to IDs
      const fromId = this.nameToIdMap.get(relation.from);
      const toId = this.nameToIdMap.get(relation.to);
      
      if (!fromId) {
        console.warn(`⚠️  Warning: Entity "${relation.from}" not found for relation ${relationId}`);
        continue;
      }
      
      if (!toId) {
        console.warn(`⚠️  Warning: Entity "${relation.to}" not found for relation ${relationId}`);
        continue;
      }
      
      // Create new relation with IDs
      const newRelation = {
        type: 'relation',
        id: relationId,
        from: fromId,
        to: toId,
        relationType: relation.relationType
      };
      
      processedRelations.push(newRelation);
      console.log(`  → Relation ${relationId}: "${relation.from}" (${fromId}) → "${relation.to}" (${toId}) [${relation.relationType}]`);
    }
    
    return processedRelations;
  }

  /**
   * Phase 3: Process type definitions and add IDs
   */
  processTypes(items) {
    const types = items.filter(item => item.type === 'typeDefinition');
    console.log(`\n📝 Processing ${types.length} type definitions...`);
    
    const processedTypes = [];
    
    for (const type of types) {
      // Generate new ID for type definition
      const id = this.generateNextId();
      
      // Create new type with ID
      const newType = {
        ...type,
        id: id
      };
      
      processedTypes.push(newType);
      console.log(`  → Type "${type.name}" (${type.objectType}) → ID: ${id}`);
    }
    
    return processedTypes;
  }

  /**
   * Generate migration summary
   */
  generateSummary(entities, relations, types) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Entities processed: ${entities.length}`);
    console.log(`✅ Relations processed: ${relations.length}`);
    console.log(`✅ Types processed: ${types.length}`);
    console.log(`🆔 Total items with IDs: ${entities.length + relations.length + types.length}`);
    console.log(`🆔 Highest ID assigned: ${this.idCounter - 1}`);
    console.log('='.repeat(60));
  }

  /**
   * Main migration function
   */
  async migrate(inputPath, outputPath) {
    console.log('🚀 Starting data migration to ID-based storage...');
    console.log(`📂 Input:  ${inputPath}`);
    console.log(`📂 Output: ${outputPath}`);
    
    // Create backup
    await this.createBackup(inputPath);
    
    // Read original data
    const items = await this.readNDJSON(inputPath);
    console.log(`📖 Read ${items.length} items from ${inputPath}`);
    
    // Process in phases
    const entities = this.processEntities(items);
    const relations = this.processRelations(items);
    const types = this.processTypes(items);
    
    // Combine all processed items
    const allItems = [...entities, ...relations, ...types];
    
    // Write to output file
    await this.writeNDJSON(outputPath, allItems);
    
    // Generate summary
    this.generateSummary(entities, relations, types);
    
    console.log(`\n✅ Migration completed! Data written to ${outputPath}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Usage: node migrate-to-ids.js <input-file> <output-file>');
    console.error('Example: node migrate-to-ids.js data/memory-test.json data/memory-test-with-ids.json');
    process.exit(1);
  }
  
  const [inputPath, outputPath] = args;
  
  // Validate input file exists
  try {
    await fs.access(inputPath);
  } catch {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });
  
  // Run migration
  const migrator = new DataMigrator();
  try {
    await migrator.migrate(inputPath, outputPath);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);

export { DataMigrator };
