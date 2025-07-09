#!/usr/bin/env python3
"""
MCP Memory Server Client Implementation
Connects to a local MCP Memory Server instance or falls back to direct file access
"""

import json
import os
from typing import Dict, List, Any, Optional

class MCPMemoryClient:
    """Client for reading memory.json files directly"""
    
    def __init__(self):
        self.memory_file = self._find_memory_file()
        
    def _find_memory_file(self) -> Optional[str]:
        """Find the memory.json file"""
        possible_paths = [
            os.path.join(os.path.dirname(__file__), "../../memory.json"),
            os.path.join(os.path.dirname(__file__), "../../../Journal/memory.json"),
        ]
        
        for path in possible_paths:
            abs_path = os.path.abspath(path)
            if os.path.exists(abs_path):
                print(f"✅ Found memory file at: {abs_path}")
                return abs_path
        
        print("⚠️  Memory file not found")
        return None
    
    def _read_memory_file(self) -> Dict[str, Any]:
        """Read and parse the memory.json file directly"""
        if not self.memory_file or not os.path.exists(self.memory_file):
            return {"entities": [], "relations": []}
        
        try:
            with open(self.memory_file, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                
            if not content:
                return {"entities": [], "relations": []}
            
            # Parse JSONL format
            entities = []
            relations = []
            
            for line in content.split('\n'):
                if line.strip():
                    item = json.loads(line)
                    if item.get('type') == 'entity':
                        entities.append(item)
                    elif item.get('type') == 'relation':
                        relations.append(item)
            
            return {"entities": entities, "relations": relations}
            
        except Exception as e:
            print(f"❌ Error reading memory file: {e}")
            return {"entities": [], "relations": []}

# Global MCP client instance
_mcp_client = MCPMemoryClient()

# Available functions list
MCP_FUNCTIONS_AVAILABLE = [
    "mcp_memory_read_graph",
    "mcp_memory_search_nodes", 
    "mcp_memory_open_nodes",
    "mcp_memory_get_node_relations",
    "mcp_memory_create_entities",
    "mcp_memory_create_relations",
    "mcp_memory_add_observations",
    "mcp_memory_delete_entities",
    "mcp_memory_delete_relations",
    "mcp_server_health_check"
]

def mcp_memory_read_graph() -> Dict[str, Any]:
    """Get the complete knowledge graph from memory file"""
    try:
        result = _mcp_client._read_memory_file()
        print(f"📡 Retrieved {len(result.get('entities', []))} entities and {len(result.get('relations', []))} relations from memory file")
        return result
    except Exception as e:
        print(f"❌ Error reading graph: {e}")
        raise ImportError("Memory file not available")

def mcp_memory_search_nodes(query: str) -> Dict[str, Any]:
    """Search for entities and relations in the knowledge graph"""
    try:
        full_graph = _mcp_client._read_memory_file()
        entities = full_graph.get('entities', [])
        relations = full_graph.get('relations', [])
        
        # Simple text search
        query_lower = query.lower()
        matching_entities = [e for e in entities if query_lower in e.get('name', '').lower() or 
                           query_lower in str(e.get('observations', [])).lower()]
        matching_relations = [r for r in relations if query_lower in r.get('relation_type', '').lower() or
                            query_lower in r.get('from', '').lower() or query_lower in r.get('to', '').lower()]
        
        result = {'entities': matching_entities, 'relations': matching_relations}
        print(f"📡 Search '{query}': found {len(matching_entities)} entities and {len(matching_relations)} relations")
        return result
    except Exception as e:
        print(f"❌ Error searching nodes: {e}")
        raise ImportError("Memory file not available")

def mcp_memory_open_nodes(names: List[str]) -> Dict[str, Any]:
    """Get specific entities by name"""
    try:
        full_graph = _mcp_client._read_memory_file()
        entities = full_graph.get('entities', [])
        
        matching_entities = [e for e in entities if e.get('name') in names]
        result = {'entities': matching_entities}
        print(f"📡 Opened {len(matching_entities)} nodes from memory file")
        return result
    except Exception as e:
        print(f"❌ Error opening nodes: {e}")
        raise ImportError("Memory file not available")

def mcp_memory_get_node_relations(entity_name: str) -> Dict[str, Any]:
    """Get all relations for a specific entity (Enhanced function)"""
    try:
        full_graph = _mcp_client._read_memory_file()
        relations = full_graph.get('relations', [])
        
        outgoing = [r for r in relations if r.get('from') == entity_name]
        incoming = [r for r in relations if r.get('to') == entity_name]
        connected_entities = list(set([r.get('to') for r in outgoing] + [r.get('from') for r in incoming]))
        
        result = {
            'outgoing': outgoing,
            'incoming': incoming,
            'connected_entities': connected_entities
        }
        print(f"📡 Retrieved relations for '{entity_name}': {len(outgoing)} outgoing, {len(incoming)} incoming")
        return result
    except Exception as e:
        print(f"❌ Error getting node relations: {e}")
        raise ImportError("Memory file not available")

# Management functions
def mcp_memory_create_entities(entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create new entities in the knowledge graph"""
    # These would use the create functions from your MCP server
    print("⚠️  Create entities function not yet implemented")
    return []

def mcp_memory_create_relations(relations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create new relations in the knowledge graph"""
    # These would use the create functions from your MCP server
    print("⚠️  Create relations function not yet implemented")
    return []

def mcp_memory_add_observations(observations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Add observations to existing entities"""
    # These would use the add observations functions from your MCP server
    print("⚠️  Add observations function not yet implemented")
    return []

def mcp_memory_delete_entities(entity_names: List[str]) -> None:
    """Delete entities from the knowledge graph"""
    # These would use the delete functions from your MCP server
    print("⚠️  Delete entities function not yet implemented")

def mcp_memory_delete_relations(relations: List[Dict[str, Any]]) -> None:
    """Delete relations from the knowledge graph"""
    # These would use the delete functions from your MCP server
    print("⚠️  Delete relations function not yet implemented")

# Health check function
def mcp_server_health_check() -> Dict[str, Any]:
    """Check if memory file is available and readable"""
    try:
        # Try a simple operation
        result = mcp_memory_read_graph()
        return {
            "status": "healthy",
            "connected": True,
            "enhanced_api": True,
            "server_type": "Direct Memory File Access",
            "functions_available": MCP_FUNCTIONS_AVAILABLE,
            "entity_count": len(result.get('entities', [])),
            "relation_count": len(result.get('relations', [])),
            "memory_file": _mcp_client.memory_file
        }
    except Exception as e:
        return {
            "status": "error", 
            "connected": False,
            "error": str(e),
            "server_type": "Unknown",
            "functions_available": MCP_FUNCTIONS_AVAILABLE,
            "memory_file": _mcp_client.memory_file
        }
