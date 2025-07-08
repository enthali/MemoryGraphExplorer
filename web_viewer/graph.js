/**
 * Knowledge Graph Visualization using D3.js Force Simulation
 * Handles the interactive graph rendering and interactions
 */

export class KnowledgeGraph {
    constructor(containerSelector, options = {}) {
        this.container = d3.select(containerSelector);
        this.options = {
            width: options.width || 800,
            height: options.height || 600,
            onNodeClick: options.onNodeClick || (() => {}),
            onNodeHover: options.onNodeHover || (() => {}),
            onNodeLeave: options.onNodeLeave || (() => {}),
            entityTypeColorMap: options.entityTypeColorMap || {},
            ...options
        };

        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.centerEntity = null;

        this.initializeSVG();
        this.setupForceSimulation();
    }

    initializeSVG() {
        // Clear any existing content
        this.container.selectAll('*').remove();
        
        // Create SVG
        this.svg = this.container
            .append('svg')
            .attr('width', this.options.width)
            .attr('height', this.options.height)
            .attr('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
        
        // Add definitions for arrow markers
        const defs = this.svg.append('defs');
        
        // Create arrow marker for directed edges
        defs.append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#64748b');
        
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });
        
        this.svg.call(zoom);
        
        // Create main group for graph elements
        this.g = this.svg.append('g');
        
