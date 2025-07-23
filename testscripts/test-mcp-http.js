#!/usr/bin/env node

// Test script for MCP HTTP StreamableHTTP transport
const http = require('http');

let sessionId = null; // Track session ID across requests

function makeRequest(data, useSessionId = true) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Content-Length': Buffer.byteLength(postData)
    };
    
    // Add session ID to subsequent requests
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
      let responseData = '';
      
      // Extract session ID from response headers if present
      if (res.headers['mcp-session-id']) {
        sessionId = res.headers['mcp-session-id'];
        console.log('📋 Got session ID:', sessionId);
      }
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        // Handle StreamableHTTP response format
        let parsedData = responseData;
        if (res.headers['content-type']?.includes('text/event-stream')) {
          // Parse Server-Sent Events format
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

async function testMCP() {
  try {
    console.log('Testing MCP StreamableHTTP transport...');
    
    // Step 1: Initialize request (no session ID for first request)
    const initResponse = await makeRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    }, false); // Don't use session ID for initialization
    
    console.log('✅ Initialize response status:', initResponse.status);
    console.log('✅ Initialize response:', initResponse.data);
    
    // Step 2: Send initialized notification (using session ID)
    if (initResponse.status === 200) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      
      const initializedResponse = await makeRequest({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {}
      });
      
      console.log('✅ Initialized notification status:', initializedResponse.status);
      
      // Step 3: Now try list tools
      const toolsResponse = await makeRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      });
      
      console.log('✅ Tools list response status:', toolsResponse.status);
      console.log('✅ Tools list response:', toolsResponse.data);
      
      // Step 4: Test calling a tool
      if (toolsResponse.status === 200) {
        const toolCallResponse = await makeRequest({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'hello',
            arguments: {
              name: 'World'
            }
          }
        });
        
        console.log('✅ Tool call response status:', toolCallResponse.status);
        console.log('✅ Tool call response:', toolCallResponse.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing MCP:', error);
  }
}

testMCP();
