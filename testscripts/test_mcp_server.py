#!/usr/bin/env python3
"""
Test MCP Memory Server Communication
Sends JSON-RPC messages to test if the MCP server is responding
"""

import json
import subprocess
import sys

def test_mcp_server():
    """Test the MCP server by sending JSON-RPC messages"""
    
    # MCP server command (same as in mcp.json)
    server_command = [
        "node", 
        "C:/workspace/MCP/modelcontextprotocol/servers/src/memory/dist/index.js"
    ]
    
    # Set environment variable
    import os
    os.environ["MEMORY_FILE_PATH"] = "C:/workspace/Journal/memory.json"
    
    try:
        # Start the MCP server process
        print("🔄 Starting MCP server process for testing...")
        process = subprocess.Popen(
            server_command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd="C:/workspace/MCP/modelcontextprotocol/servers/src/memory/dist"
        )
        
        # 1. Initialize the MCP connection
        init_request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {}
                },
                "clientInfo": {
                    "name": "test-client",
                    "version": "1.0.0"
                }
            }
        }
        
        print("📡 Sending initialization request...")
        process.stdin.write(json.dumps(init_request) + "\n")
        process.stdin.flush()
        
        # Read the response
        response_line = process.stdout.readline()
        if response_line:
            try:
                response = json.loads(response_line.strip())
                print(f"✅ Initialize response: {json.dumps(response, indent=2)}")
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse response: {response_line}")
                print(f"   Error: {e}")
        
        # 2. Send notifications/initialized
        initialized_notification = {
            "jsonrpc": "2.0",
            "method": "notifications/initialized"
        }
        
        print("📡 Sending initialized notification...")
        process.stdin.write(json.dumps(initialized_notification) + "\n")
        process.stdin.flush()
        
        # 3. List available tools
        list_tools_request = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list"
        }
        
        print("📡 Listing available tools...")
        process.stdin.write(json.dumps(list_tools_request) + "\n")
        process.stdin.flush()
        
        # Read the response
        response_line = process.stdout.readline()
        if response_line:
            try:
                response = json.loads(response_line.strip())
                print(f"🔧 Available tools: {json.dumps(response, indent=2)}")
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse tools response: {response_line}")
                print(f"   Error: {e}")
        
        # 4. Test calling a tool (read_graph)
        read_graph_request = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "read_graph",
                "arguments": {}
            }
        }
        
        print("📡 Calling read_graph tool...")
        process.stdin.write(json.dumps(read_graph_request) + "\n")
        process.stdin.flush()
        
        # Read the response
        response_line = process.stdout.readline()
        if response_line:
            try:
                response = json.loads(response_line.strip())
                if "result" in response and "content" in response["result"]:
                    content = response["result"]["content"]
                    if isinstance(content, list) and len(content) > 0:
                        # Parse the graph data
                        graph_data = json.loads(content[0]["text"])
                        entity_count = len(graph_data.get("entities", []))
                        relation_count = len(graph_data.get("relations", []))
                        print(f"✅ Graph data received: {entity_count} entities, {relation_count} relations")
                    else:
                        print(f"📊 Graph response: {json.dumps(response, indent=2)}")
                else:
                    print(f"📊 Read graph response: {json.dumps(response, indent=2)}")
            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse graph response: {response_line}")
                print(f"   Error: {e}")
            except Exception as e:
                print(f"❌ Error processing graph response: {e}")
        
        # Clean up
        process.terminate()
        process.wait()
        print("✅ MCP server test completed")
        
    except FileNotFoundError:
        print("❌ Error: Node.js not found or MCP server not built")
        print("   Make sure Node.js is installed and the server is built")
    except Exception as e:
        print(f"❌ Error testing MCP server: {e}")

if __name__ == "__main__":
    test_mcp_server()
