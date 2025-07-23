import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { OpenNodesArgs } from '../types/index.js';

export async function openNodesHandler(args: OpenNodesArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    const results = await knowledgeGraph.openNodes(args.names || []);
    
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
        text: `Error opening nodes: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
