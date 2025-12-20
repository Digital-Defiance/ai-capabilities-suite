# Design Document

> **Note:** This spec has been largely superseded by the `shared-mcp-client-timeout-fix` spec, which implemented a shared `@ai-capabilities-suite/mcp-client-base` package. The core components described below (TimeoutManager, ConnectionStateManager, ReSyncManager, and enhanced client functionality) have been implemented in the shared package and are used by the Process extension via `BaseMCPClient`. This design document is preserved for reference.

## Overview

This design addresses the timeout and synchronization issues in the MCP ACS Process Manager extension. The current implementation uses a hardcoded 30-second timeout for all JSON-RPC requests, which causes initialization failures when the server takes longer to respond. The solution introduces configurable timeouts, automatic re-synchronization, and improved connection state management.

The design focuses on three key areas:

1. **Configurable Timeouts**: Different timeout values for initialization vs. standard operations
2. **Re-synchronization Logic**: Automatic recovery when timeouts occur but the server is still running
3. **Connection State Management**: Clear visibility and accurate UI updates reflecting connection status

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VSCode Extension                          │
│                                                              │
│  ┌────────────────┐      ┌──────────────────┐             │
│  │ Tree Providers │◄─────┤ Connection State │             │
│  │  - Process     │      │    Manager       │             │
│  │  - Security    │      └────────┬─────────┘             │
│  └────────────────┘               │                        │
│                                    │                        │
│  ┌────────────────────────────────▼──────────────────────┐ │
│  │          MCPProcessClient (Enhanced)                   │ │
│  │  ┌──────────────┐  ┌────────────────┐  ┌───────────┐ │ │
│  │  │   Timeout    │  │ Re-sync Logic  │  │  Request  │ │ │
│  │  │   Manager    │  │                │  │   Queue   │ │ │
│  │  └──────────────┘  └────────────────┘  └───────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │ JSON-RPC over stdio
                            ▼
                  ┌──────────────────┐
                  │   MCP Server     │
                  │   Process        │
                  └──────────────────┘
```

### Key Components

1. **TimeoutManager**: Manages different timeout values and determines which timeout to use for each request type
2. **ConnectionStateManager**: Tracks connection state and notifies observers of state changes
3. **ReSyncManager**: Handles re-synchronization logic including retry attempts and backoff
4. **Enhanced MCPProcessClient**: Integrates all components and manages server communication

## Components and Interfaces

### TimeoutManager

```typescript
interface TimeoutConfig {
  initializationTimeoutMs: number; // Default: 60000
  standardRequestTimeoutMs: number; // Default: 30000
  toolsListTimeoutMs: number; // Default: 60000 (same as init)
}

class TimeoutManager {
  private config: TimeoutConfig;

  constructor(config: TimeoutConfig);

  // Get timeout for a specific request type
  getTimeoutForRequest(method: string): number;

  // Validate timeout configuration
  validateConfig(config: Partial<TimeoutConfig>): ValidationResult;

  // Update configuration
  updateConfig(config: Partial<TimeoutConfig>): void;
}
```

### ConnectionStateManager

```typescript
enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  TIMEOUT_RETRYING = "timeout_retrying",
  ERROR = "error",
}

interface ConnectionStatus {
  state: ConnectionState;
  message: string;
  retryCount?: number;
  lastError?: Error;
  serverProcessRunning: boolean;
}

class ConnectionStateManager {
  private state: ConnectionState;
  private listeners: Set<(status: ConnectionStatus) => void>;

  constructor();

  // Get current connection status
  getStatus(): ConnectionStatus;

  // Update connection state
  setState(state: ConnectionState, details?: Partial<ConnectionStatus>): void;

  // Subscribe to state changes
  onStateChange(listener: (status: ConnectionStatus) => void): Disposable;

  // Check if server process is running
  isServerProcessRunning(): boolean;
}
```

### ReSyncManager

```typescript
interface ReSyncConfig {
  maxRetries: number; // Default: 3
  retryDelayMs: number; // Default: 2000
  backoffMultiplier: number; // Default: 1.5
}

interface ReSyncResult {
  success: boolean;
  attempts: number;
  error?: Error;
}

