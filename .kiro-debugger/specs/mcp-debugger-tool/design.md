# MCP Debugger Tool - Design

## Architecture

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
│  (Test Runner)  │
└─────────────────┘
```

## Core Components

### 1. MCP Server
- Implements MCP protocol
- Exposes debugging tools
- Manages debug sessions
- Handles tool calls from AI agent

### 2. Inspector Client
- Connects to Node.js Inspector
- Sends CDP commands
- Receives CDP events
- Manages WebSocket connection

### 3. Session Manager
- Tracks active debug sessions
- Maps session IDs to processes
- Handles session lifecycle
- Cleans up resources

### 4. Breakpoint Manager
- Stores breakpoint definitions
- Resolves file paths to script IDs
- Handles source maps
- Manages breakpoint state

### 5. Hang Detector
- Monitors process execution
- Detects infinite loops
- Samples call stack periodically
- Reports hang location

## Implementation Details

### Starting a Debug Session

```typescript
// 1. Spawn process with inspector enabled
const child = spawn('node', [
  '--inspect-brk=0',  // Random port, break on start
  '--enable-source-maps',
  testFile
], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, NODE_OPTIONS: '--enable-source-maps' }
});

// 2. Parse inspector URL from stderr
child.stderr.on('data', (data) => {
  const match = data.toString().match(/ws:\/\/127\.0\.0\.1:(\d+)\//);
  if (match) {
    const wsUrl = match[0];
    connectToInspector(wsUrl);
  }
});

// 3. Connect via WebSocket
const ws = new WebSocket(wsUrl);
ws.on('open', () => {
  // Send CDP commands
  sendCommand('Debugger.enable');
  sendCommand('Runtime.enable');
});
```

### Setting Breakpoints

```typescript
async function setBreakpoint(file: string, line: number) {
  // 1. Resolve file to script ID
  const scripts = await sendCommand('Debugger.getScriptSource');
  const script = scripts.find(s => s.url.endsWith(file));
  
  // 2. Set breakpoint
  const result = await sendCommand('Debugger.setBreakpointByUrl', {
    lineNumber: line - 1,  // 0-indexed
    url: script.url,
    columnNumber: 0
  });
  
  return result.breakpointId;
}
```

### Inspecting Variables

```typescript
async function inspectVariable(expression: string) {
  // 1. Get current call frame
  const { callFrames } = await sendCommand('Debugger.getStackTrace');
  const topFrame = callFrames[0];
  
  // 2. Evaluate expression in frame context
  const result = await sendCommand('Debugger.evaluateOnCallFrame', {
    callFrameId: topFrame.callFrameId,
    expression: expression,
    returnByValue: true
  });
  
  return result.result.value;
}
```

### Detecting Hangs

```typescript
async function detectHang(command: string, timeout: number) {
  const session = await startDebugSession(command);
  
  // Sample call stack every 100ms
  const samples: string[] = [];
  const interval = setInterval(async () => {
    const stack = await getCallStack(session.id);
    const location = `${stack[0].file}:${stack[0].line}`;
    samples.push(location);
    
    // If same location for 50 samples (5 seconds), it's hung
    if (samples.length > 50) {
      const recent = samples.slice(-50);
      if (recent.every(s => s === recent[0])) {
        clearInterval(interval);
        return {
          hung: true,
          location: recent[0],
          stack: stack
        };
      }
    }
  }, 100);
  
  // Wait for completion or timeout
  await Promise.race([
    session.completion,
    sleep(timeout)
  ]);
  
  clearInterval(interval);
}
```

## MCP Tool Implementations

### Tool: debugger_start

```typescript
{
  name: 'debugger_start',
  async handler(args) {
    const { command, args: cmdArgs, cwd, timeout } = args;
    
    // Start process with inspector
    const session = await startDebugSession({
      command,
      args: cmdArgs,
      cwd,
      timeout
    });
    
    return {
      sessionId: session.id,
      inspectorUrl: session.wsUrl,
      pid: session.process.pid,
      status: 'paused'  // Paused at start
    };
  }
}
```

### Tool: debugger_set_breakpoint

```typescript
{
  name: 'debugger_set_breakpoint',
  async handler(args) {
    const { file, line, condition } = args;
    
    // Resolve file path
    const absolutePath = path.resolve(file);
    
    // Set breakpoint via CDP
    const breakpointId = await setBreakpoint(absolutePath, line, condition);
    
    return {
      breakpointId,
      file: absolutePath,
      line,
      verified: true
    };
  }
}
```

### Tool: debugger_inspect

```typescript
{
  name: 'debugger_inspect',
  async handler(args) {
    const { sessionId, expression } = args;
    
    const session = getSession(sessionId);
    if (!session.paused) {
      throw new Error('Process must be paused to inspect variables');
    }
    
    const value = await inspectVariable(session, expression);
    
    return {
      expression,
      value,
      type: typeof value
    };
  }
}
```

### Tool: debugger_detect_hang

```typescript
{
  name: 'debugger_detect_hang',
  async handler(args) {
    const { command, args: cmdArgs, timeout, sampleInterval = 100 } = args;
    
    const result = await detectHang(command, cmdArgs, timeout, sampleInterval);
    
    if (result.hung) {
      return {
        hung: true,
        location: result.location,
        stack: result.stack.map(frame => ({
          function: frame.functionName,
          file: frame.url,
          line: frame.lineNumber
        })),
        message: `Process hung at ${result.location}`
      };
    }
    
    return {
      hung: false,
      completed: true,
      exitCode: result.exitCode
    };
  }
}
```

## Source Map Support

```typescript
// Load source maps
import { SourceMapConsumer } from 'source-map';

async function resolveSourceLocation(file: string, line: number) {
  // Check if file is compiled (has .map file)
  const mapFile = `${file}.map`;
  if (!fs.existsSync(mapFile)) {
    return { file, line };
  }
  
  // Load source map
  const mapContent = fs.readFileSync(mapFile, 'utf8');
  const consumer = await new SourceMapConsumer(mapContent);
  
  // Map compiled location to source location
  const original = consumer.originalPositionFor({
    line,
    column: 0
  });
  
  return {
    file: original.source,
    line: original.line
  };
}
```

## Error Handling

```typescript
class DebuggerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DebuggerError';
  }
}

