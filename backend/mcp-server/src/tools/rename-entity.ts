import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { RenameEntityArgs, ErrorCode, MemoryGraphError } from '../types/index.js';

export async function renameEntityHandler(args: RenameEntityArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    // Validate input
    if (!args.oldName || !args.newName) {
      throw new MemoryGraphError(
        ErrorCode.VALIDATION_ERROR,
        "Both oldName and newName are required"
      );
    }

    if (args.oldName === args.newName) {
      throw new MemoryGraphError(
        ErrorCode.VALIDATION_ERROR,
        "Old name and new name cannot be the same"
      );
    }

    const result = await knowledgeGraph.renameEntity(args.oldName, args.newName);
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully renamed entity "${args.oldName}" to "${args.newName}". Updated ${result.relationsUpdated} relations.` 
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
        text: `Error renaming entity: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}