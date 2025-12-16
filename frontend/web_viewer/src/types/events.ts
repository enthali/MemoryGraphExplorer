/**
 * Event bus event types
 */

import type { Entity, Relation, TypesData } from './graph.js';
import type { GraphNode, GraphLink } from './d3-graph.js';

export interface EventMap {
  // Data events
  'data-loaded': { 
    entities: Entity[]; 
    relations: Relation[];
    types: TypesData;
  };
  'data-updated': { 
    entities: Entity[]; 
    relations: Relation[] 
  };
  'filtered-data': {
    entities: Entity[];
    relations: Relation[];
  };
  'entity-types-updated': {
    entityTypes: string[];
  };
  
  // Selection events
  'entity-selected': { entity: Entity | null; node: GraphNode | null };
  'entity-centered': { entity: Entity | null; node: GraphNode | null };
  'node-deselected': void;
  'edge-selected': { edgeId: string; edge: GraphLink };
  
  // Filter events
  'filter-changed': { 
    entityTypes: string[];
    relationTypes: string[];
  };
  
  // Search events
  'search-changed': { 
    query: string; 
    results: Entity[];
  };
  'search-cleared': void;
  
  // UI events
  'theme-changed': { theme: 'light' | 'dark' };
  'zoom-changed': { 
    scale: number;
    x: number;
    y: number;
  };
  'graph-centered': void;
  
  // State events
  'loading-state': { isLoading: boolean; message?: string };
  'error-occurred': { error: Error | string; context?: string };
  
  // Color events
  'color-map-updated': { colorMap: Map<string, string> };
}

export type EventName = keyof EventMap;
export type EventCallback<T extends EventName> = (data: EventMap[T]) => void;
