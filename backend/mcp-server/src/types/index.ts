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

export interface TypeDefinition {
  name: string;
  objectType: "entityType" | "relationType";
  description?: string;
}

export interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
  types?: TypeDefinition[];
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

export interface RenameEntityArgs {
  oldName: string;
  newName: string;
}

export interface ValidateIntegrityArgs {
  autoFix?: boolean;
}

// Type management argument types
export interface ListTypesArgs {
  sortBy?: "alphabetical" | "frequency";
}

export interface CreateTypeArgs {
  typeCategory: "entityType" | "relationType";
  typeName: string;
  description?: string;
  replaceExisting?: boolean;
}

export interface DeleteTypeArgs {
  typeCategory: "entityType" | "relationType";
  typeName: string;
  force?: boolean;
  replaceWith?: string;
}

// Error codes for consistent error handling
export enum ErrorCode {
  ENTITY_NOT_FOUND = "ENTITY_NOT_FOUND",
  ENTITY_ALREADY_EXISTS = "ENTITY_ALREADY_EXISTS", 
  DUPLICATE_RELATION = "DUPLICATE_RELATION",
  ORPHANED_RELATION = "ORPHANED_RELATION",
  SELF_RELATION = "SELF_RELATION",
  ENTITY_HAS_RELATIONS = "ENTITY_HAS_RELATIONS",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_ENTITY_TYPE = "INVALID_ENTITY_TYPE",
  INVALID_RELATION_TYPE = "INVALID_RELATION_TYPE",
  TYPE_NOT_FOUND = "TYPE_NOT_FOUND",
  TYPE_ALREADY_EXISTS = "TYPE_ALREADY_EXISTS",
  TYPE_IN_USE = "TYPE_IN_USE"
}

export class MemoryGraphError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MemoryGraphError';
  }
}
