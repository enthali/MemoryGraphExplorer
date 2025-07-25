import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { ListTypesArgs, ErrorCode, MemoryGraphError } from '../types/index.js';

export async function listTypesHandler(args: ListTypesArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    const sortBy = args.sortBy || "alphabetical";
    
    if (sortBy !== "alphabetical" && sortBy !== "frequency") {
      throw new MemoryGraphError(
        ErrorCode.VALIDATION_ERROR,
        "sortBy parameter must be either 'alphabetical' or 'frequency'"
      );
    }

    const result = await knowledgeGraph.listTypes(sortBy);
    
    // Format the response
    let response = "# Type Management Summary\n\n";
    
    if (result.entityTypes.length > 0) {
      response += "## Entity Types\n\n";
      result.entityTypes.forEach(entityType => {
        response += `**${entityType.type}** (${entityType.usageCount} uses)\n`;
        if (entityType.description) {
          response += `  - Description: ${entityType.description}\n`;
        }
        if (entityType.examples.length > 0) {
          response += `  - Examples: ${entityType.examples.join(", ")}\n`;
        }
        response += "\n";
      });
    } else {
      response += "## Entity Types\n\nNo entity types found.\n\n";
    }

    if (result.relationTypes.length > 0) {
      response += "## Relation Types\n\n";
      result.relationTypes.forEach(relationType => {
        response += `**${relationType.type}** (${relationType.usageCount} uses)\n`;
        if (relationType.description) {
          response += `  - Description: ${relationType.description}\n`;
        }
        response += "\n";
      });
    } else {
      response += "## Relation Types\n\nNo relation types found.\n\n";
    }

    return {
      content: [{ 
        type: "text", 
        text: response.trim()
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
        text: `Error listing types: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}