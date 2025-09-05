import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Entity, Relation, KnowledgeGraph, TypeDefinition, ErrorCode, MemoryGraphError } from './types/index.js';
import { StorageLayer } from './storage/index.js';

/**
 * KnowledgeGraphManager handles all operations for the memory graph
 * including loading, saving, and manipulating entities and relations
 * Now uses ID-based StorageLayer internally while maintaining name-based API
 */
export class KnowledgeGraphManager {
  private memoryFilePath: string;
  private storageLayer: StorageLayer;

  constructor() {
    // Define memory file path using environment variable with fallback
    const defaultMemoryPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../memory.json');
    
    // If MEMORY_FILE_PATH is just a filename, put it in the same directory as the script
    this.memoryFilePath = process.env.MEMORY_FILE_PATH
      ? path.isAbsolute(process.env.MEMORY_FILE_PATH)
        ? process.env.MEMORY_FILE_PATH
        : path.join(path.dirname(fileURLToPath(import.meta.url)), '../../', process.env.MEMORY_FILE_PATH)
      : defaultMemoryPath;
    
    this.storageLayer = new StorageLayer(this.memoryFilePath);
  }

  private async loadGraph(): Promise<KnowledgeGraph> {
    await this.storageLayer.initialize();
    return this.storageLayer.readGraph();
  }

  private async saveGraph(graph: KnowledgeGraph): Promise<void> {
    // This method is now handled internally by StorageLayer
    // Individual operations are saved automatically
    // This method kept for compatibility but doesn't need to do anything
    return Promise.resolve();
  }

  async createEntities(entities: Entity[]): Promise<Entity[]> {
    const graph = await this.loadGraph();
    
    // Get all valid entity types with their descriptions
    const availableEntityTypes = (graph.types || [])
      .filter(t => t.objectType === "entityType");
    const validEntityTypeNames = new Set(availableEntityTypes.map(t => t.name));
    
    // Validate entity types
    for (const entity of entities) {
      if (validEntityTypeNames.size > 0 && !validEntityTypeNames.has(entity.entityType)) {
        const availableTypesWithDescriptions = availableEntityTypes
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(t => t.description ? `'${t.name}' - ${t.description}` : `'${t.name}'`);
        
        throw new MemoryGraphError(
          ErrorCode.INVALID_ENTITY_TYPE,
          `Entity type '${entity.entityType}' not found.`,
          {
            availableTypes: availableTypesWithDescriptions,
            suggestion: "Use an existing type or create new type first with mcp_memory-graph_create_type"
          }
        );
      }
    }
    
    // Use StorageLayer to create entities
    return this.storageLayer.createEntities(entities);
  }

  async createRelations(relations: Relation[]): Promise<Relation[]> {
    const graph = await this.loadGraph();
    const entityNames = new Set(graph.entities.map((e: Entity) => e.name));
    
    // Get all valid relation types with their descriptions
    const availableRelationTypes = (graph.types || [])
      .filter(t => t.objectType === "relationType");
    const validRelationTypeNames = new Set(availableRelationTypes.map(t => t.name));
    
    // Validate that all referenced entities exist
    for (const relation of relations) {
      if (!entityNames.has(relation.from)) {
        throw new MemoryGraphError(
          ErrorCode.ENTITY_NOT_FOUND,
          `Source entity "${relation.from}" not found`
        );
      }
      if (!entityNames.has(relation.to)) {
        throw new MemoryGraphError(
          ErrorCode.ENTITY_NOT_FOUND,
          `Target entity "${relation.to}" not found`
        );
      }
      
      // Validate relation types
      if (validRelationTypeNames.size > 0 && !validRelationTypeNames.has(relation.relationType)) {
        const availableTypesWithDescriptions = availableRelationTypes
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(t => t.description ? `'${t.name}' - ${t.description}` : `'${t.name}'`);
        
        throw new MemoryGraphError(
          ErrorCode.INVALID_RELATION_TYPE,
          `Relation type '${relation.relationType}' not found.`,
          {
            availableTypes: availableTypesWithDescriptions,
            suggestion: "Use an existing type or create new type first with mcp_memory-graph_create_type"
          }
        );
      }
    }
    
    // Use StorageLayer to create relations
    return this.storageLayer.createRelations(relations);
  }

  async addObservations(observations: { entityName: string; contents: string[] }[]): Promise<{ entityName: string; addedObservations: string[] }[]> {
    // Validate entities exist first
    const graph = await this.loadGraph();
    observations.forEach(o => {
      const entity = graph.entities.find((e: Entity) => e.name === o.entityName);
      if (!entity) {
        throw new MemoryGraphError(
          ErrorCode.ENTITY_NOT_FOUND,
          `Entity with name "${o.entityName}" not found`
        );
      }
    });
    
    // Use StorageLayer to add observations
    return this.storageLayer.addObservations(observations);
  }

