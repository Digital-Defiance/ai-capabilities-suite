import { z } from 'zod';

export interface MCPToolSchema {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
}

export type MCPToolHandler = (input: unknown) => Promise<unknown>;

export interface MCPTool {
  schema: MCPToolSchema;
  handler: MCPToolHandler;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  description: string;
  tools: MCPTool[];
}
