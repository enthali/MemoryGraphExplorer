/**
 * Color Service - Manages color assignments for entity types
 * Provides consistent color mapping across the application
 */

import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';
import type { EventMap } from '../../src/types/index.js';

interface ColorConfig {
  entityTypeColors: Record<string, string>;
  palette?: string[];
  version?: string;
  timestamp?: string;
}

interface ColorStats {
  totalEntityTypes: number;
  assignedColors: string[];
  availableColors: number;
  usedColorSlots: number;
  colorMap: Record<string, string>;
}

export class ColorService {
  private colorPalette: string[];
  private entityTypeColorMap: Map<string, string>;
  private colorIndex: number;

  constructor() {
    // Use the same color palette as the original colorPalette.js
    this.colorPalette = [
      '#4285f4', // blue
      '#10b981', // green
      '#f59e0b', // orange
      '#8b5cf6', // purple
      '#ef4444', // red
      '#22d3ee', // cyan
      '#f472b6', // pink
      '#f43f5e', // rose
      '#6366f1', // indigo
      '#a3e635', // lime
      '#eab308', // yellow
      '#a21caf', // violet
      '#f97316', // amber
      '#14b8a6', // teal
      '#e11d48', // crimson
    ];

    this.entityTypeColorMap = new Map();
    this.colorIndex = 0;
    
    this.setupEventListeners();
    console.log('🎨 Color Service initialized');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
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
   */
  assignColorsToEntityTypes(entityTypes: string[]): void {
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
    stateManager.setState({
      colorMap: this.entityTypeColorMap
    });

    // Emit color map updated event with entity types
    eventBus.emit('color-map-updated', {
      entityTypes: entityTypes,
      colorMap: this.entityTypeColorMap
    });
  }

  /**
   * Get next color from palette
   */
  private getNextColor(): string {
    const color = this.colorPalette[this.colorIndex % this.colorPalette.length];
    if (!color) {
      throw new Error('Color palette is empty');
    }
    this.colorIndex++;
    return color;
  }

  /**
   * Get color for specific entity type
   */
  getEntityTypeColor(entityType: string): string {
    const existingColor = this.entityTypeColorMap.get(entityType);
    if (existingColor) {
      return existingColor;
    }

    // Assign new color if not found
    const color = this.getNextColor();
    this.entityTypeColorMap.set(entityType, color);
    
    console.log(`🎨 Dynamically assigned color ${color} to new entity type: ${entityType}`);
    
    return color;
  }

  /**
   * Get color map as plain object
   */
  getColorMap(): Record<string, string> {
    return Object.fromEntries(this.entityTypeColorMap);
  }

  /**
   * Get color map as Map
   */
  getColorMapInstance(): Map<string, string> {
    return this.entityTypeColorMap;
  }

  /**
   * Set custom color for entity type
   */
  setEntityTypeColor(entityType: string, color: string): void {
    console.log(`🎨 Setting custom color ${color} for entity type: ${entityType}`);
    
    this.entityTypeColorMap.set(entityType, color);
    
    // Update state
    stateManager.setState({
      colorMap: this.entityTypeColorMap
    });

    // Emit update event
    eventBus.emit('color-map-updated', {
      colorMap: this.entityTypeColorMap
    });
  }

  /**
   * Reset colors for all entity types
   */
  resetColors(): void {
    console.log('🎨 Resetting all entity type colors');
    
    this.entityTypeColorMap.clear();
    this.colorIndex = 0;
    
    // Update state
    stateManager.setState({
      colorMap: new Map()
    });

    // Emit reset event - need to add this to EventMap if not already there
    // For now, we'll comment this out as it's not in the EventMap
    // eventBus.emit('color-map-reset', {});
  }

  /**
   * Get contrasting text color for background
   */
  getContrastingTextColor(backgroundColor: string): 'white' | 'black' {
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
   */
  lightenColor(color: string, factor: number = 0.2): string {
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
   */
  darkenColor(color: string, factor: number = 0.2): string {
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
  getStats(): ColorStats {
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
   */
  exportColorMap(): ColorConfig {
    return {
      entityTypeColors: this.getColorMap(),
      palette: this.colorPalette,
      version: '1.0',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import color map from external configuration
   */
  importColorMap(colorConfig: ColorConfig): void {
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
      colorMap: this.entityTypeColorMap
    });

    console.log('🎨 Color map imported successfully');
  }
}

// Create and export a singleton instance
export const colorService = new ColorService();
