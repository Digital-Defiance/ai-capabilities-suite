# Design Document

## Overview

This design creates a shared MCP client base class that provides consistent timeout handling, re-synchronization logic, and connection state management for all MCP ACS extensions. Currently, the Process, Screenshot, and Debugger extensions each have their own MCP client implementations with hardcoded 30-second timeouts, leading to connection failures and inconsistent behavior.

The solution introduces a new shared package `@ai-capabilities-suite/mcp-client-base` that provides:

1. **BaseMCPClient**: Abstract base class with common functionality
2. **TimeoutManager**: Configurable timeout handling
3. **ConnectionStateManager**: Connection state tracking and notifications
4. **ReSyncManager**: Automatic re-synchronization with exponential backoff
5. **Extension-specific clients**: Process, Screenshot, and Debugger clients that extend the base

## Architecture

### Package Structure

```
packages/
├── mcp-client-base/                    # New shared package
│   ├── src/
│   │   ├── BaseMCPClient.ts           # Abstract base class
│   │   ├── TimeoutManager.ts          # Timeout configuration
│   │   ├── ConnectionStateManager.ts  # State management
│   │   ├── ReSyncManager.ts           # Re-sync logic
│   │   ├── types.ts                   # Shared interfaces
│   │   └── index.ts                   # Public exports
│   ├── package.json
│   └── tsconfig.json
├── vscode-mcp-acs-process/
│   └── src/
│       └── mcpClient.ts               # Extends BaseMCPClient
├── vscode-mcp-screenshot/
│   └── src/
│       └── mcpClient.ts               # Extends BaseMCPClient
└── vscode-mcp-debugger/
    └── src/
        └── mcpClient.ts               # Extends BaseMCPClient
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              @ai-capabilities-suite/mcp-client-base         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              BaseMCPClient (Abstract)                   │ │
│  │  ┌──────────────┐  ┌────────────────┐  ┌───────────┐ │ │
│  │  │   Timeout    │  │ Re-sync Logic  │  │  Request  │ │ │
│  │  │   Manager    │  │                │  │   Queue   │ │ │
│  │  └──────────────┘  └────────────────┘  └───────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │        ConnectionStateManager                     │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ extends
          ┌─────────────────┼─────────────────┐
          │                 │                  │
┌─────────┴──────┐  ┌──────┴───────┐  ┌──────┴───────┐
│ MCPProcessClient│  │MCPScreenshot │  │MCPDebugger   │
│                 │  │   Client     │  │   Client     │
└─────────────────┘  └──────────────┘  └──────────────┘
```

## Components and Interfaces

### BaseMCPClient (Abstract)

```typescript
export abstract class BaseMCPClient {
  protected serverProcess?: ChildProcess;
  protected requestId: number = 0;
  protected pendingRequests: Map<number, PendingRequest>;
  protected outputChannel: vscode.LogOutputChannel;
  protected timeoutManager: TimeoutManager;
  protected stateManager: ConnectionStateManager;
  protected reSyncManager: ReSyncManager;

  constructor(
    outputChannel: vscode.LogOutputChannel,
    config?: Partial<MCPClientConfig>
  );

  // Lifecycle methods
  async start(): Promise<void>;
  stop(): void;
  async reconnect(): Promise<boolean>;

  // Abstract methods for extension-specific behavior
  protected abstract getServerCommand(): { command: string; args: string[] };
  protected abstract getServerEnv(): Record<string, string>;
  protected abstract onServerReady(): Promise<void>;

  // Request handling
  protected async sendRequest(
    method: string,
    params: any,
    customTimeout?: number
  ): Promise<any>;

  protected async sendNotification(method: string, params: any): Promise<void>;

  // Tool calling (for MCP protocol)
  protected async callTool(name: string, args: any): Promise<any>;

  // Connection management
  getConnectionStatus(): ConnectionStatus;
  getDiagnostics(): ServerDiagnostics;
  isServerProcessAlive(): boolean;

  // Event handlers
  protected handleMessage(message: any): void;
  protected handleTimeout(requestId: number, method: string): Promise<void>;
  protected handleServerExit(code: number | null, signal: string | null): void;
  protected handleServerError(error: Error): void;

  // Utility methods
  protected clearPendingRequests(): void;
  protected logCommunication(
    type: "request" | "response" | "notification",
    data: any
  ): void;
}
```

### TimeoutManager

```typescript
export interface TimeoutConfig {
  initializationTimeoutMs: number; // Default: 60000
  standardRequestTimeoutMs: number; // Default: 30000
  toolsListTimeoutMs: number; // Default: 60000
}

export class TimeoutManager {
  private config: TimeoutConfig;

  constructor(config?: Partial<TimeoutConfig>);

  getTimeoutForRequest(method: string): number;
  validateConfig(config: Partial<TimeoutConfig>): ValidationResult;
  updateConfig(config: Partial<TimeoutConfig>): void;
  getConfig(): TimeoutConfig;
}
```

