/**
 * MCP Data Provider for Knowledge Graph
 * Handles integration with MCP Memory Server
 */

export class MCPDataProvider {
    constructor() {
        this.baseUrl = 'http://localhost:8080/api';  // Same server, different port
        console.log('🔌 Initializing MCP Data Provider...');
        console.log(`📡 Unified Server API URL: ${this.baseUrl}`);
    }

    async getFullGraph() {
        console.log('📡 Fetching full graph from MCP Memory Server...');
        
        try {
            const response = await fetch(`${this.baseUrl}/graph`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ Loaded ${data.entities?.length || 0} entities and ${data.relations?.length || 0} relations from MCP Server`);
            
            return data;
        } catch (error) {
            console.error('❌ Failed to fetch graph data from MCP Server:', error);
            throw new Error(`Unable to connect to MCP Memory Server. Please ensure the server is running and try again. Details: ${error.message}`);
        }
    }

    async searchNodes(query) {
        console.log(`🔍 Searching nodes for: ${query}`);
        
        try {
            const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ Found ${data.entities?.length || 0} entities and ${data.relations?.length || 0} relations for "${query}"`);
            
            return data;
        } catch (error) {
            console.error('❌ Failed to search nodes in MCP Server:', error);
            throw new Error(`Unable to search nodes. MCP Memory Server connection failed. Details: ${error.message}`);
        }
    }

    async getEntityDetails(entityName) {
        console.log(`📋 Getting details for entity: ${entityName}`);
        
        try {
            const response = await fetch(`${this.baseUrl}/entity?name=${encodeURIComponent(entityName)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.entity) {
                throw new Error(`Entity not found: ${entityName}`);
            }
            
            console.log(`✅ Loaded details for "${entityName}" with ${data.relations?.length || 0} relations`);
            
            return data;
        } catch (error) {
            console.error('❌ Failed to get entity details from MCP Server:', error);
            throw new Error(`Unable to get entity details for "${entityName}". MCP Memory Server connection failed. Details: ${error.message}`);
        }
    }

    // Helper method to simulate MCP Memory Server integration
    // In a real implementation, this would use the actual MCP protocol
    async callMCPMethod(method, params = {}) {
        console.log(`🔌 Calling MCP method: ${method}`, params);
        
        switch (method) {
            case 'memory/read_graph':
                return this.getFullGraph();
            
            case 'memory/search_nodes':
                return this.searchNodes(params.query);
            
            case 'memory/open_nodes':
                return this.getEntityDetails(params.entityName);
            
            default:
                throw new Error(`Unknown MCP method: ${method}`);
        }
    }
}
