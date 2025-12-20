# Requirements Document

## Introduction

All three MCP ACS extensions (Process, Screenshot, and Debugger) that use JSON-RPC communication with MCP servers suffer from the same hardcoded 30-second timeout issue. This causes connection failures when servers take longer to initialize or respond. Rather than fixing each extension independently, we should create a shared MCP client base class that all extensions can use, providing consistent timeout handling, re-synchronization logic, and connection state management across the entire ACS suite.

## Glossary

- **MCP Server**: A Model Context Protocol server process that provides specific capabilities (process management, screenshots, debugging)
- **VSCode Extension**: A Visual Studio Code extension that provides UI and communicates with an MCP Server
- **JSON-RPC**: The Remote Procedure Call protocol used for communication between extensions and servers
- **Shared Base Client**: A common base class that provides timeout handling, connection management, and re-synchronization logic
- **Extension-Specific Client**: A client class that extends the shared base client with extension-specific functionality
- **Request Timeout**: The maximum duration the client will wait for a server response
- **Re-synchronization**: The process of re-establishing communication after a timeout or connection failure
- **Connection State**: The current status of the client-server connection (connecting, connected, timeout-retrying, disconnected, error)

## Requirements

### Requirement 1

**User Story:** As a developer using any MCP ACS extension, I want consistent and reliable connection behavior across all extensions, so that I don't experience different timeout issues with different tools.

#### Acceptance Criteria

1. WHEN any MCP ACS extension initializes THEN the System SHALL use a shared base client with consistent timeout handling
2. WHEN a timeout occurs in any extension THEN the System SHALL apply the same re-synchronization logic
3. WHEN connection state changes in any extension THEN the System SHALL use the same state management approach
4. WHEN configuration is updated in any extension THEN the System SHALL validate settings using the same rules
5. WHEN errors occur in any extension THEN the System SHALL provide consistent error messages and recovery options

### Requirement 2

**User Story:** As a developer, I want a shared MCP client library that I can extend for specific use cases, so that common functionality is maintained in one place.

#### Acceptance Criteria

1. WHEN creating a new MCP extension THEN the System SHALL provide a base client class that can be extended
2. WHEN the base client is extended THEN the System SHALL allow customization of tool-specific behavior while preserving common functionality
3. WHEN the base client is updated THEN the System SHALL automatically benefit all extensions that use it
4. WHEN an extension needs custom timeout logic THEN the System SHALL allow overriding default timeout behavior
5. WHEN an extension needs custom error handling THEN the System SHALL provide hooks for extension-specific error processing

### Requirement 3

**User Story:** As a developer, I want configurable timeouts that work consistently across all MCP extensions, so that I can tune behavior once for my entire system.

#### Acceptance Criteria

1. WHEN I configure timeout settings THEN the System SHALL apply them to all MCP ACS extensions
2. WHEN I set an initialization timeout THEN the System SHALL use it for all extension initialization sequences
3. WHEN I set a standard request timeout THEN the System SHALL use it for all standard tool calls
4. WHEN timeout settings are invalid THEN the System SHALL validate them consistently across all extensions
5. WHERE timeout settings are not configured THEN the System SHALL use the same defaults (60s init, 30s standard) across all extensions

### Requirement 4

**User Story:** As a developer, I want automatic re-synchronization that works the same way in all extensions, so that connection issues are handled predictably.

#### Acceptance Criteria

1. WHEN a timeout occurs in any extension THEN the System SHALL attempt re-synchronization using the same retry logic
2. WHEN re-synchronization is attempted THEN the System SHALL use the same exponential backoff strategy across all extensions
3. WHEN re-synchronization succeeds THEN the System SHALL restore normal operation in the same way for all extensions
4. WHEN re-synchronization fails THEN the System SHALL provide the same recovery options across all extensions
5. WHILE re-synchronization is in progress THEN the System SHALL display consistent status indicators across all extensions

### Requirement 5

