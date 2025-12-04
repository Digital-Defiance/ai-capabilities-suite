# MCP Process E2E Testing - Design Document

## Overview

This design document describes the implementation of comprehensive End-to-End (E2E) tests for the MCP Process Server. The tests will spawn the server as a child process and communicate via stdio using JSON-RPC protocol, validating that the complete system works correctly in real-world usage scenarios. The design follows the proven patterns established in mcp-screenshot and mcp-debugger-server packages.

## Architecture

### Test Structure

```
packages/mcp-process/src/
├── lib/
│   ├── server.e2e.spec.ts          # Comprehensive e2e tests
│   ├── server.minimal.e2e.spec.ts  # Quick smoke tests
│   ├── integration.spec.ts         # Existing integration tests
│   └── [other component tests]
```

### Communication Flow

```
Test Process                    MCP Server Process
    │                                  │
    ├─ spawn() ──────────────────────>│
    │                                  │
    │                           [Server starts]
    │                                  │
    ├─ stdin: JSON-RPC request ──────>│
    │                                  │
    │                           [Process request]
    │                                  │
    │<─ stdout: JSON-RPC response ────┤
    │                                  │
    ├─ stdin: Next request ──────────>│
    │                                  │
    │<─ stdout: Response ──────────────┤
    │                                  │
    ├─ kill() ────────────────────────>│
    │                                  │
    │                           [Server stops]
```

## Components and Interfaces

### Test Helper Functions

#### startServer()

```typescript
async function startServer(): Promise<void>;
```

- Locates the built server CLI file (dist/cli.js)
- Spawns the server as a child process with stdio pipes
- Sets up event listeners for stdout, stderr, and errors
- Waits for server to be ready (2 second initialization period)
- Throws error if server fails to start with diagnostic information

#### sendRequest()

```typescript
function sendRequest(
  method: string,
  params?: any,
  timeoutMs: number = 30000
): Promise<any>;
```

- Constructs JSON-RPC 2.0 request with unique message ID
- Writes request to server stdin as newline-delimited JSON
- Listens for response on server stdout
- Parses response and matches by message ID
- Returns result or throws error on timeout/failure
- Handles partial JSON responses by buffering until complete

#### stopServer()

```typescript
function stopServer(): void;
```

- Removes all event listeners to prevent memory leaks
- Kills the server process gracefully
- Cleans up resources

#### safeParseResponse()

```typescript
function safeParseResponse(text: string): any;
```

- Attempts to parse JSON response
- Handles plain text errors (e.g., "MCP error -32602: ...")
- Returns structured error object for non-JSON errors
- Re-throws if not a recognized format

### Test Suites

#### server.e2e.spec.ts - Comprehensive Tests

**MCP Protocol Initialization**

- Initialize request/response validation
- Protocol version verification
- Server info and capabilities validation

**Tool Discovery**

- List all available tools
- Validate tool schemas
- Verify required tools are present

**Process Launch Operations**

- Launch with allowed executable
- Launch with environment variables
- Launch with working directory
- Launch with resource limits
- Reject blocked executables
- Reject executables not in allowlist

**Process Monitoring Operations**

- Get process statistics (CPU, memory)
- Get process status
- List all processes
- Query historical statistics
- Handle non-existent process queries

**Process Termination Operations**

- Graceful termination (SIGTERM)
- Forced termination (SIGKILL)
- Timeout escalation
- Exit code retrieval
- Process cleanup verification

**Output Capture Operations**

- Capture stdout
- Capture stderr
- Retrieve output after completion
- Handle binary output
- Buffer management

**Service Management Operations**

- Start service
- Stop service
- Auto-restart on crash
- Health check execution
- Service status queries

**Security Policy Enforcement**

- Allowlist enforcement
- Blocked executable rejection
- Environment variable sanitization
- Command injection prevention
- Argument validation

**Error Handling**

- Unknown tool errors
- Missing parameter errors
- Invalid parameter type errors
- Process not found errors
- Malformed JSON-RPC handling

**Resource Limit Enforcement**

- CPU limit enforcement
- Memory limit enforcement
- Limit exceeded termination
- Resource usage queries

**Timeout Handling**

- Timeout enforcement
- Timeout extension
- Timeout error responses
- Default timeout application

#### server.minimal.e2e.spec.ts - Smoke Tests

**Quick Validation (< 30 seconds)**

- Initialize request
- Tools list request
- Single process launch and status check
- Basic error handling

## Data Models

### JSON-RPC Request

```typescript
interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: Record<string, any>;
}
```

