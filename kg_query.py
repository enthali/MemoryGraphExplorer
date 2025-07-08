#!/usr/bin/env python3
"""
Interactive Knowledge Graph Query Tool using MCP Memory Server
Usage: python kg_query.py "search term" or python kg_query.py --interactive
"""

import json
import sys
import argparse
from collections import defaultdict

class KGQuery:
    def __init__(self):
        """Initialize KG Query tool - data is loaded via MCP calls"""
        self.entities = {}
        self.relations = []
        self.load_from_mcp()
    
    def load_from_mcp(self):
        """Load data using MCP memory server"""
        # We'll call MCP functions directly since they're available
        # This is much cleaner than parsing JSON Lines manually
        pass
    
    def search(self, query):
        """Search entities and relations"""
        results = {
            'entities': [],
            'relations': [],
            'observations': []
        }
        
        query_lower = query.lower()
        
        # Search entities
        for name, entity in self.entities.items():
            if query_lower in name.lower():
                results['entities'].append(entity)
            
            # Search observations
            for obs in entity.get('observations', []):
                if query_lower in obs.lower():
                    results['observations'].append({
                        'entity': name,
                        'observation': obs
                    })
        
        # Search relations
        for rel in self.relations:
            if (query_lower in rel['from'].lower() or 
                query_lower in rel['to'].lower() or
                query_lower in rel['relationType'].lower()):
                results['relations'].append(rel)
        
        return results
    
    def get_connections(self, entity_name):
        """Get all connections for an entity"""
        connections = {
            'outgoing': [],
            'incoming': []
        }
        
        for rel in self.relations:
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
    
    def generate_mermaid(self, focus_entity=None, max_depth=2):
        """Generate Mermaid diagram focusing on specific entity or showing all"""
        if focus_entity:
            # Focus on specific entity and its connections
            nodes = set([focus_entity])
            edges = []
            
            for rel in self.relations:
                if rel['from'] == focus_entity or rel['to'] == focus_entity:
                    nodes.add(rel['from'])
                    nodes.add(rel['to'])
                    edges.append(rel)
        else:
            # Show all
            nodes = set(self.entities.keys())
            edges = self.relations
        
        # Generate Mermaid syntax
        mermaid = ["graph TD"]
        
        # Add node definitions with emojis based on entity type
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
        
        for node in nodes:
            if node in self.entities:
                entity_type = self.entities[node]['entityType']
                emoji = emoji_map.get(entity_type, '📄')
                clean_name = node.replace(' ', '_').replace('(', '').replace(')', '')
                mermaid.append(f'    {clean_name}["{emoji} {node}"]')
        
        # Add edges
        for edge in edges:
            from_clean = edge['from'].replace(' ', '_').replace('(', '').replace(')', '')
            to_clean = edge['to'].replace(' ', '_').replace('(', '').replace(')', '')
            mermaid.append(f'    {from_clean} -->|{edge["relationType"]}| {to_clean}')
        
        return '\n'.join(mermaid)
    
    def interactive_mode(self):
        """Interactive query mode"""
        print("🔍 Knowledge Graph Interactive Query")
        print("Commands: search <term>, connections <entity>, mermaid <entity>, quit")
        
        while True:
            try:
                cmd = input("\n> ").strip()
                if cmd.lower() in ['quit', 'exit']:
                    break
                
                parts = cmd.split(' ', 1)
                command = parts[0].lower()
                
                if command == 'search' and len(parts) > 1:
                    results = self.search(parts[1])
                    self.print_search_results(results)
                
                elif command == 'connections' and len(parts) > 1:
                    connections = self.get_connections(parts[1])
                    self.print_connections(parts[1], connections)
                
                elif command == 'mermaid':
                    entity = parts[1] if len(parts) > 1 else None
                    mermaid = self.generate_mermaid(entity)
                    print(f"\n```mermaid\n{mermaid}\n```")
                
                elif command == 'list':
                    print("\nAll entities:")
                    for name in sorted(self.entities.keys()):
                        entity_type = self.entities[name]['entityType']
                        print(f"  • {name} ({entity_type})")
                
                else:
                    print("Unknown command. Try: search, connections, mermaid, list, quit")
            
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Error: {e}")
    
    def print_search_results(self, results):
        """Print formatted search results"""
        if results['entities']:
            print(f"\n📋 Entities ({len(results['entities'])}):")
            for entity in results['entities']:
                print(f"  • {entity['name']} ({entity['entityType']})")
        
        if results['observations']:
            print(f"\n💭 Observations ({len(results['observations'])}):")
            for obs in results['observations']:
                print(f"  • {obs['entity']}: {obs['observation']}")
        
        if results['relations']:
            print(f"\n🔗 Relations ({len(results['relations'])}):")
            for rel in results['relations']:
                print(f"  • {rel['from']} --{rel['relationType']}--> {rel['to']}")
        
        if not any(results.values()):
            print("No results found.")
    
    def print_connections(self, entity, connections):
        """Print entity connections"""
        print(f"\n🔗 Connections for '{entity}':")
        
        if connections['outgoing']:
            print("  Outgoing:")
            for conn in connections['outgoing']:
                print(f"    → {conn['to']} ({conn['type']})")
        
        if connections['incoming']:
            print("  Incoming:")
            for conn in connections['incoming']:
                print(f"    ← {conn['from']} ({conn['type']})")
        
        if not connections['outgoing'] and not connections['incoming']:
            print("  No connections found.")

def main():
    parser = argparse.ArgumentParser(description='Query Knowledge Graph')
    parser.add_argument('query', nargs='?', help='Search query')
    parser.add_argument('-i', '--interactive', action='store_true', help='Interactive mode')
    parser.add_argument('-m', '--mermaid', help='Generate Mermaid diagram for entity')
    parser.add_argument('-c', '--connections', help='Show connections for entity')
    parser.add_argument('-f', '--file', default='../memory.json', help='Memory file path')
    
    args = parser.parse_args()
    
    try:
        kg = KGQuery(args.file)
        
        if args.interactive:
            kg.interactive_mode()
        elif args.mermaid:
            mermaid = kg.generate_mermaid(args.mermaid)
            print(f"```mermaid\n{mermaid}\n```")
        elif args.connections:
            connections = kg.get_connections(args.connections)
            kg.print_connections(args.connections, connections)
        elif args.query:
            results = kg.search(args.query)
            kg.print_search_results(results)
        else:
            parser.print_help()
    
    except FileNotFoundError:
        print(f"Error: File '{args.file}' not found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
