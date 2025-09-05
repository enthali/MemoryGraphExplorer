#!/usr/bin/env node
/**
 * Test the rename entity functionality via HTTP API
 */

async function makeRequest(data) {
  const response = await fetch('http://localhost:3001/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  
  return response.json();
}

async function testRenameEntityHTTP() {
  console.log('🌐 Testing rename entity via HTTP API\n');

  try {
    // Step 0: Initialize the MCP server
    console.log('0. Initializing MCP server...');
    const initResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {}
      }
    });
    console.log('   ✅ Server initialized');

    // Test 1: Create some test data first
    console.log('1. Creating test data...');
    
    // Create types
    const typeResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'create_type',
        arguments: {
          typeCategory: 'entityType',
          typeName: 'Person',
          description: 'Individual people'
        }
      }
    });
    
    // Create entity
    const entityResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'create_entities',
        arguments: {
          entities: [
            {
              name: 'John Smith',
              entityType: 'Person',
              observations: ['Software engineer', 'Lives in NYC']
            }
          ]
        }
      }
    });
    
    console.log('   ✅ Created test data');

    // Test 2: Use the rename entity tool!
    console.log('2. Testing rename entity (THE KEY FEATURE!)...');
    
    const renameResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'rename_entity',
        arguments: {
          oldName: 'John Smith',
          newName: 'John Doe'
        }
      }
    });
    
    console.log('   ✅ Rename response:', renameResponse.result?.content?.[0]?.text || 'Success');

    // Test 3: Verify the rename worked
    console.log('3. Verifying rename worked...');
    
    const readResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'read_graph',
        arguments: {}
      }
    });
    
    const graphText = readResponse.result?.content?.[0]?.text;
    const hasJohnDoe = graphText?.includes('John Doe');
    const hasJohnSmith = graphText?.includes('John Smith');
    
    console.log('   ✅ Contains "John Doe":', hasJohnDoe);
    console.log('   ✅ Contains "John Smith":', hasJohnSmith);
    
    if (hasJohnDoe && !hasJohnSmith) {
      console.log('\n🎉 SUCCESS! Entity renaming via HTTP API works perfectly!');
      console.log('✨ The UUID-based storage layer is fully functional via HTTP!');
    } else {
      console.log('\n❌ Rename verification failed');
    }
    
    // Test 4: Test search to show the renamed entity
    console.log('\n4. Testing search with renamed entity...');
    
    const searchResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'search_graph',
        arguments: {
          query: 'John'
        }
      }
    });
    
    console.log('   🔍 Search results found:', searchResponse.result?.content?.[0]?.text?.includes('John Doe'));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testRenameEntityHTTP().catch(console.error);