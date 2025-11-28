import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MCPServerConfig, MCPTool } from './types';

export class MCPServerBase {
  private server: Server;
  private tools: Map<string, MCPTool>;

  constructor(config: MCPServerConfig) {
    this.server = new Server({
      name: config.name,
      version: config.version,
    });

    this.tools = new Map();
    config.tools.forEach((tool) => {
      this.tools.set(tool.schema.name, tool);
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(
      { method: 'tools/list' },
      async () => ({
        tools: Array.from(this.tools.values()).map((tool) => ({
          name: tool.schema.name,
          description: tool.schema.description,
          inputSchema: tool.schema.inputSchema,
        })),
      })
    );

    this.server.setRequestHandler(
      { method: 'tools/call' },
      async (request: any) => {
        const tool = this.tools.get(request.params.name);
        if (!tool) {
          throw new Error(`Tool not found: ${request.params.name}`);
        }

        const result = await tool.handler(request.params.arguments);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
    );
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
