/**
 * Data Manager - Handles data loading and client-side filtering
 * Always generates filteredData for visualization consumption
 */

import { eventBus } from './event-bus.js';
import { stateManager } from './state-manager.js';
import { mcpClient } from '../services/mcp-client.js';

export class DataManager {
  constructor() {
    this.setupEventListeners();
    console.log('📊 Data Manager initialized');
  }

  /**
   * Setup event listeners for data-related events
   */
  setupEventListeners() {
    // Listen for filter changes to regenerate filtered data
    eventBus.on('filter-changed', (data) => {
      this.handleFilterChange(data);
    });

    // Listen for data refresh requests
    eventBus.on('data-refresh-requested', () => {
      this.loadCompleteGraph();
    });
  }

  /**
   * Load complete graph from MCP server
   */
  async loadCompleteGraph() {
    console.log('📊 Loading complete graph data...');
    
    try {
      // Set loading state
      stateManager.setState({ isLoading: true, error: null });
      eventBus.emit('loading-state', { isLoading: true, message: 'Loading knowledge graph...' });

      // Load graph data and types
      const [graphData, typesData] = await Promise.all([
        mcpClient.readGraph(),
        mcpClient.listTypes()
      ]);

      // Find root entity (entity with "rootEntity: true" observation, or first entity)
      const rootEntity = this.findRootEntity(graphData.entities);

      // Update raw data state
      stateManager.setState({
        rawData: {
          entities: graphData.entities,
          relations: graphData.relations,
          types: typesData
        },
        availableEntityTypes: typesData.entityTypes,
        availableRelationTypes: typesData.relationTypes,
        rootEntity: rootEntity,
        centerEntity: rootEntity ? rootEntity.name : null,
        // Set initial filters to include all types
        selectedEntityTypes: typesData.entityTypes.slice(),
        selectedRelationTypes: typesData.relationTypes.slice(),
        isLoading: false
      });

      // Generate initial filtered data (all data since all types are selected)
      this.generateFilteredData();

      // Emit data loaded event
      eventBus.emit('data-loaded', {
        rawData: graphData,
        types: typesData,
        rootEntity: rootEntity
      });

      console.log(`✅ Loaded ${graphData.entities.length} entities and ${graphData.relations.length} relations`);
      console.log(`✅ Root entity: ${rootEntity ? rootEntity.name : 'None found'}`);

    } catch (error) {
      console.error('❌ Failed to load graph data:', error);
      stateManager.setState({
        isLoading: false,
        error: error.message
      });
      eventBus.emit('error-occurred', { error: error.message });
      throw error;
    }
  }

  /**
   * Find root entity with "rootEntity: true" observation, or return first entity
   * @param {Array} entities - Array of entities
   * @returns {Object|null} - Root entity or null if no entities
   */
  findRootEntity(entities) {
    if (!entities || entities.length === 0) {
      return null;
    }

    // Search for entity with rootEntity observation
    const rootEntity = entities.find(entity => 
      entity.observations && entity.observations.some(obs => 
        obs.toLowerCase().includes('rootentity') && obs.toLowerCase().includes('true')
      )
    );
    
    // Return root entity if found, otherwise first entity
    const result = rootEntity || entities[0];
    console.log(`🎯 Root entity determined: ${result.name} ${rootEntity ? '(from observation)' : '(fallback to first)'}`);
    
    return result;
  }

  /**
   * Apply client-side filters to raw data and generate filtered data
   * This method ALWAYS generates filteredData regardless of filter state
   */
  generateFilteredData() {
    const state = stateManager.getState();
    const { rawData, selectedEntityTypes, selectedRelationTypes } = state;

    console.log('📊 Generating filtered data...');
    console.log(`📊 Selected entity types: ${selectedEntityTypes.join(', ') || 'None'}`);
    console.log(`📊 Selected relation types: ${selectedRelationTypes.join(', ') || 'None'}`);

    // If no filters selected, show empty result
    if (selectedEntityTypes.length === 0 || selectedRelationTypes.length === 0) {
      const filteredData = { entities: [], relations: [] };
      stateManager.setState({ filteredData });
      eventBus.emit('filtered-data', { filteredData });
      console.log('📊 No types selected - empty filtered data generated');
      return;
    }

    // Apply entity type filtering
    const filteredEntities = rawData.entities.filter(entity => 
      selectedEntityTypes.includes(entity.entityType)
    );

    // Apply relation type filtering
    // Only include relations where both entities exist in filtered set AND relation type is selected
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
    const filteredRelations = rawData.relations.filter(relation => {
      const hasValidRelationType = selectedRelationTypes.includes(relation.relationType);
      const hasValidEntities = filteredEntityNames.has(relation.from) && 
                              filteredEntityNames.has(relation.to);
      return hasValidRelationType && hasValidEntities;
    });

    const filteredData = {
      entities: filteredEntities,
      relations: filteredRelations
    };

    // Update state with filtered data
    stateManager.setState({ filteredData });

    // Emit filtered data event
    eventBus.emit('filtered-data', { filteredData });

    console.log(`📊 Generated filtered data: ${filteredData.entities.length} entities, ${filteredData.relations.length} relations`);
  }