        // Create groups for different elements (order matters for layering)
        this.linkGroup = this.g.append('g').attr('class', 'links');
        this.nodeGroup = this.g.append('g').attr('class', 'nodes');
        this.labelGroup = this.g.append('g').attr('class', 'labels');
    }

    setupForceSimulation() {
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(80))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.options.width / 2, this.options.height / 2))
            .force('collision', d3.forceCollide().radius(30))
            .on('tick', () => this.tick());
    }

    updateData(data, centerEntity = null, entityTypeColorMap = null) {
        console.log('📊 Updating graph with new data:', data);
        
        this.centerEntity = centerEntity;
        if (entityTypeColorMap) {
            this.options.entityTypeColorMap = entityTypeColorMap;
        }
        
        // Process nodes
        this.nodes = data.entities.map(entity => ({
            id: entity.name,
            name: entity.name,
            entityType: entity.entityType,
            observations: entity.observations,
            isCenter: entity.name === centerEntity,
            degree: this.calculateDegree(entity.name, data.relations)
        }));
        
        // Process links
        this.links = data.relations.map(relation => ({
            source: relation.from,
            target: relation.to,
            relationType: relation.relationType,
            id: `${relation.from}-${relation.to}`
        }));
        
        // Update simulation
        this.simulation
            .nodes(this.nodes)
            .force('link')
            .links(this.links);
        
        this.render();
        this.simulation.alpha(1).restart();
    }

    calculateDegree(entityName, relations) {
        return relations.filter(rel => 
            rel.from === entityName || rel.to === entityName
        ).length;
    }

    render() {
        // Render links
        this.renderLinks();
        
        // Render nodes
        this.renderNodes();
        
        // Render labels
        this.renderLabels();
    }

    renderLinks() {
        const link = this.linkGroup
            .selectAll('.link')
            .data(this.links, d => d.id);
        
        // Remove old links
        link.exit().remove();
        
        // Add new links
        const linkEnter = link.enter()
            .append('g')
            .attr('class', 'link');
        
        // Add link line
        linkEnter.append('line')
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.6)
            .attr('marker-end', 'url(#arrow)');
        
        // Add link label
        linkEnter.append('text')
            .attr('class', 'link-label')
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', '#64748b')
            .attr('dy', -5)
            .text(d => d.relationType);
        
        // Update all links
        this.linkElements = linkEnter.merge(link);
    }

    renderNodes() {
        const node = this.nodeGroup
            .selectAll('.node')
            .data(this.nodes, d => d.id);
        
        // Remove old nodes
        node.exit().remove();
        
        // Add new nodes
        const nodeEnter = node.enter()
            .append('g')
            .attr('class', 'node')
            .call(this.createDragBehavior());
        
        // Add node circle
        nodeEnter.append('circle')
            .attr('r', d => this.getNodeRadius(d))
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', d => d.isCenter ? '#1e293b' : '#ffffff')
            .attr('stroke-width', d => d.isCenter ? 4 : 2)
            .attr('stroke-opacity', 0.8);
        
        // Node icons removed for dynamic entity types
        
        // Add hover effects
        nodeEnter
            .on('mouseover', (event, d) => {
                this.highlightConnectedElements(d);
                this.options.onNodeHover(d, event);
            })
            .on('mouseout', (event, d) => {
                this.clearHighlight();
                this.options.onNodeLeave(d, event);
            })
            .on('click', (event, d) => {
                this.options.onNodeClick(d);
            });
        
        // Update all nodes
        this.nodeElements = nodeEnter.merge(node);
        
        // Update node appearance
        this.nodeElements.select('circle')
            .attr('r', d => this.getNodeRadius(d))
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', d => d.isCenter ? '#1e293b' : '#ffffff')
            .attr('stroke-width', d => d.isCenter ? 4 : 2);
    }

    renderLabels() {
        const label = this.labelGroup
            .selectAll('.label')
            .data(this.nodes, d => d.id);
        
        // Remove old labels
        label.exit().remove();
        
        // Add new labels
        const labelEnter = label.enter()
            .append('text')
            .attr('class', 'label')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('font-size', '12px')
            .attr('font-weight', d => d.isCenter ? 'bold' : 'normal')
            .attr('fill', '#1e293b')
            .attr('pointer-events', 'none');
        
        // Update all labels
        this.labelElements = labelEnter.merge(label);
        this.labelElements.text(d => this.getLabelText(d));
    }

    tick() {
        // Update link positions
        if (this.linkElements) {
            this.linkElements.select('line')
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            this.linkElements.select('text')
                .attr('x', d => (d.source.x + d.target.x) / 2)
                .attr('y', d => (d.source.y + d.target.y) / 2);
        }
        
        // Update node positions
        if (this.nodeElements) {
            this.nodeElements
                .attr('transform', d => `translate(${d.x},${d.y})`);
        }
        
        // Update label positions
        if (this.labelElements) {
            this.labelElements
                .attr('x', d => d.x)
                .attr('y', d => d.y + this.getNodeRadius(d) + 15);
        }
    }

    createDragBehavior() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    getNodeRadius(node) {
        if (node.isCenter) return 25;
        
        // Base radius on degree (number of connections)
        const baseRadius = 15;
        const maxRadius = 20;
        const radiusIncrease = Math.min(node.degree * 1.5, maxRadius - baseRadius);
        
        return baseRadius + radiusIncrease;
    }

    getNodeColor(node) {
        const colorMap = this.options.entityTypeColorMap || {};
        return colorMap[node.entityType] || '#64748b';
    }

    // getNodeIcon removed: icons are no longer used for dynamic entity types

    getLabelText(node) {
        // Truncate long names
        const maxLength = 20;
        if (node.name.length > maxLength) {
            return node.name.substring(0, maxLength) + '...';
        }
        return node.name;
    }

    highlightConnectedElements(node) {
        // Dim all elements
        this.nodeElements.style('opacity', 0.2);
        this.linkElements.style('opacity', 0.1);
        this.labelElements.style('opacity', 0.2);
        
        // Highlight the hovered node
        this.nodeElements
            .filter(d => d.id === node.id)
            .style('opacity', 1);
        
        // Highlight connected nodes and links
        this.linkElements
            .filter(d => d.source.id === node.id || d.target.id === node.id)
            .style('opacity', 1)
            .each(function(d) {
                // Highlight connected nodes
                const connectedNodeId = d.source.id === node.id ? d.target.id : d.source.id;
                d3.selectAll('.node')
                    .filter(n => n.id === connectedNodeId)
                    .style('opacity', 1);
                
                // Highlight connected labels
                d3.selectAll('.label')
                    .filter(n => n.id === connectedNodeId || n.id === node.id)
                    .style('opacity', 1);
            });
    }

    clearHighlight() {
        if (this.nodeElements) this.nodeElements.style('opacity', 1);
        if (this.linkElements) this.linkElements.style('opacity', 1);
        if (this.labelElements) this.labelElements.style('opacity', 1);
    }

    highlightNodes(nodeIds) {
        this.clearHighlight();
        
        if (nodeIds.length === 0) return;
        
        // Dim all elements
        this.nodeElements.style('opacity', 0.2);
        this.labelElements.style('opacity', 0.2);
        
        // Highlight matching nodes
        this.nodeElements
            .filter(d => nodeIds.includes(d.id))
            .style('opacity', 1);
        
        this.labelElements
            .filter(d => nodeIds.includes(d.id))
            .style('opacity', 1);
    }

    filterByEntityTypes(entityTypes) {
        if (!entityTypes || entityTypes.length === 0) {
            // Hide all nodes if no types selected
            this.nodeElements.style('display', 'none');
            this.labelElements.style('display', 'none');
            this.linkElements.style('display', 'none');
            return;
        }
        
        // Show/hide nodes based on selected entity types
        this.nodeElements
            .style('display', d => entityTypes.includes(d.entityType) ? 'block' : 'none');
        
        this.labelElements
            .style('display', d => entityTypes.includes(d.entityType) ? 'block' : 'none');
        
        // Show/hide links that connect visible nodes
        this.linkElements
            .style('display', d => 
                entityTypes.includes(d.source.entityType) && entityTypes.includes(d.target.entityType) 
                    ? 'block' : 'none'
            );
    }

    // Keep the old method for backward compatibility
    filterByEntityType(entityType) {
        if (!entityType) {
            this.clearFilter();
            return;
        }
        this.filterByEntityTypes([entityType]);
    }

    clearFilter() {
        if (this.nodeElements) this.nodeElements.style('display', 'block');
        if (this.linkElements) this.linkElements.style('display', 'block');
        if (this.labelElements) this.labelElements.style('display', 'block');
    }

    resize(width, height) {
        this.options.width = width;
        this.options.height = height;
        
        this.svg
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);
        
        this.simulation
            .force('center', d3.forceCenter(width / 2, height / 2))
            .alpha(0.3)
            .restart();
    }
}
