// Shared types for the Memory Graph MCP Server

export interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}

export interface Relation {
  from: string;
  to: string;
  relationType: string;
}

export interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

// MCP Tool argument types
export interface CreateEntitiesArgs {
  entities: Entity[];
}

export interface CreateRelationsArgs {
  relations: Relation[];
}

export interface AddObservationsArgs {
  observations: {
    entityName: string;
    contents: string[];
  }[];
}

export interface DeleteEntitiesArgs {
  entityNames: string[];
}

export interface DeleteObservationsArgs {
  deletions: {
    entityName: string;
    observations: string[];
  }[];
}

export interface DeleteRelationsArgs {
  relations: Relation[];
}

export interface SearchNodesArgs {
  query: string;
}

export interface OpenNodesArgs {
  names: string[];
}

export interface GetNodeRelationsArgs {
  nodeName: string;
}
