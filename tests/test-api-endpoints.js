#!/usr/bin/env node

/**
 * API Endpoint Tests for Memory Graph Explorer
 * Tests the actual HTTP API endpoints exposed by the containerized system
 */

const http = require('http');
const { URL } = require('url');

// Configuration
const WEB_BASE_URL = 'http://localhost:8080';
const MCP_BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 10000; // 10 seconds

class APITester {
    constructor() {
        this.passedTests = 0;
        this.failedTests = 0;
        this.testResults = [];
        this.mcpSessionId = null; // Track MCP session
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const body = options.body ? JSON.stringify(options.body) : null;
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                timeout: TEST_TIMEOUT
            };

            // Add specific headers for MCP requests
            if (url.includes('/mcp')) {
                requestOptions.headers['Accept'] = 'application/json, text/event-stream';
                if (body) {
                    requestOptions.headers['Content-Length'] = Buffer.byteLength(body);
                }
                // Add MCP session ID if available
                if (this.mcpSessionId) {
                    requestOptions.headers['mcp-session-id'] = this.mcpSessionId;
                }
            }

            const req = http.request(requestOptions, (res) => {
                // Extract MCP session ID from response headers
                if (res.headers['mcp-session-id']) {
                    this.mcpSessionId = res.headers['mcp-session-id'];
                }

                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        let parsedData = data;
                        
                        // Handle MCP StreamableHTTP Server-Sent Events format
                        if (url.includes('/mcp') && res.headers['content-type']?.includes('text/event-stream')) {
                            const lines = data.split('\n');
                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    parsedData = line.substring(6);
                                    break;
                                }
                            }
                        }
                        
