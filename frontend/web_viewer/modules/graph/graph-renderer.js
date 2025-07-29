/**
 * Graph Renderer - D3.js-based graph visualization
 * Handles pure rendering logic without state management
 */

// D3.js is loaded globally via CDN, so we use the global d3 object
// No import needed - d3 is available as a global variable

export class GraphRenderer {
  constructor(containerSelector, options = {}) {
    this.container = d3.select(containerSelector);
    this.options = {
      width: options.width || 800,
      height: options.height || 600,
      onNodeClick: options.onNodeClick || (() => {}),
      onNodeHover: options.onNodeHover || (() => {}),
      onNodeLeave: options.onNodeLeave || (() => {}),
      onEdgeHover: options.onEdgeHover || (() => {}),
      onEdgeLeave: options.onEdgeLeave || (() => {}),
      entityTypeColorMap: options.entityTypeColorMap || {},
      ...options
    };

    this.svg = null;
    this.simulation = null;
    this.nodes = [];
    this.links = [];
    this.centerEntity = null;

    // DOM element groups
    this.g = null;
    this.linkGroup = null;
    this.nodeGroup = null;
    this.labelGroup = null;

    // Element selections
    this.nodeElements = null;
    this.linkElements = null;
    this.labelElements = null;

    this.initializeSVG();
    this.setupForceSimulation();
    
    console.log('🎨 Graph Renderer initialized');
  }

  /**
   * Initialize SVG container and setup
   */
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
        
        // Emit zoom change event
        if (this.options.onZoomChange) {
          this.options.onZoomChange({
            zoom: event.transform.k,
            pan: { x: event.transform.x, y: event.transform.y }
          });
        }
      });
    
    this.svg.call(zoom);
    this.zoomBehavior = zoom;
    
    // Create main group for graph elements
    this.g = this.svg.append('g');
    
    // Create groups for different elements (order matters for layering)
    this.linkGroup = this.g.append('g').attr('class', 'links');
    this.nodeGroup = this.g.append('g').attr('class', 'nodes');
    this.labelGroup = this.g.append('g').attr('class', 'labels');
  }

  /**
   * Setup D3 force simulation
   */
  setupForceSimulation() {
    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(this.options.width / 2, this.options.height / 2))
      .force('collision', d3.forceCollide().radius(30))
      .on('tick', () => this.tick());
  }

  /**
   * Update graph with new data
   * @param {Object} data - Graph data with entities and relations
   * @param {string} centerEntity - Name of the center entity
   */
  updateGraph(data, centerEntity = null) {
    console.log('🎨 Updating graph visualization:', data);
    
    this.centerEntity = centerEntity;
    
    // Process nodes
    this.nodes = data.entities.map(entity => ({
      id: entity.name,
      name: entity.name,
      entityType: entity.entityType,
      observations: entity.observations || [],
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

  /**
   * Calculate node degree (number of connections)
   */
  calculateDegree(entityName, relations) {
    return relations.filter(rel => 
      rel.from === entityName || rel.to === entityName
    ).length;
  }

  /**
   * Render all graph elements
   */
  render() {
    this.renderLinks();
    this.renderNodes();
    this.renderLabels();
  }

  /**
   * Render graph links/edges
   */
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
      .attr('marker-end', 'url(#arrow)')
      .on('mouseover', (event, d) => {
        this.options.onEdgeHover(d, event);
      })
      .on('mouseout', (event, d) => {
        this.options.onEdgeLeave(d, event);
      });
    
    // Update all links
    this.linkElements = linkEnter.merge(link);
  }

  /**
   * Render graph nodes
   */
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
    
    // Add hover and click effects
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

  /**
   * Render node labels
   */
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

  /**
   * Animation tick function
   */
  tick() {
    // Update link positions
    if (this.linkElements) {
      this.linkElements.select('line')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
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

  /**
   * Create drag behavior for nodes
   */
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

  /**
   * Get node radius based on type and degree
   */
  getNodeRadius(node) {
    if (node.isCenter) return 25;
    
    // Base radius on degree (number of connections)
    const baseRadius = 15;
    const maxRadius = 20;
    const radiusIncrease = Math.min(node.degree * 1.5, maxRadius - baseRadius);
    
    return baseRadius + radiusIncrease;
  }

  /**
   * Get node color based on entity type
   */
  getNodeColor(node) {
    const colorMap = this.options.entityTypeColorMap || {};
    return colorMap[node.entityType] || '#64748b';
  }

  /**
   * Get truncated label text for node
   */
  getLabelText(node) {
    const maxLength = 20;
    if (node.name.length > maxLength) {
      return node.name.substring(0, maxLength) + '...';
    }
    return node.name;
  }

  /**
   * Highlight connected elements on hover
   */
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
      .each((d) => {
        // Highlight connected nodes
        const connectedNodeId = d.source.id === node.id ? d.target.id : d.source.id;
        this.nodeElements
          .filter(n => n.id === connectedNodeId)
          .style('opacity', 1);
        
        // Highlight connected labels
        this.labelElements
          .filter(n => n.id === connectedNodeId || n.id === node.id)
          .style('opacity', 1);
      });
  }

  /**
   * Clear all highlighting
   */
  clearHighlight() {
    if (this.nodeElements) this.nodeElements.style('opacity', 1);
    if (this.linkElements) this.linkElements.style('opacity', 1);
    if (this.labelElements) this.labelElements.style('opacity', 1);
  }

  /**
   * Highlight specific nodes (for search results)
   */
  highlightNodes(nodeIds) {
    this.clearHighlight();
    
    if (!nodeIds || nodeIds.length === 0) return;
    
    // Dim all elements
    this.nodeElements.style('opacity', 0.2);
    this.labelElements.style('opacity', 0.2);
    this.linkElements.style('opacity', 0.1);
    
    // Highlight matching nodes
    this.nodeElements
      .filter(d => nodeIds.includes(d.id))
      .style('opacity', 1);
    
    this.labelElements
      .filter(d => nodeIds.includes(d.id))
      .style('opacity', 1);
  }

  /**
   * Select a specific node (add selection styling)
   */
  selectNode(nodeId) {
    // Remove previous selection styling
    this.nodeElements.select('circle')
      .attr('stroke', d => d.isCenter ? '#1e293b' : '#ffffff')
      .attr('stroke-width', d => d.isCenter ? 4 : 2);
    
    // Add selection styling to the selected node
    if (nodeId) {
      this.nodeElements
        .filter(d => d.id === nodeId)
        .select('circle')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 3);
    }
  }

  /**
   * Reset zoom to default
   */
  resetZoom() {
    this.svg.transition()
      .duration(750)
      .call(
        this.zoomBehavior.transform,
        d3.zoomIdentity
      );
  }

  /**
   * Resize the graph
   */
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

  /**
   * Update color map for entity types
   */
  updateColorMap(colorMap) {
    this.options.entityTypeColorMap = colorMap;
    
    // Update existing node colors
    if (this.nodeElements) {
      this.nodeElements.select('circle')
        .attr('fill', d => this.getNodeColor(d));
    }
  }

  /**
   * Get current graph statistics
   */
  getStats() {
    return {
      nodes: this.nodes.length,
      links: this.links.length,
      centerEntity: this.centerEntity,
      width: this.options.width,
      height: this.options.height
    };
  }
}

// Export the class
export default GraphRenderer;