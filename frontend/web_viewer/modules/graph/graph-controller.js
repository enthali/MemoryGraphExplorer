/**
 * Graph Controller - Manages graph state and coordinates rendering
 * Always consumes filteredData from DataManager, never rawData directly
 */

import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';
import { dataManager } from '../core/data-manager.js';

export class GraphController {
  constructor() {
    this.currentNetworkData = null;
    this.currentCenterEntity = null;
    this.graphRenderer = null;
    
    this.setupEventListeners();
    console.log('📊 Graph Controller initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for filtered data updates
    eventBus.on('filtered-data', (data) => {
      this.handleFilteredDataUpdate(data.filteredData);
    });

    // Listen for entity centering requests
    eventBus.on('entity-centered', (data) => {
      this.centerOnEntity(data.entity.name);
    });

    // Listen for entity selection
    eventBus.on('entity-selected', (data) => {
      this.selectEntity(data.entity);
    });

    // Listen for search results for highlighting
    eventBus.on('search-results', (data) => {
      this.handleSearchResults(data);
    });

    // Listen for zoom changes
    eventBus.on('zoom-changed', (data) => {
      this.handleZoomChange(data);
    });

    // Listen for window resize
    eventBus.on('window-resized', (data) => {
      this.handleResize(data);
    });

    // Listen for view reset
    eventBus.on('view-reset', () => {
      this.resetView();
    });

    // Listen for color map updates
    eventBus.on('color-map-updated', (data) => {
      this.handleColorMapUpdate(data);
    });
  }

  /**
   * Set the graph renderer instance
   * @param {Object} renderer - Graph renderer instance
   */
  setRenderer(renderer) {
    this.graphRenderer = renderer;
    console.log('📊 Graph renderer attached to controller');
  }

  /**
   * Handle filtered data updates from DataManager
   * @param {Object} filteredData - Filtered entities and relations
   */
  handleFilteredDataUpdate(filteredData) {
    console.log('📊 Graph Controller: Handling filtered data update');
    console.log(`📊 Filtered data: ${filteredData.entities.length} entities, ${filteredData.relations.length} relations`);

    // Store current filtered data
    this.currentFilteredData = filteredData;

    // If we have a center entity, generate network around it
    const state = stateManager.getState();
    const centerEntity = state.centerEntity;

    if (centerEntity && filteredData.entities.length > 0) {
      this.centerOnEntity(centerEntity);
    } else if (filteredData.entities.length > 0) {
      // If no center entity but we have data, center on root entity
      const rootEntity = state.rootEntity;
      if (rootEntity) {
        this.centerOnEntity(rootEntity.name);
      } else {
        // Fallback to first entity
        this.centerOnEntity(filteredData.entities[0].name);
      }
    } else {
      // No data to display
      this.renderEmptyGraph();
    }
  }

  /**
   * Center the graph on a specific entity
   * @param {string} entityName - Name of the entity to center on
   */
  centerOnEntity(entityName) {
    if (!this.currentFilteredData || this.currentFilteredData.entities.length === 0) {
      console.warn('📊 Cannot center on entity: no filtered data available');
      return;
    }

    console.log(`📊 Centering graph on: ${entityName}`);

    // Check if entity exists in filtered data
    const entityExists = this.currentFilteredData.entities.some(e => e.name === entityName);
    if (!entityExists) {
      console.warn(`📊 Entity ${entityName} not found in filtered data`);
      // Try to find alternative or use first entity
      entityName = this.currentFilteredData.entities[0].name;
      console.log(`📊 Falling back to: ${entityName}`);
    }

    // Get network around the center entity
    this.currentNetworkData = dataManager.getNetworkAroundEntity(entityName, 2);
    this.currentCenterEntity = entityName;

    // Update state
    stateManager.setState({
      centerEntity: entityName,
      selectedEntity: entityName
    });

    // Render the network if we have a renderer
    if (this.graphRenderer) {
      this.graphRenderer.updateGraph(this.currentNetworkData, entityName);
    }

    // Emit centered event
    eventBus.emit('graph-centered', {
      entity: entityName,
      networkData: this.currentNetworkData
    });

    console.log(`📊 Graph centered on ${entityName}: ${this.currentNetworkData.entities.length} entities, ${this.currentNetworkData.relations.length} relations`);
  }

  /**
   * Select an entity (highlight without centering)
   * @param {Object} entity - Entity object
   */
  selectEntity(entity) {
    console.log(`📊 Selecting entity: ${entity.name}`);

    // Update state
    stateManager.setState({
      selectedEntity: entity.name
    });

    // Update renderer selection if available
    if (this.graphRenderer) {
      this.graphRenderer.selectNode(entity.name);
    }

    // Emit selection event
    eventBus.emit('entity-selection-changed', { entity });
  }

  /**
   * Handle search results for highlighting
   * @param {Object} data - Search results data
   */
  handleSearchResults(data) {
    const { query, results, highlightedNodes } = data;
    
    console.log(`📊 Handling search results: ${results.length} matches for "${query}"`);

    if (this.graphRenderer) {
      if (query && highlightedNodes.length > 0) {
        this.graphRenderer.highlightNodes(highlightedNodes);
      } else {
        this.graphRenderer.clearHighlight();
      }
    }
  }

  /**
   * Handle zoom changes
   * @param {Object} data - Zoom data
   */
  handleZoomChange(data) {
    const { zoom, pan } = data;
    
    // Update visual state
    stateManager.setState({
      zoom: zoom,
      pan: pan
    });

    console.log(`📊 Zoom changed: ${zoom.toFixed(2)}x, pan: (${pan.x.toFixed(1)}, ${pan.y.toFixed(1)})`);
  }

  /**
   * Handle window resize
   * @param {Object} data - Resize data
   */
  handleResize(data) {
    if (this.graphRenderer) {
      const container = document.getElementById('graph-container');
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.graphRenderer.resize(width, height);
        console.log(`📊 Graph resized to: ${width}x${height}`);
      }
    }
  }

