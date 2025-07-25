// Legend rendering moved to legend.js
/**
 * Knowledge Graph Interactive Viewer - Main Application
 * Entry point for the web-based knowledge graph visualization
 */

import { KnowledgeGraph } from './graph.js';
import { MCPDataProvider } from './mcp-data.js';
import { renderEntityTypeFilter } from './filter.js';
import { COLOR_PALETTE, getEntityTypeColorMap } from './colorPalette.js';
import { renderLegend } from './legend.js';
import { renderInfoPanel } from './infoPanel.js';

class KnowledgeGraphApp {
    constructor() {
        this.dataProvider = new MCPDataProvider();
        this.graph = null;
        this.currentData = null;
        this.currentCenter = 'Georg Doll'; // Default center entity
        this.entityTypes = [];
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Knowledge Graph App...');
        
        try {
            // Initialize UI event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadData();
            
            // Initialize graph visualization
            this.initializeGraph();
            
            // Set initial view
            await this.centerOnEntity(this.currentCenter);
            
            console.log('✅ Knowledge Graph App initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Failed to initialize the knowledge graph viewer');
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // Multi-select filter functionality
        this.setupMultiSelectFilter();
        
        // Refresh data
        const refreshBtn = document.getElementById('refresh-btn');
        refreshBtn.addEventListener('click', () => this.refreshData());
        
        // Reset view
        const resetBtn = document.getElementById('reset-btn');
        resetBtn.addEventListener('click', () => this.resetView());
        
        // Retry button
        const retryBtn = document.getElementById('retry-btn');
        retryBtn.addEventListener('click', () => this.loadData());
        
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    async loadData() {
        console.log('📊 Loading knowledge graph data...');
        this.showLoading();
        try {
            this.currentData = await this.dataProvider.getFullGraph();
            // Extract unique entity types
            this.entityTypes = [...new Set(this.currentData.entities.map(e => e.entityType))].sort();
            // Set initial center to first entity if available
            if (this.currentData.entities.length > 0) {
                this.currentCenter = this.currentData.entities[0].name;
            }
            // Generate color map for entity types
            this.entityTypeColorMap = getEntityTypeColorMap(this.entityTypes);
            // Render dynamic filter UI with color
            renderEntityTypeFilter(this.entityTypes, () => {
                this.updateFilterDisplay();
                this.applyMultiSelectFilter();
            }, this.entityTypeColorMap);
            // Render dynamic legend
            renderLegend(this.entityTypes, this.entityTypeColorMap);
            this.updateStats();
            this.hideLoading();
            // Show info panel for the center node after data is loaded
            const centerEntityObj = this.currentData.entities.find(e => e.name === this.currentCenter);
            if (centerEntityObj) {
                renderInfoPanel(centerEntityObj, this.getEntityTypeClass.bind(this), this.getEntityConnectionsWithClickHandler.bind(this));
            }
            console.log(`✅ Loaded ${this.currentData.entities.length} entities and ${this.currentData.relations.length} relations`);
        } catch (error) {
            console.error('❌ Failed to load data:', error);
            this.showError(`Unable to connect to MCP Memory Server. Please ensure the server is running and has data loaded.

Troubleshooting steps:
1. Check that your memory.json file exists and contains data
2. Verify the MCP Memory Server is configured correctly in mcp.json
3. Restart the server if needed

Error details: ${error.message}`);
            throw error;
        }
    }

    initializeGraph() {
        if (!this.currentData) {
            throw new Error('No data available to initialize graph');
        }

        // Initialize the graph visualization
        this.graph = new KnowledgeGraph('#graph', {
            width: this.getGraphContainerWidth(),
            height: this.getGraphContainerHeight(),
            onNodeClick: (node) => this.handleNodeClick(node),
            onNodeHover: (node, event) => this.handleNodeHover(node, event),
            onNodeLeave: () => this.handleNodeLeave(),
            onEdgeHover: (edge, event) => this.handleEdgeHover(edge, event),
            onEdgeLeave: () => this.handleEdgeLeave(),
            entityTypeColorMap: this.entityTypeColorMap
        });

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    handleEdgeHover(edge, event) {
        this.showTooltip(edge, event, true);
    }

    handleEdgeLeave() {
        this.hideTooltip();
    }

    async centerOnEntity(entityName) {
        if (!this.graph || !this.currentData) return;
        
        console.log(`🎯 Centering graph on: ${entityName}`);
        
        try {
            // Get 2-degree network around the center entity
            const networkData = this.getNetworkAroundEntity(entityName, 2);
            
            // Update graph with filtered data
            this.graph.updateData(networkData, entityName, this.entityTypeColorMap);
            
            // Update current center
            this.currentCenter = entityName;
            this.updateCurrentCenter(entityName);
            
        } catch (error) {
            console.error('❌ Failed to center on entity:', error);
            this.showError(`Failed to center on entity: ${entityName}`);
        }
    }

    getNetworkAroundEntity(centerEntity, maxDegree = 2) {
        if (!this.currentData) return { entities: [], relations: [] };
        
        const networkEntities = new Set();
        const networkRelations = [];
        
        // Add center entity
        networkEntities.add(centerEntity);
        
        // Helper function to get connected entities
        const getConnectedEntities = (entityName) => {
            const connected = new Set();
            
            this.currentData.relations.forEach(relation => {
                if (relation.from === entityName) {
                    connected.add(relation.to);
                    networkRelations.push(relation);
                } else if (relation.to === entityName) {
                    connected.add(relation.from);
                    networkRelations.push(relation);
                }
            });
            
            return connected;
        };
        
        // Get 1st degree connections
        const firstDegree = getConnectedEntities(centerEntity);
        firstDegree.forEach(entity => networkEntities.add(entity));
        
        // Get 2nd degree connections if requested
        if (maxDegree >= 2) {
            firstDegree.forEach(entity => {
                const secondDegree = getConnectedEntities(entity);
                secondDegree.forEach(entity2 => {
                    if (!networkEntities.has(entity2)) {
                        networkEntities.add(entity2);
                    }
                });
            });
        }
        
        // Filter entities and relations to include only network members
        const entities = this.currentData.entities.filter(entity => 
            networkEntities.has(entity.name)
        );
        
        const relations = networkRelations.filter(relation =>
            networkEntities.has(relation.from) && networkEntities.has(relation.to)
        );
        
        console.log(`🔍 Network around ${centerEntity}: ${entities.length} entities, ${relations.length} relations`);
        return { entities, relations };
    }

    handleNodeClick(node) {
        console.log(`👆 Node clicked: ${node.name}`);
        // Center graph on clicked node, but do not show info panel here (will show below)
        this.centerOnEntity(node.name, false);
        // Show entity details for the clicked node
        renderInfoPanel(node, this.getEntityTypeClass.bind(this), this.getEntityConnectionsWithClickHandler.bind(this));
    }

    handleNodeHover(node, event) {
        this.showTooltip(node, event);
    }

    handleNodeLeave() {
        this.hideTooltip();
    }

    handleSearch(query) {
        if (!this.graph) return;
        
        console.log(`🔍 Searching for: ${query}`);
        
        if (query.trim() === '') {
            this.graph.clearHighlight();
            return;
        }
        
        // Find matching entities
        const matches = this.currentData.entities.filter(entity =>
            entity.name.toLowerCase().includes(query.toLowerCase()) ||
            entity.entityType.toLowerCase().includes(query.toLowerCase()) ||
            entity.observations.some(obs => obs.toLowerCase().includes(query.toLowerCase()))
        );
        
        // Highlight matching nodes
        const matchNames = matches.map(entity => entity.name);
        this.graph.highlightNodes(matchNames);
        
        console.log(`🎯 Found ${matches.length} matches for "${query}"`);
    }

    resetView() {
        console.log('🏠 Resetting to default view');
        
        // Clear search
        document.getElementById('search').value = '';
        
        // Reset multi-select filter - check all boxes
        const checkboxes = document.querySelectorAll('#filter-dropdown input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        this.updateFilterDisplay();
        
        // Reset graph
        if (this.graph) {
            this.graph.clearHighlight();
            this.graph.clearFilter();
        }
        
        // Center on default entity
        // this.centerOnEntity('Georg Doll');
        // Center on first entity in the current data
        if (this.currentData && this.currentData.entities.length > 0) {
            this.currentCenter = this.currentData.entities[0].name;
            this.centerOnEntity(this.currentCenter);
        }
    }

    handleKeyboard(event) {
        // ESC to close panels
        if (event.key === 'Escape') {
            this.hideInfoPanel();
            this.hideTooltip();
        }
        
        // R to reset view
        if (event.key === 'r' || event.key === 'R') {
            if (!event.ctrlKey && !event.metaKey) {
                this.resetView();
            }
        }
        
        // F to focus search
        if (event.key === 'f' || event.key === 'F') {
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                document.getElementById('search').focus();
            }
        }
    }

    handleResize() {
        if (this.graph) {
            const width = this.getGraphContainerWidth();
            const height = this.getGraphContainerHeight();
            this.graph.resize(width, height);
        }
    }

    getEntityConnectionsWithClickHandler(entityName) {
        if (!this.currentData) return [];
        return this.currentData.relations
            .filter(rel => rel.from === entityName || rel.to === entityName)
            .map(rel => ({
                relationType: rel.relationType,
                target: rel.from === entityName ? rel.to : rel.from,
                direction: rel.from === entityName ? 'outgoing' : 'incoming',
                onClick: (target) => this.centerOnEntity(target)
            }));
    }

    getEntityTypeClass(entityType) {
        // Convert entity type to CSS class
        return entityType.toLowerCase().replace(/\s+/g, '-');
    }

    // hideInfoPanel removed: info panel is always visible

    showTooltip(node, event) {
        const tooltip = document.getElementById('tooltip');
        const title = document.getElementById('tooltip-title');
        const type = document.getElementById('tooltip-type');
        const description = document.getElementById('tooltip-description');

        // If third argument is true, treat as edge/relation
        if (arguments[2]) {
            // edge: { source, target, relationType }
            title.textContent = `${node.relationType}`;
            type.textContent = `Relation`;
            description.textContent = `From: ${node.source.id || node.source} → To: ${node.target.id || node.target}`;
        } else {
            title.textContent = node.name;
            type.textContent = node.entityType;
            description.textContent = node.observations[0] || 'No description available';
        }

        // Position tooltip
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY - 10}px`;

        tooltip.classList.remove('hidden');
    }

    hideTooltip() {
        document.getElementById('tooltip').classList.add('hidden');
    }

    updateStats() {
        if (!this.currentData) return;
        
        document.getElementById('entity-count').textContent = 
            `Entities: ${this.currentData.entities.length}`;
        document.getElementById('relation-count').textContent = 
            `Relations: ${this.currentData.relations.length}`;
    }

    updateCurrentCenter(centerEntity) {
        document.getElementById('current-center').textContent = 
            `Center: ${centerEntity}`;
    }

    getEntityTypeColor(entityType) {
        return this.entityTypeColorMap && this.entityTypeColorMap[entityType]
            ? this.entityTypeColorMap[entityType]
            : '#888'; // fallback color
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('error').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('loading').classList.add('hidden');
        const errorDiv = document.getElementById('error');
        const messageElement = errorDiv.querySelector('p');
        
        // Handle multiline messages by preserving line breaks
        messageElement.innerHTML = `❌ ${message.replace(/\n/g, '<br>')}`;
        errorDiv.classList.remove('hidden');
    }

    getGraphContainerWidth() {
        const container = document.getElementById('graph-container');
        return container.clientWidth;
    }

    getGraphContainerHeight() {
        const container = document.getElementById('graph-container');
        return container.clientHeight;
    }

    setupMultiSelectFilter() {
        const filterBtn = document.getElementById('filter-btn');
        const filterDropdown = document.getElementById('filter-dropdown');
        const clearFiltersBtn = document.getElementById('clear-filters');

        // Toggle dropdown visibility
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
                filterDropdown.classList.add('hidden');
            }
        });

        // Clear all filters
        clearFiltersBtn.addEventListener('click', () => {
            const checkboxes = filterDropdown.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            this.updateFilterDisplay();
            this.applyMultiSelectFilter();
        });

        // Prevent dropdown from closing when clicking inside
        filterDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Initialize filter display
        this.updateFilterDisplay();
    }

    updateFilterDisplay() {
        const filterCount = document.getElementById('filter-count');
        const checkboxes = document.querySelectorAll('#filter-dropdown input[type="checkbox"]:checked');
        const totalCheckboxes = document.querySelectorAll('#filter-dropdown input[type="checkbox"]');
        
        const checkedCount = checkboxes.length;
        const totalCount = totalCheckboxes.length;
        
        if (checkedCount === 0) {
            filterCount.textContent = '0';
            filterCount.style.background = '#ef4444'; // error color
        } else if (checkedCount === totalCount) {
            filterCount.textContent = '';
        } else {
            filterCount.textContent = checkedCount.toString();
            filterCount.style.background = '#2563eb'; // primary color
        }
    }

    applyMultiSelectFilter() {
        if (!this.graph) return;
        
        const checkboxes = document.querySelectorAll('#filter-dropdown input[type="checkbox"]:checked');
        const selectedTypes = Array.from(checkboxes).map(cb => cb.value);
        
        console.log(`🔽 Filtering by types: ${selectedTypes.join(', ') || 'None'}`);
        
        if (selectedTypes.length === 0) {
            // Hide all entities if no types selected
            this.graph.filterByEntityTypes([]);
        } else {
            // Show only selected entity types
            this.graph.filterByEntityTypes(selectedTypes);
        }
    }

    async refreshData() {
        console.log('🔄 Refreshing knowledge graph data...');
        
        try {
            // Reload data from MCP server
            await this.loadData();
            
            // If graph is initialized, update it
            if (this.graph && this.currentData) {
                // Re-center on the current entity to refresh the view
                await this.centerOnEntity(this.currentCenter);
                console.log('✅ Knowledge graph data refreshed successfully');
                
                // Show a brief success message
                this.showRefreshSuccess();
            }
        } catch (error) {
            console.error('❌ Failed to refresh data:', error);
            this.showError('Failed to refresh knowledge graph data');
        }
    }

    showRefreshSuccess() {
        // Create a temporary success message
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
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(successMsg);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (successMsg.parentNode) {
                successMsg.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    successMsg.remove();
                }, 300);
            }
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KnowledgeGraphApp();
});
