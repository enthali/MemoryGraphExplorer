import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { CreateEntitiesArgs, ErrorCode, MemoryGraphError } from '../types/index.js';

export async function createEntitiesHandler(args: CreateEntitiesArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    // Enhanced validation
    if (!args.entities || !Array.isArray(args.entities)) {
      throw new MemoryGraphError(
        ErrorCode.VALIDATION_ERROR,
        "entities parameter must be a non-empty array"
      );
    }

    if (args.entities.length === 0) {
      throw new MemoryGraphError(
        ErrorCode.VALIDATION_ERROR,
        "entities array cannot be empty"
      );
    }

    // Validate each entity
    for (let i = 0; i < args.entities.length; i++) {
      const entity = args.entities[i];
      if (!entity.name || entity.name.trim() === '') {
        throw new MemoryGraphError(
          ErrorCode.VALIDATION_ERROR,
          `Entity at index ${i} has empty or invalid name`
        );
      }
      if (!entity.entityType || entity.entityType.trim() === '') {
        throw new MemoryGraphError(
          ErrorCode.VALIDATION_ERROR,
          `Entity "${entity.name}" has empty or invalid entity type`
        );
      }
      if (!Array.isArray(entity.observations)) {
        throw new MemoryGraphError(
          ErrorCode.VALIDATION_ERROR,
          `Entity "${entity.name}" observations must be an array`
        );
      }
    }

    const entities = await knowledgeGraph.createEntities(args.entities || []);
    
    if (entities.length === 0) {
      return {
        content: [{ type: "text", text: "No new entities were created. All entities already exist." }],
      };
    }
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully created ${entities.length} new entities: ${entities.map(e => e.name).join(', ')}` 
      }],
    };
  } catch (error) {
    if (error instanceof MemoryGraphError) {
      return {
        content: [{ 
          type: "text", 
          text: `Error [${error.code}]: ${error.message}` 
        }],
        isError: true,
      };
    }
    
    return {
      content: [{ 
        type: "text", 
        text: `Error creating entities: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
