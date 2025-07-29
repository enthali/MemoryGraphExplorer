/**
 * App Controller - Main application coordination
 * Orchestrates initialization and coordinates between all managers
 */

import { eventBus } from './event-bus.js';
import { stateManager } from './state-manager.js';
import { dataManager } from './data-manager.js';
import { filterManager } from '../features/filter-manager.js';
import { searchManager } from '../features/search-manager.js';

export class AppController {
  constructor() {
    this.initialized = false;
    this.setupEventListeners();
    console.log('🎮 App Controller initialized');
  }

  /**
   * Setup event listeners for app-level coordination
   */
  setupEventListeners() {
    // Listen for critical errors
    eventBus.on('error-occurred', (data) => {
      this.handleError(data.error);
    });

    // Listen for loading state changes
    eventBus.on('loading-state', (data) => {
      this.handleLoadingState(data);
    });

    // Listen for data loaded event to complete initialization
    eventBus.on('data-loaded', (data) => {
      this.handleDataLoaded(data);
    });

    // Setup keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Setup UI event listeners
    this.setupUIEventListeners();
  }

  /**
   * Setup UI event listeners
   */
  setupUIEventListeners() {
    // Refresh data button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshData();
      });
    }

    // Reset view button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetView();
      });
    }

    // Retry button
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.initializeApp();
      });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  /**
   * Initialize the application
   */
  async initializeApp() {
    console.log('🚀 Initializing Memory Graph Explorer...');
    
    try {
      // Reset any previous state
      if (this.initialized) {
        stateManager.reset();
      }

      // Load complete data from MCP server
      await dataManager.loadCompleteGraph();
      
      // Mark as initialized
      this.initialized = true;
      
      console.log('✅ Memory Graph Explorer initialized successfully');
      
      // Emit app ready event
      eventBus.emit('app-ready', {
        initialized: true,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.handleError(error.message);
      throw error;
    }
  }

  /**
   * Handle data loaded event
   */
  handleDataLoaded(data) {
    console.log('🎮 App Controller: Data loaded, completing initialization');
    
    // Center on root entity if available
    if (data.rootEntity) {
      this.centerOnEntity(data.rootEntity.name);
    }

    // Update UI stats
    this.updateStats();
    
    // Hide loading state
    this.hideLoading();
  }

  /**
   * Center the view on a specific entity
   * @param {string} entityName - Name of the entity to center on
   */
  centerOnEntity(entityName) {
    console.log(`🎯 Centering on entity: ${entityName}`);
    
    // Update state
    stateManager.setState({
      centerEntity: entityName,
      selectedEntity: entityName
    });

    // Emit centering events
    eventBus.emit('entity-centered', { entity: { name: entityName } });
    eventBus.emit('entity-selected', { entity: { name: entityName } });
  }

  /**
   * Refresh data from server
   */
  async refreshData() {
    console.log('🔄 Refreshing data...');
    
    try {
      await dataManager.loadCompleteGraph();
      this.showRefreshSuccess();
      console.log('✅ Data refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh data:', error);
      this.handleError('Failed to refresh data from server');
    }
  }

  /**
   * Reset view to initial state
   */
  resetView() {
    console.log('🏠 Resetting view...');
    
    // Clear search
    searchManager.clearSearch();
    
    // Reset filters to all selected
    filterManager.selectAllFilters();
    
    // Reset zoom and center on root entity
    const state = stateManager.getState();
    if (state.rootEntity) {
      this.centerOnEntity(state.rootEntity.name);
    }

    // Emit reset event
    eventBus.emit('view-reset', {
      timestamp: new Date()
    });
    
    console.log('✅ View reset to initial state');
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(event) {
    // ESC to close panels and clear search
    if (event.key === 'Escape') {
      searchManager.clearSearch();
      stateManager.setState({ filterDropdownOpen: false });
      
      // Close filter dropdown
      const filterDropdown = document.getElementById('filter-dropdown');
      if (filterDropdown) {
        filterDropdown.classList.add('hidden');
      }
    }
    
    // R to reset view (if not in input field)
    if ((event.key === 'r' || event.key === 'R') && !this.isInputFocused()) {
      if (!event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        this.resetView();
      }
    }
    
    // F to focus search (Ctrl/Cmd + F)
    if ((event.key === 'f' || event.key === 'F') && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      searchManager.focusSearch();
    }

    // Arrow keys to navigate search results
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const state = stateManager.getState();
      if (state.searchResults.length > 0 && !this.isInputFocused()) {
        event.preventDefault();
        const direction = event.key === 'ArrowUp' ? 'previous' : 'next';
        searchManager.navigateResults(direction);
      }
    }

    // Enter to center on selected search result
    if (event.key === 'Enter') {
      const state = stateManager.getState();
      if (state.searchResults.length > 0 && document.activeElement !== searchManager.searchInput) {
        const selectedEntity = state.selectedEntity;
        if (selectedEntity) {
          this.centerOnEntity(selectedEntity);
        }
      }
    }
  }

  /**
   * Check if an input field is currently focused
   */
  isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
  }

  /**
   * Handle error states
   */
  handleError(errorMessage) {
    console.error('🎮 App Controller: Handling error:', errorMessage);
    
    this.hideLoading();
    this.showError(errorMessage);
    
    // Update state
    stateManager.setState({
      error: errorMessage,
      isLoading: false
    });
  }

  /**
   * Handle loading state changes
   */
  handleLoadingState(data) {
    if (data.isLoading) {
      this.showLoading(data.message);
    } else {
      this.hideLoading();
    }
  }

  /**
   * Show loading state
   */
  showLoading(message = 'Loading...') {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    
    if (loadingEl) {
      loadingEl.classList.remove('hidden');
      const messageEl = loadingEl.querySelector('p');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }
    
    if (errorEl) {
      errorEl.classList.add('hidden');
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
  }

  /**
   * Show error state
   */
  showError(message) {
    const errorEl = document.getElementById('error');
    const loadingEl = document.getElementById('loading');
    
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
    
    if (errorEl) {
      const messageEl = errorEl.querySelector('p');
      if (messageEl) {
        messageEl.innerHTML = `❌ ${message.replace(/\n/g, '<br>')}`;
      }
      errorEl.classList.remove('hidden');
    }
  }

  /**
   * Show success message for refresh
   */
  showRefreshSuccess() {
    const successMsg = document.createElement('div');
    successMsg.className = 'refresh-success';
    successMsg.textContent = '✅ Data refreshed successfully';
    successMsg.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 1000;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(successMsg);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (successMsg.parentNode) {
        successMsg.remove();
      }
    }, 3000);
  }

  /**
   * Update statistics display
   */
  updateStats() {
    const state = stateManager.getState();
    
    // Update entity count
    const entityCountEl = document.getElementById('entity-count');
    if (entityCountEl) {
      entityCountEl.textContent = `Entities: ${state.filteredData.entities.length}`;
    }
    
    // Update relation count
    const relationCountEl = document.getElementById('relation-count');
    if (relationCountEl) {
      relationCountEl.textContent = `Relations: ${state.filteredData.relations.length}`;
    }
    
    // Update current center
    const currentCenterEl = document.getElementById('current-center');
    if (currentCenterEl) {
      currentCenterEl.textContent = `Center: ${state.centerEntity || 'None'}`;
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Emit resize event for graph to handle
    eventBus.emit('window-resized', {
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  /**
   * Get application status
   */
  getAppStatus() {
    const state = stateManager.getState();
    return {
      initialized: this.initialized,
      isLoading: state.isLoading,
      hasError: !!state.error,
      error: state.error,
      dataLoaded: state.rawData.entities.length > 0,
      entitiesCount: state.rawData.entities.length,
      relationsCount: state.rawData.relations.length,
      filteredEntitiesCount: state.filteredData.entities.length,
      filteredRelationsCount: state.filteredData.relations.length,
      centerEntity: state.centerEntity,
      rootEntity: state.rootEntity?.name || null
    };
  }
}

// Create and export a singleton instance
export const appController = new AppController();