  /**
   * Reset view to initial state
   */
  resetView() {
    console.log('📊 Resetting graph view');

    // Reset to root entity
    const state = stateManager.getState();
    const rootEntity = state.rootEntity;

    if (rootEntity) {
      this.centerOnEntity(rootEntity.name);
    } else if (this.currentFilteredData && this.currentFilteredData.entities.length > 0) {
      this.centerOnEntity(this.currentFilteredData.entities[0].name);
    }

    // Reset zoom and pan
    if (this.graphRenderer) {
      this.graphRenderer.resetZoom();
    }

    // Clear highlights
    if (this.graphRenderer) {
      this.graphRenderer.clearHighlight();
    }

    // Update visual state
    stateManager.setState({
      zoom: 1.0,
      pan: { x: 0, y: 0 }
    });
  }

  /**
   * Render empty graph when no data is available
   */
  renderEmptyGraph() {
    console.log('📊 Rendering empty graph - no data to display');
    
    if (this.graphRenderer) {
      this.graphRenderer.updateGraph({ entities: [], relations: [] }, null);
    }

    // Update state
    stateManager.setState({
      centerEntity: null,
      selectedEntity: null
    });
  }

  /**
   * Handle node click events from renderer
   * @param {Object} node - Clicked node data
   */
  handleNodeClick(node) {
    console.log(`📊 Node clicked: ${node.name}`);

    // Center on clicked node
    this.centerOnEntity(node.name);

    // Emit node click event for other components (like info panel)
    eventBus.emit('node-clicked', { node });
  }

  /**
   * Handle node hover events from renderer
   * @param {Object} node - Hovered node data
   * @param {Event} event - Mouse event
   */
  handleNodeHover(node, event) {
    // Emit hover event for tooltip
    eventBus.emit('node-hovered', { node, event });
  }

  /**
   * Handle node leave events from renderer
   */
  handleNodeLeave() {
    // Emit leave event to hide tooltip
    eventBus.emit('node-left', {});
  }

  /**
   * Handle edge hover events from renderer
   * @param {Object} edge - Hovered edge data
   * @param {Event} event - Mouse event
   */
  handleEdgeHover(edge, event) {
    // Emit hover event for tooltip
    eventBus.emit('edge-hovered', { edge, event });
  }

  /**
   * Handle edge leave events from renderer
   */
  handleEdgeLeave() {
    // Emit leave event to hide tooltip
    eventBus.emit('edge-left', {});
  }

  /**
   * Get current graph statistics
   */
  getGraphStats() {
    const state = stateManager.getState();
    return {
      centerEntity: state.centerEntity,
      selectedEntity: state.selectedEntity,
      networkEntities: this.currentNetworkData ? this.currentNetworkData.entities.length : 0,
      networkRelations: this.currentNetworkData ? this.currentNetworkData.relations.length : 0,
      filteredEntities: state.filteredData.entities.length,
      filteredRelations: state.filteredData.relations.length,
      totalEntities: state.rawData.entities.length,
      totalRelations: state.rawData.relations.length,
      zoom: state.zoom,
      pan: state.pan
    };
  }

  /**
   * Handle color map updates from ColorService
   * @param {Object} data - Color map update data
   */
  handleColorMapUpdate(data) {
    console.log('📊 Graph Controller: Handling color map update', data);
    
    if (!this.graphRenderer) {
      console.warn('📊 No graph renderer available for color update');
      return;
    }

    // Update the renderer's color map
    this.graphRenderer.updateColorMap(data.colorMap);
  }

  /**
   * Get current network data
   */
  getCurrentNetworkData() {
    return this.currentNetworkData;
  }

  /**
   * Get current center entity
   */
  getCurrentCenterEntity() {
    return this.currentCenterEntity;
  }

  /**
   * Check if graph has data
   */
  hasData() {
    return this.currentNetworkData && this.currentNetworkData.entities.length > 0;
  }
}

// Create and export a singleton instance
export const graphController = new GraphController();