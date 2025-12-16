/**
 * Core graph data types from MCP Server
 */

export interface Entity {
  id: string;
  name: string;
  entityType: string;
  observations: string[];
}

export interface Relation {
  id: string;
  from: string;
  to: string;
  relationType: string;
}

export interface GraphData {
  entities: Entity[];
  relations: Relation[];
}

export interface TypesData {
  entityTypes: string[];
  relationTypes: string[];
}

export interface GraphDataWithTypes extends GraphData {
  types: TypesData;
}
