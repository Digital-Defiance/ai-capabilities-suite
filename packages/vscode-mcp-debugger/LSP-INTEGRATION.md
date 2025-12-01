# Language Server Protocol (LSP) Integration Guide

## Overview

The MCP Debugger extension includes Language Server Protocol (LSP) integration that enables rich debugging features directly in VS Code and GitHub Copilot. This guide explains how the LSP integration works and how to leverage it for AI-assisted debugging.

**What is LSP?** The Language Server Protocol is a standardized protocol between development tools and language servers that provide features like auto-complete, go-to-definition, and diagnostics. The MCP Debugger extends LSP to provide debugging-specific features.

**Why LSP for Debugging?** By exposing debugging capabilities through LSP, we enable:
- Rich editor integration (hover, code lens, diagnostics)
- AI agent access to debugging tools
- Consistent debugging experience across editors
- Extensibility for custom debugging workflows

## Architecture

The extension uses a hybrid architecture combining:

1. **MCP Server**: Provides debugging tools via Model Context Protocol
2. **LSP Wrapper**: Exposes debugging capabilities through Language Server Protocol
3. **Debug Adapter Protocol (DAP)**: Integrates with VS Code's native debugging UI
4. **AI Agent Integration**: Enables GitHub Copilot and other AI assistants to use debugging tools

```
┌─────────────────────────────────────────────────────────────┐
│                         VS Code                              │
├─────────────────────────────────────────────────────────────┤
│  Editor UI  │  Debug UI (DAP)  │  GitHub Copilot           │
├─────────────┼──────────────────┼───────────────────────────┤
│             │                  │                            │
│  LSP Client │  DAP Client      │  MCP Client (AI Agent)    │
│             │                  │                            │
└──────┬──────┴────────┬─────────┴──────────┬────────────────┘
       │               │                    │
       ▼               ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              MCP Debugger Extension                          │
├─────────────────────────────────────────────────────────────┤
│  LSP Server  │  DAP Adapter    │  MCP Server               │
└──────┬───────┴────────┬────────┴──────────┬────────────────┘
       │                │                   │
       └────────────────┴───────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  Node.js Process │
              │  (CDP Inspector) │
              └──────────────────┘
```

## LSP Features

### 1. Hover Providers

When you hover over a variable while debugging, the LSP server provides:
- Current value
- Type information
- Scope (local, closure, global)
- Source-mapped TypeScript names

**Implementation:**
```typescript
connection.onHover((params: HoverParams): Hover | null => {
  const session = getActiveDebugSession();
  if (!session || !session.isPaused()) {
    return null;
  }
  
  const word = getWordAtPosition(params.textDocument.uri, params.position);
  const value = await session.evaluateExpression(word);
  
  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: formatVariableValue(value)
    }
  };
});
```

### 2. Code Lens

The LSP server provides code lens annotations for:
- **Breakpoint suggestions**: "🔴 Set breakpoint here"
- **Logpoint suggestions**: "📝 Add logpoint"
- **Performance hotspots**: "🔥 CPU hotspot detected"
- **Memory issues**: "⚠️ Memory allocation spike"

**Implementation:**
```typescript
connection.onCodeLens((params: CodeLensParams): CodeLens[] => {
  const lenses: CodeLens[] = [];
  
  // Add breakpoint suggestions at function entries
  const functions = parseDocument(params.textDocument.uri);
  for (const func of functions) {
    lenses.push({
      range: func.range,
      command: {
        title: "🔴 Set breakpoint",
        command: "mcp-debugger.setBreakpoint",
        arguments: [func.location]
      }
    });
  }
  
  return lenses;
});
```

### 3. Diagnostics

The LSP server publishes diagnostics for:
- Runtime errors detected during debugging
- Breakpoint verification failures
- Source map issues
- Performance warnings

**Implementation:**
```typescript
function publishDiagnostics(uri: string, errors: DebugError[]) {
  const diagnostics: Diagnostic[] = errors.map(error => ({
    severity: DiagnosticSeverity.Error,
    range: error.location,
    message: error.message,
    source: 'mcp-debugger',
    code: error.code
  }));
  
  connection.sendDiagnostics({ uri, diagnostics });
}
```