// Handle CDP errors
try {
  await sendCommand('Debugger.setBreakpoint', params);
} catch (error) {
  if (error.code === 'BREAKPOINT_NOT_RESOLVED') {
    throw new DebuggerError(
      'Could not set breakpoint - file not loaded yet',
      'BREAKPOINT_PENDING',
      { file, line }
    );
  }
  throw error;
}
```

## Session Lifecycle

```typescript
class DebugSession {
  id: string;
  process: ChildProcess;
  inspector: InspectorClient;
  breakpoints: Map<string, Breakpoint>;
  paused: boolean = false;
  
  async start() {
    // Spawn process
    this.process = spawnWithInspector(this.command);
    
    // Connect inspector
    this.inspector = await connectInspector(this.process);
    
    // Enable debugging
    await this.inspector.send('Debugger.enable');
    await this.inspector.send('Runtime.enable');
    
    // Set up event handlers
    this.inspector.on('Debugger.paused', () => {
      this.paused = true;
    });
    
    this.inspector.on('Debugger.resumed', () => {
      this.paused = false;
    });
  }
  
  async cleanup() {
    // Remove all breakpoints
    for (const bp of this.breakpoints.values()) {
      await this.inspector.send('Debugger.removeBreakpoint', {
        breakpointId: bp.id
      });
    }
    
    // Disconnect inspector
    await this.inspector.disconnect();
    
    // Kill process if still running
    if (!this.process.killed) {
      this.process.kill();
    }
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Breakpoint creation and retrieval consistency
*For any* valid file path and line number, when a breakpoint is created at that location, then retrieving the breakpoint list should include that breakpoint with the correct file path and line number.
**Validates: Requirements 1.1, 1.3**

### Property 2: Conditional breakpoint evaluation
*For any* conditional breakpoint with a valid condition expression, the Target Process should only pause at that breakpoint when the condition evaluates to true.
**Validates: Requirements 1.2**

### Property 3: Breakpoint removal completeness
*For any* breakpoint that exists in the system, when that breakpoint is removed by its identifier, then subsequent breakpoint list retrievals should not include that breakpoint.
**Validates: Requirements 1.4**

### Property 4: Breakpoint toggle preserves identity
*For any* breakpoint, when its state is toggled between enabled and disabled, the breakpoint should remain in the breakpoint list with the same identifier and location but with updated state.
**Validates: Requirements 1.5**

### Property 5: Process start with inspector attachment
*For any* valid Node.js command with arguments, when the MCP Server starts that command, then the resulting process should have the Inspector Protocol attached and be in a paused state.
**Validates: Requirements 2.1**

### Property 6: Step operations maintain execution flow
*For any* paused Target Process, when a step operation (step over, step into, or step out) is executed, then the process should pause at a valid source location that is reachable from the previous location according to the step semantics.
**Validates: Requirements 2.3, 2.4, 2.5**

### Property 7: Object inspection completeness
*For any* object reference in a paused Target Process, when that object is inspected, then all enumerable properties of that object should be returned with their current values.
**Validates: Requirements 3.3**

### Property 8: Expression evaluation correctness
*For any* valid JavaScript expression and paused Target Process, when that expression is evaluated in the current execution context, then the result should match what would be computed if the expression were executed at that point in the code.
**Validates: Requirements 3.4**

### Property 9: Variable watch notification
*For any* watched variable, when that variable's value changes during execution, then the MCP Server should report the change with the old and new values.
**Validates: Requirements 3.5**

### Property 10: Stack frame context switching
*For any* valid stack frame index in a paused Target Process, when the context is switched to that frame, then subsequent variable inspections should return variables from that frame's scope, not from other frames.
**Validates: Requirements 4.2, 4.3**

### Property 11: Timeout-based hang detection
*For any* Target Process and specified timeout duration, if the process executes for longer than the timeout without completing, then the MCP Server should pause the process and report a hang condition with the current call stack.
**Validates: Requirements 5.1, 5.2**

### Property 12: Infinite loop detection via sampling
*For any* Target Process being monitored with a sample interval, if the execution location remains unchanged across consecutive samples for the specified duration, then the MCP Server should report an infinite loop condition with the loop location.
**Validates: Requirements 5.3, 5.4**

### Property 13: Test output capture completeness
*For any* test execution, all output written to stdout and stderr by the test process should be captured and returned by the MCP Server.
**Validates: Requirements 6.4**

### Property 14: Test failure information completeness
*For any* failing test, the MCP Server should return the failure message, complete stack trace, and execution context including variable values at the failure point.
**Validates: Requirements 6.5**

### Property 15: Source map round-trip consistency
*For any* TypeScript source location with a valid source map, mapping that location to JavaScript and then back to TypeScript should yield the original location.
**Validates: Requirements 7.2, 7.3**

### Property 16: Source map variable name preservation
*For any* variable in a TypeScript source file with a valid source map, when that variable is inspected during debugging, the variable name should match the name in the TypeScript source, not the potentially mangled JavaScript name.
**Validates: Requirements 7.4**

### Property 17: Crash detection and cleanup
*For any* Debug Session, if the Target Process crashes or terminates unexpectedly, then the MCP Server should detect the termination, clean up all debugging resources, and report the error without leaving orphaned resources.
**Validates: Requirements 8.1, 8.2**

### Property 18: Error handling without process crash
*For any* invalid operation (invalid breakpoint location, invalid expression evaluation), the MCP Server should return a clear error message without causing the Target Process to crash or become unresponsive.
**Validates: Requirements 8.3, 8.4**

### Property 19: Debug session isolation
*For any* two concurrent Debug Sessions, operations performed on one session should not affect the state, breakpoints, or execution of the other session.
**Validates: Requirements 8.5**

### Property 20: Response format consistency
*For any* debugging operation, the MCP Server should return a structured JSON response containing an operation status field and either a results object or an error object with code, message, and context.
**Validates: Requirements 9.1, 9.2**

### Property 21: Complex object serialization with type information
*For any* complex object (arrays, nested objects, functions) returned from variable inspection, the serialized representation should include type information for each value and property.
**Validates: Requirements 9.3**

### Property 22: Call stack absolute path requirement
*For any* call stack returned by the MCP Server, every stack frame should include an absolute file path, not a relative path.
**Validates: Requirements 9.4**

## Testing Strategy

### Unit Tests
- Test CDP command formatting
- Test source map resolution
- Test breakpoint management
- Test session lifecycle
- Test error response formatting
- Test object serialization

### Property-Based Tests
- Use fast-check library for TypeScript property-based testing
- Each property test should run a minimum of 100 iterations
- Each property-based test must be tagged with a comment referencing the correctness property from this design document
- Tag format: `// Feature: mcp-debugger-tool, Property {number}: {property_text}`
- Property tests should focus on:
  - Breakpoint operations (create, list, remove, toggle)
  - Expression evaluation with various input types
  - Session isolation with concurrent sessions
  - Source map round-trip consistency
  - Error handling without crashes

### Integration Tests
- Test with simple Node.js script
- Test with TypeScript file
- Test with Jest test
- Test hang detection
- Test with multiple concurrent debug sessions

### Example Test Cases

```typescript
describe('MCP Debugger', () => {
  it('should set breakpoint and pause execution', async () => {
    const session = await debugger.start({
      command: 'node',
      args: ['test-script.js']
    });
    
    await debugger.setBreakpoint({
      file: 'test-script.js',
      line: 5
    });
    
    await debugger.continue({ sessionId: session.id });
    
    // Should pause at breakpoint
    expect(session.paused).toBe(true);
    expect(session.currentLine).toBe(5);
  });
  
  it('should detect hanging loop', async () => {
    const result = await debugger.detectHang({
      command: 'node',
      args: ['infinite-loop.js'],
      timeout: 5000
    });
    
    expect(result.hung).toBe(true);
    expect(result.location).toContain('infinite-loop.js');
  });
});
```

## Performance Considerations

1. **Minimize CDP Calls**: Batch commands when possible
2. **Efficient Serialization**: Limit object depth when inspecting
3. **Smart Sampling**: Adjust hang detection interval based on timeout
4. **Resource Cleanup**: Always clean up sessions to prevent leaks

## Security Considerations

1. **Local Only**: Only allow debugging local processes
2. **No Remote Access**: Don't expose inspector port externally
3. **Validate Paths**: Sanitize file paths to prevent directory traversal
4. **Timeout Limits**: Enforce maximum timeout to prevent resource exhaustion

## Future Enhancements

1. **Conditional Breakpoints**: Support complex conditions
2. **Watch Expressions**: Monitor variable changes
3. **Log Points**: Log without stopping
4. **Time Travel**: Record and replay execution
5. **Smart Suggestions**: AI-powered debugging hints
