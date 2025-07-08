#!/usr/bin/env python3
"""
MCP Knowledge Graph Helper Functions
This demonstrates how to use MCP memory functions for knowledge graph operations
"""

import json
from typing import Dict, List, Any, Optional

def format_mcp_search_results(results: Dict[str, Any], query: str) -> str:
    """Format MCP search results for display"""
    output = []
    output.append(f"🔍 Search Results for '{query}':")
    
    entities = results.get('entities', [])
    relations = results.get('relations', [])
    
    if entities:
        output.append(f"\n📋 Entities ({len(entities)}):")
        for entity in entities:
            output.append(f"  • {entity['name']} ({entity['entityType']})")
    
    if relations:
        output.append(f"\n🔗 Relations ({len(relations)}):")
        for rel in relations:
            output.append(f"  • {rel['from']} --{rel['relationType']}--> {rel['to']}")
    
    if not entities and not relations:
        output.append("  No results found.")
    
    return '\n'.join(output)

def get_entity_connections(graph_data: Dict[str, Any], entity_name: str) -> Dict[str, List[Dict[str, str]]]:
    """Extract connections for a specific entity from full graph data"""
    connections = {
        'outgoing': [],
        'incoming': []
    }
    
    relations = graph_data.get('relations', [])
    
    for rel in relations:
        if rel['from'] == entity_name:
            connections['outgoing'].append({
                'to': rel['to'],
                'type': rel['relationType']
            })
        elif rel['to'] == entity_name:
            connections['incoming'].append({
                'from': rel['from'],
                'type': rel['relationType']
            })
    
    return connections

def format_entity_connections(connections: Dict[str, List[Dict[str, str]]], entity_name: str) -> str:
    """Format entity connections for display"""
    output = []
    output.append(f"🔗 Connections for '{entity_name}':")
    
    if connections['outgoing']:
        output.append("  Outgoing:")
        for conn in connections['outgoing']:
            output.append(f"    → {conn['to']} ({conn['type']})")
    
    if connections['incoming']:
        output.append("  Incoming:")
        for conn in connections['incoming']:
            output.append(f"    ← {conn['from']} ({conn['type']})")
    
    if not connections['outgoing'] and not connections['incoming']:
        output.append("  No connections found.")
    
    return '\n'.join(output)

def generate_mermaid_diagram(graph_data: Dict[str, Any], focus_entity: Optional[str] = None) -> str:
    """Generate Mermaid diagram from graph data"""
    entities = {e['name']: e for e in graph_data.get('entities', [])}
    relations = graph_data.get('relations', [])
    
    if focus_entity:
        # Filter to focus entity and its connections
        relevant_nodes = {focus_entity}
        relevant_relations = []
        
        for rel in relations:
            if rel['from'] == focus_entity or rel['to'] == focus_entity:
                relevant_nodes.add(rel['from'])
                relevant_nodes.add(rel['to'])
                relevant_relations.append(rel)
    else:
        relevant_nodes = set(entities.keys())
        relevant_relations = relations
    
    # Generate Mermaid syntax
    mermaid = ["graph TD"]
    
    # Entity type to emoji mapping
    emoji_map = {
        'Microsoft Team Member': '👤',
        'Professional Contact': '🤝',
        'Customer': '🏭',
        'Industry Event': '🏢',
        'Microsoft Project': '📋',
        'Partnership Project': '🤝',
        'Customer Project': '💼',
        'External Partner': '🔗'
    }
    
    # Add nodes
    for node in relevant_nodes:
        if node in entities:
            entity_type = entities[node]['entityType']
            emoji = emoji_map.get(entity_type, '📄')
            clean_name = node.replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
            mermaid.append(f'    {clean_name}["{emoji} {node}"]')
    
    # Add edges
    for rel in relevant_relations:
        from_clean = rel['from'].replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
        to_clean = rel['to'].replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
        mermaid.append(f'    {from_clean} -->|{rel["relationType"]}| {to_clean}')
    
    return '\n'.join(mermaid)

def print_graph_stats(graph_data: Dict[str, Any]) -> str:
    """Print statistics about the knowledge graph"""
    entities = graph_data.get('entities', [])
    relations = graph_data.get('relations', [])
    
    output = []
    output.append("📊 Knowledge Graph Statistics:")
    output.append(f"   Entities: {len(entities)}")
    output.append(f"   Relations: {len(relations)}")
    
    # Entity type breakdown
    entity_types = {}
    for entity in entities:
        entity_type = entity['entityType']
        entity_types[entity_type] = entity_types.get(entity_type, 0) + 1
    
    output.append("\n📋 Entity Types:")
    for entity_type, count in sorted(entity_types.items()):
        output.append(f"   {entity_type}: {count}")
    
    return '\n'.join(output)

# Example usage functions that demonstrate MCP calls
def demo_search_example():
    """Demo search functionality"""
    print("=== MCP Search Example ===")
    print("To search for 'AEK' entities:")
    print("mcp_memory_search_nodes('AEK')")
    print()

def demo_connections_example():
    """Demo connections functionality"""
    print("=== MCP Connections Example ===")
    print("To get connections for 'Robert Lockner':")
    print("1. graph_data = mcp_memory_read_graph()")
    print("2. connections = get_entity_connections(graph_data, 'Robert Lockner')")
    print("3. print(format_entity_connections(connections, 'Robert Lockner'))")
    print()

def demo_mermaid_example():
    """Demo Mermaid diagram generation"""
    print("=== MCP Mermaid Example ===")
    print("To generate a Mermaid diagram:")
    print("1. graph_data = mcp_memory_read_graph()")
    print("2. mermaid = generate_mermaid_diagram(graph_data, 'Robert Lockner')")
    print("3. print(f'```mermaid\\n{mermaid}\\n```')")
    print()

if __name__ == "__main__":
    print("🔍 MCP Knowledge Graph Helper Functions")
    print("This module provides helper functions for working with MCP memory data.")
    print()
    
    demo_search_example()
    demo_connections_example()
    demo_mermaid_example()
    
    print("💡 Use these functions with MCP memory server calls:")
    print("   mcp_memory_search_nodes(query)")
    print("   mcp_memory_read_graph()")
    print("   mcp_memory_open_nodes([entity_names])")
