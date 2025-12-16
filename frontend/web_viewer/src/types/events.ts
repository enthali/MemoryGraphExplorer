/**
 * Event bus event types
 */

import type { Entity, Relation, TypesData } from './graph.js';
import type { GraphNode, GraphLink } from './d3-graph.js';

export interface EventMap {
  // Data events
  'data-loaded': { 
    rawData?: { entities: Entity[]; relations: Relation[] };
    entities?: Entity[]; 
    relations?: Relation[];
    types: TypesData;
    rootEntity?: Entity | null;
  };
  'data-updated': { 
    entities: Entity[]; 
    relations: Relation[] 
  };
  'filtered-data': {
    filteredData?: { entities: Entity[]; relations: Relation[] };
    entities?: Entity[];
    relations?: Relation[];
  };
  'entity-types-updated': {
    entityTypes: string[];
  };
  'data-refresh-requested': void;
  
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
  'search-results': {
    query: string;
    results: Entity[];
    highlightedNodes: string[];
  };
  'search-clear-requested': void;
  
  // UI events
  'theme-changed': { theme: 'light' | 'dark' };
  'zoom-changed': { 
    scale: number;
    x: number;
    y: number;
  };
  'graph-centered': void;
  'app-ready': {
    initialized: boolean;
    timestamp: Date;
  };
  'view-reset': {
    timestamp: Date;
  };
  'window-resized': {
    width: number;
    height: number;
  };
  
  // State events
  'loading-state': { isLoading: boolean; message?: string };
  'error-occurred': { error: Error | string; context?: string };
  'state-changed': {
    previous: any;
    current: any;
    updates: any;
  };
  'state-reset': any;
  
  // Color events
  'color-map-updated': { entityTypes: string[]; colorMap: Map<string, string> };
  
  // Legend events
  'legend-toggle': { isVisible: boolean };
}

export type EventName = keyof EventMap;
export type EventCallback<T extends EventName> = (data: EventMap[T]) => void;