                        const jsonData = parsedData ? JSON.parse(parsedData) : {};
                        resolve({ 
                            statusCode: res.statusCode, 
                            data: jsonData, 
                            headers: res.headers 
                        });
                    } catch (e) {
                        resolve({ 
                            statusCode: res.statusCode, 
                            data: data, 
                            headers: res.headers 
                        });
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (body) {
                req.write(body);
            }
            req.end();
        });
    }

    async test(name, testFn) {
        process.stdout.write(`🧪 ${name}... `);
        try {
            await testFn();
            console.log('✅ PASS');
            this.passedTests++;
            this.testResults.push({ name, status: 'PASS' });
        } catch (error) {
            console.log(`❌ FAIL: ${error.message}`);
            this.failedTests++;
            this.testResults.push({ name, status: 'FAIL', error: error.message });
        }
    }

    async runAllTests() {
        console.log('🚀 Starting API Endpoint Tests for Memory Graph Explorer\n');

        // Web Interface API Tests
        console.log('📊 Testing Web Interface APIs...');
        
        await this.test('Health Check Endpoint', async () => {
            const response = await this.makeRequest(`${WEB_BASE_URL}/api/health`);
            if (response.statusCode !== 200) {
                throw new Error(`Expected 200, got ${response.statusCode}`);
            }
            if (!response.data.status || response.data.status !== 'healthy') {
                throw new Error('Health check did not return healthy status');
            }
        });

        await this.test('Graph Data Endpoint', async () => {
            const response = await this.makeRequest(`${WEB_BASE_URL}/api/graph`);
            if (response.statusCode !== 200) {
                throw new Error(`Expected 200, got ${response.statusCode}`);
            }
            if (!response.data.entities || !Array.isArray(response.data.entities)) {
                throw new Error('Graph endpoint did not return entities array');
            }
            if (!response.data.relations || !Array.isArray(response.data.relations)) {
                throw new Error('Graph endpoint did not return relations array');
            }
        });

        await this.test('Search Endpoint', async () => {
            const response = await this.makeRequest(`${WEB_BASE_URL}/api/search?q=test`);
            if (response.statusCode !== 200) {
                throw new Error(`Expected 200, got ${response.statusCode}`);
            }
            if (!response.data.entities || !Array.isArray(response.data.entities)) {
                throw new Error('Search endpoint did not return entities array');
            }
            if (!response.data.relations || !Array.isArray(response.data.relations)) {
                throw new Error('Search endpoint did not return relations array');
            }
        });

        await this.test('Entity Details Endpoint', async () => {
            // First get entities to find a valid one
            const graphResponse = await this.makeRequest(`${WEB_BASE_URL}/api/graph`);
            const entities = graphResponse.data.entities;
            
            if (entities.length > 0) {
                const entityName = entities[0].name;
                const response = await this.makeRequest(`${WEB_BASE_URL}/api/entity?name=${encodeURIComponent(entityName)}`);
                if (response.statusCode !== 200) {
                    throw new Error(`Expected 200, got ${response.statusCode}`);
                }
                if (!response.data.entity || !response.data.entity.name) {
                    throw new Error('Entity endpoint did not return entity with name');
                }
                if (!Array.isArray(response.data.relations)) {
                    throw new Error('Entity endpoint did not return relations array');
                }
            } else {
                console.log('⚠️  No entities found, skipping entity test');
            }
        });

        await this.test('Node Relations Endpoint', async () => {
            // First get entities to find a valid one
            const graphResponse = await this.makeRequest(`${WEB_BASE_URL}/api/graph`);
            const entities = graphResponse.data.entities;
            
            if (entities.length > 0) {
                const entityName = entities[0].name;
                const response = await this.makeRequest(`${WEB_BASE_URL}/api/node-relations?name=${encodeURIComponent(entityName)}`);
                if (response.statusCode !== 200) {
                    throw new Error(`Expected 200, got ${response.statusCode}`);
                }
                if (!response.data.entity_name) {
                    throw new Error('Node relations endpoint did not return entity_name');
                }
                if (!Array.isArray(response.data.incoming_relations)) {
                    throw new Error('Node relations endpoint did not return incoming_relations array');
                }
                if (!Array.isArray(response.data.outgoing_relations)) {
                    throw new Error('Node relations endpoint did not return outgoing_relations array');
                }
            } else {
                console.log('⚠️  No entities found, skipping relations test');
            }
        });

        // MCP Server Tests
        console.log('\n🤖 Testing MCP Server APIs...');

        // Initialize MCP session first
        await this.test('MCP Session Initialization', async () => {
            const response = await this.makeRequest(`${MCP_BASE_URL}/mcp`, {
                method: 'POST',
                body: {
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
                }
            });
            if (response.statusCode !== 200) {
                throw new Error(`Expected 200, got ${response.statusCode}`);
            }
            if (!response.data.result) {
                throw new Error('MCP initialize did not return result');
            }
            
            // Send initialized notification
            await new Promise(resolve => setTimeout(resolve, 100));
            const notifyResponse = await this.makeRequest(`${MCP_BASE_URL}/mcp`, {
                method: 'POST',
                body: {
                    jsonrpc: '2.0',
                    method: 'notifications/initialized'
                }
            });
            if (notifyResponse.statusCode !== 202) {
                throw new Error(`Expected 202 for notification, got ${notifyResponse.statusCode}`);
            }
        });

        await this.test('MCP Tools List', async () => {
            const response = await this.makeRequest(`${MCP_BASE_URL}/mcp`, {
                method: 'POST',
                body: {
                    jsonrpc: '2.0',
                    id: 2,
                    method: 'tools/list'
                }
            });
            if (response.statusCode !== 200) {
                throw new Error(`Expected 200, got ${response.statusCode}`);
            }
            if (!response.data.result || !Array.isArray(response.data.result.tools)) {
                throw new Error('MCP tools/list did not return tools array');
            }
            const toolCount = response.data.result.tools.length;
            if (toolCount === 0) {
                throw new Error('No tools returned from MCP server');
            }
            console.log(`\n    📋 Found ${toolCount} MCP tools available`);
        });

        await this.test('MCP Read Graph Tool', async () => {
            const response = await this.makeRequest(`${MCP_BASE_URL}/mcp`, {
                method: 'POST',
                body: {
                    jsonrpc: '2.0',
                    id: 3,
                    method: 'tools/call',
                    params: {
                        name: 'read_graph',
                        arguments: {}
                    }
                }
            });
            if (response.statusCode !== 200) {
                throw new Error(`Expected 200, got ${response.statusCode}`);
            }
            if (!response.data.result) {
                throw new Error('MCP read_graph did not return result');
            }
        });

        await this.test('MCP Search Nodes Tool', async () => {
            const response = await this.makeRequest(`${MCP_BASE_URL}/mcp`, {
                method: 'POST',
                body: {
                    jsonrpc: '2.0',
                    id: 4,
                    method: 'tools/call',
                    params: {
                        name: 'search_nodes',
                        arguments: { query: 'test' }
                    }
                }
            });
            if (response.statusCode !== 200) {
                throw new Error(`Expected 200, got ${response.statusCode}`);
            }
            if (!response.data.result) {
                throw new Error('MCP search_nodes did not return result');
            }
        });

        // Error Handling Tests
        console.log('\n⚠️  Testing Error Handling...');

        await this.test('Invalid API Endpoint', async () => {
            const response = await this.makeRequest(`${WEB_BASE_URL}/api/nonexistent`);
            if (response.statusCode === 200) {
                throw new Error('Expected non-200 status for invalid endpoint');
            }
        });

        await this.test('Invalid MCP Method', async () => {
            const response = await this.makeRequest(`${MCP_BASE_URL}/mcp`, {
                method: 'POST',
                body: {
                    jsonrpc: '2.0',
                    id: 5,
                    method: 'invalid/method'
                }
            });
            if (response.statusCode !== 200) {
                throw new Error(`Expected 200 status with error in body, got ${response.statusCode}`);
            }
            if (!response.data.error) {
                throw new Error('Expected error response for invalid MCP method');
            }
        });

        // Print Summary
        console.log('\n📊 Test Summary:');
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📈 Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);

        if (this.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`   • ${r.name}: ${r.error}`));
        }

        console.log('\n🎯 Test completed!');
        return this.failedTests === 0;
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new APITester();
    tester.runAllTests()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('💥 Test runner failed:', error);
            process.exit(1);
        });
}

module.exports = APITester;
