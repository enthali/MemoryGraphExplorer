/**
 * Search Manager - Handles live search functionality
 * Provides visual filtering (show/hide) without data modification
 */

import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';
import type { Entity } from '../../src/types/index.js';

export class SearchManager {
  searchInput: HTMLInputElement | null;
  private debounceTimer: ReturnType<typeof setTimeout> | null;
  private readonly debounceDelay: number;

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
  private setupEventListeners(): void {
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
  private setupUI(): void {
    this.searchInput = document.getElementById('search') as HTMLInputElement | null;
    
    if (this.searchInput) {
      // Live search on input
      this.searchInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.handleSearchInput(target.value);
      });

      // Clear search on escape key
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.clearSearch();
        }
      });

      // Handle focus/blur for better UX
      this.searchInput.addEventListener('focus', () => {
        this.searchInput?.parentElement?.classList.add('search-focused');
      });

      this.searchInput.addEventListener('blur', () => {
        this.searchInput?.parentElement?.classList.remove('search-focused');
      });
    }
  }

  /**
   * Handle search input with debouncing
   */
  private handleSearchInput(query: string): void {
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
   */
  performSearch(query: string): void {
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
   */
  private searchEntities(query: string, entities: Entity[]): Entity[] {
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
  private clearSearchResults(): void {
    console.log('🔍 Clearing search results');
    
    // Update state
    stateManager.setState({
      searchResults: [],
      highlightedNodes: []
    });

    // Emit clear events
    eventBus.emit('search-cleared');
    eventBus.emit('search-results', {
      query: '',
      results: [],
      highlightedNodes: []
    });
  }

  /**
   * Clear search input and results
   */
  clearSearch(): void {
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
  private updateSearchResults(): void {
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
  focusSearch(): void {
    if (this.searchInput) {
      this.searchInput.focus();
      this.searchInput.select();
    }
  }

  /**
   * Navigate through search results
   */
  navigateResults(direction: 'next' | 'previous' = 'next'): void {
    const state = stateManager.getState();
    const searchResults = state.searchResults;
    
    if (!searchResults.length) return;

    const currentSelected = state.selectedEntity;
    let currentIndex = searchResults.findIndex(result => result.name === (currentSelected?.name || ''));
    
    if (direction === 'next') {
      currentIndex = (currentIndex + 1) % searchResults.length;
    } else {
      currentIndex = currentIndex <= 0 ? searchResults.length - 1 : currentIndex - 1;
    }
    
    const nextResult = searchResults[currentIndex];
    if (!nextResult) return;
    
    // Emit entity selection event
    eventBus.emit('entity-selected', { entity: nextResult, node: null });
    eventBus.emit('entity-centered', { entity: nextResult, node: null });
    
    console.log(`🔍 Navigated to search result: ${nextResult.name}`);
  }

  /**
   * Get search statistics
   */
  getSearchStats(): {
    query: string;
    resultsCount: number;
    totalEntities: number;
    hasActiveSearch: boolean;
    highlightedNodes: number;
  } {
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
   */
  addSearchHighlight(element: Element, entityName: string): void {
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
   */
  setQuery(query: string): void {
    if (this.searchInput) {
      this.searchInput.value = query;
    }
    this.performSearch(query);
  }
}

// Create and export a singleton instance
export const searchManager = new SearchManager();