### ConnectionStateManager

```typescript
export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  TIMEOUT_RETRYING = "timeout_retrying",
  ERROR = "error",
}

export interface ConnectionStatus {
  state: ConnectionState;
  message: string;
  retryCount?: number;
  lastError?: Error;
  serverProcessRunning: boolean;
  timestamp: number;
}

export class ConnectionStateManager {
  private state: ConnectionState;
  private listeners: Set<(status: ConnectionStatus) => void>;
  private statusHistory: ConnectionStatus[];

  constructor();

  getStatus(): ConnectionStatus;
  setState(state: ConnectionState, details?: Partial<ConnectionStatus>): void;
  onStateChange(
    listener: (status: ConnectionStatus) => void
  ): vscode.Disposable;
  getHistory(limit?: number): ConnectionStatus[];
  isServerProcessRunning(): boolean;
  setServerProcessRunning(running: boolean): void;
}
```

### ReSyncManager

```typescript
export interface ReSyncConfig {
  maxRetries: number; // Default: 3
  retryDelayMs: number; // Default: 2000
  backoffMultiplier: number; // Default: 1.5
}

export interface ReSyncResult {
  success: boolean;
  attempts: number;
  error?: Error;
}

export class ReSyncManager {
  private config: ReSyncConfig;
  private currentAttempt: number;

  constructor(config?: Partial<ReSyncConfig>);

  async attemptReSync(
    sendInitialize: () => Promise<void>,
    stateManager: ConnectionStateManager
  ): Promise<ReSyncResult>;

  reset(): void;
  shouldRetry(): boolean;
  getNextRetryDelay(): number;
  getCurrentAttempt(): number;
}
```

## Data Models

### MCPClientConfig

```typescript
export interface MCPClientConfig {
  timeout: TimeoutConfig;
  reSync: ReSyncConfig;
  logging: {
    logLevel: "debug" | "info" | "warn" | "error";
    logCommunication: boolean;
  };
}
```

### PendingRequest

```typescript
export interface PendingRequest {
  id: number;
  method: string;
  params: any;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeoutHandle: NodeJS.Timeout;
  startTime: number;
}
```

### ServerDiagnostics

```typescript
export interface ServerDiagnostics {
  extensionName: string;
  processId?: number;
  processRunning: boolean;
  connectionState: ConnectionState;
  pendingRequestCount: number;
  pendingRequests: Array<{
    id: number;
    method: string;
    elapsedMs: number;
  }>;
  lastError?: {
    message: string;
    timestamp: number;
  };
  recentCommunication: Array<{
    type: "request" | "response" | "notification";
    method?: string;
    timestamp: number;
    success: boolean;
  }>;
  stateHistory: ConnectionStatus[];
}
```

### ValidationResult

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Timeout consistency across extensions

_For any_ request method and any extension using BaseMCPClient, the timeout value returned by getTimeoutForRequest should be the same
**Validates: Requirements 1.1, 3.2, 3.3**

### Property 2: Re-synchronization logic consistency

_For any_ timeout scenario across any extension, the re-synchronization logic should follow the same retry pattern with the same backoff delays
**Validates: Requirements 1.2, 4.1, 4.2**

### Property 3: Connection state management consistency

_For any_ connection state change across any extension, the state transition should be validated using the same rules
**Validates: Requirements 1.3, 5.1, 5.2**

### Property 4: Configuration validation consistency

_For any_ timeout configuration across any extension, validation should produce the same result (valid/invalid with same errors)
**Validates: Requirements 1.4, 3.4**

### Property 5: Error message consistency

_For any_ error condition across any extension, the error message format and recovery options should be the same
**Validates: Requirements 1.5, 9.1, 9.2, 9.3**

### Property 6: Base client extensibility

_For any_ extension-specific client that extends BaseMCPClient, overriding methods should work while base functionality remains intact
**Validates: Requirements 2.2, 2.3**

### Property 7: Default timeout values

_For any_ extension using BaseMCPClient without explicit timeout configuration, the default values should be 60s for initialization and 30s for standard requests
**Validates: Requirements 3.5**

### Property 8: Exponential backoff correctness

_For any_ retry attempt N, the delay before attempt N+1 should be delay \* (backoffMultiplier ^ N)
**Validates: Requirements 4.2**

### Property 9: State transition validity

_For any_ sequence of connection state changes, only valid transitions should be allowed (e.g., CONNECTING → CONNECTED, not CONNECTED → CONNECTING)
**Validates: Requirements 5.2**

