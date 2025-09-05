/**
 * MCP Client - Communication service for MCP Memory Server
 * Handles all API calls and data fetching from the MCP server
 */

export class MCPClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    console.log('🔌 MCP Client initialized');
    console.log(`📡 API Base URL: ${this.baseURL}`);
  }

  /**
   * Read the complete graph from MCP server
   * @returns {Promise<Object>} - Complete graph data with entities and relations
   */
  async readGraph() {
    console.log('📡 Fetching complete graph from MCP Memory Server...');
    
    try {
      const response = await fetch(`${this.baseURL}/graph`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.entities?.length || 0} entities and ${data.relations?.length || 0} relations from MCP Server`);
      
      return {
        entities: data.entities || [],
        relations: data.relations || []
      };
    } catch (error) {
      console.error('❌ Failed to fetch graph data from MCP Server:', error);
      throw new Error(`Unable to connect to MCP Memory Server. Please ensure the server is running and try again. Details: ${error.message}`);
    }
  }

  /**
   * List available entity and relation types
   * @returns {Promise<Object>} - Available types from MCP server
   */
  async listTypes() {
    console.log('📡 Fetching available types from MCP Memory Server...');
    
    try {
      // For now, extract types from the complete graph
      // In a real MCP implementation, this would be a separate endpoint
      const graphData = await this.readGraph();
      
      const entityTypes = [...new Set(graphData.entities.map(e => e.entityType))].sort();
      const relationTypes = [...new Set(graphData.relations.map(r => r.relationType))].sort();
      
      console.log(`✅ Found ${entityTypes.length} entity types and ${relationTypes.length} relation types`);
      
      return {
        entityTypes,
        relationTypes
      };
    } catch (error) {
      console.error('❌ Failed to fetch types from MCP Server:', error);
      throw new Error(`Unable to get types from MCP Memory Server. Details: ${error.message}`);
    }
  }

  /**
   * Search for entities matching a query
   * @param {string} query - Search query string
   * @returns {Promise<Object>} - Search results
   */
  async searchNodes(query) {
    console.log(`🔍 Searching nodes for: ${query}`);
    
    try {
      const response = await fetch(`${this.baseURL}/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Found ${data.entities?.length || 0} entities and ${data.relations?.length || 0} relations for "${query}"`);
      
      return {
        entities: data.entities || [],
        relations: data.relations || []
      };
    } catch (error) {
      console.error('❌ Failed to search nodes in MCP Server:', error);
      throw new Error(`Unable to search nodes. MCP Memory Server connection failed. Details: ${error.message}`);
    }
  }

  /**
   * Get detailed information about a specific entity
   * @param {string} entityName - Name of the entity to get details for
   * @returns {Promise<Object>} - Entity details with relations
   */
  async getEntityDetails(entityName) {
    console.log(`📋 Getting details for entity: ${entityName}`);
    
    try {
      const response = await fetch(`${this.baseURL}/entity?name=${encodeURIComponent(entityName)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.entity) {
        throw new Error(`Entity not found: ${entityName}`);
      }
      
      console.log(`✅ Loaded details for "${entityName}" with ${data.relations?.length || 0} relations`);
      
      return {
        entity: data.entity,
        relations: data.relations || []
      };
    } catch (error) {
      console.error('❌ Failed to get entity details from MCP Server:', error);
      throw new Error(`Unable to get entity details for "${entityName}". MCP Memory Server connection failed. Details: ${error.message}`);
    }
  }

  /**
   * Test connection to MCP server
   * @returns {Promise<boolean>} - True if connection is successful
   */
  async testConnection() {
    try {
      console.log('🔍 Testing MCP server connection...');
      await this.readGraph();
      console.log('✅ MCP server connection successful');
      return true;
    } catch (error) {
      console.error('❌ MCP server connection failed:', error);
      return false;
    }
  }

  /**
   * Generic MCP method call (for future extensibility)
   * @param {string} method - MCP method name
   * @param {Object} params - Method parameters
   * @returns {Promise<*>} - Method result
   */
  async callMCPMethod(method, params = {}) {
    console.log(`🔌 Calling MCP method: ${method}`, params);
    
    switch (method) {
      case 'memory/read_graph':
        return this.readGraph();
      
      case 'memory/list_types':
        return this.listTypes();
      
      case 'memory/search_nodes':
        return this.searchNodes(params.query);
      
      case 'memory/get_entity':
        return this.getEntityDetails(params.entityName);
      
      default:
        throw new Error(`Unknown MCP method: ${method}`);
    }
  }
}

// Create and export a singleton instance
export const mcpClient = new MCPClient();