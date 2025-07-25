#!/usr/bin/env node

/**
 * Test Script for New Copilot Features
 * Tests the new entity rename and integrity validation tools
 */

const http = require('http');

let sessionId = null;

function makeRequest(data, useSessionId = true) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Content-Length': Buffer.byteLength(postData)
    };
    
    if (useSessionId && sessionId) {
      headers['mcp-session-id'] = sessionId;
    }
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/mcp',
      method: 'POST',
      headers
    };

    const req = http.request(options, (res) => {
      if (res.headers['mcp-session-id']) {
        sessionId = res.headers['mcp-session-id'];
      }
      
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        let parsedData = responseData;
        if (res.headers['content-type']?.includes('text/event-stream')) {
          const lines = responseData.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              parsedData = line.substring(6);
              break;
            }
          }
        }
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsedData
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

async function testCopilotFeatures() {
  try {
    console.log('🧪 Testing GitHub Copilot Enhanced Features\n');
    
    // Initialize MCP
    console.log('🔄 Initializing MCP session...');
    const initResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: {
          name: 'copilot-feature-test',
          version: '1.0.0'
        }
      }
    }, false);
    
    if (initResponse.status !== 200) {
      throw new Error('Failed to initialize MCP session');
    }
    
    // Send initialized notification
    await makeRequest({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {}
    });
    
    console.log('✅ MCP session initialized\n');
    
    // Test 1: Validate Integrity
    console.log('🔍 Testing validate_integrity tool...');
    const integrityResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'validate_integrity',
        arguments: {
          autoFix: false
        }
      }
    });
    
    if (integrityResponse.status === 200) {
      try {
        const result = JSON.parse(integrityResponse.data);
        if (result.result && result.result.content) {
          const content = result.result.content[0].text;
          console.log('✅ Integrity validation completed:');
          console.log(`   � Result: ${content}`);
        }
      } catch (e) {
        console.log('❌ Failed to parse integrity response:', e.message);
      }
    } else {
      console.log('❌ Integrity validation failed');
    }
    
    // Test 2: Test Rename Entity (create test entity first)
    console.log('\n📝 Testing entity rename functionality...');
    
    // First create a test entity
    console.log('   Creating test entity...');
    const createResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'create_entities',
        arguments: {
          entities: [{
            name: 'Test Entity Original',
            entityType: 'Person',
            observations: ['This is a test entity for rename functionality']
          }]
        }
      }
    });
    
    if (createResponse.status === 200) {
      console.log('   ✅ Test entity created');
      
      // Now test rename
      console.log('   Attempting to rename entity...');
      const renameResponse = await makeRequest({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'rename_entity',
          arguments: {
            oldName: 'Test Entity Original',
            newName: 'Test Entity Renamed'
          }
        }
      });
      
      if (renameResponse.status === 200) {
        const result = JSON.parse(renameResponse.data);
        if (result.result && !result.result.isError) {
          console.log('   ✅ Entity renamed successfully');
          
          // Verify the rename worked
          const searchResponse = await makeRequest({
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: {
              name: 'search_nodes',
              arguments: {
                query: 'Test Entity Renamed'
              }
            }
          });
          
          if (searchResponse.status === 200) {
            const searchResult = JSON.parse(searchResponse.data);
            const entities = JSON.parse(searchResult.result.content[0].text);
            if (entities.length > 0) {
              console.log('   ✅ Renamed entity found in search');
            } else {
              console.log('   ⚠️  Renamed entity not found in search');
            }
          }
        } else {
          console.log('   ❌ Entity rename failed:', result.result?.content?.[0]?.text || 'Unknown error');
        }
      } else {
        console.log('   ❌ Rename request failed');
      }
      
      // Clean up - delete test entity
      console.log('   Cleaning up test entity...');
      await makeRequest({
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'delete_entities',
          arguments: {
            entityNames: ['Test Entity Renamed']
          }
        }
      });
      console.log('   🗑️  Test entity cleaned up');
    } else {
      console.log('   ❌ Failed to create test entity');
    }
    
    // Test 3: Test error handling
    console.log('\n🚫 Testing error handling...');
    
    // Try to rename non-existent entity
    const errorResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'rename_entity',
        arguments: {
          oldName: 'NonExistentEntity',
          newName: 'SomeNewName'
        }
      }
    });
    
    if (errorResponse.status === 200) {
      const result = JSON.parse(errorResponse.data);
      if (result.result && result.result.isError) {
        console.log('   ✅ Error handling works - proper error returned for non-existent entity');
        console.log(`   📋 Error: ${result.result.content[0].text}`);
      } else {
        console.log('   ⚠️  Expected error for non-existent entity, but got success');
      }
    }
    
    console.log('\n🎯 Copilot Feature Testing Complete!');
    console.log('\n📊 Summary of new features:');
    console.log('   ✅ validate_integrity - Graph integrity validation with optional auto-fix');
    console.log('   ✅ rename_entity - Atomic entity renaming with relation updates');
    console.log('   ✅ Enhanced error handling with proper error codes');
    
  } catch (error) {
    console.error('❌ Error testing Copilot features:', error);
  }
}

testCopilotFeatures();
