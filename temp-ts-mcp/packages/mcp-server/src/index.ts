export * from './lib/mcp-server.js';

// Main entry point for running the server
import { startMcpDebuggerServer } from './lib/mcp-server.js';

// Start the server if this is the main module
if (require.main === module) {
  startMcpDebuggerServer().catch((error) => {
    console.error('Failed to start MCP debugger server:', error);
    process.exit(1);
  });
}
