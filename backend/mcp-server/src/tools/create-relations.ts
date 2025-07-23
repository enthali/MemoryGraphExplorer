import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { CreateRelationsArgs } from '../types/index.js';

export async function createRelationsHandler(args: CreateRelationsArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    const relations = await knowledgeGraph.createRelations(args.relations || []);
    
    if (relations.length === 0) {
      return {
        content: [{ type: "text", text: "No new relations were created. All relations already exist." }],
      };
    }
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully created ${relations.length} new relations: ${relations.map(r => `${r.from} -[${r.relationType}]-> ${r.to}`).join(', ')}` 
      }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error creating relations: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
