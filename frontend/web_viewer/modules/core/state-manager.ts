/**
 * State Manager - Centralized state management for the application
 * Provides immutable state updates and subscription mechanisms
 */

import { eventBus } from './event-bus.js';
import type { AppState } from '../../src/types/index.js';

type StateSubscriber = (currentState: AppState, previousState: AppState) => void;

export class StateManager {
  private state: AppState;
  private subscribers: StateSubscriber[];

  constructor() {
    this.state = this.getInitialState();
    this.subscribers = [];
    console.log('🗄️ State Manager initialized with initial state');
  }

  /**
   * Get the initial application state
   */
  private getInitialState(): AppState {
    return {
      // Data State - Complete dataset from MCP server
      rawData: { 
        entities: [], 
        relations: [],
        types: { entityTypes: [], relationTypes: [] }
      },
      filteredData: { entities: [], relations: [] }, // ALWAYS populated - client-side filtered subset for visualization
      
      // Graph State
      centerEntity: null, // Currently centered entity
      selectedEntity: null, // Currently selected entity
      rootEntity: null, // Entity with "rootEntity: true" observation, or first entity as fallback
      
      // Filter State (for visualization filtering)
      selectedEntityTypes: [], 
      availableEntityTypes: [], // From MCP list-types
      selectedRelationTypes: [],
      availableRelationTypes: [], // From MCP list-types
      
      // Search State
      searchQuery: '',
      searchResults: [],
      highlightedNodes: [],
      
      // UI State
      isLoading: false,
      error: null,
      infoPanelVisible: true, // Info panel is always visible in current design
      filterDropdownOpen: false,
      
      // Visual State
      colorMap: new Map(),
      zoom: 1.0,
      pan: { x: 0, y: 0 }
    };
  }

  /**
   * Get current state (immutable)
   */
  getState(): AppState {
    // Deep clone with Map support
    const cloned = JSON.parse(JSON.stringify(this.state, (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      return value;
    }));
    
    // Restore Map
    if (cloned.colorMap && typeof cloned.colorMap === 'object') {
      cloned.colorMap = new Map(Object.entries(cloned.colorMap));
    }
    
    return cloned;
  }

  /**
   * Update state with new values
   */
  setState(updates: Partial<AppState>): void {
    const previousState = this.getState();
    
    // Create new state object with updates
    this.state = {
      ...this.state,
      ...updates
    };
    
    console.log('🗄️ State updated:', updates);
    
    // Notify subscribers
    this.notifySubscribers(previousState, this.state);
    
    // Emit state change event
    eventBus.emit('state-changed', {
      previous: previousState,
      current: this.getState(),
      updates
    });
  }

  /**
   * Update nested state properties
   */
  setStateProperty(path: string, value: any): void {
    const keys = path.split('.');
    const updates: any = {};
    let current: any = updates;
    
    // Build nested object
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!key) continue;
      current[key] = { ...(this.state as any)[key] };
      current = current[key];
    }
    const lastKey = keys[keys.length - 1];
    if (lastKey) {
      current[lastKey] = value;
    }
    
    this.setState(updates);
  }

  /**
   * Get specific state property
   */
  getStateProperty(path: string): any {
    const keys = path.split('.');
    let current: any = this.state;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: StateSubscriber): () => void {
    this.subscribers.push(callback);
    console.log('🗄️ New state subscriber added');
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
      console.log('🗄️ State subscriber removed');
    };
  }

  /**
   * Notify all subscribers of state changes
   */
  private notifySubscribers(previousState: AppState, currentState: AppState): void {
    this.subscribers.forEach(callback => {
      try {
        callback(currentState, previousState);
      } catch (error) {
        console.error('❌ Error in state subscriber:', error);
      }
    });
  }

  /**
   * Reset state to initial values
   */
  reset(): void {
    console.log('🗄️ Resetting state to initial values');
    const emptyState = {} as AppState;
    this.state = this.getInitialState();
    this.notifySubscribers(emptyState, this.state);
    eventBus.emit('state-reset', this.getState());
  }

  /**
   * Get state summary for debugging
   */
  getStateSummary(): {
    entities: number;
    relations: number;
    filteredEntities: number;
    filteredRelations: number;
    centerEntity: any;
    selectedEntity: any;
    rootEntity: any;
    searchQuery: string;
    selectedEntityTypes: number;
    selectedRelationTypes: number;
    isLoading: boolean;
    error: string | null;
  } {
    const state = this.getState();
    return {
      entities: state.rawData.entities.length,
      relations: state.rawData.relations.length,
      filteredEntities: state.filteredData.entities.length,
      filteredRelations: state.filteredData.relations.length,
      centerEntity: state.centerEntity,
      selectedEntity: state.selectedEntity,
      rootEntity: state.rootEntity,
      searchQuery: state.searchQuery,
      selectedEntityTypes: state.selectedEntityTypes.length,
      selectedRelationTypes: state.selectedRelationTypes.length,
      isLoading: state.isLoading,
      error: state.error
    };
  }
}

// Create and export a singleton instance
export const stateManager = new StateManager();
