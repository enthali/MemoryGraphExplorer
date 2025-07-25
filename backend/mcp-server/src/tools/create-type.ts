import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { CreateTypeArgs, ErrorCode, MemoryGraphError } from '../types/index.js';

export async function createTypeHandler(args: CreateTypeArgs, knowledgeGraph: KnowledgeGraphManager) {
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
    const description = args.description?.trim();
    const replaceExisting = args.replaceExisting || false;

    const newType = await knowledgeGraph.createType(
      args.typeCategory, 
      typeName, 
      description, 
      replaceExisting
    );
    
    const action = replaceExisting ? "Updated" : "Created";
    const typeLabel = args.typeCategory === "entityType" ? "entity type" : "relation type";
    
    let response = `${action} ${typeLabel} '${typeName}'`;
    if (description) {
      response += ` with description: "${description}"`;
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
        text: `Error creating type: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}