# MCP Debugger Server

A Model Context Protocol (MCP) server that provides comprehensive debugging capabilities for Node.js and TypeScript applications. This server enables AI agents to interactively debug code by setting breakpoints, inspecting variables, stepping through execution, and detecting problematic runtime conditions such as hanging processes and infinite loops.

## Features

- **Breakpoint Management**: Set, remove, toggle, and list breakpoints with optional conditions
- **Execution Control**: Continue, step over, step into, step out, and pause execution
- **Variable Inspection**: Inspect local and global variables, evaluate expressions, and watch variables
- **Call Stack Navigation**: View and navigate through call stack frames
- **Hang Detection**: Detect infinite loops and hanging processes with configurable timeouts
- **TypeScript Support**: Full source map support for debugging TypeScript code
- **Session Management**: Support for multiple concurrent debug sessions
- **Test Framework Integration**: Debug Jest, Mocha, and Vitest tests

## Installation

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Build from Source

```bash
# Clone the repository
git clone <repository-url>
cd <repository-directory>

# Install dependencies
npm install

# Build the packages
npx nx build @digitaldefiance/ts-mcp-core
npx nx build @digitaldefiance/ts-mcp-server
```

### Configuration

Add the debugger server to your MCP configuration file (`.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "debugger": {
      "command": "node",
      "args": ["packages/mcp-server/dist/src/index.js"],
      "env": {
        "NODE_ENV": "production"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Tools

The MCP Debugger Server provides 21 tools for comprehensive debugging:

### Session Management

#### 1. `debugger_start`
Start a new debug session with a Node.js process.

**Parameters:**
- `command` (string, required): The command to execute (e.g., "node", "npm")
- `args` (string[], optional): Command arguments (e.g., ["test.js"])
- `cwd` (string, optional): Working directory for the process
- `timeout` (number, optional): Timeout in milliseconds (default: 30000)

**Example:**
```json
{
  "command": "node",
  "args": ["app.js"],
  "cwd": "/path/to/project",
  "timeout": 30000
}
```

**Response:**
```json
{
  "status": "success",
  "sessionId": "session-123",
  "state": "paused",
  "pid": 12345
}
```

#### 2. `debugger_stop_session`
Stop a debug session and cleanup all resources.

**Parameters:**
- `sessionId` (string, required): The debug session ID

**Example:**
```json
{
  "sessionId": "session-123"
}
```

### Breakpoint Management

#### 3. `debugger_set_breakpoint`
Set a breakpoint at a specific file and line number.

**Parameters:**
- `sessionId` (string, required): The debug session ID
- `file` (string, required): The file path (absolute or relative)
- `line` (number, required): The line number (1-indexed)
- `condition` (string, optional): Optional condition expression (e.g., "x > 10")

**Example:**
```json
{
  "sessionId": "session-123",
  "file": "/path/to/file.js",
  "line": 42,
  "condition": "count > 5"
}
```

#### 4. `debugger_remove_breakpoint`
Remove a breakpoint from the session.

**Parameters:**
- `sessionId` (string, required): The debug session ID
- `breakpointId` (string, required): The breakpoint ID to remove

#### 5. `debugger_toggle_breakpoint`
Toggle a breakpoint between enabled and disabled states.

**Parameters:**
- `sessionId` (string, required): The debug session ID
- `breakpointId` (string, required): The breakpoint ID to toggle

#### 6. `debugger_list_breakpoints`
Get all breakpoints for a debug session.

**Parameters:**
- `sessionId` (string, required): The debug session ID

**Response:**
```json
{
  "status": "success",
  "breakpoints": [
    {
      "id": "bp-1",
      "file": "/path/to/file.js",
      "line": 42,
      "condition": "x > 10",
      "enabled": true,
      "verified": true
    }
  ]
}
```

### Execution Control

#### 7. `debugger_continue`
Resume execution until the next breakpoint or program termination.

**Parameters:**
- `sessionId` (string, required): The debug session ID

#### 8. `debugger_step_over`
Execute the current line and pause at the next line in the same scope.

**Parameters:**
- `sessionId` (string, required): The debug session ID

#### 9. `debugger_step_into`
Execute the current line and pause at the first line inside any called function.

**Parameters:**
- `sessionId` (string, required): The debug session ID

#### 10. `debugger_step_out`
Execute until the current function returns and pause at the calling location.

**Parameters:**
- `sessionId` (string, required): The debug session ID

#### 11. `debugger_pause`
Pause a running debug session.

**Parameters:**
- `sessionId` (string, required): The debug session ID

### Variable Inspection

#### 12. `debugger_inspect`
Evaluate a JavaScript expression in the current execution context.

**Parameters:**
- `sessionId` (string, required): The debug session ID
- `expression` (string, required): The JavaScript expression to evaluate

**Example:**
```json
{
  "sessionId": "session-123",
  "expression": "user.name + ' ' + user.age"
}
```

#### 13. `debugger_get_local_variables`
Get all local variables in the current scope.

**Parameters:**
- `sessionId` (string, required): The debug session ID

#### 14. `debugger_get_global_variables`
Get global variables accessible from the current scope.

**Parameters:**
- `sessionId` (string, required): The debug session ID

#### 15. `debugger_inspect_object`
Inspect an object's properties with nested resolution.

**Parameters:**
- `sessionId` (string, required): The debug session ID
- `objectId` (string, required): The object ID from a previous inspection
- `maxDepth` (number, optional): Maximum depth to traverse (default: 2)

### Variable Watching

#### 16. `debugger_add_watch`
Add an expression to the watch list.

**Parameters:**
- `sessionId` (string, required): The debug session ID
- `expression` (string, required): The expression to watch

#### 17. `debugger_remove_watch`
Remove an expression from the watch list.

**Parameters:**
- `sessionId` (string, required): The debug session ID
- `watchId` (string, required): The watch ID (expression) to remove

#### 18. `debugger_get_watches`
Get all watched expressions with their current values.

**Parameters:**
- `sessionId` (string, required): The debug session ID

### Call Stack

#### 19. `debugger_get_stack`
Get the current call stack with function names and file locations.

**Parameters:**
- `sessionId` (string, required): The debug session ID

**Response:**
```json
{
  "status": "success",
  "stack": [
    {
      "function": "myFunction",
      "file": "/absolute/path/to/file.js",
      "line": 42,
      "column": 10
    }
  ]
}
```

#### 20. `debugger_switch_stack_frame`
Switch the execution context to a specific stack frame.

**Parameters:**
- `sessionId` (string, required): The debug session ID
- `frameIndex` (number, required): The frame index (0 = top frame)

### Hang Detection

#### 21. `debugger_detect_hang`
Detect if a process hangs or enters an infinite loop.

**Parameters:**
- `command` (string, required): The command to execute
- `args` (string[], optional): Command arguments
- `cwd` (string, optional): Working directory
- `timeout` (number, required): Timeout in milliseconds
- `sampleInterval` (number, optional): Sample interval for loop detection (default: 100ms)

**Example:**
```json
{
  "command": "node",
  "args": ["script.js"],
  "timeout": 5000,
  "sampleInterval": 100
}
```

**Response (hung):**
```json
{
  "status": "success",
  "hung": true,
  "location": "/path/to/file.js:42",
  "stack": [...],
  "message": "Process hung at /path/to/file.js:42",
  "duration": 5000
}
```

**Response (completed):**
```json
{
  "status": "success",
  "hung": false,
  "completed": true,
  "exitCode": 0,
  "duration": 1234
}
```

## Common Debugging Scenarios

### Scenario 1: Debug a Simple Script

```javascript
// 1. Start a debug session
{
  "tool": "debugger_start",
  "args": {
    "command": "node",
    "args": ["my-script.js"]
  }
}
// Returns: { sessionId: "session-123", state: "paused" }

// 2. Set a breakpoint
{
  "tool": "debugger_set_breakpoint",
  "args": {
    "sessionId": "session-123",
    "file": "/path/to/my-script.js",
    "line": 10
  }
}

// 3. Continue execution
{
  "tool": "debugger_continue",
  "args": {
    "sessionId": "session-123"
  }
}

// 4. When paused at breakpoint, inspect variables
{
  "tool": "debugger_get_local_variables",
  "args": {
    "sessionId": "session-123"
  }
}

// 5. Step through code
{
  "tool": "debugger_step_over",
  "args": {
    "sessionId": "session-123"
  }
}

// 6. Stop the session
{
  "tool": "debugger_stop_session",
  "args": {
    "sessionId": "session-123"
  }
}
```

### Scenario 2: Debug a Failing Test

```javascript
// 1. Start debugging a Jest test
{
  "tool": "debugger_start",
  "args": {
    "command": "node",
    "args": ["node_modules/.bin/jest", "my-test.spec.js", "--runInBand"],
    "timeout": 60000
  }
}

// 2. Set breakpoint in test file
{
  "tool": "debugger_set_breakpoint",
  "args": {
    "sessionId": "session-123",
    "file": "/path/to/my-test.spec.js",
    "line": 25
  }
}

// 3. Continue to breakpoint
{
  "tool": "debugger_continue",
  "args": {
    "sessionId": "session-123"
  }
}

// 4. Inspect test variables
{
  "tool": "debugger_inspect",
  "args": {
    "sessionId": "session-123",
    "expression": "expect.getState()"
  }
}
```

### Scenario 3: Detect an Infinite Loop

```javascript
// Use hang detection to identify infinite loops
{
  "tool": "debugger_detect_hang",
  "args": {
    "command": "node",
    "args": ["potentially-hanging-script.js"],
    "timeout": 5000,
    "sampleInterval": 100
  }
}
// Returns hang location and stack trace if hung
```

### Scenario 4: Debug TypeScript Code

```javascript
// TypeScript debugging works automatically with source maps
// 1. Ensure your tsconfig.json has "sourceMap": true

// 2. Start debugging the compiled JavaScript
{
  "tool": "debugger_start",
  "args": {
    "command": "node",
    "args": ["--enable-source-maps", "dist/app.js"]
  }
}

// 3. Set breakpoints using TypeScript file paths
{
  "tool": "debugger_set_breakpoint",
  "args": {
    "sessionId": "session-123",
    "file": "/path/to/src/app.ts",  // TypeScript source file
    "line": 42
  }
}
// The debugger automatically maps to the compiled JavaScript location
```

### Scenario 5: Watch Variable Changes

```javascript
// 1. Start session and set breakpoint
// ... (as in Scenario 1)

// 2. Add watched variables
{
  "tool": "debugger_add_watch",
  "args": {
    "sessionId": "session-123",
    "expression": "user.balance"
  }
}

// 3. Continue execution
{
  "tool": "debugger_continue",
  "args": {
    "sessionId": "session-123"
  }
}

// 4. Check watched variables at each pause
{
  "tool": "debugger_get_watches",
  "args": {
    "sessionId": "session-123"
  }
}
// Returns: { watches: [{ watchId: "user.balance", value: 100, changed: true, oldValue: 50, newValue: 100 }] }
```

## Troubleshooting

### Issue: "Session not found"
**Cause**: The session ID is invalid or the session has been terminated.
**Solution**: Start a new debug session with `debugger_start`.

### Issue: "Process must be paused"
**Cause**: Trying to inspect variables or step when the process is running.
**Solution**: Set a breakpoint and continue to it, or use `debugger_pause` to pause execution.

### Issue: Breakpoint not hitting
**Cause**: The breakpoint location may not be valid or the code path isn't executed.
**Solution**: 
- Verify the file path is correct (use absolute paths)
- Check that the line number has executable code
- Use `debugger_list_breakpoints` to verify the breakpoint is set and verified

### Issue: Hang detection false positives
**Cause**: The timeout is too short for the script's normal execution time.
**Solution**: Increase the `timeout` parameter in `debugger_detect_hang`.

### Issue: TypeScript breakpoints not working
**Cause**: Source maps are not enabled or not found.
**Solution**:
- Ensure `"sourceMap": true` in tsconfig.json
- Use `--enable-source-maps` flag when starting Node.js
- Verify .map files exist alongside compiled JavaScript

### Issue: "Cannot find module" errors
**Cause**: The packages haven't been built.
**Solution**:
```bash
npx nx build @digitaldefiance/ts-mcp-core
npx nx build @digitaldefiance/ts-mcp-server
```

### Issue: WebSocket connection errors
**Cause**: The Inspector Protocol failed to start.
**Solution**:
- Ensure Node.js version is 16 or higher
- Check that no other debugger is attached to the process
- Verify the process starts successfully

## Error Codes

The server returns structured error responses with the following codes:

- `SESSION_NOT_FOUND`: The specified session ID doesn't exist
- `SESSION_START_FAILED`: Failed to start the debug session
- `BREAKPOINT_SET_FAILED`: Failed to set the breakpoint
- `BREAKPOINT_NOT_FOUND`: The specified breakpoint doesn't exist
- `CONTINUE_FAILED`: Failed to resume execution
- `STEP_OVER_FAILED`: Failed to step over
- `STEP_INTO_FAILED`: Failed to step into
- `STEP_OUT_FAILED`: Failed to step out
- `PAUSE_FAILED`: Failed to pause execution
- `INSPECT_FAILED`: Failed to evaluate expression
- `GET_STACK_FAILED`: Failed to get call stack
- `NOT_PAUSED`: Operation requires the process to be paused
- `HANG_DETECTION_FAILED`: Failed to detect hang
- `WATCH_NOT_FOUND`: The specified watch doesn't exist

## Testing

### Run Unit Tests
```bash
npx nx test @digitaldefiance/ts-mcp-core
npx nx test @digitaldefiance/ts-mcp-server
```

### Run E2E Tests
```bash
npx nx test @digitaldefiance/ts-mcp-server --testPathPattern=e2e --testTimeout=60000
```

### Manual Testing
```bash
node packages/mcp-server/test-mcp-manual.js
```

See [TESTING.md](./TESTING.md) for comprehensive testing documentation.

## Architecture

The MCP Debugger Server is built on:

- **MCP SDK**: Model Context Protocol implementation
- **Chrome DevTools Protocol (CDP)**: Node.js Inspector Protocol for debugging
- **WebSocket**: Communication with the Node.js Inspector
- **TypeScript**: Type-safe implementation

### Component Overview

```
┌─────────────────┐
│   AI Agent      │
│   (Kiro)        │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│  MCP Debugger   │
│     Server      │
└────────┬────────┘
         │ Inspector Protocol (CDP)
         │
┌────────▼────────┐
│   Node.js       │
│   Process       │
└─────────────────┘
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run the test suite
5. Submit a pull request

## License

[Add your license information here]

## Support

For issues, questions, or contributions, please visit:
- GitHub Issues: [Add your repository URL]
- Documentation: [Add documentation URL]

## Changelog

### Version 1.0.0
- Initial release
- 21 comprehensive debugging tools
- Full TypeScript support with source maps
- Hang detection with configurable sampling
- Multiple concurrent sessions with isolation
- Test framework integration (Jest, Mocha, Vitest)
- Variable watching with change detection
- Call stack navigation
- Conditional breakpoints
- Object inspection with nested resolution