class ReSyncManager {
  private config: ReSyncConfig;
  private currentAttempt: number;

  constructor(config: ReSyncConfig);

  // Attempt re-synchronization
  async attemptReSync(
    client: MCPProcessClient,
    stateManager: ConnectionStateManager
  ): Promise<ReSyncResult>;

  // Reset retry counter
  reset(): void;

  // Check if should retry
  shouldRetry(): boolean;

  // Get next retry delay with backoff
  getNextRetryDelay(): number;
}
```

### Enhanced MCPProcessClient

```typescript
class MCPProcessClient {
  private timeoutManager: TimeoutManager;
  private stateManager: ConnectionStateManager;
  private reSyncManager: ReSyncManager;
  private pendingRequests: Map<number, PendingRequest>;
  private serverProcess?: ChildProcess;

  constructor(
    outputChannel: OutputChannel,
    timeoutConfig?: Partial<TimeoutConfig>,
    reSyncConfig?: Partial<ReSyncConfig>
  );

  // Start server and initialize
  async start(): Promise<void>;

  // Stop server
  stop(): void;

  // Send request with appropriate timeout
  private async sendRequest(
    method: string,
    params: any,
    customTimeout?: number
  ): Promise<any>;

  // Handle timeout with re-sync logic
  private async handleTimeout(requestId: number, method: string): Promise<void>;

  // Clear all pending requests
  private clearPendingRequests(): void;

  // Check if server process is alive
  private isServerProcessAlive(): boolean;

  // Attempt re-synchronization
  async reconnect(): Promise<boolean>;

  // Get connection status
  getConnectionStatus(): ConnectionStatus;

