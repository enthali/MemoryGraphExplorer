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
import { listTypesHandler } from './list-types.js';
import { createTypeHandler } from './create-type.js';
import { deleteTypeHandler } from './delete-type.js';

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
  validateIntegrityHandler,
  listTypesHandler,
  createTypeHandler,
  deleteTypeHandler
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
  },
  {
    name: "list_types",
    description: "List all unique types currently used in the graph",
    inputSchema: {
      type: "object",
      properties: {
        sortBy: {
          type: "string",
          enum: ["alphabetical", "frequency"],
          description: "Sort order for the types"
        }
      }
    }
  },
  {
    name: "create_type",
    description: "Explicitly create a new type with optional description",
    inputSchema: {
      type: "object",
      properties: {
        typeCategory: {
          type: "string",
          enum: ["entityType", "relationType"],
          description: "Which type category to create"
        },
        typeName: {
          type: "string",
          description: "Name of the new type"
        },
        description: {
          type: "string",
          description: "Optional description of the type"
        },
        replaceExisting: {
          type: "boolean",
          description: "Whether to replace existing type if it exists"
        }
      },
      required: ["typeCategory", "typeName"]
    }
  },
  {
    name: "delete_type",
    description: "Delete type if not in use, or force delete with warnings",
    inputSchema: {
      type: "object",
      properties: {
        typeCategory: {
          type: "string",
          enum: ["entityType", "relationType"],
          description: "Which type category to delete from"
        },
        typeName: {
          type: "string",
          description: "Name of the type to delete"
        },
        force: {
          type: "boolean",
          description: "Force delete even if type is in use"
        },
        replaceWith: {
          type: "string",
          description: "Replace deleted type with this type in existing entities/relations"
        }
      },
      required: ["typeCategory", "typeName"]
    }
  }
];
