/**
 * Info Panel Manager - Handles entity details panel
 * Displays entity information and connections
 */

import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';
import { colorService } from '../services/color-service.js';

export class InfoPanelManager {
  constructor() {
    this.currentEntity = null;
    this.panelElement = null;
    
    this.setupEventListeners();
    this.setupUI();
    console.log('📋 Info Panel Manager initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for entity selection to update panel
    eventBus.on('entity-selected', (data) => {
      this.updatePanel(data.entity);
    });

    // Listen for info panel update requests
    eventBus.on('info-panel-update', (data) => {
      this.updatePanel(data.entity);
    });

    // Listen for node clicks from graph interactions
    eventBus.on('node-clicked', (data) => {
      this.updatePanel(data.node);
    });

    // Listen for entity centering to update panel
    eventBus.on('entity-centered', (data) => {
      // Find entity data from state
      const state = stateManager.getState();
      const entity = state.filteredData.entities.find(e => e.name === data.entity.name);
      if (entity) {
        this.updatePanel(entity);
      }
    });

    // Listen for filtered data changes to update connections
    eventBus.on('filtered-data', () => {
      if (this.currentEntity) {
        this.updatePanel(this.currentEntity);
      }
    });
  }

  /**
   * Setup UI elements and interactions
   */
  setupUI() {
    this.panelElement = document.getElementById('info-panel');
    
    if (!this.panelElement) {
      console.warn('📋 Info panel element not found in DOM');
      return;
    }

    // Info panel is always visible in current design, no toggle needed
    console.log('📋 Info panel UI initialized');
  }

  /**
   * Update panel with entity information
   * @param {Object} entity - Entity data to display
   */
  updatePanel(entity) {
    if (!entity) {
      this.clearPanel();
      return;
    }

    console.log(`📋 Updating info panel for entity: ${entity.name}`);
    
    this.currentEntity = entity;
    
    // Update entity name
    this.updateEntityName(entity);
    
    // Update entity type
    this.updateEntityType(entity);
    
    // Update observations
    this.updateObservations(entity);
    
    // Update connections
    this.updateConnections(entity);

    // Emit panel update event
    eventBus.emit('info-panel-updated', { entity });
  }

  /**
   * Update entity name in panel
   * @param {Object} entity - Entity data
   */
  updateEntityName(entity) {
    const nameElement = document.getElementById('entity-name');
    if (nameElement) {
      nameElement.textContent = entity.name;
    }
  }

  /**
   * Update entity type in panel
   * @param {Object} entity - Entity data
   */
  updateEntityType(entity) {
    const typeElement = document.getElementById('entity-type');
    if (typeElement) {
      const color = colorService.getEntityTypeColor(entity.entityType);
      const textColor = colorService.getContrastingTextColor(color);
      
      typeElement.textContent = entity.entityType;
      typeElement.style.backgroundColor = color;
      typeElement.style.color = textColor;
      typeElement.style.padding = '4px 8px';
      typeElement.style.borderRadius = '4px';
      typeElement.style.fontSize = '12px';
      typeElement.style.fontWeight = 'bold';
      typeElement.style.display = 'inline-block';
      typeElement.style.marginBottom = '8px';
    }
  }

  /**
   * Update observations in panel
   * @param {Object} entity - Entity data
   */
  updateObservations(entity) {
    const observationsList = document.getElementById('observations-list');
    if (!observationsList) return;

    // Clear existing observations
    observationsList.innerHTML = '';

    if (entity.observations && entity.observations.length > 0) {
      entity.observations.forEach((observation, index) => {
        const li = document.createElement('li');
        li.className = 'observation-item';
        li.textContent = observation;
        
        // Style for better readability
        li.style.marginBottom = '8px';
        li.style.padding = '8px';
        li.style.backgroundColor = '#f8fafc';
        li.style.borderRadius = '4px';
        li.style.borderLeft = '3px solid #e2e8f0';
        
        observationsList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No observations available';
      li.style.fontStyle = 'italic';
      li.style.color = '#6b7280';
      li.style.padding = '8px';
      observationsList.appendChild(li);
    }
  }

  /**
   * Update connections in panel
   * @param {Object} entity - Entity data
   */
  updateConnections(entity) {
    const connectionsList = document.getElementById('connections-list');
    if (!connectionsList) return;

    // Clear existing connections
    connectionsList.innerHTML = '';

    // Get current filtered data for connections
    const state = stateManager.getState();
    const relations = state.filteredData.relations || [];

    // Find connections for this entity
    const connections = relations.filter(rel => 
      rel.from === entity.name || rel.to === entity.name
    );

    if (connections.length > 0) {
      // Group connections by type for better organization
      const connectionsByType = this.groupConnectionsByType(connections, entity.name);
      
      Object.entries(connectionsByType).forEach(([relationType, typeConnections]) => {
        // Create type header
        const typeHeader = document.createElement('div');
        typeHeader.className = 'connection-type-header';
        typeHeader.innerHTML = `
          <h5 style="margin: 8px 0 4px 0; color: #374151; font-size: 14px; font-weight: 600;">
            🔗 ${relationType} (${typeConnections.length})
          </h5>
        `;
        connectionsList.appendChild(typeHeader);

        // Create connections for this type
        typeConnections.forEach(connection => {
          const connectionDiv = this.createConnectionElement(connection, entity.name);
          connectionsList.appendChild(connectionDiv);
        });
      });
    } else {
      const noConnectionsDiv = document.createElement('div');
      noConnectionsDiv.className = 'no-connections';
      noConnectionsDiv.innerHTML = `
        <p style="font-style: italic; color: #6b7280; padding: 16px; text-align: center; background: #f8fafc; border-radius: 4px; margin: 8px 0;">
          No connections visible in current view
        </p>
      `;
      connectionsList.appendChild(noConnectionsDiv);
    }
  }

  /**
   * Group connections by relation type
   * @param {Array} connections - Array of relation objects
   * @param {string} entityName - Name of the current entity
   * @returns {Object} - Grouped connections
   */
  groupConnectionsByType(connections, entityName) {
    const grouped = {};
    
    connections.forEach(relation => {
      const relationType = relation.relationType;
      if (!grouped[relationType]) {
        grouped[relationType] = [];
      }
      grouped[relationType].push(relation);
    });
    
    return grouped;
  }

  /**
   * Create connection element
   * @param {Object} relation - Relation data
   * @param {string} currentEntityName - Current entity name
   * @returns {Element} - Connection DOM element
   */
  createConnectionElement(relation, currentEntityName) {
    const connectionDiv = document.createElement('div');
    connectionDiv.className = 'connection-item';
    
    const isOutgoing = relation.from === currentEntityName;
    const connectedEntity = isOutgoing ? relation.to : relation.from;
    const direction = isOutgoing ? '→' : '←';
    const directionLabel = isOutgoing ? 'to' : 'from';
    
    connectionDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; padding: 8px; margin: 4px 0; background: white; border-radius: 4px; border: 1px solid #e5e7eb; cursor: pointer; transition: background-color 0.2s;">
        <span style="font-size: 12px; color: #6b7280;">${direction}</span>
        <span style="font-size: 12px; color: #6b7280;">${directionLabel}</span>
        <span class="connected-entity" data-entity="${connectedEntity}" style="font-weight: 500; color: #1f2937; flex: 1; text-decoration: underline;">${connectedEntity}</span>
      </div>
    `;

    // Add click handler for navigation
    connectionDiv.addEventListener('click', () => {
      this.handleConnectionClick(connectedEntity);
    });

    // Add hover effects
    connectionDiv.addEventListener('mouseenter', () => {
      connectionDiv.style.backgroundColor = '#f3f4f6';
    });

    connectionDiv.addEventListener('mouseleave', () => {
      connectionDiv.style.backgroundColor = 'white';
    });

    return connectionDiv;
  }

  /**
   * Handle connection clicks for navigation
   * @param {string} entityName - Name of connected entity
   */
  handleConnectionClick(entityName) {
    console.log(`📋 Connection clicked: navigating to ${entityName}`);
    
    // Emit navigation event
    eventBus.emit('entity-centered', { entity: { name: entityName } });
  }

  /**
   * Clear panel content
   */
  clearPanel() {
    console.log('📋 Clearing info panel');
    
    this.currentEntity = null;
    
    // Clear entity name
    const nameElement = document.getElementById('entity-name');
    if (nameElement) {
      nameElement.textContent = 'Entity Details';
    }
    
    // Clear entity type
    const typeElement = document.getElementById('entity-type');
    if (typeElement) {
      typeElement.textContent = '';
      typeElement.style.backgroundColor = '';
      typeElement.style.color = '';
    }
    
    // Clear observations
    const observationsList = document.getElementById('observations-list');
    if (observationsList) {
      observationsList.innerHTML = '<li style="font-style: italic; color: #6b7280;">Select an entity to view details</li>';
    }
    
    // Clear connections
    const connectionsList = document.getElementById('connections-list');
    if (connectionsList) {
      connectionsList.innerHTML = '<div style="font-style: italic; color: #6b7280; padding: 16px; text-align: center;">Select an entity to view connections</div>';
    }
  }

  /**
   * Get current panel state
   */
  getPanelState() {
    return {
      currentEntity: this.currentEntity?.name || null,
      isVisible: !!this.panelElement && !this.panelElement.classList.contains('hidden'),
      hasContent: !!this.currentEntity
    };
  }

  /**
   * Get entity statistics for current entity
   */
  getEntityStats() {
    if (!this.currentEntity) return null;
    
    const state = stateManager.getState();
    const relations = state.filteredData.relations || [];
    
    const connections = relations.filter(rel => 
      rel.from === this.currentEntity.name || rel.to === this.currentEntity.name
    );
    
    return {
      name: this.currentEntity.name,
      type: this.currentEntity.entityType,
      observations: this.currentEntity.observations?.length || 0,
      connections: connections.length,
      outgoingConnections: connections.filter(rel => rel.from === this.currentEntity.name).length,
      incomingConnections: connections.filter(rel => rel.to === this.currentEntity.name).length
    };
  }
}

// Create and export a singleton instance
export const infoPanelManager = new InfoPanelManager();