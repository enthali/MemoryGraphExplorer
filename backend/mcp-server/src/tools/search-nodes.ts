import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { SearchNodesArgs } from '../types/index.js';

export async function searchNodesHandler(args: SearchNodesArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    const results = await knowledgeGraph.searchNodes(args.query);
    
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
        text: `Error searching nodes: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