  async deleteEntities(entityNames: string[]): Promise<void> {
    return this.storageLayer.deleteEntities(entityNames);
  }

  async deleteObservations(deletions: { entityName: string; observations: string[] }[]): Promise<void> {
    return this.storageLayer.deleteObservations(deletions);
  }

  async deleteRelations(relations: Relation[]): Promise<void> {
    return this.storageLayer.deleteRelations(relations);
  }

  async readGraph(): Promise<KnowledgeGraph> {
    return this.loadGraph();
  }

  // Comprehensive graph search function - searches both entities and relations
  async searchGraph(query: string): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    
    if (!query || query.trim() === '') {
      return { entities: [], relations: [] };
    }
    
    const lowerQuery = query.toLowerCase();
    
    // Filter entities (preserve existing functionality)
    const filteredEntities = graph.entities.filter((e: Entity) => 
      e.name.toLowerCase().includes(lowerQuery) ||
      e.entityType.toLowerCase().includes(lowerQuery) ||
      e.observations.some((o: string) => o.toLowerCase().includes(lowerQuery))
    );
  
    // Create a Set of filtered entity names for quick lookup
    const filteredEntityNames = new Set(filteredEntities.map((e: Entity) => e.name));
  
    // Filter relations - NEW comprehensive relation search
    const filteredRelations = graph.relations.filter((r: Relation) => {
      // Search by relation type
      if (r.relationType.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      // Search by entity names in relations (from/to fields)
      if (r.from.toLowerCase().includes(lowerQuery) || 
          r.to.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      // Include relations between filtered entities (preserve existing behavior)
      if (filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)) {
        return true;
      }
      return false;
    });
  
    const filteredGraph: KnowledgeGraph = {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  
    console.log(`Search "${query}": found ${filteredEntities.length} entities, ${filteredRelations.length} relations`);
    return filteredGraph;
  }

  // Legacy search function - delegates to searchGraph for backward compatibility
  async searchNodes(query: string): Promise<KnowledgeGraph> {
    return this.searchGraph(query);
  }

  async openNodes(names: string[]): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    
    // Filter entities
    const filteredEntities = graph.entities.filter((e: Entity) => names.includes(e.name));
  
    // Create a Set of filtered entity names for quick lookup
    const filteredEntityNames = new Set(filteredEntities.map((e: Entity) => e.name));
  
    // Filter relations to only include those between filtered entities
    const filteredRelations = graph.relations.filter((r: Relation) => 
      filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );
  
    const filteredGraph: KnowledgeGraph = {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  
    return filteredGraph;
  }

  async getNodeRelations(nodeName: string): Promise<{
    outgoing: Relation[],
    incoming: Relation[],
    connected_entities: string[]
  }> {
    const graph = await this.loadGraph();
    
    // Find all outgoing relations (where this node is the source)
    const outgoing = graph.relations.filter((r: Relation) => r.from === nodeName);
    
    // Find all incoming relations (where this node is the target)
    const incoming = graph.relations.filter((r: Relation) => r.to === nodeName);
    
    // Get all connected entity names (removing duplicates)
    const connected_entities = [
      ...new Set([
        ...outgoing.map((r: Relation) => r.to),
        ...incoming.map((r: Relation) => r.from)
      ])
    ];
    
    return { outgoing, incoming, connected_entities };
  }

  async renameEntity(oldName: string, newName: string): Promise<{ relationsUpdated: number }> {
    const graph = await this.loadGraph();
    
    // Check if old entity exists
    const entityExists = graph.entities.find((e: Entity) => e.name === oldName);
    if (!entityExists) {
      throw new MemoryGraphError(
        ErrorCode.ENTITY_NOT_FOUND,
        `Entity with name "${oldName}" not found`
      );
    }
    
    // Check if new name already exists
    const existingEntity = graph.entities.find((e: Entity) => e.name === newName);
    if (existingEntity) {
      throw new MemoryGraphError(
        ErrorCode.ENTITY_ALREADY_EXISTS,
        `Entity with name "${newName}" already exists`
      );
    }
    
    // Count relations that will be updated (for compatibility)
    const relationsUpdated = graph.relations.filter((r: Relation) => 
      r.from === oldName || r.to === oldName
    ).length;
    
    // Use StorageLayer to rename entity (automatically preserves all relations)
    await this.storageLayer.renameEntity(oldName, newName);
    
    return { relationsUpdated };
  }

  async validateIntegrity(autoFix: boolean = false): Promise<{
    issues: Array<{ type: string; description: string; details?: any }>;
    fixedIssues: string[];
  }> {
    const graph = await this.loadGraph();
    const issues: Array<{ type: string; description: string; details?: any }> = [];
    const fixedIssues: string[] = [];
    let needsSave = false;

    // Get all entity names for quick lookup
    const entityNames = new Set(graph.entities.map((e: Entity) => e.name));
    
    // Check for orphaned relations (relations referencing non-existent entities)
    const orphanedRelations: Relation[] = [];
    graph.relations.forEach((r: Relation, index: number) => {
      if (!entityNames.has(r.from)) {
        issues.push({
          type: ErrorCode.ORPHANED_RELATION,
          description: `Relation references non-existent source entity "${r.from}"`,
          details: { relation: r, index }
        });
        orphanedRelations.push(r);
      }
      if (!entityNames.has(r.to)) {
        issues.push({
          type: ErrorCode.ORPHANED_RELATION,
          description: `Relation references non-existent target entity "${r.to}"`,
          details: { relation: r, index }
        });
        orphanedRelations.push(r);
      }
    });

    // Check for self-relations (entity pointing to itself)
    graph.relations.forEach((r: Relation, index: number) => {
      if (r.from === r.to) {
        issues.push({
          type: ErrorCode.SELF_RELATION,
          description: `Entity "${r.from}" has a self-relation`,
          details: { relation: r, index }
        });
      }
    });

    // Check for duplicate relations
    const seenRelations = new Set<string>();
    const duplicateRelations: Relation[] = [];
    graph.relations.forEach((r: Relation, index: number) => {
      const relationKey = `${r.from}->${r.to}:${r.relationType}`;
      if (seenRelations.has(relationKey)) {
        issues.push({
          type: ErrorCode.DUPLICATE_RELATION,
          description: `Duplicate relation found: ${relationKey}`,
          details: { relation: r, index }
        });
        duplicateRelations.push(r);
      } else {
        seenRelations.add(relationKey);
      }
    });

    // Check for entities with empty names or invalid data
    graph.entities.forEach((e: Entity, index: number) => {
      if (!e.name || e.name.trim() === '') {
        issues.push({
          type: ErrorCode.VALIDATION_ERROR,
          description: `Entity at index ${index} has empty or invalid name`,
          details: { entity: e, index }
        });
      }
      if (!e.entityType || e.entityType.trim() === '') {
        issues.push({
          type: ErrorCode.VALIDATION_ERROR,
          description: `Entity "${e.name}" has empty or invalid entity type`,
          details: { entity: e, index }
        });
      }
      if (!Array.isArray(e.observations)) {
        issues.push({
          type: ErrorCode.VALIDATION_ERROR,
          description: `Entity "${e.name}" has invalid observations (not an array)`,
          details: { entity: e, index }
        });
      }
    });

    // Auto-fix if requested
    if (autoFix) {
      // Remove orphaned relations
      if (orphanedRelations.length > 0) {
        const originalLength = graph.relations.length;
        graph.relations = graph.relations.filter(r => !orphanedRelations.includes(r));
        const removedCount = originalLength - graph.relations.length;
        fixedIssues.push(`Removed ${removedCount} orphaned relations`);
        needsSave = true;
      }

      // Remove duplicate relations (keep first occurrence)
      if (duplicateRelations.length > 0) {
        const seenKeys = new Set<string>();
        const originalLength = graph.relations.length;
        graph.relations = graph.relations.filter(r => {
          const key = `${r.from}->${r.to}:${r.relationType}`;
          if (seenKeys.has(key)) {
            return false; // Remove duplicate
          }
          seenKeys.add(key);
          return true;
        });
        const removedCount = originalLength - graph.relations.length;
        fixedIssues.push(`Removed ${removedCount} duplicate relations`);
        needsSave = true;
      }

      // Remove self-relations
      const originalRelationsLength = graph.relations.length;
      graph.relations = graph.relations.filter(r => r.from !== r.to);
      const selfRelationsRemoved = originalRelationsLength - graph.relations.length;
      if (selfRelationsRemoved > 0) {
        fixedIssues.push(`Removed ${selfRelationsRemoved} self-relations`);
        needsSave = true;
      }

      // Fix entity data issues (basic fixes)
      graph.entities.forEach((e: Entity) => {
        if (!Array.isArray(e.observations)) {
          e.observations = [];
          fixedIssues.push(`Fixed observations array for entity "${e.name}"`);
          needsSave = true;
        }
      });

      // Remove entities with empty names (can't be fixed, must be removed)
      const originalEntitiesLength = graph.entities.length;
      graph.entities = graph.entities.filter(e => e.name && e.name.trim() !== '');
      const invalidEntitiesRemoved = originalEntitiesLength - graph.entities.length;
      if (invalidEntitiesRemoved > 0) {
        fixedIssues.push(`Removed ${invalidEntitiesRemoved} entities with invalid names`);
        needsSave = true;
      }

      if (needsSave) {
        await this.saveGraph(graph);
      }
    }

    return { issues, fixedIssues };
  }

  async listTypes(sortBy: "alphabetical" | "frequency" = "alphabetical"): Promise<{
    entityTypes: Array<{ type: string; usageCount: number; description?: string; examples: string[] }>;
    relationTypes: Array<{ type: string; usageCount: number; description?: string }>;
  }> {
    const graph = await this.loadGraph();
    
    // Get entity type usage counts
    const entityTypeUsage = new Map<string, number>();
    const entityTypeExamples = new Map<string, string[]>();
    
    graph.entities.forEach(entity => {
      const count = entityTypeUsage.get(entity.entityType) || 0;
      entityTypeUsage.set(entity.entityType, count + 1);
      
      const examples = entityTypeExamples.get(entity.entityType) || [];
      if (examples.length < 2) {
        examples.push(entity.name);
        entityTypeExamples.set(entity.entityType, examples);
      }
    });

    // Get relation type usage counts
    const relationTypeUsage = new Map<string, number>();
    graph.relations.forEach(relation => {
      const count = relationTypeUsage.get(relation.relationType) || 0;
      relationTypeUsage.set(relation.relationType, count + 1);
    });

    // Get type definitions
    const typeDefinitions = new Map<string, TypeDefinition>();
    (graph.types || []).forEach(typeDef => {
      typeDefinitions.set(`${typeDef.objectType}:${typeDef.name}`, typeDef);
    });

    // Build entity types response
    const entityTypes = Array.from(entityTypeUsage.entries()).map(([type, usageCount]) => {
      const typeDef = typeDefinitions.get(`entityType:${type}`);
      return {
        type,
        usageCount,
        description: typeDef?.description,
        examples: entityTypeExamples.get(type) || []
      };
    });

    // Build relation types response
    const relationTypes = Array.from(relationTypeUsage.entries()).map(([type, usageCount]) => {
      const typeDef = typeDefinitions.get(`relationType:${type}`);
      return {
        type,
        usageCount,
        description: typeDef?.description
      };
    });

    // Sort the results
    const sortFunc = sortBy === "frequency" 
      ? (a: any, b: any) => b.usageCount - a.usageCount
      : (a: any, b: any) => a.type.localeCompare(b.type);

    entityTypes.sort(sortFunc);
    relationTypes.sort(sortFunc);

    return { entityTypes, relationTypes };
  }

  async createType(
    typeCategory: "entityType" | "relationType",
    typeName: string,
    description?: string,
    replaceExisting: boolean = false
  ): Promise<TypeDefinition> {
    // Validate existing type
    const graph = await this.loadGraph();
    const existingType = (graph.types || []).find(t => t.objectType === typeCategory && t.name === typeName);
    
    if (existingType && !replaceExisting) {
      throw new MemoryGraphError(
        ErrorCode.TYPE_ALREADY_EXISTS,
        `${typeCategory} '${typeName}' already exists`
      );
    }
    
    // Use StorageLayer to create type
    return this.storageLayer.createType(typeCategory, typeName, description, replaceExisting);
  }

  async deleteType(
    typeCategory: "entityType" | "relationType", 
    typeName: string, 
    force: boolean = false,
    replaceWith?: string
  ): Promise<{ deleted: boolean; replacedUsages?: number }> {
    const graph = await this.loadGraph();
    
    // Find the type to delete
    const existingType = (graph.types || []).find(t => t.objectType === typeCategory && t.name === typeName);
    if (!existingType) {
      throw new MemoryGraphError(
        ErrorCode.TYPE_NOT_FOUND,
        `${typeCategory} '${typeName}' not found`
      );
    }

    // Check if type is in use
    let usageCount = 0;
    if (typeCategory === "entityType") {
      usageCount = graph.entities.filter(e => e.entityType === typeName).length;
    } else {
      usageCount = graph.relations.filter(r => r.relationType === typeName).length;
    }

    if (usageCount > 0 && !force) {
      throw new MemoryGraphError(
        ErrorCode.TYPE_IN_USE,
        `${typeCategory} '${typeName}' is in use by ${usageCount} ${typeCategory === "entityType" ? "entities" : "relations"}. Use force=true to delete anyway.`
      );
    }
    
    // Use StorageLayer to delete type
    try {
      return await this.storageLayer.deleteType(typeCategory, typeName, force, replaceWith);
    } catch (error) {
      // Convert storage layer errors to MemoryGraphErrors
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new MemoryGraphError(ErrorCode.TYPE_NOT_FOUND, error.message);
        } else if (error.message.includes('in use')) {
          throw new MemoryGraphError(ErrorCode.TYPE_IN_USE, error.message);
        }
      }
      throw error;
    }
  }
}
