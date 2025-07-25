// Tool registry - exports all tool handlers and their configurations

import { createEntitiesHandler } from './create-entities.js';
import { createRelationsHandler } from './create-relations.js';
import { addObservationsHandler } from './add-observations.js';
import { deleteEntitiesHandler } from './delete-entities.js';
import { deleteObservationsHandler } from './delete-observations.js';
import { deleteRelationsHandler } from './delete-relations.js';
import { readGraphHandler } from './read-graph.js';
import { searchNodesHandler } from './search-nodes.js';
import { openNodesHandler } from './open-nodes.js';
import { getNodeRelationsHandler } from './get-node-relations.js';
import { renameEntityHandler } from './rename-entity.js';
import { validateIntegrityHandler } from './validate-integrity.js';

// Export all handlers
export {
  createEntitiesHandler,
  createRelationsHandler,
  addObservationsHandler,
  deleteEntitiesHandler,
  deleteObservationsHandler,
  deleteRelationsHandler,
  readGraphHandler,
  searchNodesHandler,
  openNodesHandler,
  getNodeRelationsHandler,
  renameEntityHandler,
  validateIntegrityHandler
};

// Tool definitions for the MCP server
export const toolDefinitions = [
  {
    name: "create_entities",
    description: "Create new entities in the knowledge graph",
    inputSchema: {
      type: "object",
      properties: {
        entities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              entityType: { type: "string" },
              observations: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["name", "entityType", "observations"]
          }
        }
      },
      required: ["entities"]
    }
  },
  {
    name: "create_relations",
    description: "Create new relations between entities in the knowledge graph",
    inputSchema: {
      type: "object",
      properties: {
        relations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string" },
              to: { type: "string" },
              relationType: { type: "string" }
            },
            required: ["from", "to", "relationType"]
          }
        }
      },
      required: ["relations"]
    }
  },
  {
    name: "add_observations",
    description: "Add observations to existing entities",
    inputSchema: {
      type: "object",
      properties: {
        observations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              entityName: { type: "string" },
              contents: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["entityName", "contents"]
          }
        }
      },
      required: ["observations"]
    }
  },
  {
    name: "delete_entities",
    description: "Delete entities from the knowledge graph",
    inputSchema: {
      type: "object",
      properties: {
        entityNames: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["entityNames"]
    }
  },
  {
    name: "delete_observations",
    description: "Delete specific observations from entities",
    inputSchema: {
      type: "object",
      properties: {
        deletions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              entityName: { type: "string" },
              observations: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["entityName", "observations"]
          }
        }
      },
      required: ["deletions"]
    }
  },
  {
    name: "delete_relations",
    description: "Delete relations from the knowledge graph",
    inputSchema: {
      type: "object",
      properties: {
        relations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string" },
              to: { type: "string" },
              relationType: { type: "string" }
            },
            required: ["from", "to", "relationType"]
          }
        }
      },
      required: ["relations"]
    }
  },
  {
    name: "read_graph",
    description: "Read the entire knowledge graph",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "search_nodes",
    description: "Search for nodes in the knowledge graph",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" }
      },
      required: ["query"]
    }
  },
  {
    name: "open_nodes",
    description: "Open/retrieve specific nodes from the knowledge graph",
    inputSchema: {
      type: "object",
      properties: {
        names: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["names"]
    }
  },
  {
    name: "get_node_relations",
    description: "Get all relations for a specific node",
    inputSchema: {
      type: "object",
      properties: {
        nodeName: { type: "string" }
      },
      required: ["nodeName"]
    }
  },
  {
    name: "rename_entity",
    description: "Rename an entity and update all related relations atomically",
    inputSchema: {
      type: "object",
      properties: {
        oldName: { type: "string" },
        newName: { type: "string" }
      },
      required: ["oldName", "newName"]
    }
  },
  {
    name: "validate_integrity",
    description: "Validate the integrity of the knowledge graph and optionally fix issues",
    inputSchema: {
      type: "object",
      properties: {
        autoFix: { 
          type: "boolean",
          description: "Whether to automatically fix detected issues"
        }
      }
    }
  }
];
