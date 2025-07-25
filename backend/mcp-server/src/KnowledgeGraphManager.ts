import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Entity, Relation, KnowledgeGraph, ErrorCode, MemoryGraphError } from './types/index.js';

/**
 * KnowledgeGraphManager handles all operations for the memory graph
 * including loading, saving, and manipulating entities and relations
 */
export class KnowledgeGraphManager {
  private memoryFilePath: string;

  constructor() {
    // Define memory file path using environment variable with fallback
    const defaultMemoryPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../memory.json');
    
    // If MEMORY_FILE_PATH is just a filename, put it in the same directory as the script
    this.memoryFilePath = process.env.MEMORY_FILE_PATH
      ? path.isAbsolute(process.env.MEMORY_FILE_PATH)
        ? process.env.MEMORY_FILE_PATH
        : path.join(path.dirname(fileURLToPath(import.meta.url)), '../../', process.env.MEMORY_FILE_PATH)
      : defaultMemoryPath;
  }

  private async loadGraph(): Promise<KnowledgeGraph> {
    try {
      const data = await fs.readFile(this.memoryFilePath, "utf-8");
      const lines = data.split("\n").filter((line: string) => line.trim() !== "");
      return lines.reduce((graph: KnowledgeGraph, line: string) => {
        const item = JSON.parse(line);
        if (item.type === "entity") graph.entities.push(item as Entity);
        if (item.type === "relation") graph.relations.push(item as Relation);
        return graph;
      }, { entities: [], relations: [] });
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === "ENOENT") {
        return { entities: [], relations: [] };
      }
      throw error;
    }
  }

  private async saveGraph(graph: KnowledgeGraph): Promise<void> {
    const lines = [
      ...graph.entities.map((e: Entity) => JSON.stringify({ type: "entity", ...e })),
      ...graph.relations.map((r: Relation) => JSON.stringify({ type: "relation", ...r })),
    ];
    await fs.writeFile(this.memoryFilePath, lines.join("\n"));
  }

  async createEntities(entities: Entity[]): Promise<Entity[]> {
    const graph = await this.loadGraph();
    const newEntities = entities.filter((e: Entity) => !graph.entities.some((existingEntity: Entity) => existingEntity.name === e.name));
    graph.entities.push(...newEntities);
    await this.saveGraph(graph);
    return newEntities;
  }

  async createRelations(relations: Relation[]): Promise<Relation[]> {
    const graph = await this.loadGraph();
    const entityNames = new Set(graph.entities.map((e: Entity) => e.name));
    
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
    }
    
    const newRelations = relations.filter((r: Relation) => !graph.relations.some((existingRelation: Relation) =>
      existingRelation.from === r.from && 
      existingRelation.to === r.to && 
      existingRelation.relationType === r.relationType
    ));
    graph.relations.push(...newRelations);
    await this.saveGraph(graph);
    return newRelations;
  }

  async addObservations(observations: { entityName: string; contents: string[] }[]): Promise<{ entityName: string; addedObservations: string[] }[]> {
    const graph = await this.loadGraph();
    const results = observations.map(o => {
      const entity = graph.entities.find((e: Entity) => e.name === o.entityName);
      if (!entity) {
        throw new MemoryGraphError(
          ErrorCode.ENTITY_NOT_FOUND,
          `Entity with name "${o.entityName}" not found`
        );
      }
      const newObservations = o.contents.filter(content => !entity.observations.includes(content));
      entity.observations.push(...newObservations);
      return { entityName: o.entityName, addedObservations: newObservations };
    });
    await this.saveGraph(graph);
    return results;
  }

  async deleteEntities(entityNames: string[]): Promise<void> {
    const graph = await this.loadGraph();
    graph.entities = graph.entities.filter((e: Entity) => !entityNames.includes(e.name));
    graph.relations = graph.relations.filter((r: Relation) => !entityNames.includes(r.from) && !entityNames.includes(r.to));
    await this.saveGraph(graph);
  }

  async deleteObservations(deletions: { entityName: string; observations: string[] }[]): Promise<void> {
    const graph = await this.loadGraph();
    deletions.forEach(d => {
      const entity = graph.entities.find((e: Entity) => e.name === d.entityName);
      if (entity) {
        entity.observations = entity.observations.filter((o: string) => !d.observations.includes(o));
      }
    });
    await this.saveGraph(graph);
  }

  async deleteRelations(relations: Relation[]): Promise<void> {
    const graph = await this.loadGraph();
    graph.relations = graph.relations.filter((r: Relation) => !relations.some((delRelation: Relation) => 
      r.from === delRelation.from && 
      r.to === delRelation.to && 
      r.relationType === delRelation.relationType
    ));
    await this.saveGraph(graph);
  }

  async readGraph(): Promise<KnowledgeGraph> {
    return this.loadGraph();
  }

  // Very basic search function
  async searchNodes(query: string): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    
    // Filter entities
    const filteredEntities = graph.entities.filter((e: Entity) => 
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.entityType.toLowerCase().includes(query.toLowerCase()) ||
      e.observations.some((o: string) => o.toLowerCase().includes(query.toLowerCase()))
    );
  
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
    const entityIndex = graph.entities.findIndex((e: Entity) => e.name === oldName);
    if (entityIndex === -1) {
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
    
    // Rename the entity
    graph.entities[entityIndex].name = newName;
    
    // Update all relations that reference this entity
    let relationsUpdated = 0;
    graph.relations.forEach((r: Relation) => {
      if (r.from === oldName) {
        r.from = newName;
        relationsUpdated++;
      }
      if (r.to === oldName) {
        r.to = newName;
        relationsUpdated++;
      }
    });
    
    await this.saveGraph(graph);
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
}
