import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';

export async function readGraphHandler(_args: any, knowledgeGraph: KnowledgeGraphManager) {
  try {
    const graph = await knowledgeGraph.readGraph();
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(graph, null, 2)
      }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error reading graph: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
