# MCP Process Server

A Model Context Protocol (MCP) server that provides process management and monitoring capabilities for AI agents, with strict security boundaries enforced by executable allowlists.

## Features

- **Process Launching**: Spawn processes with specified arguments and environment
- **Resource Monitoring**: Track CPU, memory, and I/O usage
- **Output Capture**: Capture stdout and stderr streams
- **Process Termination**: Graceful and forced termination
- **Service Management**: Long-running services with auto-restart
- **Process Groups**: Manage related processes and pipelines
- **Security**: Multi-layer security with executable allowlists

## Security

This server implements defense-in-depth security:

1. **Executable Allowlist**: Only pre-approved executables can be launched
2. **Argument Validation**: Command arguments validated for injection attacks
3. **Environment Sanitization**: Dangerous environment variables removed
4. **Resource Limits**: CPU, memory, and time limits prevent resource exhaustion
5. **Privilege Prevention**: No privilege escalation or setuid executables
6. **Audit Logging**: Complete operation tracking

## Installation

```bash
npm install @ai-capabilities-suite/mcp-process
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## License

MIT
