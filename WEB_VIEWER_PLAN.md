# Interactive Knowledge Graph Web Viewer - Requirements & Implementation Plan

## 🎯 Project Overview

Create an interactive web-based visualization of the professional network knowledge graph with dynamic exploration capabilities, using MCP Memory Server as the data source.

## 📋 Requirements List

### Core Functionality
1. **Root Entity Display**
   - Start with "you" (Georg Doll) as the central node
   - Show all direct connections (1st degree)
   - Show 2nd degree connections from direct contacts
   - Dynamic node positioning around the selected center

2. **Interactive Navigation**
   - Click any entity to re-center the graph on that entity
   - Smooth animations when switching center nodes
   - Zoom and pan capabilities
   - Node hover effects with entity details

3. **Visual Design**
   - Different colors/shapes for entity types (Microsoft Team, Customers, Projects, Events)
   - Node size based on connection count or importance
   - Edge labels showing relationship types
   - Clear visual hierarchy (center > 1st degree > 2nd degree)

4. **Information Display**
   - Entity details panel on hover/click
   - Show observations/notes for entities
   - Relationship information on edge hover
   - Search box to quickly find entities

### Advanced Features
5. **Filtering & Search**
   - Filter by entity type (Team Members, Customers, Projects, etc.)
   - Filter by relationship type (reports to, collaborates on, etc.)
   - Text search across entity names and observations
   - Date range filters (if timestamps available)

6. **Layout Options**
   - Force-directed layout (default)
   - Hierarchical layout (org chart style)
   - Circular layout
   - Custom positioning save/load

7. **Data Integration**
   - Real-time sync with MCP Memory Server
   - Export current view as image/PDF
   - Share specific graph views via URL
   - Bookmark frequently accessed entity views

## 🔧 Technology Stack Options

### Frontend Frameworks
**Option A: D3.js + Vanilla JS/HTML**
- ✅ Maximum flexibility and control
- ✅ Excellent graph visualization capabilities
- ✅ Lightweight, no framework dependencies
- ❌ More development time required
- ❌ Need to build UI components from scratch

**Option B: React + D3.js**
- ✅ Component-based architecture
- ✅ Easy to add complex UI features
- ✅ Good ecosystem for additional features
- ❌ Heavier bundle size
- ❌ More complex setup

**Option C: Vue.js + D3.js**
- ✅ Simpler than React
- ✅ Good integration with D3
- ✅ Progressive enhancement possible
- ❌ Less mature ecosystem than React

### Graph Visualization Libraries
**Option A: D3.js Force Simulation**
- ✅ Highly customizable
- ✅ Excellent performance
- ✅ Built-in force algorithms
- ✅ Industry standard

**Option B: Cytoscape.js**
- ✅ Graph-specific library
- ✅ Good performance with large datasets
- ✅ Built-in layouts and interactions
- ✅ Easier to implement than D3

**Option C: vis-network**
- ✅ Simple API
- ✅ Good built-in interactions
- ✅ Physics simulation
- ❌ Less customizable than D3

**Option D: Sigma.js**
- ✅ High performance
- ✅ WebGL rendering
- ✅ Good for large graphs
- ❌ Less flexible than D3

### Backend Integration
**Option A: Direct MCP Integration**
- ✅ Use existing MCP Memory Server functions
- ✅ Real-time data access
- ✅ No additional backend needed

**Option B: REST API Wrapper**
- ✅ Standard web API approach
- ✅ Cacheable responses
- ❌ Additional complexity
- ❌ Not real-time

## 🏗️ Implementation Plan

### Phase 1: Core Foundation (1-2 weeks)
1. **Setup & Architecture**
   - Choose technology stack (recommendation below)
   - Set up development environment
   - Create basic HTML/CSS structure
   - Implement MCP data fetching

2. **Basic Graph Display**
   - Render nodes and edges from MCP data
   - Implement basic force-directed layout
   - Add entity type styling (colors/shapes)
   - Show relationship labels

### Phase 2: Interactive Features (1-2 weeks)
3. **Navigation & Interaction**
   - Click to re-center functionality
   - Zoom and pan controls
   - Hover effects and tooltips
   - Smooth animations between views

4. **Information Display**
   - Entity details panel
   - Relationship information display
   - Basic search functionality

### Phase 3: Advanced Features (2-3 weeks)
5. **Filtering & Enhancement**
   - Entity type filters
   - Relationship type filters
   - Advanced search across observations
   - Layout options

6. **Polish & Optimization**
   - Performance optimization
   - Responsive design
   - Export functionality
   - URL-based view sharing

## 🎯 Recommended Technology Stack

**Primary Recommendation: D3.js + Vanilla JS**
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: D3.js v7 with Force Simulation
- **Data**: MCP Memory Server integration
- **Styling**: CSS Grid/Flexbox for layout, CSS transitions for animations
- **Build**: Simple bundler (Vite or Webpack) for development

**Alternative: Cytoscape.js + Vanilla JS**
- Faster to implement, less customizable

## 📁 Proposed Directory Structure

```
scripts/
└── knowledge_graph/
    ├── web_viewer/
    │   ├── index.html           # Main HTML file
    │   ├── css/
    │   │   ├── styles.css       # Main styles
    │   │   └── graph.css        # Graph-specific styles
    │   ├── js/
    │   │   ├── main.js          # Application entry point
    │   │   ├── graph.js         # Graph visualization logic
    │   │   ├── mcp-client.js    # MCP integration
    │   │   └── utils.js         # Utility functions
    │   ├── assets/
    │   │   └── icons/           # Entity type icons
    │   └── README.md            # Web viewer documentation
    ├── mcp_helpers.py           # Existing helper functions
    └── ...existing files...
```

## 🚀 Quick Start Implementation

### Minimal Viable Product (MVP) Features:
1. Load data from MCP Memory Server
2. Display graph with "Georg Doll" as center
3. Show 1st and 2nd degree connections
4. Click to re-center on any entity
5. Basic entity type styling
6. Hover tooltips with entity information

### Development Steps:
1. Create basic HTML structure
2. Integrate MCP data fetching (using existing mcp_helpers.py as reference)
3. Implement D3.js force simulation
4. Add click interactions
5. Style different entity types
6. Add hover information display

## 🔄 Data Flow

```
MCP Memory Server → JavaScript Client → D3.js Visualization → User Interaction → Re-query MCP
```

## 💡 Additional Considerations

### Performance
- Limit initial view to 2 degrees to prevent overwhelming display
- Implement lazy loading for large networks
- Use requestAnimationFrame for smooth animations

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode option

### Mobile Support
- Touch-friendly interactions
- Responsive layout
- Simplified mobile view

Would you like me to start implementing the MVP version, or would you prefer to discuss and refine any part of this plan first?
