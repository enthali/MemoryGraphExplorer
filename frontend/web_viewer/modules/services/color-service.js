/**
 * Color Service - Manages color assignments for entity types
 * Provides consistent color mapping across the application
 */

import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';

export class ColorService {
  constructor() {
    this.colorPalette = [
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Amber
      '#8b5cf6', // Purple
      '#06b6d4', // Cyan
      '#ef4444', // Red
      '#84cc16', // Lime
      '#f97316', // Orange
      '#ec4899', // Pink
      '#6366f1', // Indigo
      '#14b8a6', // Teal
      '#a855f7', // Violet
      '#22c55e', // Emerald
      '#eab308', // Yellow
      '#dc2626', // Red (darker)
      '#059669'  // Green (darker)
    ];

    this.entityTypeColorMap = new Map();
    this.colorIndex = 0;
    
    this.setupEventListeners();
    console.log('🎨 Color Service initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for data loaded to assign colors
    eventBus.on('data-loaded', (data) => {
      this.assignColorsToEntityTypes(data.types.entityTypes);
    });

    // Listen for new entity types
    eventBus.on('entity-types-updated', (data) => {
      this.assignColorsToEntityTypes(data.entityTypes);
    });
  }

  /**
   * Assign colors to entity types
   * @param {Array} entityTypes - Array of entity type names
   */
  assignColorsToEntityTypes(entityTypes) {
    console.log('🎨 Assigning colors to entity types:', entityTypes);

    // Reset color index for consistent assignment
    this.colorIndex = 0;

    entityTypes.forEach(entityType => {
      if (!this.entityTypeColorMap.has(entityType)) {
        const color = this.getNextColor();
        this.entityTypeColorMap.set(entityType, color);
        console.log(`🎨 Assigned color ${color} to entity type: ${entityType}`);
      }
    });

    // Update state with color map
    const colorMapObject = Object.fromEntries(this.entityTypeColorMap);
    stateManager.setState({
      colorMap: this.entityTypeColorMap
    });

    // Emit color map updated event
    eventBus.emit('color-map-updated', {
      colorMap: colorMapObject,
      entityTypes: entityTypes
    });
  }

  /**
   * Get next color from palette
   * @returns {string} - Hex color code
   */
  getNextColor() {
    const color = this.colorPalette[this.colorIndex % this.colorPalette.length];
    this.colorIndex++;
    return color;
  }

  /**
   * Get color for specific entity type
   * @param {string} entityType - Entity type name
   * @returns {string} - Hex color code
   */
  getEntityTypeColor(entityType) {
    if (this.entityTypeColorMap.has(entityType)) {
      return this.entityTypeColorMap.get(entityType);
    }

    // Assign new color if not found
    const color = this.getNextColor();
    this.entityTypeColorMap.set(entityType, color);
    
    console.log(`🎨 Dynamically assigned color ${color} to new entity type: ${entityType}`);
    
    return color;
  }

  /**
   * Get color map as plain object
   * @returns {Object} - Color map object
   */
  getColorMap() {
    return Object.fromEntries(this.entityTypeColorMap);
  }

  /**
   * Get color map as Map
   * @returns {Map} - Color map
   */
  getColorMapInstance() {
    return this.entityTypeColorMap;
  }

  /**
   * Set custom color for entity type
   * @param {string} entityType - Entity type name
   * @param {string} color - Hex color code
   */
  setEntityTypeColor(entityType, color) {
    console.log(`🎨 Setting custom color ${color} for entity type: ${entityType}`);
    
    this.entityTypeColorMap.set(entityType, color);
    
    // Update state
    stateManager.setState({
      colorMap: this.entityTypeColorMap
    });

    // Emit update event
    eventBus.emit('color-map-updated', {
      colorMap: this.getColorMap(),
      entityTypes: Array.from(this.entityTypeColorMap.keys())
    });
  }

  /**
   * Reset colors for all entity types
   */
  resetColors() {
    console.log('🎨 Resetting all entity type colors');
    
    this.entityTypeColorMap.clear();
    this.colorIndex = 0;
    
    // Update state
    stateManager.setState({
      colorMap: new Map()
    });

    // Emit reset event
    eventBus.emit('color-map-reset', {});
  }

  /**
   * Get contrasting text color for background
   * @param {string} backgroundColor - Background color in hex
   * @returns {string} - 'white' or 'black'
   */
  getContrastingTextColor(backgroundColor) {
    // Remove # if present
    const hex = backgroundColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? 'black' : 'white';
  }

  /**
   * Generate a lighter version of a color
   * @param {string} color - Hex color code
   * @param {number} factor - Lightening factor (0-1)
   * @returns {string} - Lighter hex color
   */
  lightenColor(color, factor = 0.2) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.round(r + (255 - r) * factor));
    const newG = Math.min(255, Math.round(g + (255 - g) * factor));
    const newB = Math.min(255, Math.round(b + (255 - b) * factor));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Generate a darker version of a color
   * @param {string} color - Hex color code
   * @param {number} factor - Darkening factor (0-1)
   * @returns {string} - Darker hex color
   */
  darkenColor(color, factor = 0.2) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.max(0, Math.round(r * (1 - factor)));
    const newG = Math.max(0, Math.round(g * (1 - factor)));
    const newB = Math.max(0, Math.round(b * (1 - factor)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Get color statistics
   */
  getStats() {
    return {
      totalEntityTypes: this.entityTypeColorMap.size,
      assignedColors: Array.from(this.entityTypeColorMap.values()),
      availableColors: this.colorPalette.length,
      usedColorSlots: this.colorIndex,
      colorMap: this.getColorMap()
    };
  }

  /**
   * Export color map for external use
   * @returns {Object} - Exportable color configuration
   */
  exportColorMap() {
    return {
      entityTypeColors: this.getColorMap(),
      palette: this.colorPalette,
      version: '1.0',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import color map from external configuration
   * @param {Object} colorConfig - Color configuration object
   */
  importColorMap(colorConfig) {
    if (!colorConfig.entityTypeColors) {
      console.error('🎨 Invalid color configuration: missing entityTypeColors');
      return;
    }

    console.log('🎨 Importing color map configuration');
    
    // Clear existing colors
    this.entityTypeColorMap.clear();
    
    // Import new colors
    Object.entries(colorConfig.entityTypeColors).forEach(([entityType, color]) => {
      this.entityTypeColorMap.set(entityType, color);
    });

    // Update palette if provided
    if (colorConfig.palette) {
      this.colorPalette = colorConfig.palette;
    }

    // Update state and emit events
    stateManager.setState({
      colorMap: this.entityTypeColorMap
    });

    eventBus.emit('color-map-updated', {
      colorMap: this.getColorMap(),
      entityTypes: Array.from(this.entityTypeColorMap.keys())
    });

    console.log('🎨 Color map imported successfully');
  }
}

// Create and export a singleton instance
export const colorService = new ColorService();