import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { SearchGraphArgs } from '../types/index.js';

export async function searchGraphHandler(args: SearchGraphArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    const results = await knowledgeGraph.searchGraph(args.query);
    
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
        text: `Error searching graph: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}