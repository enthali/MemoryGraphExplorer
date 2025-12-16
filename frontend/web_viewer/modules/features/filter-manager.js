/**
 * Filter Manager - Handles entity and relation type filtering
 * Manages filter UI and triggers data filtering events
 */

import { eventBus } from '../core/event-bus.js';
import { stateManager } from '../core/state-manager.js';
import { colorService } from '../services/color-service.js';

export class FilterManager {
  constructor() {
    this.currentColorMap = new Map();
    this.setupEventListeners();
    this.setupUI();
    console.log('🔽 Filter Manager initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for data loaded to render filters
    eventBus.on('data-loaded', (data) => {
      this.renderEntityTypeFilters();
      this.renderRelationTypeFilters();
    });

    // Listen for color map updates
    eventBus.on('color-map-updated', (data) => {
      this.handleColorMapUpdate(data);
    });

    // Listen for state changes to update UI
    stateManager.subscribe((currentState, previousState) => {
      if (currentState.availableEntityTypes !== previousState.availableEntityTypes) {
        this.renderEntityTypeFilters();
      }
      if (currentState.availableRelationTypes !== previousState.availableRelationTypes) {
        this.renderRelationTypeFilters();
      }
    });
  }

  /**
   * Setup UI event listeners
   */
  setupUI() {
    // Multi-select dropdown functionality
    const filterBtn = document.getElementById('filter-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    const clearFiltersBtn = document.getElementById('clear-filters');

    if (filterBtn && filterDropdown) {
      // Toggle dropdown visibility
      filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterDropdown.classList.toggle('hidden');
        stateManager.setState({ 
          filterDropdownOpen: !stateManager.getState().filterDropdownOpen 
        });
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
          filterDropdown.classList.add('hidden');
          stateManager.setState({ filterDropdownOpen: false });
        }
      });

      // Prevent dropdown from closing when clicking inside
      filterDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    if (clearFiltersBtn) {
      // Clear all filters
      clearFiltersBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }
  }

  /**
   * Render entity type filter checkboxes
   */
  renderEntityTypeFilters() {
    const state = stateManager.getState();
    const { availableEntityTypes, selectedEntityTypes } = state;
    
    if (!availableEntityTypes.length) return;

    console.log('🔽 Rendering entity type filters');

    const filterOptions = document.querySelector('#filter-dropdown .filter-options');
    if (!filterOptions) return;

    // Clear existing options
    filterOptions.innerHTML = '';

    // Create section for entity types
    const entitySection = document.createElement('div');
    entitySection.className = 'filter-section';
    entitySection.innerHTML = `
      <h4 class="filter-section-title">Entity Types</h4>
      <div class="filter-section-options" id="entity-type-options"></div>
    `;
    filterOptions.appendChild(entitySection);

    const entityOptions = entitySection.querySelector('#entity-type-options');

    // Generate entity type options
    availableEntityTypes.forEach(type => {
      const label = document.createElement('label');
      label.className = 'filter-option';
      
      const isChecked = selectedEntityTypes.includes(type);
      const colorDot = this.getEntityTypeColorDot(type);
      
      label.innerHTML = `
        <input type="checkbox" value="${type}" ${isChecked ? 'checked' : ''}>
        <span class="checkmark"></span>
        ${colorDot}
        <span class="filter-label">${type}</span>
      `;

      const checkbox = label.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => {
        this.handleEntityTypeChange();
      });

      entityOptions.appendChild(label);
    });

