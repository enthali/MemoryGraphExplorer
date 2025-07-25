#!/usr/bin/env node

// Simple test for MCP HTTP transport
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
        'Accept': 'application/json, text/event-stream',
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

async function testMCP() {
  try {
    console.log('Testing MCP HTTP transport...');
    
    // Initialize request
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
    console.log('Initialize response:', initResponse.data);
    
    // If successful, try list tools
    if (initResponse.status === 200) {
      const toolsResponse = await makeRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      });
      
      console.log('Tools list response status:', toolsResponse.status);
      console.log('Tools list response:', toolsResponse.data);
    }
    
  } catch (error) {
    console.error('Error testing MCP:', error);
  }
}

testMCP();
