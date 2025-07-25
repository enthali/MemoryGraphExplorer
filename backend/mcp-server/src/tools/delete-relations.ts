import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { DeleteRelationsArgs } from '../types/index.js';

export async function deleteRelationsHandler(args: DeleteRelationsArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    await knowledgeGraph.deleteRelations(args.relations || []);
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully deleted ${args.relations?.length || 0} relations` 
      }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error deleting relations: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
