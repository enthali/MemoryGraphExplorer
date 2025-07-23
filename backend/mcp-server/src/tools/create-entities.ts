import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { CreateEntitiesArgs } from '../types/index.js';

export async function createEntitiesHandler(args: CreateEntitiesArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    const entities = await knowledgeGraph.createEntities(args.entities || []);
    
    if (entities.length === 0) {
      return {
        content: [{ type: "text", text: "No new entities were created. All entities already exist." }],
      };
    }
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully created ${entities.length} new entities: ${entities.map(e => e.name).join(', ')}` 
      }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error creating entities: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
