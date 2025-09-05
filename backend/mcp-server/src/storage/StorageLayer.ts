import { promises as fs } from 'fs';
import { IDManager } from './IDManager.js';
import { NameMapping } from './NameMapping.js';
import { Entity, Relation, TypeDefinition, KnowledgeGraph } from '../types/index.js';

/**
 * Internal storage format with IDs for all items
 */
interface StorageEntity extends Entity {
  id: string;
}

interface StorageRelation extends Relation {
  id: string;
  from: string; // Entity ID
  to: string;   // Entity ID
}

interface StorageTypeDefinition extends TypeDefinition {
  id: string;
}

interface InternalGraph {
  entities: StorageEntity[];
  relations: StorageRelation[];
  types: StorageTypeDefinition[];
}

/**
 * StorageLayer provides ID-based storage with transparent name-based API
 */
export class StorageLayer {
  private idManager: IDManager;
  private entityMapping: NameMapping;
  private typeMapping: NameMapping;
  private memoryFilePath: string;

  constructor(memoryFilePath: string) {
    this.memoryFilePath = memoryFilePath;
    this.idManager = new IDManager();
    this.entityMapping = new NameMapping();
    this.typeMapping = new NameMapping();
  }

  /**
   * Load the internal graph with IDs
   */
  private async loadInternalGraph(): Promise<InternalGraph> {
    try {
      const data = await fs.readFile(this.memoryFilePath, "utf-8");
      const lines = data.split("\n").filter((line: string) => line.trim() !== "");
      
      const graph: InternalGraph = { entities: [], relations: [], types: [] };
      const allIds: string[] = [];

      lines.forEach((line: string) => {
        const item = JSON.parse(line);
        
        if (item.type === "entity") {
          const entity: StorageEntity = {
            id: item.id || this.idManager.createNewId(),
            name: item.name,
            entityType: item.entityType,
            observations: item.observations || []
          };
          graph.entities.push(entity);
          allIds.push(entity.id);
          
          // Build name mapping
          this.entityMapping.addMapping(entity.name, entity.id);
        } else if (item.type === "relation") {
          const relation: StorageRelation = {
            id: item.id || this.idManager.createNewId(),
            from: item.from,
            to: item.to,
            relationType: item.relationType
          };
          graph.relations.push(relation);
          allIds.push(relation.id);
        } else if (item.type === "typeDefinition") {
          const typeDef: StorageTypeDefinition = {
            id: item.id || this.idManager.createNewId(),
            name: item.name,
            objectType: item.objectType,
            description: item.description
          };
          graph.types.push(typeDef);
          allIds.push(typeDef.id);
          
          // Build type name mapping  
          this.typeMapping.addMapping(typeDef.name, typeDef.id);
        }
      });

      // Initialize ID counter to highest existing ID
      this.idManager.initializeFromIds(allIds);

      return graph;
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === "ENOENT") {
        this.idManager.setCurrentId(0);
        return { entities: [], relations: [], types: [] };
      }
      throw error;
    }
  }

  /**
   * Save the internal graph with IDs to file
   */
  private async saveInternalGraph(graph: InternalGraph): Promise<void> {
    const lines = [
      ...graph.entities.map((e: StorageEntity) => JSON.stringify({ type: "entity", id: e.id, name: e.name, entityType: e.entityType, observations: e.observations })),
      ...graph.relations.map((r: StorageRelation) => JSON.stringify({ type: "relation", id: r.id, from: r.from, to: r.to, relationType: r.relationType })),
      ...graph.types.map((t: StorageTypeDefinition) => JSON.stringify({ type: "typeDefinition", id: t.id, name: t.name, objectType: t.objectType, description: t.description })),
    ];
    await fs.writeFile(this.memoryFilePath, lines.join("\n"));
  }

  /**
   * Convert internal storage format to external API format (remove IDs, convert relations to use names)
   */
  private toExternalFormat(internalGraph: InternalGraph): KnowledgeGraph {
    const externalGraph: KnowledgeGraph = {
      entities: [],
      relations: [],
      types: []
    };

    // Convert entities (remove ID)
    externalGraph.entities = internalGraph.entities.map(entity => ({
      name: entity.name,
      entityType: entity.entityType,
      observations: entity.observations
    }));

    // Convert relations (convert IDs back to names)
    externalGraph.relations = internalGraph.relations.map(relation => {
      const fromName = this.entityMapping.getName(relation.from);
      const toName = this.entityMapping.getName(relation.to);
      
      if (!fromName || !toName) {
        throw new Error(`Orphaned relation found: from=${relation.from}, to=${relation.to}`);
      }

      return {
        from: fromName,
        to: toName,
        relationType: relation.relationType
      };
    });

    // Convert types (remove ID)
    externalGraph.types = internalGraph.types.map(type => ({
      name: type.name,
      objectType: type.objectType,
      description: type.description
    }));

    return externalGraph;
  }

  /**
   * Initialize the storage layer and build mappings
   */
  async initialize(): Promise<void> {
    await this.loadInternalGraph();
  }

  /**
   * Read the complete graph (external format)
   */
  async readGraph(): Promise<KnowledgeGraph> {
    const internalGraph = await this.loadInternalGraph();
    return this.toExternalFormat(internalGraph);
  }

  /**
   * Create entities with automatic ID assignment
   */
  async createEntity(name: string, type: string, observations: string[]): Promise<string> {
    const internalGraph = await this.loadInternalGraph();
    
    // Check if entity already exists
    if (this.entityMapping.getId(name)) {
      throw new Error(`Entity already exists: ${name}`);
    }

    const newId = this.idManager.createNewId();
    const newEntity: StorageEntity = {
      id: newId,
      name,
      entityType: type,
      observations
    };

    internalGraph.entities.push(newEntity);
    this.entityMapping.addMapping(name, newId);
    
    await this.saveInternalGraph(internalGraph);
    return newId;
  }

  /**
   * Rename an entity while preserving all relations
   */
  async renameEntity(oldName: string, newName: string): Promise<void> {
    const internalGraph = await this.loadInternalGraph();
    
    const entityId = this.entityMapping.getId(oldName);
    if (!entityId) {
      throw new Error(`Entity not found: ${oldName}`);
    }

    if (this.entityMapping.getId(newName)) {
      throw new Error(`Entity already exists: ${newName}`);
    }

    // Update the entity name in storage
    const entity = internalGraph.entities.find(e => e.id === entityId);
    if (entity) {
      entity.name = newName;
    }

    // Update the name mapping
    this.entityMapping.updateName(oldName, newName);
    
    await this.saveInternalGraph(internalGraph);
  }

  /**
   * Delete an entity and all its relations
   */
  async deleteEntity(name: string): Promise<void> {
    const internalGraph = await this.loadInternalGraph();
    
    const entityId = this.entityMapping.getId(name);
    if (!entityId) {
      throw new Error(`Entity not found: ${name}`);
    }

    // Remove entity
    internalGraph.entities = internalGraph.entities.filter(e => e.id !== entityId);
    
    // Remove all relations involving this entity
    internalGraph.relations = internalGraph.relations.filter(r => 
      r.from !== entityId && r.to !== entityId
    );

    // Remove from mapping
    this.entityMapping.removeMapping(name);
    
    await this.saveInternalGraph(internalGraph);
  }

  /**
   * Create a relation using entity names (converted to IDs internally)
   */
  async createRelation(from: string, relationType: string, to: string): Promise<string> {
    const internalGraph = await this.loadInternalGraph();
    
    const fromId = this.entityMapping.getId(from);
    const toId = this.entityMapping.getId(to);
    
    if (!fromId) {
      throw new Error(`Source entity not found: ${from}`);
    }
    if (!toId) {
      throw new Error(`Target entity not found: ${to}`);
    }

    // Check for duplicate relation
    const existingRelation = internalGraph.relations.find(r =>
      r.from === fromId && r.to === toId && r.relationType === relationType
    );
    
    if (existingRelation) {
      throw new Error(`Relation already exists: ${from} -> ${to} (${relationType})`);
    }

    const relationId = this.idManager.createNewId();
    const newRelation: StorageRelation = {
      id: relationId,
      from: fromId,
      to: toId,
      relationType
    };

    internalGraph.relations.push(newRelation);
    await this.saveInternalGraph(internalGraph);
    return relationId;
  }

  /**
   * Delete a relation by its ID
   */
  async deleteRelation(relationId: string): Promise<void> {
    const internalGraph = await this.loadInternalGraph();
    
    const initialLength = internalGraph.relations.length;
    internalGraph.relations = internalGraph.relations.filter(r => r.id !== relationId);
    
    if (internalGraph.relations.length === initialLength) {
      throw new Error(`Relation not found: ${relationId}`);
    }
    
    await this.saveInternalGraph(internalGraph);
  }

  /**
   * Find entity by name
   */
  async findEntityByName(name: string): Promise<Entity | null> {
    const internalGraph = await this.loadInternalGraph();
    const entityId = this.entityMapping.getId(name);
    
    if (!entityId) {
      return null;
    }

    const entity = internalGraph.entities.find(e => e.id === entityId);
    if (!entity) {
      return null;
    }

    return {
      name: entity.name,
      entityType: entity.entityType,
      observations: entity.observations
    };
  }

  /**
   * Search entities by query
   */
  async searchEntities(query: string): Promise<Entity[]> {
    const graph = await this.readGraph();
    
    if (!query || query.trim() === '') {
      return [];
    }
    
    const lowerQuery = query.toLowerCase();
    
    return graph.entities.filter((e: Entity) => 
      e.name.toLowerCase().includes(lowerQuery) ||
      e.entityType.toLowerCase().includes(lowerQuery) ||
      e.observations.some((o: string) => o.toLowerCase().includes(lowerQuery))
    );
  }
}