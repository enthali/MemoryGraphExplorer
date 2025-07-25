import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { DeleteObservationsArgs } from '../types/index.js';

export async function deleteObservationsHandler(args: DeleteObservationsArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    await knowledgeGraph.deleteObservations(args.deletions || []);
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully deleted observations from ${args.deletions?.length || 0} entities` 
      }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error deleting observations: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