### 4. Custom Commands

The LSP server exposes debugging operations as workspace commands:

| Command | Description | Parameters |
|---------|-------------|------------|
| `mcp-debugger.setBreakpoint` | Set breakpoint at location | `file`, `line`, `condition?` |
| `mcp-debugger.setLogpoint` | Set logpoint at location | `file`, `line`, `message` |
| `mcp-debugger.inspectVariable` | Inspect variable value | `expression` |
| `mcp-debugger.evaluateExpression` | Evaluate expression | `expression` |
| `mcp-debugger.getCallStack` | Get current call stack | - |
| `mcp-debugger.startProfiling` | Start CPU profiling | - |
| `mcp-debugger.stopProfiling` | Stop CPU profiling | - |

**Implementation:**
```typescript
connection.onExecuteCommand(async (params: ExecuteCommandParams) => {
  switch (params.command) {
    case 'mcp-debugger.setBreakpoint':
      const [file, line, condition] = params.arguments;
      return await debugSession.setBreakpoint(file, line, condition);
      
    case 'mcp-debugger.inspectVariable':
      const [expression] = params.arguments;
      return await debugSession.evaluateExpression(expression);
      
    // ... other commands
  }
});
```

## GitHub Copilot Integration

### Agent Profile

The extension provides an agent profile that teaches Copilot how to use debugging tools:

```json
{
  "name": "mcp-debugger",
  "description": "Node.js debugging assistant with breakpoints, inspection, and profiling",
  "capabilities": [
    "set_breakpoints",
    "inspect_variables",
    "control_execution",
    "analyze_performance",
    "detect_hangs"
  ],
  "tools": [
    {
      "name": "debugger_start",
      "description": "Start a debug session for a Node.js process",
      "when": "User wants to debug a script or test"
    },
    {
      "name": "debugger_set_breakpoint",
      "description": "Set a breakpoint at a specific location",
      "when": "User wants to pause execution at a line"
    }
    // ... more tools
  ]
}
```

### Context Providers

The extension provides debugging context to Copilot:

```typescript
// Provide current debug state as context
export function getDebugContext(): DebugContext {
  const session = getActiveDebugSession();
  if (!session) {
    return { active: false };
  }
  
  return {
    active: true,
    paused: session.isPaused(),
    location: session.getCurrentLocation(),
    callStack: session.getCallStack(),
    localVariables: session.getLocalVariables(),
    breakpoints: session.getBreakpoints()
  };
}
```

### Example Copilot Interactions

**Setting a breakpoint:**
```
User: "Set a breakpoint in user-service.ts at line 45"

Copilot: I'll set a breakpoint for you.
[Executes: mcp-debugger.setBreakpoint("src/user-service.ts", 45)]

✓ Breakpoint set at user-service.ts:45
```

**Inspecting variables:**
```
User: "What's the value of userConfig?"

Copilot: Let me inspect that variable.
[Executes: mcp-debugger.inspectVariable("userConfig")]

userConfig = {
  id: "user-123",
  name: "John Doe",
  permissions: ["read", "write"]
}
```

**Performance analysis:**
```
User: "Profile this function to see why it's slow"

Copilot: I'll start CPU profiling.
[Executes: mcp-debugger.startProfiling()]
[Waits for execution]
[Executes: mcp-debugger.stopProfiling()]

Analysis:
- Total time: 2.3s
- Hotspot: database query (1.8s, 78%)
- Suggestion: Add database index on user_id column
```

## Tool Discovery for AI Agents

The LSP server exposes tool schemas that AI agents can discover:

```typescript
connection.onRequest('mcp/listTools', () => {
  return {
    tools: [
      {
        name: 'debugger_start',
        description: 'Start debugging a Node.js process',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Command to execute' },
            args: { type: 'array', items: { type: 'string' } },
            cwd: { type: 'string', description: 'Working directory' },
            timeout: { type: 'number', description: 'Timeout in ms' }
          },
          required: ['command']
        }
      },
      // ... more tools
    ]
  };
});
```

## Configuration

### VS Code Settings

