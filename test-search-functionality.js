#!/usr/bin/env node

// Test script for the new search functionality
const http = require('http');

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testSearchFunctionality() {
  try {
    console.log('Testing search functionality...\n');
    
    // Step 1: Initialize the MCP server
    console.log('1. Initializing MCP server...');
    const initResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {}
      }
    });
    
    console.log('Initialize response status:', initResponse.status);
    if (initResponse.status !== 200) {
      console.error('Failed to initialize:', initResponse.data);
      return;
    }
    console.log('✓ MCP server initialized\n');

    // Step 2: Send initialized notification
    console.log('2. Sending initialized notification...');
    await makeRequest({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    });
    console.log('✓ Initialized notification sent\n');
    
    // Step 3: List available tools to verify search_graph is available
    console.log('3. Listing available tools...');
    const toolsResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    });
    
    if (toolsResponse.status === 200) {
      const toolsData = JSON.parse(toolsResponse.data);
      const tools = toolsData.result.tools;
      console.log('Available tools:', tools.map(t => t.name).join(', '));
      
      const searchTool = tools.find(t => t.name === 'memory_search_graph');
      if (searchTool) {
        console.log('✓ search_graph tool found!');
        console.log('Tool description:', searchTool.description);
      } else {
        console.log('✗ search_graph tool not found');
        return;
      }
    } else {
      console.error('Failed to list tools:', toolsResponse.data);
      return;
    }
    console.log();

    // Step 4: Create some test data
    console.log('4. Creating test data...');
    
    // Create entities
    await makeRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'memory_create_entities',
        arguments: {
          entities: [
            {
              name: 'John Smith',
              entityType: 'Person',
              observations: ['Software developer', 'Lives in Seattle', 'Age 30']
            },
            {
              name: 'Microsoft',
              entityType: 'Company',
              observations: ['Technology company', 'Located in Redmond']
            },
            {
              name: 'GitHub',
              entityType: 'Platform',
              observations: ['Version control platform', 'Owned by Microsoft']
            }
          ]
        }
      }
    });
    
    // Create relations
    await makeRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'memory_create_relations',
        arguments: {
          relations: [
            {
              from: 'John Smith',
              to: 'Microsoft',
              relationType: 'works_at'
            },
            {
              from: 'John Smith',
              to: 'GitHub',
              relationType: 'uses'
            },
            {
              from: 'Microsoft',
              to: 'GitHub',
              relationType: 'owns'
            }
          ]
        }
      }
    });
    
    console.log('✓ Test data created (entities: John Smith, Microsoft, GitHub)\n');

    // Step 5: Test the new search functionality
    console.log('5. Testing search functionality...\n');
    
    // Test 1: Search for a relation type
    console.log('Test 1: Search for "works_at" (relation type)');
    const searchTest1 = await makeRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'memory_search_graph',
        arguments: {
          query: 'works_at'
        }
      }
    });
    
    if (searchTest1.status === 200) {
      const result1 = JSON.parse(searchTest1.data);
      console.log('Search result:', JSON.stringify(result1.result, null, 2));
    } else {
      console.error('Search test 1 failed:', searchTest1.data);
    }
    console.log();

    // Test 2: Search for an entity name
    console.log('Test 2: Search for "John" (entity name)');
    const searchTest2 = await makeRequest({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'memory_search_graph',
        arguments: {
          query: 'John'
        }
      }
    });
    
    if (searchTest2.status === 200) {
      const result2 = JSON.parse(searchTest2.data);
      console.log('Search result:', JSON.stringify(result2.result, null, 2));
    } else {
      console.error('Search test 2 failed:', searchTest2.data);
    }
    console.log();

    // Test 3: Search for a company
    console.log('Test 3: Search for "Microsoft" (entity name)');
    const searchTest3 = await makeRequest({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'memory_search_graph',
        arguments: {
          query: 'Microsoft'
        }
      }
    });
    
    if (searchTest3.status === 200) {
      const result3 = JSON.parse(searchTest3.data);
      console.log('Search result:', JSON.stringify(result3.result, null, 2));
    } else {
      console.error('Search test 3 failed:', searchTest3.data);
    }
    console.log();

    console.log('✓ All search tests completed!');
    
  } catch (error) {
    console.error('Error testing search functionality:', error);
  }
}

testSearchFunctionality();
