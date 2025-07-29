#!/usr/bin/env node

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import { randomUUID } from 'node:crypto';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { KnowledgeGraphManager } from './src/KnowledgeGraphManager.js';
import { 
  toolDefinitions,
  createEntitiesHandler,
  createRelationsHandler,
  addObservationsHandler,
  deleteEntitiesHandler,
  deleteObservationsHandler,
  deleteRelationsHandler,
  readGraphHandler,
  searchGraphHandler,
  openNodesHandler,
  getNodeRelationsHandler,
  renameEntityHandler,
  validateIntegrityHandler,
  listTypesHandler,
  createTypeHandler,
  deleteTypeHandler
} from './src/tools/index.js';

console.error('Starting MCP Streamable HTTP Server...');

// Create Knowledge Graph Manager instance
const knowledgeGraph = new KnowledgeGraphManager();

// Create MCP server - following official StreamableHTTP pattern
function createMCPServer() {
  const server = new Server({
    name: "memory-mcp-server",  
    version: "0.6.3",
  }, {
    capabilities: {
      tools: {},
    },
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: toolDefinitions
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "create_entities":
          return await createEntitiesHandler(args as any, knowledgeGraph);
        case "create_relations":
          return await createRelationsHandler(args as any, knowledgeGraph);
        case "add_observations":
          return await addObservationsHandler(args as any, knowledgeGraph);
        case "delete_entities":
          return await deleteEntitiesHandler(args as any, knowledgeGraph);
        case "delete_observations":
          return await deleteObservationsHandler(args as any, knowledgeGraph);
        case "delete_relations":
          return await deleteRelationsHandler(args as any, knowledgeGraph);
        case "read_graph":
          return await readGraphHandler(args as any, knowledgeGraph);
        case "search_graph":
          return await searchGraphHandler(args as any, knowledgeGraph);
        case "open_nodes":
          return await openNodesHandler(args as any, knowledgeGraph);
        case "get_node_relations":
          return await getNodeRelationsHandler(args as any, knowledgeGraph);
        case "rename_entity":
          return await renameEntityHandler(args as any, knowledgeGraph);
        case "validate_integrity":
          return await validateIntegrityHandler(args as any, knowledgeGraph);
        case "list_types":
          return await listTypesHandler(args as any, knowledgeGraph);
        case "create_type":
          return await createTypeHandler(args as any, knowledgeGraph);
        case "delete_type":
          return await deleteTypeHandler(args as any, knowledgeGraph);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  });

  const cleanup = async () => {
    // Any cleanup logic can go here
  };

  return { server, cleanup };
}

// Express app setup - following official pattern exactly
const app = express();

const transports: Map<string, StreamableHTTPServerTransport> = new Map<string, StreamableHTTPServerTransport>();

app.post('/mcp', async (req: Request, res: Response) => {
  console.error('Received MCP POST request');
  try {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.has(sessionId)) {
      // Reuse existing transport
      transport = transports.get(sessionId)!;
    } else if (!sessionId) {
      const { server, cleanup } = createMCPServer();

      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId: string) => {
          // Store the transport by session ID when session is initialized
          console.error(`Session initialized with ID: ${sessionId}`);
          transports.set(sessionId, transport);
        }
      });

      // Set up onclose handler to clean up transport when closed
      server.onclose = async () => {
        const sid = transport.sessionId;
        if (sid && transports.has(sid)) {
          console.error(`Transport closed for session ${sid}, removing from transports map`);
          transports.delete(sid);
          await cleanup();
        }
      };

      // Connect the transport to the MCP server BEFORE handling the request
      await server.connect(transport);

      await transport.handleRequest(req, res);
      return; // Already handled
    } else {
      // Invalid request - no session ID or not initialization request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: req?.body?.id,
      });
      return;
    }

    // Handle the request with existing transport
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: req?.body?.id,
      });
      return;
    }
  }
});

// Handle GET requests for SSE streams
app.get('/mcp', async (req: Request, res: Response) => {
  console.error('Received MCP GET request');
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: req?.body?.id,
    });
    return;
  }

  // Check for Last-Event-ID header for resumability
  const lastEventId = req.headers['last-event-id'] as string | undefined;
  if (lastEventId) {
    console.error(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
  } else {
    console.error(`Establishing new SSE stream for session ${sessionId}`);
  }

  const transport = transports.get(sessionId);
  await transport!.handleRequest(req, res);
});

// Handle DELETE requests for session termination
app.delete('/mcp', async (req: Request, res: Response) => {
  console.error('Received MCP DELETE request');
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: req?.body?.id,
    });
    return;
  }

  console.error(`Received session termination request for session ${sessionId}`);

  try {
    const transport = transports.get(sessionId);
    await transport!.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Error handling session termination',
        },
        id: req?.body?.id,
      });
      return;
    }
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.error(`MCP Streamable HTTP Server listening on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down server...');

  // Close all active transports to properly clean up resources
  for (const sessionId in transports) {
    try {
      console.error(`Closing transport for session ${sessionId}`);
      await transports.get(sessionId)!.close();
      transports.delete(sessionId);
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }

  console.error('Server shutdown complete');
  process.exit(0);
});