### Property 10: Listener notification consistency

_For any_ connection state change, all registered listeners should be notified with the same ConnectionStatus object
**Validates: Requirements 5.3, 5.4**

### Property 11: Status format consistency

_For any_ extension querying connection status, the returned ConnectionStatus object should have the same structure and fields
**Validates: Requirements 5.5**

### Property 12: Backward compatibility preservation

_For any_ existing functionality in Process, Screenshot, or Debugger extensions, migrating to BaseMCPClient should not break existing behavior
**Validates: Requirements 6.4, 6.5**

### Property 13: Log format consistency

_For any_ communication event logged by any extension, the log entry should include timestamp, request ID (if applicable), and method name
**Validates: Requirements 7.1, 7.5**

### Property 14: Error log completeness

_For any_ error logged by any extension, the log entry should include error category, server process status, and connection state
**Validates: Requirements 7.2**

### Property 15: Diagnostic format consistency

_For any_ extension's diagnostics, the ServerDiagnostics object should have the same structure and include all required fields
**Validates: Requirements 8.3, 8.5**

### Property 16: Process lifecycle handling consistency

_For any_ server process exit across any extension, the handling (logging, error messages, restart offers) should be the same
**Validates: Requirements 9.2, 9.3, 9.4**

### Property 17: Process alive detection consistency

_For any_ extension checking if the server process is alive, the detection logic should be the same
**Validates: Requirements 9.5**

## Error Handling

### Timeout Scenarios

All extensions will handle timeouts identically:

1. **Initialization Timeout with Running Server**

   - Trigger re-synchronization via ReSyncManager
   - Update state to TIMEOUT_RETRYING
   - Log timeout with server process status
   - After max retries, offer manual recovery

2. **Initialization Timeout with Dead Server**

   - Immediately fail with "Server process exited" error
   - Update state to ERROR
   - Offer to restart server
   - Log exit code and stderr

3. **Standard Request Timeout**
   - Fail the specific request
   - Keep connection alive
   - Log timeout with request details
   - Don't trigger re-synchronization

### Server Process Errors

All extensions will handle process errors identically:

1. **Spawn Failure**

   - Log diagnostic information (executable path, environment)
   - Update state to ERROR
   - Suggest common fixes
   - Offer to check configuration

2. **Unexpected Exit**

   - Log exit code and signal
   - Capture and log stderr
   - Update state to DISCONNECTED
   - Offer automatic restart

3. **Unresponsive Server**
   - Detect via timeout
   - Verify process is still running
   - Attempt re-synchronization
   - If re-sync fails, offer to restart

## Testing Strategy

### Unit Testing

Unit tests will cover:

- TimeoutManager configuration validation and timeout selection
- ConnectionStateManager state transitions and listener notifications
- ReSyncManager retry logic and backoff calculations
- BaseMCPClient request handling in isolation
- Extension-specific client customization

### Property-Based Testing

Property-based tests will verify all 17 correctness properties listed above. We will use the `fast-check` library for TypeScript. Each property-based test will run a minimum of 100 iterations.

Key property tests:

- Timeout consistency across all three extensions
- Re-sync logic produces same results across extensions
- State transitions follow same rules across extensions
- Configuration validation produces same results across extensions
- Log format is consistent across extensions

### Integration Testing

Integration tests will cover:

- Full initialization flow for each extension
- Re-synchronization with simulated slow servers
- Migration from old client to new client (backward compatibility)
- Cross-extension consistency (all three extensions in same test)

### Cross-Extension Consistency Tests

Special tests that verify all three extensions behave identically:

- Same timeout values for same request types
- Same retry delays for same retry attempts
- Same error messages for same error conditions
- Same log format for same events
- Same diagnostic format

## Implementation Notes

### Migration Strategy

1. **Phase 1**: Create shared package

   - Implement BaseMCPClient, TimeoutManager, ConnectionStateManager, ReSyncManager
   - Write comprehensive tests
   - Publish as internal package

2. **Phase 2**: Migrate Process extension

   - Update MCPProcessClient to extend BaseMCPClient
   - Implement abstract methods
   - Run existing tests to verify no regressions
   - Add new timeout/re-sync tests

3. **Phase 3**: Migrate Screenshot extension

   - Update MCPScreenshotClient to extend BaseMCPClient
   - Implement abstract methods
   - Run existing tests to verify no regressions
   - Add new timeout/re-sync tests

4. **Phase 4**: Migrate Debugger extension

   - Update MCPDebuggerClient to extend BaseMCPClient
   - Implement abstract methods
   - Run existing tests to verify no regressions
   - Add new timeout/re-sync tests

