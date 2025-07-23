import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { DeleteEntitiesArgs } from '../types/index.js';

export async function deleteEntitiesHandler(args: DeleteEntitiesArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    await knowledgeGraph.deleteEntities(args.entityNames || []);
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully deleted ${args.entityNames?.length || 0} entities: ${(args.entityNames || []).join(', ')}` 
      }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error deleting entities: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
