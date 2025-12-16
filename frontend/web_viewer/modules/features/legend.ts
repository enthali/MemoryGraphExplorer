/**
 * Legend Manager - Handles legend rendering and interactions
 * Displays entity type colors and statistics
 */

import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';
import { colorService } from '../services/color-service.js';

export class LegendManager {
  constructor() {
    this.legendElement = null;
    this.isVisible = true;
    
    this.setupEventListeners();
    this.setupUI();
    console.log('🏷️ Legend Manager initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for color map updates
    eventBus.on('color-map-updated', (data) => {
      this.renderLegend(data.entityTypes, data.colorMap);
    });

    // Listen for filtered data updates to update counts
    eventBus.on('filtered-data', (data) => {
      this.updateEntityCounts(data.filteredData);
    });

    // Listen for data loaded to initial render
    eventBus.on('data-loaded', (data) => {
      // Initial render will be handled by color-map-updated event
    });

    // Listen for legend toggle requests
    eventBus.on('legend-toggle', (data) => {
      this.toggleVisibility(data.isVisible);
    });
  }

  /**
   * Setup UI elements
   */
  setupUI() {
    this.legendElement = document.getElementById('legend');
    
    if (!this.legendElement) {
      console.warn('🏷️ Legend element not found in DOM');
      return;
    }

    // Initially empty, will be populated when data loads
    this.legendElement.innerHTML = '<span style="color: var(--text-muted); font-size: 12px;">Loading...</span>';
  }

  /**
   * Render legend with entity types and colors
   * @param {Array} entityTypes - Array of entity type names
   * @param {Object} colorMap - Color mapping object
   */
  renderLegend(entityTypes, colorMap) {
    if (!this.legendElement || !entityTypes || !colorMap) return;

    console.log('🏷️ Rendering legend for entity types:', entityTypes);

    // Clear existing legend
    this.legendElement.innerHTML = '';

    // Create legend title
    const titleElement = document.createElement('div');
    titleElement.className = 'legend-title';
    titleElement.innerHTML = '<strong style="font-size: 12px; color: var(--text-primary);">Entity Types</strong>';
    this.legendElement.appendChild(titleElement);

    // Create legend items container
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'legend-items';
    itemsContainer.style.display = 'flex';
    itemsContainer.style.flexWrap = 'wrap';
    itemsContainer.style.gap = '8px';
    itemsContainer.style.marginTop = '4px';

    // Create legend items for each entity type
    entityTypes.forEach(entityType => {
      const color = colorMap[entityType] || 'var(--text-muted)';
      const legendItem = this.createLegendItem(entityType, color);
      itemsContainer.appendChild(legendItem);
    });

    this.legendElement.appendChild(itemsContainer);

    // Update counts with current filtered data
    const state = stateManager.getState();
    if (state.filteredData) {
      this.updateEntityCounts(state.filteredData);
    }
  }

  /**
   * Create individual legend item
   * @param {string} entityType - Entity type name
   * @param {string} color - Color hex code
   * @returns {Element} - Legend item element
   */
  createLegendItem(entityType, color) {
    const itemElement = document.createElement('div');
    itemElement.className = 'legend-item';
    itemElement.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 11px;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s;
      user-select: none;
    `;

    // Create color dot
    const colorDot = document.createElement('div');
    colorDot.className = 'legend-color-dot';
    colorDot.style.cssText = `
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: ${color};
      flex-shrink: 0;
    `;

    // Create type label
    const typeLabel = document.createElement('span');
    typeLabel.className = 'legend-type-label';
    typeLabel.textContent = entityType;

    // Create count badge (will be updated later)
    const countBadge = document.createElement('span');
    countBadge.className = 'legend-count';
    countBadge.dataset.entityType = entityType;
    countBadge.style.cssText = `
      background: ${color};
      color: ${colorService.getContrastingTextColor(color)};
      padding: 1px 4px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 600;
      min-width: 16px;
      text-align: center;
    `;
    countBadge.textContent = '0';

    // Assemble item
    itemElement.appendChild(colorDot);
    itemElement.appendChild(typeLabel);
    itemElement.appendChild(countBadge);

    // Add hover effects
    itemElement.addEventListener('mouseenter', () => {
      itemElement.style.backgroundColor = 'var(--hover-bg)';
      itemElement.style.borderColor = color;
      itemElement.style.transform = 'scale(1.02)';
    });

    itemElement.addEventListener('mouseleave', () => {
      itemElement.style.backgroundColor = 'var(--surface-color)';
      itemElement.style.borderColor = 'var(--border-color)';
      itemElement.style.transform = 'scale(1)';
    });

    // Add click handler for filtering (future enhancement)
    itemElement.addEventListener('click', () => {
      this.handleLegendItemClick(entityType);
    });

    return itemElement;
  }

  /**
   * Update entity counts in legend
   * @param {Object} filteredData - Current filtered data
   */
  updateEntityCounts(filteredData) {
    if (!filteredData || !this.legendElement) return;

    // Count entities by type
    const entityCounts = {};
    filteredData.entities.forEach(entity => {
      entityCounts[entity.entityType] = (entityCounts[entity.entityType] || 0) + 1;
    });

    // Update count badges
    const countElements = this.legendElement.querySelectorAll('.legend-count');
    countElements.forEach(countElement => {
      const entityType = countElement.dataset.entityType;
      const count = entityCounts[entityType] || 0;
      countElement.textContent = count.toString();
      
      // Style based on count
      if (count === 0) {
        countElement.style.opacity = '0.5';
      } else {
        countElement.style.opacity = '1';
      }
    });

    console.log('🏷️ Updated legend counts:', entityCounts);
  }

  /**
   * Handle legend item clicks
   * @param {string} entityType - Clicked entity type
   */
  handleLegendItemClick(entityType) {
    console.log(`🏷️ Legend item clicked: ${entityType}`);
    
    // Future enhancement: Could toggle filter for this entity type
    // For now, emit an event that other components can listen to
    eventBus.emit('legend-item-clicked', {
      entityType: entityType,
      timestamp: new Date()
    });

    // Could also highlight entities of this type in the graph
    eventBus.emit('entity-type-highlighted', { entityType });
  }

  /**
   * Toggle legend visibility
   * @param {boolean} isVisible - Whether legend should be visible
   */
  toggleVisibility(isVisible = !this.isVisible) {
    if (!this.legendElement) return;

    this.isVisible = isVisible;
    
    if (isVisible) {
      this.legendElement.style.display = 'block';
    } else {
      this.legendElement.style.display = 'none';
    }

    console.log(`🏷️ Legend visibility toggled: ${isVisible}`);
  }

  /**
   * Show legend
   */
  show() {
    this.toggleVisibility(true);
  }

  /**
   * Hide legend
   */
  hide() {
    this.toggleVisibility(false);
  }

  /**
   * Clear legend content
   */
  clear() {
    if (this.legendElement) {
      this.legendElement.innerHTML = '<span style="color: var(--text-muted); font-size: 12px;">No data</span>';
    }
  }

  /**
   * Get legend statistics
   */
  getStats() {
    const items = this.legendElement ? this.legendElement.querySelectorAll('.legend-item') : [];
    const countElements = this.legendElement ? this.legendElement.querySelectorAll('.legend-count') : [];
    
    let totalEntities = 0;
    const typeCounts = {};
    
    countElements.forEach(countElement => {
      const entityType = countElement.dataset.entityType;
      const count = parseInt(countElement.textContent) || 0;
      typeCounts[entityType] = count;
      totalEntities += count;
    });

    return {
      isVisible: this.isVisible,
      totalTypes: items.length,
      totalEntities: totalEntities,
      typeCounts: typeCounts,
      hasElement: !!this.legendElement
    };
  }

  /**
   * Create a compact legend for small screens
   */
  renderCompactLegend() {
    if (!this.legendElement) return;

    const state = stateManager.getState();
    const colorMap = colorService.getColorMap();
    const entityTypes = Object.keys(colorMap);

    this.legendElement.innerHTML = '';
    
    // Create compact container
    const compactContainer = document.createElement('div');
    compactContainer.className = 'legend-compact';
    compactContainer.style.cssText = `
      display: flex;
      gap: 2px;
      flex-wrap: wrap;
    `;

    entityTypes.forEach(entityType => {
      const color = colorMap[entityType];
      const dot = document.createElement('div');
      dot.title = entityType; // Tooltip
      dot.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: ${color};
        cursor: pointer;
        border: 1px solid var(--surface-color);
        box-shadow: var(--shadow);
      `;
      
      compactContainer.appendChild(dot);
    });

    this.legendElement.appendChild(compactContainer);
  }

  /**
   * Export legend configuration
   */
  exportConfig() {
    const state = stateManager.getState();
    return {
      isVisible: this.isVisible,
      colorMap: colorService.getColorMap(),
      stats: this.getStats(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create and export a singleton instance
export const legendManager = new LegendManager();