```json
{
  "mcp-debugger.lsp.enabled": true,
  "mcp-debugger.lsp.hover.enabled": true,
  "mcp-debugger.lsp.codeLens.enabled": true,
  "mcp-debugger.lsp.diagnostics.enabled": true,
  "mcp-debugger.copilot.enabled": true,
  "mcp-debugger.copilot.autoSuggest": true
}
```

### Extension Activation

The LSP server activates when:
- A JavaScript/TypeScript file is opened
- A debug session starts
- Copilot requests debugging assistance

```typescript
export function activate(context: vscode.ExtensionContext) {
  // Start LSP server
  const serverModule = context.asAbsolutePath(
    path.join('out', 'server', 'lsp-server.js')
  );
  
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc }
  };
  
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'javascript' },
      { scheme: 'file', language: 'typescript' }
    ],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{js,ts}')
    }
  };
  
  const client = new LanguageClient(
    'mcp-debugger-lsp',
    'MCP Debugger LSP',
    serverOptions,
    clientOptions
  );
  
  client.start();
}
```

## Debugging Workflows

### 1. Interactive Debugging with Copilot

```
User: "Debug the failing test in auth.test.ts"

Copilot: I'll start a debug session for that test.
[Executes: debugger_start with Jest command]
[Sets breakpoint at first test]
[Continues execution]
[Pauses at breakpoint]

The test is failing because `user.token` is undefined.
Let me inspect the authentication flow...
[Inspects variables]

Found the issue: The mock authentication service isn't 
returning a token. Here's the fix:
[Suggests code change]
```

### 2. Performance Investigation

```
User: "Why is the API endpoint slow?"

Copilot: Let me profile the endpoint handler.
[Starts CPU profiling]
[Executes request]
[Stops profiling]

Performance analysis:
1. Database query: 850ms (65%)
2. JSON serialization: 280ms (21%)
3. Validation: 180ms (14%)

Recommendations:
1. Add database index on user_id
2. Use streaming JSON serialization
3. Cache validation results
```

### 3. Hang Detection

```
User: "The script seems to hang, can you find where?"

Copilot: I'll run hang detection.
[Executes: debugger_detect_hang]

Hang detected at:
File: data-processor.ts
Line: 156
Function: processRecords
Reason: Infinite loop - counter never increments

Call stack:
  processRecords (data-processor.ts:156)
  handleBatch (data-processor.ts:89)
  main (index.ts:23)
```

## Advanced Features

### Source Map Support

The LSP server automatically handles source maps:

```typescript
// Automatically maps TypeScript locations to JavaScript
const tsLocation = { file: 'src/app.ts', line: 42 };
const jsLocation = sourceMapManager.mapToGenerated(tsLocation);

// Set breakpoint in JavaScript
await debugSession.setBreakpoint(jsLocation);

// When paused, map back to TypeScript
const pausedLocation = await debugSession.getCurrentLocation();
const tsLocation = sourceMapManager.mapToOriginal(pausedLocation);

// Show TypeScript location to user
showLocation(tsLocation);
```

### Multi-Session Support

The LSP server can manage multiple debug sessions:

```typescript
// Session manager tracks multiple sessions
const sessionManager = new SessionManager();

// Each session has its own context
const session1 = await sessionManager.createSession({
  command: 'node',
  args: ['app.js']
});

const session2 = await sessionManager.createSession({
  command: 'node',
  args: ['worker.js']
});

// LSP commands target the active session
connection.onExecuteCommand(async (params) => {
  const activeSession = sessionManager.getActiveSession();
  // ... execute command on active session
});
```

### Performance Profiling Integration

```typescript
// Start profiling via LSP command
connection.onExecuteCommand(async (params) => {
  if (params.command === 'mcp-debugger.startProfiling') {
    const session = getActiveSession();
    await session.startCPUProfile();
    
    // Provide real-time updates via progress notifications
    connection.sendProgress(WorkDoneProgress.create(), {
      kind: 'begin',
      title: 'CPU Profiling',
      message: 'Recording...'
    });
  }
});

// Stop profiling and analyze
connection.onExecuteCommand(async (params) => {
  if (params.command === 'mcp-debugger.stopProfiling') {
    const session = getActiveSession();
    const profile = await session.stopCPUProfile();
    
    // Analyze and show results
    const analysis = analyzeCPUProfile(profile);
    
    // Publish diagnostics for hotspots
    publishPerformanceDiagnostics(analysis.hotspots);
    
    return analysis;
  }
});
```