    this.updateFilterDisplay();
  }

  /**
   * Render relation type filter checkboxes
   */
  renderRelationTypeFilters() {
    const state = stateManager.getState();
    const { availableRelationTypes, selectedRelationTypes } = state;
    
    if (!availableRelationTypes.length) return;

    console.log('🔽 Rendering relation type filters');

    const filterOptions = document.querySelector('#filter-dropdown .filter-options');
    if (!filterOptions) return;

    // Check if entity section exists, if not create basic structure
    let entitySection = filterOptions.querySelector('.filter-section');
    if (!entitySection) {
      this.renderEntityTypeFilters();
    }

    // Create section for relation types
    const relationSection = document.createElement('div');
    relationSection.className = 'filter-section';
    relationSection.innerHTML = `
      <h4 class="filter-section-title">Relation Types</h4>
      <div class="filter-section-options" id="relation-type-options"></div>
    `;
    filterOptions.appendChild(relationSection);

    const relationOptions = relationSection.querySelector('#relation-type-options');

    // Generate relation type options
    availableRelationTypes.forEach(type => {
      const label = document.createElement('label');
      label.className = 'filter-option';
      
      const isChecked = selectedRelationTypes.includes(type);
      
      label.innerHTML = `
        <input type="checkbox" value="${type}" ${isChecked ? 'checked' : ''}>
        <span class="checkmark"></span>
        <span class="relation-icon">🔗</span>
        <span class="filter-label">${type}</span>
      `;

      const checkbox = label.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => {
        this.handleRelationTypeChange();
      });

      relationOptions.appendChild(label);
    });

    this.updateFilterDisplay();
  }

  /**
   * Handle entity type filter changes
   */
  handleEntityTypeChange() {
    const checkboxes = document.querySelectorAll('#entity-type-options input[type="checkbox"]:checked');
    const selectedTypes = Array.from(checkboxes).map(cb => cb.value);
    
    console.log('🔽 Entity type filter changed:', selectedTypes);
    
    // Update state and emit filter change event
    stateManager.setState({ selectedEntityTypes: selectedTypes });
    this.emitFilterChange();
    this.updateFilterDisplay();
  }

  /**
   * Handle relation type filter changes
   */
  handleRelationTypeChange() {
    const checkboxes = document.querySelectorAll('#relation-type-options input[type="checkbox"]:checked');
    const selectedTypes = Array.from(checkboxes).map(cb => cb.value);
    
    console.log('🔽 Relation type filter changed:', selectedTypes);
    
    // Update state and emit filter change event
    stateManager.setState({ selectedRelationTypes: selectedTypes });
    this.emitFilterChange();
    this.updateFilterDisplay();
  }

  /**
   * Emit filter change event
   */
  emitFilterChange() {
    const state = stateManager.getState();
    eventBus.emit('filter-changed', {
      selectedEntityTypes: state.selectedEntityTypes,
      selectedRelationTypes: state.selectedRelationTypes
    });
  }

  /**
   * Clear all filters
   */
  clearAllFilters() {
    console.log('🔽 Clearing all filters');
    
    // Uncheck all checkboxes
    const allCheckboxes = document.querySelectorAll('#filter-dropdown input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    // Update state
    stateManager.setState({
      selectedEntityTypes: [],
      selectedRelationTypes: []
    });

    this.emitFilterChange();
    this.updateFilterDisplay();
  }

  /**
   * Select all filters
   */
  selectAllFilters() {
    console.log('🔽 Selecting all filters');
    
    const state = stateManager.getState();
    
    // Check all checkboxes
    const allCheckboxes = document.querySelectorAll('#filter-dropdown input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = true;
    });

    // Update state
    stateManager.setState({
      selectedEntityTypes: state.availableEntityTypes.slice(),
      selectedRelationTypes: state.availableRelationTypes.slice()
    });

    this.emitFilterChange();
    this.updateFilterDisplay();
  }

  /**
   * Update filter button display
   */
  updateFilterDisplay() {
    const filterCount = document.getElementById('filter-count');
    if (!filterCount) return;

    const state = stateManager.getState();
    const totalSelected = state.selectedEntityTypes.length + state.selectedRelationTypes.length;
    const totalAvailable = state.availableEntityTypes.length + state.availableRelationTypes.length;
    
    if (totalSelected === 0) {
      filterCount.textContent = '0';
      filterCount.style.background = 'var(--error-color)';
    } else if (totalSelected === totalAvailable) {
      filterCount.textContent = '';
    } else {
      filterCount.textContent = totalSelected.toString();
      filterCount.style.background = 'var(--primary-color)';
    }
  }

  /**
   * Handle color map updates from ColorService
   * @param {Object} data - Color map update data
   */
  handleColorMapUpdate(data) {
    console.log('🔽 Filter Manager: Handling color map update', data);
    
    // Store the color map for filter rendering
    this.currentColorMap = data.colorMap;
    
    // Re-render entity type filters with new colors
    this.renderEntityTypeFilters();
  }

  /**
   * Get color dot for entity type using ColorService colors
   */
  getEntityTypeColorDot(entityType) {
    // Use color from ColorService if available, otherwise fallback
    const color = this.currentColorMap[entityType] || colorService.getEntityTypeColor(entityType) || 'var(--text-muted)';
    
    return `<span class="color-dot" style="background:${color};"></span>`;
  }

  /**
   * Get current filter summary
   */
  getFilterSummary() {
    const state = stateManager.getState();
    return {
      selectedEntityTypes: state.selectedEntityTypes.length,
      totalEntityTypes: state.availableEntityTypes.length,
      selectedRelationTypes: state.selectedRelationTypes.length,
      totalRelationTypes: state.availableRelationTypes.length,
      entityTypes: state.selectedEntityTypes,
      relationTypes: state.selectedRelationTypes
    };
  }
}

// Create and export a singleton instance
export const filterManager = new FilterManager();