**User Story:** As a developer, I want connection state management that works consistently across all extensions, so that UI updates are predictable and reliable.

#### Acceptance Criteria

1. WHEN connection state changes THEN the System SHALL use the same state machine across all extensions
2. WHEN state transitions occur THEN the System SHALL validate transitions using the same rules for all extensions
3. WHEN listeners are notified THEN the System SHALL use the same notification mechanism across all extensions
4. WHEN UI components subscribe to state changes THEN the System SHALL provide the same subscription interface for all extensions
5. WHEN connection status is queried THEN the System SHALL return the same status format across all extensions

### Requirement 6

**User Story:** As a developer, I want the Process, Screenshot, and Debugger extensions to migrate to the shared client, so that they all benefit from improved timeout handling.

#### Acceptance Criteria

1. WHEN the Process extension is updated THEN the System SHALL use the shared base client instead of its custom implementation
2. WHEN the Screenshot extension is updated THEN the System SHALL use the shared base client instead of its custom implementation
3. WHEN the Debugger extension is updated THEN the System SHALL use the shared base client instead of its custom implementation
4. WHEN extensions are migrated THEN the System SHALL maintain backward compatibility with existing functionality
5. WHEN extensions are migrated THEN the System SHALL preserve all extension-specific features while using shared infrastructure

### Requirement 7

**User Story:** As a developer, I want comprehensive logging that works consistently across all extensions, so that I can diagnose issues regardless of which extension is having problems.

#### Acceptance Criteria

1. WHEN any extension logs communication events THEN the System SHALL include timestamps, request IDs, and method names
2. WHEN any extension logs errors THEN the System SHALL include error category, server process status, and connection state
3. WHEN any extension logs state changes THEN the System SHALL include previous state, new state, and reason for change
4. WHEN log levels are configured THEN the System SHALL apply them consistently across all extensions
5. WHEN viewing logs from multiple extensions THEN the System SHALL use consistent formatting for easy correlation

### Requirement 8

**User Story:** As a developer, I want shared diagnostic commands that work across all extensions, so that I can troubleshoot connection issues in a consistent way.

#### Acceptance Criteria

1. WHEN I execute a "Reconnect" command THEN the System SHALL attempt re-synchronization for the specific extension
2. WHEN I execute a "Restart Server" command THEN the System SHALL restart the specific extension's server
3. WHEN I execute a "Show Diagnostics" command THEN the System SHALL display diagnostics in a consistent format across all extensions
4. WHEN I execute a "Show All MCP Status" command THEN the System SHALL display connection status for all MCP ACS extensions
5. WHEN diagnostics are displayed THEN the System SHALL include server process status, pending requests, and recent communication logs

### Requirement 9

**User Story:** As a developer, I want the shared client to handle server process lifecycle consistently, so that spawn failures, crashes, and unexpected exits are handled the same way across all extensions.

#### Acceptance Criteria

1. WHEN a server process fails to spawn THEN the System SHALL provide diagnostic information consistently across all extensions
2. WHEN a server process exits unexpectedly THEN the System SHALL log exit code and stderr consistently across all extensions
3. WHEN a server process is killed by a signal THEN the System SHALL log the signal name consistently across all extensions
4. WHEN a server process crashes THEN the System SHALL offer automatic restart consistently across all extensions
5. WHEN checking if a server process is alive THEN the System SHALL use the same detection logic across all extensions

### Requirement 10

**User Story:** As a developer, I want the shared client to be well-tested with property-based tests, so that I can trust it will work reliably across all extensions.

#### Acceptance Criteria

1. WHEN the shared client is tested THEN the System SHALL include property-based tests for timeout handling
2. WHEN the shared client is tested THEN the System SHALL include property-based tests for re-synchronization logic
3. WHEN the shared client is tested THEN the System SHALL include property-based tests for connection state management
4. WHEN the shared client is tested THEN the System SHALL include property-based tests for configuration validation
5. WHEN the shared client is tested THEN the System SHALL verify that all extensions using the shared client behave consistently
