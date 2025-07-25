import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { DeleteTypeArgs, ErrorCode, MemoryGraphError } from '../types/index.js';

export async function deleteTypeHandler(args: DeleteTypeArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    // Enhanced validation
    if (!args.typeCategory) {
      throw new MemoryGraphError(
        ErrorCode.VALIDATION_ERROR,
        "typeCategory parameter is required"
      );
    }

    if (args.typeCategory !== "entityType" && args.typeCategory !== "relationType") {
      throw new MemoryGraphError(
        ErrorCode.VALIDATION_ERROR,
        "typeCategory must be either 'entityType' or 'relationType'"
      );
    }

    if (!args.typeName || args.typeName.trim() === '') {
      throw new MemoryGraphError(
        ErrorCode.VALIDATION_ERROR,
        "typeName parameter is required and cannot be empty"
      );
    }

    const typeName = args.typeName.trim();
    const force = args.force || false;
    const replaceWith = args.replaceWith?.trim();

    const result = await knowledgeGraph.deleteType(
      args.typeCategory, 
      typeName, 
      force,
      replaceWith
    );
    
    const typeLabel = args.typeCategory === "entityType" ? "entity type" : "relation type";
    
    let response = `Deleted ${typeLabel} '${typeName}'`;
    
    if (result.replacedUsages !== undefined && result.replacedUsages > 0) {
      response += ` and replaced ${result.replacedUsages} usages with '${replaceWith}'`;
    }
    
    return {
      content: [{ 
        type: "text", 
        text: response
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
        text: `Error deleting type: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}