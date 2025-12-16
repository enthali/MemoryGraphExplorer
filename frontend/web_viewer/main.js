/**
 * Memory Graph Explorer - New Modular Main Application
 * Coordinates all modules and provides the application entry point
 */

// Core modules
import { eventBus } from './modules/core/event-bus.js';
import { stateManager } from './modules/core/state-manager.js';
import { dataManager } from './modules/core/data-manager.js';
import { appController } from './modules/core/app-controller.js';

// Feature modules
import { filterManager } from './modules/features/filter-manager.js';
import { searchManager } from './modules/features/search-manager.js';
import { infoPanelManager } from './modules/features/info-panel.js';
import { legendManager } from './modules/features/legend.js';
import { themeManager } from './modules/features/theme-manager.js';

// Graph modules
import { graphController } from './modules/graph/graph-controller.js';
import { GraphRenderer } from './modules/graph/graph-renderer.js';
import { graphInteractions } from './modules/graph/graph-interactions.js';

// Service modules
import { mcpClient } from './modules/services/mcp-client.js';
import { colorService } from './modules/services/color-service.js';

/**
 * Main application class that coordinates all modules
 */
class MemoryGraphExplorer {
  constructor() {
    this.graphRenderer = null;
    this.initialized = false;
    
    console.log('🚀 Memory Graph Explorer starting with modular architecture...');
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('📋 Initializing modular components...');
      
      // Initialize theme manager early to apply saved theme
      themeManager.initialize();
      
      // Initialize graph renderer
      this.initializeGraphRenderer();
      
      // Connect graph controller to renderer
      graphController.setRenderer(this.graphRenderer);
      
      // Setup event logging for debugging
      this.setupEventLogging();
      
      // Initialize application data and UI
      await appController.initializeApp();
      
      this.initialized = true;
      console.log('✅ Memory Graph Explorer initialized successfully with modular architecture');
      
    } catch (error) {
      console.error('❌ Failed to initialize Memory Graph Explorer:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Initialize the graph renderer
   */
  initializeGraphRenderer() {
    const graphContainer = document.getElementById('graph');
    if (!graphContainer) {
      throw new Error('Graph container element not found');
    }

    // Get container dimensions
    const containerElement = document.getElementById('graph-container');
    const width = containerElement ? containerElement.clientWidth : 800;
    const height = containerElement ? containerElement.clientHeight : 600;

    // Create graph renderer with event handlers
    this.graphRenderer = new GraphRenderer('#graph', {
      width: width,
      height: height,
      onNodeClick: (node) => graphController.handleNodeClick(node),
      onNodeHover: (node, event) => graphController.handleNodeHover(node, event),
      onNodeLeave: () => graphController.handleNodeLeave(),
      onEdgeHover: (edge, event) => graphController.handleEdgeHover(edge, event),
      onEdgeLeave: () => graphController.handleEdgeLeave(),
      onZoomChange: (data) => {
        eventBus.emit('zoom-changed', data);
      }
    });

    console.log('🎨 Graph renderer initialized');
  }

  /**
   * Setup event logging for debugging
   */
  setupEventLogging() {
    // Log key events for debugging
    const keyEvents = [
      'data-loaded',
      'filtered-data',
      'filter-changed',
      'search-changed',
      'entity-selected',
      'entity-centered',
      'graph-centered',
      'color-map-updated',
      'theme-changed'
    ];

    keyEvents.forEach(eventName => {
      eventBus.on(eventName, (data) => {
        console.log(`📡 Event: ${eventName}`, data);
      });
    });
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError(error) {
    console.error('💥 Initialization failed:', error);
    
    // Show error to user
    const errorMessage = `Failed to initialize Memory Graph Explorer: ${error.message}`;
    appController.handleError(errorMessage);
    
    // Try to provide recovery options
    this.showRecoveryOptions();
  }

  /**
   * Show recovery options to user
   */
  showRecoveryOptions() {
    const errorElement = document.getElementById('error');
    if (errorElement) {
      const retryButton = errorElement.querySelector('#retry-btn');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          this.retryInitialization();
        });
      }
    }
  }

  /**
   * Retry initialization
   */
  async retryInitialization() {
    console.log('🔄 Retrying initialization...');
    
    // Reset state
    stateManager.reset();
    this.initialized = false;
    
    // Clear any existing graph
    if (this.graphRenderer) {
      this.graphRenderer.updateGraph({ entities: [], relations: [] }, null);
    }
    
    // Retry initialization
    await this.init();
  }

  /**
   * Get application status for debugging
   */
  getStatus() {
    return {
      initialized: this.initialized,
      hasGraphRenderer: !!this.graphRenderer,
      appStatus: appController.getAppStatus(),
      stateStatus: stateManager.getStateSummary(),
      dataStatus: dataManager.getDataSummary(),
      graphStatus: graphController.getGraphStats(),
      colorStatus: colorService.getStats(),
      filterStatus: filterManager.getFilterSummary(),
      searchStatus: searchManager.getSearchStats(),
      infoPanelStatus: infoPanelManager.getPanelState(),
      legendStatus: legendManager.getStats(),
      interactionStatus: graphInteractions.getStats(),
      themeStatus: themeManager.getStats()
    };
  }

  /**
   * Get module references for debugging
   */
  getModules() {
    return {
      // Core
      eventBus,
      stateManager,
      dataManager,
      appController,
      
      // Features
      filterManager,
      searchManager,
      infoPanelManager,
      legendManager,
      themeManager,
      
      // Graph
      graphController,
      graphRenderer: this.graphRenderer,
      graphInteractions,
      
      // Services
      mcpClient,
      colorService
    };
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create global app instance for debugging
  window.memoryGraphExplorer = new MemoryGraphExplorer();
  
  // Export modules for debugging
  if (typeof window !== 'undefined') {
    window.MGE = {
      app: window.memoryGraphExplorer,
      modules: window.memoryGraphExplorer.getModules(),
      getStatus: () => window.memoryGraphExplorer.getStatus(),
      eventBus,
      stateManager,
      dataManager,
      appController,
      graphController,
      colorService,
      themeManager
    };
  }
  
  console.log('🎯 Memory Graph Explorer available globally as window.MGE');
  console.log('🔍 Use MGE.getStatus() to check application state');
  console.log('📡 Use MGE.eventBus to emit/listen to events');
  console.log('🗄️ Use MGE.stateManager to inspect application state');
});

// Export for potential module usage
export { MemoryGraphExplorer };