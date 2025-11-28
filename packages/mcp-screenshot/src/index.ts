import { createMCPServer } from '@ai-capability-suite/mcp-core';
import { screenshotTool } from './tools/screenshot';

const server = createMCPServer({
  name: 'screenshot-server',
  version: '0.0.1',
  description: 'MCP server for screen capture and image operations',
  tools: [screenshotTool],
});

server.start().catch(console.error);
