/**
 * Search Manager - Handles live search functionality
 * Provides visual filtering (show/hide) without data modification
 */

import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';

export class SearchManager {
  constructor() {
    this.searchInput = null;
    this.debounceTimer = null;
    this.debounceDelay = 300; // milliseconds
    
    this.setupEventListeners();
    this.setupUI();
    console.log('🔍 Search Manager initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for filtered data updates to update search results
    eventBus.on('filtered-data', (data) => {
      this.updateSearchResults();
    });

    // Listen for search clear requests
    eventBus.on('search-clear-requested', () => {
      this.clearSearch();
    });
  }

  /**
   * Setup UI event listeners
   */
  setupUI() {
    this.searchInput = document.getElementById('search');
    
    if (this.searchInput) {
      // Live search on input
      this.searchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });

      // Clear search on escape key
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.clearSearch();
        }
      });

      // Handle focus/blur for better UX
      this.searchInput.addEventListener('focus', () => {
        this.searchInput.parentElement.classList.add('search-focused');
      });

      this.searchInput.addEventListener('blur', () => {
        this.searchInput.parentElement.classList.remove('search-focused');
      });
    }
  }

  /**
   * Handle search input with debouncing
   * @param {string} query - Search query string
   */
  handleSearchInput(query) {
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce search to avoid excessive processing
    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, this.debounceDelay);
  }

  /**
   * Perform the actual search
   * @param {string} query - Search query string
   */
  performSearch(query) {
    const trimmedQuery = query.trim();
    
    console.log(`🔍 Performing search for: "${trimmedQuery}"`);

    // Update search state
    stateManager.setState({
      searchQuery: trimmedQuery
    });

    if (trimmedQuery === '') {
      this.clearSearchResults();
      return;
    }

    // Get current filtered data to search within
    const state = stateManager.getState();
    const filteredData = state.filteredData;

    // Find matching entities in current filtered dataset
    const searchResults = this.searchEntities(trimmedQuery, filteredData.entities);
    
    // Update state with search results
    stateManager.setState({
      searchResults: searchResults,
      highlightedNodes: searchResults.map(entity => entity.name)
    });

    // Emit search events
    eventBus.emit('search-changed', {
      query: trimmedQuery,
      results: searchResults
    });

    eventBus.emit('search-results', {
      query: trimmedQuery,
      results: searchResults,
      highlightedNodes: searchResults.map(entity => entity.name)
    });

    console.log(`🎯 Found ${searchResults.length} matches for "${trimmedQuery}"`);
  }

  /**
   * Search entities by name and observations
   * @param {string} query - Search query
   * @param {Array} entities - Array of entities to search
   * @returns {Array} - Matching entities
   */
  searchEntities(query, entities) {
    if (!query || !entities.length) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    
    return entities.filter(entity => {
      // Search in entity name
      if (entity.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Search in entity type
      if (entity.entityType.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Search in observations
      if (entity.observations && entity.observations.length > 0) {
        return entity.observations.some(obs => 
          obs.toLowerCase().includes(lowerQuery)
        );
      }
      
      return false;
    });
  }

  /**
   * Clear search results and restore full view
   */
  clearSearchResults() {
    console.log('🔍 Clearing search results');
    
    // Update state
    stateManager.setState({
      searchResults: [],
      highlightedNodes: []
    });

    // Emit clear events
    eventBus.emit('search-cleared', {});
    eventBus.emit('search-results', {
      query: '',
      results: [],
      highlightedNodes: []
    });
  }

  /**
   * Clear search input and results
   */
  clearSearch() {
    console.log('🔍 Clearing search');
    
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    
    stateManager.setState({
      searchQuery: ''
    });
    
    this.clearSearchResults();
  }

  /**
   * Update search results when filtered data changes
   */
  updateSearchResults() {
    const state = stateManager.getState();
    const currentQuery = state.searchQuery;
    
    // Re-run search with current query if there is one
    if (currentQuery && currentQuery.trim() !== '') {
      this.performSearch(currentQuery);
    }
  }

  /**
   * Focus on search input
   */
  focusSearch() {
    if (this.searchInput) {
      this.searchInput.focus();
      this.searchInput.select();
    }
  }

  /**
   * Navigate through search results
   * @param {string} direction - 'next' or 'previous'
   */
  navigateResults(direction = 'next') {
    const state = stateManager.getState();
    const searchResults = state.searchResults;
    
    if (!searchResults.length) return;

    const currentSelected = state.selectedEntity;
    let currentIndex = searchResults.findIndex(result => result.name === currentSelected);
    
    if (direction === 'next') {
      currentIndex = (currentIndex + 1) % searchResults.length;
    } else {
      currentIndex = currentIndex <= 0 ? searchResults.length - 1 : currentIndex - 1;
    }
    
    const nextResult = searchResults[currentIndex];
    
    // Emit entity selection event
    eventBus.emit('entity-selected', { entity: nextResult });
    eventBus.emit('entity-centered', { entity: nextResult });
    
    console.log(`🔍 Navigated to search result: ${nextResult.name}`);
  }

  /**
   * Get search statistics
   */
  getSearchStats() {
    const state = stateManager.getState();
    return {
      query: state.searchQuery,
      resultsCount: state.searchResults.length,
      totalEntities: state.filteredData.entities.length,
      hasActiveSearch: state.searchQuery.trim() !== '',
      highlightedNodes: state.highlightedNodes.length
    };
  }

  /**
   * Add search result highlighting to an entity element
   * @param {Element} element - DOM element to highlight
   * @param {string} entityName - Name of the entity
   */
  addSearchHighlight(element, entityName) {
    const state = stateManager.getState();
    const isHighlighted = state.highlightedNodes.includes(entityName);
    
    if (isHighlighted) {
      element.classList.add('search-highlight');
    } else {
      element.classList.remove('search-highlight');
    }
  }

  /**
   * Set search query programmatically
   * @param {string} query - Search query to set
   */
  setQuery(query) {
    if (this.searchInput) {
      this.searchInput.value = query;
    }
    this.performSearch(query);
  }
}

// Create and export a singleton instance
export const searchManager = new SearchManager();