  // Get diagnostics
  getDiagnostics(): ServerDiagnostics;
}
```

## Data Models

### PendingRequest

```typescript
interface PendingRequest {
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
interface ServerDiagnostics {
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
}
```

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Timeout configuration validation

_For any_ timeout configuration, if the initialization timeout is less than the standard request timeout, then validation should fail with an error
**Validates: Requirements 2.2**

### Property 2: Timeout selection consistency

_For any_ request method, calling getTimeoutForRequest multiple times with the same method should return the same timeout value
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 3: Re-synchronization clears pending requests

_For any_ client state with pending requests, when re-synchronization is attempted, all pending requests should be cleared before the retry
**Validates: Requirements 3.2**

### Property 4: Connection state transitions are valid

_For any_ sequence of connection state changes, the state should only transition through valid paths (e.g., CONNECTING → CONNECTED or CONNECTING → TIMEOUT_RETRYING → CONNECTED)
**Validates: Requirements 4.4**

### Property 5: Retry backoff increases delay

_For any_ retry attempt number N, the delay before attempt N+1 should be greater than the delay before attempt N
**Validates: Requirements 3.1**

### Property 6: Server process detection accuracy

_For any_ server process state, if the process has exited, then isServerProcessAlive() should return false
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 7: Timeout respects configuration

_For any_ request with a configured timeout T, if the server doesn't respond within T milliseconds, the request should fail with a timeout error
**Validates: Requirements 1.1, 2.1**

### Property 8: UI state reflects connection state

_For any_ connection state change, all registered listeners should be notified with the updated status
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 9: Diagnostic information completeness

_For any_ server diagnostics request, the returned diagnostics should include process status, pending request count, and connection state
**Validates: Requirements 8.3**

### Property 10: Error messages distinguish server states

_For any_ error condition, if the server process is running but unresponsive, the error message should be different from when the server process is not running
**Validates: Requirements 4.3**

### Property 11: Log entries include required metadata

_For any_ communication event (request, response, notification), the log entry should include a timestamp and request ID
**Validates: Requirements 4.5**

### Property 12: Initialization uses correct timeout

_For any_ initialize or tools/list request, the timeout used should be the initialization timeout, not the standard request timeout
**Validates: Requirements 6.1, 6.2**

## Error Handling

### Timeout Scenarios

1. **Initialization Timeout with Running Server**

   - Trigger re-synchronization
   - Update UI to show "Timeout - Retrying (attempt X/3)"
   - Log detailed diagnostics
   - After max retries, offer manual recovery options

2. **Initialization Timeout with Dead Server**

   - Immediately fail with "Server process exited" error
   - Offer to restart server
   - Log exit code and stderr output

3. **Standard Request Timeout**
   - Fail the specific request
   - Keep connection alive
   - Log timeout with request details
   - Don't trigger re-synchronization for individual requests

### Server Process Errors

1. **Spawn Failure**

   - Provide diagnostic information (executable path, environment)
   - Check if executable exists and is executable
   - Suggest common fixes (install package, check PATH)

2. **Unexpected Exit**

   - Log exit code and signal
   - Capture and log stderr output
   - Offer automatic restart
   - Update UI to show disconnected state

3. **Unresponsive Server**
   - Detect via timeout
   - Verify process is still running
   - Attempt re-synchronization
   - If re-sync fails, offer to restart

### Configuration Errors

1. **Invalid Timeout Values**

   - Reject configuration with clear error message
   - Suggest valid ranges
   - Keep existing configuration

2. **Conflicting Settings**
   - Validate initialization timeout >= standard timeout
   - Show validation error in settings UI
   - Prevent saving invalid configuration

## Testing Strategy

### Unit Testing

Unit tests will cover:

- TimeoutManager configuration validation and timeout selection
- ConnectionStateManager state transitions and listener notifications
- ReSyncManager retry logic and backoff calculations
- Request timeout handling in isolation
- Error message formatting for different scenarios

### Property-Based Testing

Property-based tests will verify:

- All correctness properties listed above
- Configuration validation across random timeout values
- State machine transitions across random event sequences
- Retry backoff behavior across random retry counts
- Log format consistency across random communication events

We will use the `fast-check` library for property-based testing in TypeScript. Each property-based test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

### Integration Testing

Integration tests will cover:

- Full initialization flow with simulated slow server
- Re-synchronization with mock server that times out then responds
- UI updates in response to connection state changes
- Manual reconnect and restart commands
- Configuration changes applied to running client

### Test Utilities

We will create test utilities for:

- Mock MCP server with configurable response delays
- Simulated server process that can be controlled (exit, hang, respond)
- Connection state observer for verifying UI updates
- Log capture and assertion helpers

## Implementation Notes

### Backward Compatibility

- Existing code using MCPProcessClient will continue to work with default timeout values
- New timeout configuration is optional
- Tree providers will automatically benefit from improved connection state management

### Performance Considerations

- Timeout checks use native setTimeout, no polling
- Connection state updates are event-driven, not polled
- Pending request map is cleaned up immediately on response or timeout
- Re-synchronization uses exponential backoff to avoid overwhelming the server

### VSCode Settings Schema

```json
{
  "mcp-process.timeout.initialization": {
    "type": "number",
    "default": 60000,
    "minimum": 10000,
    "maximum": 300000,
    "description": "Timeout in milliseconds for server initialization (10-300 seconds)"
  },
  "mcp-process.timeout.standardRequest": {
    "type": "number",
    "default": 30000,
    "minimum": 5000,
    "maximum": 120000,
    "description": "Timeout in milliseconds for standard requests (5-120 seconds)"
  },
  "mcp-process.reconnect.maxRetries": {
    "type": "number",
    "default": 3,
    "minimum": 0,
    "maximum": 10,
    "description": "Maximum number of reconnection attempts"
  },
  "mcp-process.reconnect.retryDelay": {
    "type": "number",
    "default": 2000,
    "minimum": 1000,
    "maximum": 10000,
    "description": "Initial delay in milliseconds between reconnection attempts"
  }
}
```

### Logging Strategy

All logs will include:

- ISO 8601 timestamp
- Request ID (for requests/responses)
- Method name
- Duration (for completed operations)
- Connection state (for state changes)
- Server process PID (when available)

Log levels:

- **DEBUG**: All JSON-RPC messages, state transitions
- **INFO**: Connection established, requests completed, retries
- **WARN**: Timeouts, retry attempts, configuration warnings
- **ERROR**: Initialization failures, server crashes, unrecoverable errors