## Troubleshooting

### LSP Server Not Starting

**Symptoms:**
- No hover information
- Code lens not appearing
- Commands not available

**Solutions:**
1. Check VS Code output panel: "MCP Debugger LSP"
2. Verify extension is activated: Check "Extensions" view
3. Restart LSP server: Command palette → "Restart LSP Server"
4. Check logs: `~/.vscode/extensions/mcp-debugger-*/logs/`

### Copilot Not Using Debugging Tools

**Symptoms:**
- Copilot doesn't suggest debugging actions
- Tool discovery fails

**Solutions:**
1. Verify Copilot is enabled: Settings → "mcp-debugger.copilot.enabled"
2. Check agent profile is loaded: Look for "mcp-debugger" in Copilot agents
3. Restart VS Code to reload agent profiles
4. Check MCP server is running: Command palette → "MCP: Show Server Status"

### Source Maps Not Working

**Symptoms:**
- Breakpoints set in wrong locations
- Variable names are mangled

**Solutions:**
1. Verify source maps are generated: Check for `.map` files
2. Enable source map support: `--enable-source-maps` flag
3. Check source map paths are correct
4. Verify `sourceRoot` in tsconfig.json

## API Reference

### LSP Server Methods

```typescript
interface MCPDebuggerLSP {
  // Hover provider
  onHover(params: HoverParams): Hover | null;
  
  // Code lens provider
  onCodeLens(params: CodeLensParams): CodeLens[];
  
  // Diagnostics
  publishDiagnostics(uri: string, diagnostics: Diagnostic[]): void;
  
  // Commands
  onExecuteCommand(params: ExecuteCommandParams): any;
  
  // Tool discovery
  listTools(): ToolDefinition[];
  
  // Context provider
  getDebugContext(): DebugContext;
}
```

### Debug Context

```typescript
interface DebugContext {
  active: boolean;
  paused?: boolean;
  location?: SourceLocation;
  callStack?: StackFrame[];
  localVariables?: Variable[];
  breakpoints?: Breakpoint[];
  profiling?: {
    active: boolean;
    type: 'cpu' | 'memory';
  };
}
```

## Best Practices

### 1. Use Descriptive Breakpoint Conditions

```typescript
// Good: Clear condition
await setBreakpoint('app.ts', 42, 'user.role === "admin"');

// Bad: Complex condition
await setBreakpoint('app.ts', 42, 'user && user.role && user.role === "admin" && user.active');
```

### 2. Leverage Logpoints for Non-Intrusive Debugging

```typescript
// Instead of adding console.log and restarting
await setLogpoint('app.ts', 42, 'User {user.id} logged in');

// Logs appear in debug console without modifying code
```

### 3. Use Copilot for Complex Debugging Scenarios

```
// Let Copilot orchestrate multi-step debugging
User: "Find why the memory usage keeps growing"

Copilot:
1. Takes heap snapshot
2. Runs code for 30 seconds
3. Takes another heap snapshot
4. Compares snapshots
5. Identifies leaked objects
6. Suggests fix
```

### 4. Profile Before Optimizing

```typescript
// Always profile first to find real bottlenecks
await startCPUProfile();
// ... run code ...
const profile = await stopCPUProfile();
const hotspots = analyzeProfile(profile);

// Focus optimization on top hotspots
```

## Examples

See the [examples directory](./examples/) for complete examples:

- [Basic debugging workflow](./examples/basic-debugging.md)
- [Performance profiling](./examples/performance-profiling.md)
- [Copilot-assisted debugging](./examples/copilot-debugging.md)
- [Multi-session debugging](./examples/multi-session.md)

## Resources

- [Language Server Protocol Specification](https://microsoft.github.io/language-server-protocol/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

## Contributing

To contribute to the LSP integration:

1. Read the [contributing guide](../../CONTRIBUTING.md)
2. Set up the development environment
3. Make changes to `src/lsp-server.ts`
4. Test with the LSP inspector: `npm run test:lsp`
5. Submit a pull request

## License

MIT - See [LICENSE](../../LICENSE) for details.
