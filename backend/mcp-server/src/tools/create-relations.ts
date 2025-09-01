import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { CreateRelationsArgs, ErrorCode, MemoryGraphError } from '../types/index.js';

export async function createRelationsHandler(args: CreateRelationsArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    // Enhanced validation
    if (!args.relations || !Array.isArray(args.relations)) {
      throw new MemoryGraphError(
        ErrorCode.VALIDATION_ERROR,
        "relations parameter must be a non-empty array"
      );
    }

    if (args.relations.length === 0) {
      throw new MemoryGraphError(
        ErrorCode.VALIDATION_ERROR,
        "relations array cannot be empty"
      );
    }

    // Validate each relation
    for (let i = 0; i < args.relations.length; i++) {
      const relation = args.relations[i];
      if (!relation.from || relation.from.trim() === '') {
        throw new MemoryGraphError(
          ErrorCode.VALIDATION_ERROR,
          `Relation at index ${i} has empty or invalid "from" entity`
        );
      }
      if (!relation.to || relation.to.trim() === '') {
        throw new MemoryGraphError(
          ErrorCode.VALIDATION_ERROR,
          `Relation at index ${i} has empty or invalid "to" entity`
        );
      }
      if (!relation.relationType || relation.relationType.trim() === '') {
        throw new MemoryGraphError(
          ErrorCode.VALIDATION_ERROR,
          `Relation at index ${i} has empty or invalid relation type`
        );
      }
      if (relation.from === relation.to) {
        throw new MemoryGraphError(
          ErrorCode.SELF_RELATION,
          `Self-relations are not allowed: entity "${relation.from}" cannot relate to itself`
        );
      }
    }

    const relations = await knowledgeGraph.createRelations(args.relations || []);
    
    if (relations.length === 0) {
      return {
        content: [{ type: "text", text: "No new relations were created. All relations already exist." }],
      };
    }
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully created ${relations.length} new relations: ${relations.map(r => `${r.from} -[${r.relationType}]-> ${r.to}`).join(', ')}` 
      }],
    };
  } catch (error) {
    if (error instanceof MemoryGraphError) {
      let errorText = `Error [${error.code}]: ${error.message}`;
      if (error.code === ErrorCode.INVALID_RELATION_TYPE && error.details?.availableTypes) {
        errorText += `\n\nAvailable relation types:`;
        error.details.availableTypes.forEach((type: string) => {
          errorText += `\n  • ${type}`;
        });
        if (error.details.suggestion) {
          errorText += `\n\n${error.details.suggestion}`;
        }
      }
      return {
        content: [{ 
          type: "text", 
          text: errorText
        }],
        isError: true,
      };
    }
    
    return {
      content: [{ 
        type: "text", 
        text: `Error creating relations: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
