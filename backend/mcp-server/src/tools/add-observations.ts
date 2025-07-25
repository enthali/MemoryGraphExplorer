import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { AddObservationsArgs, ErrorCode, MemoryGraphError } from '../types/index.js';

export async function addObservationsHandler(args: AddObservationsArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    // Enhanced validation
    if (!args.observations || !Array.isArray(args.observations)) {
      throw new MemoryGraphError(
        ErrorCode.VALIDATION_ERROR,
        "observations parameter must be a non-empty array"
      );
    }

    if (args.observations.length === 0) {
      throw new MemoryGraphError(
        ErrorCode.VALIDATION_ERROR,
        "observations array cannot be empty"
      );
    }

    // Validate each observation
    for (let i = 0; i < args.observations.length; i++) {
      const obs = args.observations[i];
      if (!obs.entityName || obs.entityName.trim() === '') {
        throw new MemoryGraphError(
          ErrorCode.VALIDATION_ERROR,
          `Observation at index ${i} has empty or invalid entity name`
        );
      }
      if (!Array.isArray(obs.contents)) {
        throw new MemoryGraphError(
          ErrorCode.VALIDATION_ERROR,
          `Observation for entity "${obs.entityName}" must have contents as an array`
        );
      }
      if (obs.contents.length === 0) {
        throw new MemoryGraphError(
          ErrorCode.VALIDATION_ERROR,
          `Observation for entity "${obs.entityName}" cannot have empty contents array`
        );
      }
    }

    const observations = await knowledgeGraph.addObservations(args.observations || []);
    
    if (observations.length === 0) {
      return {
        content: [{ type: "text", text: "No new observations were added. All observations already exist." }],
      };
    }
    
    const summary = observations.map(obs => `${obs.entityName}: ${obs.addedObservations.length} observations`).join(', ');
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully added observations to ${observations.length} entities: ${summary}` 
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
        text: `Error adding observations: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
