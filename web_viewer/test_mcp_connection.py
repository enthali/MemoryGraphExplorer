#!/usr/bin/env python3
"""
Test script for the enhanced MCP client connection
Run this to verify the architecture is working correctly
"""

import sys
import os

# Add the web_viewer directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_mcp_connection():
    """Test the MCP client connection"""
    print("🧪 Testing MCP Enhanced Client Connection")
    print("=" * 50)
    
    try:
        # Test import
        print("1️⃣ Testing imports...")
        from mcp_memory_functions import (
            mcp_memory_read_graph,
            mcp_memory_search_nodes,
            mcp_memory_open_nodes,
            mcp_memory_get_node_relations,
            mcp_server_health_check
        )
        print("✅ Imports successful")
        
        # Test health check
        print("\n2️⃣ Testing health check...")
        health = mcp_server_health_check()
        print(f"Health status: {health}")
        
        # Test read graph
        print("\n3️⃣ Testing read graph...")
        try:
            graph = mcp_memory_read_graph()
            print(f"✅ Read graph: {len(graph.get('entities', []))} entities, {len(graph.get('relations', []))} relations")
        except Exception as e:
            print(f"⚠️  Read graph failed: {e}")
        
        # Test search
        print("\n4️⃣ Testing search...")
        try:
            search_result = mcp_memory_search_nodes("Microsoft")
            print(f"✅ Search successful: {len(search_result.get('entities', []))} entities found")
        except Exception as e:
            print(f"⚠️  Search failed: {e}")
            
        # Test enhanced function
        print("\n5️⃣ Testing enhanced get_node_relations...")
        try:
            relations = mcp_memory_get_node_relations("Georg Doll")
            outgoing = len(relations.get('outgoing', []))
            incoming = len(relations.get('incoming', []))
            connected = len(relations.get('connected_entities', []))
            print(f"✅ Enhanced function successful: {outgoing} outgoing, {incoming} incoming, {connected} connected entities")
        except Exception as e:
            print(f"⚠️  Enhanced function failed: {e}")
        
        print("\n✅ MCP Enhanced Client Test Complete!")
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        print("📋 This means the MCP functions are not available in the current environment")
        print("💡 The unified server will fall back to reading memory.json directly")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_mcp_connection()
