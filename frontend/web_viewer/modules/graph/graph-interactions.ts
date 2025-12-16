/**
 * Graph Interactions - Handles user interactions with the graph
 * Manages mouse/touch interactions, tooltips, and user input coordination
 */

import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';

export class GraphInteractions {
  constructor() {
    this.tooltip = null;
    this.isTooltipVisible = false;
    
    this.setupEventListeners();
    this.setupTooltip();
    console.log('🖱️ Graph Interactions initialized');
  }

  /**
   * Setup event listeners for graph interactions
   */
  setupEventListeners() {
    // Listen for node events from graph controller
    eventBus.on('node-hovered', (data) => {
      this.handleNodeHover(data.node, data.event);
    });

    eventBus.on('node-left', () => {
      this.handleNodeLeave();
    });

    eventBus.on('node-clicked', (data) => {
      this.handleNodeClick(data.node);
    });

    // Listen for edge events
    eventBus.on('edge-hovered', (data) => {
      this.handleEdgeHover(data.edge, data.event);
    });

    eventBus.on('edge-left', () => {
      this.handleEdgeLeave();
    });

    // Listen for graph centering to hide tooltip
    eventBus.on('graph-centered', () => {
      this.hideTooltip();
    });

    // Setup global mouse handlers
    document.addEventListener('mousemove', (e) => {
      this.updateTooltipPosition(e);
    });

    document.addEventListener('click', (e) => {
      // Hide tooltip on clicks outside graph
      if (!e.target.closest('#graph')) {
        this.hideTooltip();
      }
    });
  }

  /**
   * Setup tooltip element
   */
  setupTooltip() {
    this.tooltip = document.getElementById('tooltip');
    
    if (!this.tooltip) {
      console.warn('🖱️ Tooltip element not found in DOM');
      return;
    }

    // Ensure tooltip is initially hidden
    this.hideTooltip();
  }

  /**
   * Handle node hover events
   * @param {Object} node - Node data
   * @param {Event} event - Mouse event
   */
  handleNodeHover(node, event) {
    this.showNodeTooltip(node, event);
  }

  /**
   * Handle node leave events
   */
  handleNodeLeave() {
    this.hideTooltip();
  }

  /**
   * Handle node click events
   * @param {Object} node - Clicked node data
   */
  handleNodeClick(node) {
    console.log(`🖱️ Node clicked: ${node.name}`);
    
    // Hide tooltip on click
    this.hideTooltip();
    
    // Update info panel with node data
    this.updateInfoPanel(node);
    
    // Emit events for other components
    eventBus.emit('entity-selected', { entity: node });
    eventBus.emit('info-panel-update', { entity: node });
  }

  /**
   * Handle edge hover events
   * @param {Object} edge - Edge data
   * @param {Event} event - Mouse event
   */
  handleEdgeHover(edge, event) {
    this.showEdgeTooltip(edge, event);
  }

  /**
   * Handle edge leave events
   */
  handleEdgeLeave() {
    this.hideTooltip();
  }

  /**
   * Show tooltip for node
   * @param {Object} node - Node data
   * @param {Event} event - Mouse event
   */
  showNodeTooltip(node, event) {
    if (!this.tooltip) return;

    const title = this.tooltip.querySelector('#tooltip-title');
    const type = this.tooltip.querySelector('#tooltip-type');
    const description = this.tooltip.querySelector('#tooltip-description');

    if (title) title.textContent = node.name;
    if (type) type.textContent = node.entityType;
    if (description) {
      const obs = node.observations && node.observations.length > 0 
        ? node.observations[0] 
        : 'No description available';
      description.textContent = obs;
    }

    this.showTooltip(event);
  }

  /**
   * Show tooltip for edge
   * @param {Object} edge - Edge data
   * @param {Event} event - Mouse event
   */
  showEdgeTooltip(edge, event) {
    if (!this.tooltip) return;

    const title = this.tooltip.querySelector('#tooltip-title');
    const type = this.tooltip.querySelector('#tooltip-type');
    const description = this.tooltip.querySelector('#tooltip-description');

    if (title) title.textContent = edge.relationType;
    if (type) type.textContent = 'Relation';
    if (description) {
      const sourceId = edge.source.id || edge.source;
      const targetId = edge.target.id || edge.target;
      description.textContent = `From: ${sourceId} → To: ${targetId}`;
    }

    this.showTooltip(event);
  }

  /**
   * Show tooltip at event position
   * @param {Event} event - Mouse event
   */
  showTooltip(event) {
    if (!this.tooltip) return;

    this.positionTooltip(event);
    this.tooltip.classList.remove('hidden');
    this.isTooltipVisible = true;
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (!this.tooltip) return;

    this.tooltip.classList.add('hidden');
    this.isTooltipVisible = false;
  }

