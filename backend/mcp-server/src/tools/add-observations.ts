import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { AddObservationsArgs } from '../types/index.js';

export async function addObservationsHandler(args: AddObservationsArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    const observations = await knowledgeGraph.addObservations(args.observations || []);
    
    if (observations.length === 0) {
      return {
        content: [{ type: "text", text: "No new observations were added. All observations already exist." }],
      };
    }
    
    const summary = observations.map(obs => `${obs.entityName}: ${obs.addedObservations.length} observations`).join(', ');
    
    return {
      content: [{ 
        type: "text", 
        text: `Successfully added observations to ${observations.length} entities: ${summary}` 
      }],
    };
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: `Error adding observations: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}