  /**
   * Handle filter change events
   * @param {Object} data - Filter change data
   */
  handleFilterChange(data) {
    console.log('📊 Handling filter change:', data);
    
    // Update filter state
    const updates = {};
    if (data.selectedEntityTypes !== undefined) {
      updates.selectedEntityTypes = data.selectedEntityTypes;
    }
    if (data.selectedRelationTypes !== undefined) {
      updates.selectedRelationTypes = data.selectedRelationTypes;
    }

    stateManager.setState(updates);

    // Regenerate filtered data
    this.generateFilteredData();
  }

  /**
   * Get network around a specific entity (for centering)
   * @param {string} centerEntity - Name of the center entity
   * @param {number} maxDegree - Maximum degree of connections (default: 2)
   * @returns {Object} - Network data with entities and relations
   */
  getNetworkAroundEntity(centerEntity, maxDegree = 2) {
    const state = stateManager.getState();
    const filteredData = state.filteredData;

    if (!filteredData || !filteredData.entities.length) {
      return { entities: [], relations: [] };
    }

    console.log(`🔍 Getting ${maxDegree}-degree network around ${centerEntity}`);

    const networkEntities = new Set();
    const networkRelations = [];
    
    // Add center entity
    networkEntities.add(centerEntity);
    
    // Helper function to get connected entities
    const getConnectedEntities = (entityName) => {
      const connected = new Set();
      
      filteredData.relations.forEach(relation => {
        if (relation.from === entityName) {
          connected.add(relation.to);
          if (!networkRelations.some(r => r.from === relation.from && r.to === relation.to && r.relationType === relation.relationType)) {
            networkRelations.push(relation);
          }
        } else if (relation.to === entityName) {
          connected.add(relation.from);
          if (!networkRelations.some(r => r.from === relation.from && r.to === relation.to && r.relationType === relation.relationType)) {
            networkRelations.push(relation);
          }
        }
      });
      
      return connected;
    };
    
    // Get 1st degree connections
    const firstDegree = getConnectedEntities(centerEntity);
    firstDegree.forEach(entity => networkEntities.add(entity));
    
    // Get 2nd degree connections if requested
    if (maxDegree >= 2) {
      firstDegree.forEach(entity => {
        const secondDegree = getConnectedEntities(entity);
        secondDegree.forEach(entity2 => {
          networkEntities.add(entity2);
        });
      });
    }
    
    // Filter entities and relations to include only network members
    const entities = filteredData.entities.filter(entity => 
      networkEntities.has(entity.name)
    );
    
    const relations = networkRelations.filter(relation =>
      networkEntities.has(relation.from) && networkEntities.has(relation.to)
    );
    
    console.log(`🔍 Network around ${centerEntity}: ${entities.length} entities, ${relations.length} relations`);
    return { entities, relations };
  }

  /**
   * Get current data summary
   */
  getDataSummary() {
    const state = stateManager.getState();
    return {
      rawEntities: state.rawData.entities.length,
      rawRelations: state.rawData.relations.length,
      filteredEntities: state.filteredData.entities.length,
      filteredRelations: state.filteredData.relations.length,
      availableEntityTypes: state.availableEntityTypes.length,
      availableRelationTypes: state.availableRelationTypes.length,
      selectedEntityTypes: state.selectedEntityTypes.length,
      selectedRelationTypes: state.selectedRelationTypes.length,
      rootEntity: state.rootEntity?.name || 'None'
    };
  }
}

// Create and export a singleton instance
export const dataManager = new DataManager();