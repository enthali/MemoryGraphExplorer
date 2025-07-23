import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { GetNodeRelationsArgs } from '../types/index.js';

export async function getNodeRelationsHandler(args: GetNodeRelationsArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    const results = await knowledgeGraph.getNodeRelations(args.nodeName);
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(results, null, 2)
      }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error getting node relations: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
