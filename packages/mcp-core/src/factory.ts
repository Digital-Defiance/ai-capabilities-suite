import { MCPServerBase } from './server-base';
import { MCPServerConfig } from './types';

export function createMCPServer(config: MCPServerConfig): MCPServerBase {
  return new MCPServerBase(config);
}