5. **Phase 5**: Add cross-extension tests
   - Create tests that verify consistency across all three extensions
   - Verify all extensions use same timeout values
   - Verify all extensions handle errors the same way

### Backward Compatibility

- Extension-specific clients will maintain all existing public methods
- Existing code using the clients will continue to work without changes
- Configuration will be backward compatible (old settings still work)
- New features (re-sync, better timeouts) will be automatic

### Performance Considerations

- Timeout checks use native setTimeout, no polling
- Connection state updates are event-driven
- Pending request map is cleaned up immediately
- Re-synchronization uses exponential backoff
- Shared code is loaded once, not duplicated per extension

### Package Dependencies

```json
{
  "name": "@ai-capabilities-suite/mcp-client-base",
  "version": "1.0.0",
  "dependencies": {
    "vscode": "^1.85.0"
  },
  "devDependencies": {
    "fast-check": "^3.15.0",
    "@types/node": "^20.0.0",
    "@types/vscode": "^1.85.0"
  }
}
```

### Logging Strategy

All extensions will use consistent logging:

**Log Levels:**

- **DEBUG**: All JSON-RPC messages, state transitions
- **INFO**: Connection established, requests completed, retries
- **WARN**: Timeouts, retry attempts, configuration warnings
- **ERROR**: Initialization failures, server crashes, unrecoverable errors

**Log Format:**

```
[YYYY-MM-DDTHH:mm:ss.sssZ] [LEVEL] [ExtensionName] [RequestID?] Message
```

**Example Logs:**

```
[2025-12-16T13:45:23.123Z] [INFO] [Process] [req-1] Sending request: initialize
[2025-12-16T13:45:23.456Z] [INFO] [Process] [req-1] Received response: initialize (333ms)
[2025-12-16T13:46:03.789Z] [WARN] [Process] [req-2] Request timeout after 30000ms: tools/list
[2025-12-16T13:46:03.790Z] [INFO] [Process] Attempting re-synchronization (attempt 1/3)
[2025-12-16T13:46:05.890Z] [INFO] [Process] Re-synchronization successful
```

## Extension-Specific Implementations

### MCPProcessClient

```typescript
export class MCPProcessClient extends BaseMCPClient {
  private serverConfig?: SecurityConfig;

  constructor(
    outputChannel: vscode.LogOutputChannel,
    config?: Partial<MCPClientConfig>
  ) {
    super(outputChannel, config);
  }

  setServerConfig(config: SecurityConfig): void {
    this.serverConfig = config;
  }

  protected getServerCommand(): { command: string; args: string[] } {
    // Process-specific server command logic
    return {
      command: "npx",
      args: ["-y", "@ai-capabilities-suite/mcp-process"],
    };
  }

  protected getServerEnv(): Record<string, string> {
    const env = { ...process.env };
    if (this.serverConfig) {
      env["MCP_PROCESS_CONFIG"] = JSON.stringify(this.serverConfig);
    }
    return env;
  }

  protected async onServerReady(): Promise<void> {
    // Process-specific initialization
    await this.callTool("process_list", {});
  }

  // Process-specific methods
  async startProcess(params: ProcessStartParams): Promise<string> {
    const result = await this.callTool("process_start", params);
    return result.pid?.toString();
  }

  async terminateProcess(params: ProcessTerminateParams): Promise<void> {
    await this.callTool("process_terminate", params);
  }

  // ... other process-specific methods
}
```

### MCPScreenshotClient

```typescript
export class MCPScreenshotClient extends BaseMCPClient {
  protected getServerCommand(): { command: string; args: string[] } {
    return {
      command: "npx",
      args: ["-y", "@ai-capabilities-suite/mcp-screenshot"],
    };
  }

  protected getServerEnv(): Record<string, string> {
    return { ...process.env };
  }

  protected async onServerReady(): Promise<void> {
    // Screenshot-specific initialization
  }

  // Screenshot-specific methods
  async captureScreen(params: CaptureParams): Promise<string> {
    const result = await this.callTool("screenshot_capture", params);
    return result.imagePath;
  }

  // ... other screenshot-specific methods
}
```

### MCPDebuggerClient

```typescript
export class MCPDebuggerClient extends BaseMCPClient {
  protected getServerCommand(): { command: string; args: string[] } {
    return {
      command: "npx",
      args: ["-y", "@ai-capabilities-suite/mcp-debugger"],
    };
  }

  protected getServerEnv(): Record<string, string> {
    return { ...process.env };
  }

  protected async onServerReady(): Promise<void> {
    // Debugger-specific initialization
  }

  // Debugger-specific methods
  async startDebugSession(params: DebugParams): Promise<string> {
    const result = await this.callTool("debugger_start", params);
    return result.sessionId;
  }

  // ... other debugger-specific methods
}
```
