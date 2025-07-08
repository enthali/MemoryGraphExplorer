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
            console.log('🔄 Falling back to mock data...');
            
            // Fallback to mock data if MCP server is not available
            return this.getMockData();
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
            console.log('🔄 Falling back to mock data search...');
            
            // Fallback to searching mock data
            const fullGraph = this.getMockData();
            const queryLower = query.toLowerCase();
            
            const matchingEntities = fullGraph.entities.filter(entity =>
                entity.name.toLowerCase().includes(queryLower) ||
                entity.entityType.toLowerCase().includes(queryLower) ||
                entity.observations.some(obs => obs.toLowerCase().includes(queryLower))
            );
            
            const entityNames = new Set(matchingEntities.map(e => e.name));
            const matchingRelations = fullGraph.relations.filter(rel =>
                entityNames.has(rel.from) || entityNames.has(rel.to)
            );
            
            return {
                entities: matchingEntities,
                relations: matchingRelations
            };
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
            console.log('🔄 Falling back to mock data...');
            
            // Fallback to searching mock data
            const fullGraph = this.getMockData();
            
            const entity = fullGraph.entities.find(e => e.name === entityName);
            if (!entity) {
                throw new Error(`Entity not found: ${entityName}`);
            }
            
            // Get all relations involving this entity
            const relations = fullGraph.relations.filter(rel =>
                rel.from === entityName || rel.to === entityName
            );
            
            return {
                entity,
                relations
            };
        }
    }

    // Fallback data that matches the real knowledge graph structure
    // This is used when the MCP Data Server is not available
    // The data is a copy of the real professional network and project information
    getMockData() {
        return {
            entities: [
                // Add Georg Doll as the central entity (you)
                {
                    name: 'Georg Doll',
                    entityType: 'Microsoft Team Member',
                    observations: [
                        'Company: Microsoft',
                        'Title: CTO Automotive and Mobility',
                        'Focus on automotive industry and AI initiatives',
                        'Based in Germany, covering European automotive market',
                        'Expertise in AI, automotive technology, and industry partnerships',
                        'Active in conference speaking and industry networking'
                    ]
                },
                {
                    name: 'Marek Neumann',
                    entityType: 'Professional Contact',
                    observations: [
                        'Vice President of Munich Research Center, CTO Automotive at Huawei',
                        'Long-term professional relationship spanning many years',
                        'Email: marek.neumann@huawei.com',
                        'Phone: +49 176 705 3985',
                        'Met at Automotive Electronic Kongress (AEK) in Ludwigsburg, June 25-26, 2025',
                        'Follow-up meeting scheduled for Munich location',
                        'Works at Huawei Munich Research Center focusing on automotive technology'
                    ]
                },
                {
                    entityType: 'Industry Event',
                    name: 'Automotive Electronic Kongress (AEK) 2025',
                    observations: [
                        'Held in Ludwigsburg, Germany',
                        'Dates: June 25-26, 2025',
                        'Focus on AI opportunities in automotive R&D',
                        'Extensive networking with industry professionals',
                        'Generated multiple meaningful business connections',
                        'Location: Ludwigsburg automotive industry hub',
                        'Successfully attended after Norway vacation',
                        'Generated substantial follow-up opportunities requiring coordination',
                        'Strong momentum on AI initiatives in automotive sector'
                    ]
                },
                {
                    entityType: 'Professional Contact',
                    name: 'Thomas Günther',
                    observations: [
                        'Chief Launch Officer (CLO) at CARIAD',
                        'Met at Automotive Electronic Kongress (AEK) 2025 in Ludwigsburg',
                        'Focus area: AI strategy discussion with CFO',
                        'Collaboration: Comprehensive AI implementation strategy',
                        'Partners with Kai Wang for joint presentations',
                        'Microsoft account team: Markus Herber and Christian Simon handle follow-up'
                    ]
                },
                {
                    entityType: 'Professional Contact',
                    name: 'Christiane Viereck',
                    observations: [
                        'Contact at CapGemini',
                        'Met through ConMod Simulation Project discussions at AEK 2025',
                        'CapGemini submitted AWS-based proposal for ConMod Simulation',
                        'Will provide current concept document',
                        'Holger Rothaug coordinates calls with CapGemini',
                        'Focus: Competitive positioning discussions'
                    ]
                },
                {
                    entityType: 'Professional Contact',
                    name: 'Martin Schleicher',
                    observations: [
                        'Connection to VDA (Verband der Deutschen Automobilhersteller)',
                        'Met at Automotive Electronic Kongress (AEK) 2025',
                        'Focus: Open Source Business Models Discussion',
                        'Established pathway to VDA collaboration',
                        'Facilitates automotive industry association connections'
                    ]
                },
                {
                    entityType: 'Microsoft Team Member',
                    name: 'Kai Wang',
                    observations: [
                        'Microsoft colleague and project partner',
                        'Joint presentation partner for CARIAD AI strategy discussions',
                        'Collaborates on ConMod Simulation Project with CapGemini',
                        'Key partner for automotive industry initiatives',
                        'Works closely on customer engagements and technical discussions'
                    ]
                },
                {
                    entityType: 'Microsoft Team Member',
                    name: 'Markus Herber',
                    observations: [
                        'Microsoft CARIAD account team member',
                        'Handles follow-up activities with CARIAD customers',
                        'Works with Christian Simon on account management',
                        'Supports AI strategy discussions and implementations',
                        'Focus on CARIAD relationship management'
                    ]
                },
                {
                    entityType: 'Microsoft Team Member',
                    name: 'Christian Simon',
                    observations: [
                        'Microsoft CARIAD account team member',
                        'Partners with Markus Herber on account activities',
                        'Handles follow-up activities with CARIAD customers',
                        'Supports comprehensive AI implementation strategy',
                        'Focus on CARIAD relationship management'
                    ]
                },
                {
                    entityType: 'Microsoft Team Member',
                    name: 'Campbell Vertesi',
                    observations: [
                        'Microsoft Product Manager',
                        'Email: Campbell.Vertesi@microsoft.com',
                        'Key participant in RedHat partnership discussions',
                        'Product management focus on partnership initiatives',
                        'Coordinates with partner managers on technical products'
                    ]
                },
                {
                    entityType: 'Microsoft Team Member',
                    name: 'Holger Rothaug',
                    observations: [
                        'Microsoft team member',
                        'Coordinates calls with CapGemini',
                        'Handles competitive positioning discussions',
                        'Manages external partner relationships',
                        'Focus on technical partnership coordination'
                    ]
                },
                {
                    entityType: 'Microsoft Project',
                    name: 'L1VH Project',
                    observations: [
                        'Microsoft internal project requiring escalation',
                        'Engineering commitment secured during June 27 week',
                        'Follow-up completed after AEK congress',
                        'Project status: Active with secured engineering resources',
                        'Critical project requiring ongoing attention'
                    ]
                },
                {
                    entityType: 'Partnership Project',
                    name: 'ConMod Simulation Project',
                    observations: [
                        'Collaboration between Microsoft, CARIAD, and CapGemini',
                        'CapGemini submitted AWS-based proposal',
                        'Competitive positioning discussions required',
                        'Christiane Viereck leads CapGemini involvement',
                        'Kai Wang partners on Microsoft side',
                        'Holger Rothaug coordinates partnership calls'
                    ]
                },
                {
                    entityType: 'Customer Project',
                    name: 'Mahindra Voice Assistant MVP',
                    observations: [
                        'Full-day workshop conducted July 3, 2025 in Coimbatore',
                        'Focus on voice assistant capabilities integration',
                        'Microsoft technology demonstrated successfully',
                        'Mahindra shared architecture documents',
                        'All technical questions clarified',
                        'High confidence in MVP development feasibility',
                        'Follow-up call required early July 2025'
                    ]
                },
                {
                    entityType: 'Partnership Project',
                    name: 'RedHat Partnership Initiative',
                    observations: [
                        'Sync call conducted during India trip July 4, 2025',
                        'Michael Kuehl is RedHat partner manager contact',
                        'Campbell Vertesi involved as Microsoft Product Manager',
                        'Three-way follow-up call required',
                        'Partnership development focus',
                        'Coordination needed between Microsoft and RedHat teams'
                    ]
                },
                {
                    entityType: 'External Partner',
                    name: 'Michael Kuehl',
                    observations: [
                        'RedHat partner manager',
                        'Participated in sync call during India trip July 4, 2025',
                        'Key contact for RedHat partnership initiatives',
                        'Requires follow-up three-way call with Campbell Vertesi',
                        'Focus on Microsoft-RedHat collaboration development'
                    ]
                },
                {
                    entityType: 'Microsoft Team Member',
                    name: 'Robert Lockner',
                    observations: [
                        'Microsoft Industry Advisor',
                        'Leads the Industry Advisor group at Microsoft Germany',
                        'Similar role to Kai Wang in industry advisory capacity',
                        'Focus on automotive and industry initiatives',
                        'Leadership role in German Microsoft industry advisory team',
                        'Key contact for industry strategy and partnerships'
                    ]
                },
                {
                    entityType: 'Microsoft Team Member',
                    name: 'Frank Kalek',
                    observations: [
                        'Microsoft Industry Advisor team member',
                        'Part of the L1VH project team',
                        'Holds Volvo AB (Truck) customer relationship',
                        'Focus on autonomous vehicle and trucking industry',
                        'Works within Robert Lockner\'s Industry Advisor group',
                        'Key account manager for Volvo truck division'
                    ]
                },
                {
                    entityType: 'Customer',
                    name: 'Volvo AB (Truck)',
                    observations: [
                        'Swedish truck manufacturer',
                        'Focus on autonomous vehicle technology',
                        'Microsoft customer relationship managed by Frank Kalek',
                        'Part of Volvo Group truck division',
                        'Key customer for automotive AI and autonomous systems'
                    ]
                },
                {
                    entityType: 'Customer',
                    name: 'Volkswagen (VW)',
                    observations: [
                        'German automotive manufacturer',
                        'Major automotive OEM customer',
                        'Microsoft customer relationship managed by Kai Wang',
                        'Focus on automotive technology and digital transformation',
                        'Key strategic automotive customer'
                    ]
                },
                {
                    entityType: 'Customer',
                    name: 'BMW',
                    observations: [
                        'German premium automotive manufacturer',
                        'Major automotive OEM customer',
                        'Microsoft customer relationship managed by Kai Wang',
                        'Focus on premium automotive technology and innovation',
                        'Key strategic automotive customer'
                    ]
                }
            ],
            relations: [
                // Georg Doll connections
                { from: 'Georg Doll', to: 'Automotive Electronic Kongress (AEK) 2025', relationType: 'attended' },
                { from: 'Georg Doll', to: 'Marek Neumann', relationType: 'has long-term relationship with' },
                { from: 'Georg Doll', to: 'Thomas Günther', relationType: 'met at event' },
                { from: 'Georg Doll', to: 'Christiane Viereck', relationType: 'met at event' },
                { from: 'Georg Doll', to: 'Martin Schleicher', relationType: 'met at event' },
                { from: 'Georg Doll', to: 'Kai Wang', relationType: 'collaborates with' },
                { from: 'Georg Doll', to: 'Robert Lockner', relationType: 'works with' },
                { from: 'Georg Doll', to: 'ConMod Simulation Project', relationType: 'involved in' },
                { from: 'Georg Doll', to: 'L1VH Project', relationType: 'escalated' },
                { from: 'Georg Doll', to: 'Mahindra Voice Assistant MVP', relationType: 'conducted workshop for' },
                { from: 'Georg Doll', to: 'RedHat Partnership Initiative', relationType: 'participated in' },
                
                // Original relations
                { from: 'Marek Neumann', to: 'Automotive Electronic Kongress (AEK) 2025', relationType: 'attended' },
                { from: 'Thomas Günther', to: 'Automotive Electronic Kongress (AEK) 2025', relationType: 'attended' },
                { from: 'Christiane Viereck', to: 'Automotive Electronic Kongress (AEK) 2025', relationType: 'attended' },
                { from: 'Martin Schleicher', to: 'Automotive Electronic Kongress (AEK) 2025', relationType: 'attended' },
                { from: 'Automotive Electronic Kongress (AEK) 2025', to: 'Marek Neumann', relationType: 'generated follow-up with' },
                { from: 'Automotive Electronic Kongress (AEK) 2025', to: 'Thomas Günther', relationType: 'generated follow-up with' },
                { from: 'Automotive Electronic Kongress (AEK) 2025', to: 'Christiane Viereck', relationType: 'generated follow-up with' },
                { from: 'Automotive Electronic Kongress (AEK) 2025', to: 'Martin Schleicher', relationType: 'generated follow-up with' },
                { from: 'Kai Wang', relationType: 'collaborates on', to: 'ConMod Simulation Project' },
                { from: 'Kai Wang', relationType: 'partners with', to: 'Thomas Günther' },
                { from: 'Christiane Viereck', relationType: 'leads', to: 'ConMod Simulation Project' },
                { from: 'Holger Rothaug', relationType: 'coordinates', to: 'ConMod Simulation Project' },
                { from: 'Markus Herber', relationType: 'manages account for', to: 'Thomas Günther' },
                { from: 'Christian Simon', relationType: 'manages account for', to: 'Thomas Günther' },
                { from: 'Campbell Vertesi', relationType: 'collaborates on', to: 'RedHat Partnership Initiative' },
                { from: 'Michael Kuehl', relationType: 'leads', to: 'RedHat Partnership Initiative' },
                { from: 'ConMod Simulation Project', relationType: 'originated from', to: 'Automotive Electronic Kongress (AEK) 2025' },
                { from: 'Mahindra Voice Assistant MVP', relationType: 'requires follow-up', to: 'Marek Neumann' },
                { from: 'Robert Lockner', relationType: 'leads team with', to: 'Kai Wang' },
                { from: 'Robert Lockner', relationType: 'oversees', to: 'L1VH Project' },
                { from: 'Kai Wang', relationType: 'reports to', to: 'Robert Lockner' },
                { from: 'Frank Kalek', relationType: 'reports to', to: 'Robert Lockner' },
                { from: 'Frank Kalek', relationType: 'collaborates on', to: 'L1VH Project' },
                { from: 'Frank Kalek', relationType: 'manages customer relationship', to: 'Volvo AB (Truck)' },
                { from: 'Kai Wang', relationType: 'manages customer relationship', to: 'Volkswagen (VW)' },
                { from: 'Kai Wang', relationType: 'manages customer relationship', to: 'BMW' },
                { from: 'Robert Lockner', relationType: 'leads team with', to: 'Frank Kalek' },
                { from: 'Volvo AB (Truck)', relationType: 'works with Microsoft on', to: 'L1VH Project' }
            ]
        };
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
