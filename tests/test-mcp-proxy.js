#!/usr/bin/env node

import http from 'http';

let sessionId = null;

function makeRequest(data, url, useSessionId = true) {
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
        
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
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

async function testMCPProxy() {
    console.log('🧪 Phase 1 MCP Proxy Test');
    console.log('─'.repeat(30));

    try {
        // Test proxy endpoint
        const initRequest = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {
                    "name": "test-client",
                    "version": "1.0.0"
                }
            }
        };
        
        // Test 1: Proxy on port 8081
        console.log('🔄 Testing proxy endpoint (port 8081)...');
        const proxyResponse = await makeRequest(initRequest, 'http://localhost:8081/mcp', false);
        
        if (proxyResponse.status !== 200) {
            throw new Error(`Proxy test failed: ${proxyResponse.status}`);
        }

        const toolsRequest = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        };
        
        const toolsResponse = await makeRequest(toolsRequest, 'http://localhost:8081/mcp', true);
        const tools = JSON.parse(toolsResponse.data);
        
        if (!tools.result || !tools.result.tools || tools.result.tools.length < 15) {
            throw new Error(`Expected 15+ tools, got ${tools.result?.tools?.length || 0}`);
        }

        // Test 2: Direct access still works
        console.log('🔄 Verifying direct access (port 3001)...');
        sessionId = null;
        const directResponse = await makeRequest(initRequest, 'http://localhost:3001/mcp', false);
        
        if (directResponse.status !== 200) {
            throw new Error(`Direct access failed: ${directResponse.status}`);
        }

        console.log('✅ MCP Proxy implementation working correctly');
        console.log('✅ Direct access preserved');
        console.log(`✅ ${tools.result.tools.length} MCP tools available through proxy`);
        
        return true;
        
    } catch (error) {
        console.error('❌ MCP Proxy test failed:', error.message);
        return false;
    }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    testMCPProxy().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

export default testMCPProxy;