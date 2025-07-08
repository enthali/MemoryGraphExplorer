# Knowledge Graph Interactive Web Viewer

An interactive web-based visualization of your professional network knowledge graph, built with D3.js and integrated with MCP Memory Server.

## 🚀 Quick Start

### Option 1: Using Vite (Recommended for Development)
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Option 2: Simple HTTP Server
```bash
# Using Python (if Node.js not available)
npm run serve
```

### Option 3: Open directly in browser
Simply open `index.html` in a modern web browser that supports ES6 modules.

## 🎯 Features

### Core Functionality
- **Interactive Graph**: Force-directed layout with your professional network
- **Dynamic Re-centering**: Click any entity to make it the new center
- **2-Degree Network**: Shows direct connections and their connections
- **Entity Types**: Color-coded nodes for different entity types
- **Hover Information**: Detailed tooltips and entity information panel

### Controls
- **Search**: Find entities by name, type, or observations
- **Filter**: Show only specific entity types
- **Reset**: Return to default view centered on you
- **Zoom/Pan**: Navigate large networks easily

### Keyboard Shortcuts
- `ESC` - Close panels and tooltips
- `R` - Reset to default view
- `Ctrl+F` / `Cmd+F` - Focus search box

## 🎨 Entity Types & Colors

| Type | Color | Icon | Description |
|------|-------|------|-------------|
| Microsoft Team Member | Blue | 👤 | Internal Microsoft colleagues |
| Professional Contact | Green | 🤝 | External professional contacts |
| Customer | Orange | 🏭 | Customer companies |
| Microsoft Project | Purple | 📋 | Internal Microsoft projects |
| Industry Event | Red | 🏢 | Conferences and events |
| Partnership Project | Cyan | 🤝 | Collaborative projects |

## 🔧 Technical Details

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Visualization**: D3.js v7 Force Simulation
- **Data Source**: MCP Memory Server integration
- **Build Tool**: Vite (optional)

### Architecture
- `main.js` - Application entry point and event handling
- `graph.js` - D3.js visualization logic and interactions
- `mcp-data.js` - MCP Memory Server data integration
- `styles.css` - Responsive styling and theming
- `index.html` - Main HTML structure

### Data Flow
```
MCP Memory Server → MCPDataProvider → KnowledgeGraph → D3.js Visualization
```

## 🎯 Default View

The application starts with **Georg Doll** (you) as the center entity, showing:
- Your direct professional connections (1st degree)
- Their connections (2nd degree)
- All relationships between these entities

## 🔍 Interactive Features

### Node Interactions
- **Click**: Re-center graph on clicked entity
- **Hover**: Show tooltip with entity details
- **Drag**: Reposition nodes manually

### Information Panel
- Shows detailed entity information
- Lists all observations/notes
- Displays connections with relationship types
- Click connections to navigate to related entities

### Search & Filtering
- Real-time search across entity names and content
- Filter by entity type to focus on specific relationships
- Highlight matching entities visually

## 📱 Mobile Support

The interface is responsive and works on:
- Desktop computers
- Tablets (touch-friendly interactions)
- Mobile phones (simplified layout)

## 🔧 Customization

### Adding New Entity Types
1. Update the color mapping in `graph.js` `getNodeColor()`
2. Add icon mapping in `graph.js` `getNodeIcon()`
3. Update CSS classes in `styles.css`
4. Add filter option in `index.html`

### Styling Changes
- Modify CSS custom properties in `:root` for color scheme
- Adjust force simulation parameters in `graph.js`
- Update node sizes and layouts as needed

## 🚀 Future Enhancements

- Real-time MCP Memory Server integration
- Export graph as image/PDF
- Save and share custom views
- Advanced filtering and search
- Timeline view for relationship history
- Network analysis metrics

## 📊 Performance

- Optimized for networks up to 100+ entities
- Lazy loading for large datasets
- Smooth animations with requestAnimationFrame
- Responsive design for various screen sizes
