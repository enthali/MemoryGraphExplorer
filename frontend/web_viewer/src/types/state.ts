/**
 * Application state type
 */

import type { Entity, Relation, TypesData } from './graph.js';

export interface AppState {
  // Data State - Complete dataset from MCP server
  rawData: {
    entities: Entity[];
    relations: Relation[];
    types: TypesData;
  };
  filteredData: {
    entities: Entity[];
    relations: Relation[];
  };
  
  // Graph State
  centerEntity: Entity | null;
  selectedEntity: Entity | null;
  rootEntity: Entity | null;
  
  // Filter State (for visualization filtering)
  selectedEntityTypes: string[];
  availableEntityTypes: string[];
  selectedRelationTypes: string[];
  availableRelationTypes: string[];
  
  // Search State
  searchQuery: string;
  searchResults: Entity[];
  highlightedNodes: string[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  infoPanelVisible: boolean;
  filterDropdownOpen: boolean;
  
  // Visual State
  colorMap: Map<string, string>;
  zoom: number;
  pan: { x: number; y: number };
}