  /**
   * Position tooltip based on mouse position
   * @param {Event} event - Mouse event
   */
  positionTooltip(event) {
    if (!this.tooltip || !event) return;

    const offsetX = 10;
    const offsetY = -10;
    
    let x = event.pageX + offsetX;
    let y = event.pageY + offsetY;

    // Prevent tooltip from going off screen
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (x + tooltipRect.width > windowWidth) {
      x = event.pageX - tooltipRect.width - offsetX;
    }

    if (y < 0) {
      y = event.pageY + Math.abs(offsetY) + 20;
    }

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  /**
   * Update tooltip position on mouse move
   * @param {Event} event - Mouse event
   */
  updateTooltipPosition(event) {
    if (this.isTooltipVisible) {
      this.positionTooltip(event);
    }
  }

  /**
   * Update info panel with entity data
   * @param {Object} entity - Entity data
   */
  updateInfoPanel(entity) {
    // Update entity name
    const entityName = document.getElementById('entity-name');
    if (entityName) {
      entityName.textContent = entity.name;
    }

    // Update entity type
    const entityType = document.getElementById('entity-type');
    if (entityType) {
      entityType.textContent = entity.entityType;
      entityType.className = `entity-type ${this.getEntityTypeClass(entity.entityType)}`;
    }

    // Update observations
    this.updateObservations(entity);

    // Update connections
    this.updateConnections(entity);
  }

  /**
   * Update observations in info panel
   * @param {Object} entity - Entity data
   */
  updateObservations(entity) {
    const observationsList = document.getElementById('observations-list');
    if (!observationsList) return;

    observationsList.innerHTML = '';

    if (entity.observations && entity.observations.length > 0) {
      entity.observations.forEach(observation => {
        const li = document.createElement('li');
        li.textContent = observation;
        observationsList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No observations available';
      li.style.fontStyle = 'italic';
      li.style.color = 'var(--text-secondary)';
      observationsList.appendChild(li);
    }
  }

  /**
   * Update connections in info panel
   * @param {Object} entity - Entity data
   */
  updateConnections(entity) {
    const connectionsList = document.getElementById('connections-list');
    if (!connectionsList) return;

    connectionsList.innerHTML = '';

    // Get connections from current state
    const state = stateManager.getState();
    const relations = state.filteredData.relations || [];

    const connections = relations.filter(rel => 
      rel.from === entity.name || rel.to === entity.name
    );

    if (connections.length > 0) {
      connections.forEach(relation => {
        const connectionDiv = document.createElement('div');
        connectionDiv.className = 'connection-item';
        
        const isOutgoing = relation.from === entity.name;
        const connectedEntity = isOutgoing ? relation.to : relation.from;
        const direction = isOutgoing ? '→' : '←';
        
        connectionDiv.innerHTML = `
          <span class="relation-type">${relation.relationType}</span>
          <span class="direction">${direction}</span>
          <span class="connected-entity" data-entity="${connectedEntity}">${connectedEntity}</span>
        `;

        // Add click handler for connected entity
        const connectedEntitySpan = connectionDiv.querySelector('.connected-entity');
        connectedEntitySpan.addEventListener('click', () => {
          this.handleConnectedEntityClick(connectedEntity);
        });

        connectionsList.appendChild(connectionDiv);
      });
    } else {
      const noConnectionsDiv = document.createElement('div');
      noConnectionsDiv.textContent = 'No connections in current view';
      noConnectionsDiv.style.fontStyle = 'italic';
      noConnectionsDiv.style.color = 'var(--text-secondary)';
      connectionsList.appendChild(noConnectionsDiv);
    }
  }

  /**
   * Handle clicks on connected entities in info panel
   * @param {string} entityName - Name of connected entity
   */
  handleConnectedEntityClick(entityName) {
    console.log(`🖱️ Connected entity clicked: ${entityName}`);
    
    // Emit center event to navigate to connected entity
    eventBus.emit('entity-centered', { entity: { name: entityName } });
  }

  /**
   * Get CSS class for entity type
   * @param {string} entityType - Entity type
   * @returns {string} - CSS class name
   */
  getEntityTypeClass(entityType) {
    return entityType.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Get interaction statistics
   */
  getStats() {
    return {
      tooltipVisible: this.isTooltipVisible,
      hasTooltipElement: !!this.tooltip
    };
  }

  /**
   * Handle keyboard shortcuts for interactions
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyboardShortcut(event) {
    // Escape to hide tooltip
    if (event.key === 'Escape') {
      this.hideTooltip();
    }
  }

  /**
   * Cleanup method for removing event listeners
   */
  cleanup() {
    this.hideTooltip();
    
    // Remove global event listeners if needed
    document.removeEventListener('mousemove', this.updateTooltipPosition);
  }
}

// Create and export a singleton instance
export const graphInteractions = new GraphInteractions();