/**
 * State Manager - Centralized state management for the application
 * Provides immutable state updates and subscription mechanisms
 */

import { eventBus } from './event-bus.js';

export class StateManager {
  constructor() {
    this.state = this.getInitialState();
    this.subscribers = [];
    console.log('🗄️ State Manager initialized with initial state');
  }

  /**
   * Get the initial application state
   */
  getInitialState() {
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
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Update state with new values
   * @param {Object} updates - Object with state updates
   */
  setState(updates) {
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
   * @param {string} path - Dot-separated path to the property (e.g., 'rawData.entities')
   * @param {*} value - New value
   */
  setStateProperty(path, value) {
    const keys = path.split('.');
    const updates = {};
    let current = updates;
    
    // Build nested object
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...this.state[keys[i]] };
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    this.setState(updates);
  }

  /**
   * Get specific state property
   * @param {string} path - Dot-separated path to the property
   */
  getStateProperty(path) {
    const keys = path.split('.');
    let current = this.state;
    
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
   * @param {Function} callback - Function to call when state changes
   */
  subscribe(callback) {
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
  notifySubscribers(previousState, currentState) {
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
  reset() {
    console.log('🗄️ Resetting state to initial values');
    this.state = this.getInitialState();
    this.notifySubscribers({}, this.state);
    eventBus.emit('state-reset', this.getState());
  }

  /**
   * Get state summary for debugging
   */
  getStateSummary() {
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