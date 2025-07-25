#!/usr/bin/env node

/**
 * Quick Test to verify we're on test data
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

async function testDataSource() {
  try {
    console.log('🔍 Checking which data source we are using...\n');
    
    // Initialize MCP
    const initResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: {
          name: 'data-source-test',
          version: '1.0.0'
        }
      }
    }, false);
    
    // Send initialized notification
    await makeRequest({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {}
    });
    
    // Read the full graph
    const graphResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'read_graph',
        arguments: {}
      }
    });
    
    if (graphResponse.status === 200) {
      const result = JSON.parse(graphResponse.data);
      const graphData = JSON.parse(result.result.content[0].text);
      
      console.log('📊 Memory Graph Contents:');
      console.log(`📈 Total Entities: ${graphData.entities.length}`);
      console.log(`🔗 Total Relations: ${graphData.relations.length}\n`);
      
      console.log('👥 Entities found:');
      graphData.entities.forEach(entity => {
        console.log(`  - ${entity.name} (${entity.entityType})`);
      });
      
      console.log('\n🔗 Relations found:');
      graphData.relations.forEach(relation => {
        console.log(`  - ${relation.from} → ${relation.to} (${relation.relationType})`);
      });
      
      // Check if we have test data
      const hasAliceJohnson = graphData.entities.some(e => e.name === 'Alice Johnson');
      const hasGeorgDoll = graphData.entities.some(e => e.name === 'Georg Doll');
      
      if (hasAliceJohnson && !hasGeorgDoll) {
        console.log('\n✅ CONFIRMED: Running on TEST DATA (Alice Johnson found, no real professional data)');
      } else if (hasGeorgDoll) {
        console.log('\n⚠️  WARNING: Running on LIVE DATA (Georg Doll found - real professional network)');
      } else {
        console.log('\n❓ UNKNOWN: Data source cannot be determined from entity names');
      }
      
    } else {
      console.log('❌ Failed to read graph');
    }
    
  } catch (error) {
    console.error('❌ Error testing data source:', error);
  }
}

testDataSource();