### JSON-RPC Response

```typescript
interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
```

### MCP Tool Response

```typescript
interface MCPToolResponse {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}
```

### Process Start Response

```typescript
interface ProcessStartResponse {
  status: "success" | "error";
  pid?: number;
  startTime?: string;
  error?: {
    code: string;
    message: string;
  };
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Server initialization round trip

_For any_ valid initialize request, sending it to the server should result in a successful response containing protocol version and server info
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 2: Tool discovery completeness

_For any_ tools/list request, the response should contain all expected process management tools with valid schemas
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 3: Process launch with allowed executable succeeds

_For any_ allowed executable in the allowlist, launching it via tools/call should return success with valid PID
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 4: Process launch with blocked executable fails

_For any_ blocked or non-allowlisted executable, launching it should return an error with security code
**Validates: Requirements 4.4, 10.1, 10.2**

### Property 5: Process statistics retrieval

_For any_ running process PID, requesting statistics should return valid CPU and memory usage data
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 6: Process termination cleanup

_For any_ running process, terminating it should result in the process no longer being running
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 7: Output capture completeness

_For any_ process that writes to stdout, the captured output should contain the written data
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 8: Service lifecycle management

_For any_ service started via process_start_service, stopping it should terminate the service process
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 9: Error response structure

_For any_ invalid request (unknown tool, missing params, etc.), the response should contain error status and message
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 10: Security policy enforcement

_For any_ security violation attempt, the server should reject the request with appropriate error code
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

### Property 11: JSON-RPC protocol compliance

_For any_ request sent via stdin, the response via stdout should be valid JSON-RPC 2.0 format with matching ID
**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

### Property 12: Resource limit enforcement

_For any_ process launched with resource limits, exceeding those limits should result in process termination
**Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

### Property 13: Timeout enforcement

_For any_ process launched with timeout, exceeding the timeout should result in process termination with timeout error
**Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

## Error Handling

### Server Startup Failures

- **Server not found**: Provide clear error with searched paths and build instructions
- **Server crash on startup**: Capture stderr and display diagnostic information
- **Server timeout**: Report timeout with last known state

### Communication Failures

- **Malformed JSON**: Handle gracefully and report parsing error
- **Response timeout**: Report timeout with request details
- **Broken pipe**: Detect server crash and report with stderr output

### Test Failures

- **Assertion failures**: Provide clear error messages with expected vs actual values
- **Process cleanup**: Ensure all spawned processes are terminated even on test failure
- **Resource leaks**: Remove all event listeners and close file descriptors

### CI Environment Handling

- **Headless environment**: Skip tests that require display server with clear warnings
- **Permission issues**: Report permission errors with suggested fixes
- **Resource constraints**: Adjust timeouts for slower CI environments

## Testing Strategy

### Unit Testing

Not applicable - this design is for e2e tests which validate the complete system.

### Property-Based Testing

We will use **fast-check** (already in devDependencies) for property-based testing of the e2e test infrastructure.

#### Property Test 1: JSON-RPC request/response ID matching

**Feature: mcp-process-e2e-testing, Property 1: JSON-RPC protocol compliance**

```typescript
fc.assert(
  fc.property(
    fc.integer({ min: 1, max: 10000 }), // message ID
    fc.constantFrom("initialize", "tools/list", "tools/call"), // method
    async (id, method) => {
      const request = { jsonrpc: "2.0", id, method, params: {} };
      const response = await sendRequest(method, {});
      // Response ID should match request ID
      return response !== undefined;
    }
  ),
  { numRuns: 100 }
);
```

#### Property Test 2: Server handles concurrent requests

**Feature: mcp-process-e2e-testing, Property 2: Concurrent request handling**

```typescript
fc.assert(
  fc.property(
    fc.array(fc.constantFrom("tools/list", "process_list"), {
      minLength: 2,
      maxLength: 5,
    }),
    async (methods) => {
      const promises = methods.map((method) => sendRequest(method, {}));
      const results = await Promise.all(promises);
      // All requests should complete successfully
      return results.every((r) => r !== undefined);
    }
  ),
  { numRuns: 50 }
);
```

#### Property Test 3: Process launch with random allowed executables

**Feature: mcp-process-e2e-testing, Property 3: Process launch succeeds for allowed executables**

```typescript
fc.assert(
  fc.property(
    fc.constantFrom("node", "echo", "npm"), // allowed executables
    fc.array(fc.string(), { maxLength: 3 }), // arguments
    async (executable, args) => {
      const result = await sendRequest("tools/call", {
        name: "process_start",
        arguments: { executable, args, captureOutput: true },
      });
      const response = JSON.parse(result.content[0].text);
      // Should succeed with valid PID
      return response.status === "success" && response.pid > 0;
    }
  ),
  { numRuns: 50 }
);
```

#### Property Test 4: Security rejection for blocked executables

**Feature: mcp-process-e2e-testing, Property 4: Security policy enforcement**

```typescript
fc.assert(
  fc.property(
    fc.constantFrom("sudo", "rm", "curl", "wget"), // blocked executables
    async (executable) => {
      const result = await sendRequest("tools/call", {
        name: "process_start",
        arguments: { executable, args: [], captureOutput: true },
      });
      const response = JSON.parse(result.content[0].text);
      // Should fail with security error
      return (
        response.status === "error" && response.error.code.includes("SECURITY")
      );
    }
  ),
  { numRuns: 50 }
);
```

### Integration Testing

The existing integration.spec.ts tests will remain and complement the e2e tests by validating component interactions within the same process.

### E2E Testing

The new server.e2e.spec.ts and server.minimal.e2e.spec.ts will validate the complete system behavior through the MCP protocol.

## Implementation Notes

### Server Path Resolution

Follow the pattern from mcp-screenshot:

1. Try direct paths relative to test file location
2. Try paths relative to current working directory
3. Recursively search parent directories for dist/cli.js
4. Verify package.json name matches to avoid wrong CLI
5. Provide clear error with all attempted paths if not found

### Process Cleanup

- Use `beforeAll` to start server once per test suite
- Use `afterAll` to stop server and clean up
- Use `afterEach` for test-specific cleanup (terminate spawned processes)
- Set max listeners to 100 to avoid warnings with many tests
- Remove all event listeners before killing server

### Timeout Management

- Default request timeout: 30 seconds
- Server startup timeout: 60 seconds (allows for build if needed)
- Minimal test suite timeout: 30 seconds total
- CI environment: Add 50% buffer to all timeouts

### Error Diagnostics

- Log all requests and responses with message IDs
- Capture and display server stderr on failures
- Provide file system diagnostics when server not found
- Include process state in error messages

### CI Compatibility

- Handle headless environments gracefully
- Skip tests that require display server
- Clean up all processes even on test failure
- Provide clear failure messages for debugging
- Use `--forceExit` flag for Jest to ensure cleanup

## Dependencies

All required dependencies are already in package.json:

- `jest`: Test framework
- `@swc/jest`: Fast TypeScript compilation
- `@types/node`: Node.js type definitions
- `fast-check`: Property-based testing library

No additional dependencies needed.

## File Organization

```
packages/mcp-process/
├── src/
│   ├── lib/
│   │   ├── server.e2e.spec.ts          # New: Comprehensive e2e tests
│   │   ├── server.minimal.e2e.spec.ts  # New: Minimal smoke tests
│   │   ├── integration.spec.ts         # Existing: Integration tests
│   │   └── [other test files]          # Existing: Unit tests
│   ├── cli.ts                          # Existing: CLI entry point
│   └── index.ts                        # Existing: Main entry point
├── dist/
│   ├── cli.js                          # Built CLI (spawned by tests)
│   └── [other built files]
├── package.json                        # Existing: Already has test scripts
└── jest.config.js                      # Existing: Jest configuration
```

## Testing Workflow

### Development

```bash
# Run all tests including e2e
npm test

# Run only e2e tests
npm test -- --testPathPattern=e2e.spec.ts

# Run only minimal e2e tests
npm test -- --testPathPattern=minimal.e2e.spec.ts

# Run with coverage
npm run test:coverage
```

### CI Pipeline

```bash
# Build first
npm run build

# Run minimal tests for quick feedback
npm test -- --testPathPattern=minimal.e2e.spec.ts

# Run full test suite
npm test
```

## Success Criteria

The implementation will be considered complete when:

1. ✅ server.e2e.spec.ts exists with comprehensive test coverage
2. ✅ server.minimal.e2e.spec.ts exists with quick smoke tests
3. ✅ All tests pass locally and in CI
4. ✅ Test structure matches mcp-screenshot and mcp-debugger-server patterns
5. ✅ Property-based tests validate key behaviors
6. ✅ Error handling is robust and provides clear diagnostics
7. ✅ Process cleanup is reliable even on test failures
8. ✅ Tests run successfully in CI environments
9. ✅ Documentation is updated with e2e testing information
10. ✅ Code coverage includes e2e test paths
