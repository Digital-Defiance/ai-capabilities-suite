# Requirements Document

> **Note:** This spec has been largely superseded by the `shared-mcp-client-timeout-fix` spec, which implemented a shared `@ai-capabilities-suite/mcp-client-base` package that addresses these requirements across ALL MCP extensions (Process, Screenshot, Debugger, and Filesystem). The Process extension has been migrated to use `BaseMCPClient`. The requirements below are preserved for reference, with most core functionality already implemented in the shared package.

## Introduction

The MCP ACS Process Manager extension currently suffers from initialization timeout issues where the VSCode extension times out waiting for the MCP server to respond, even though the server successfully starts. This results in the UI showing "Server not running" despite the server being operational. The system needs configurable timeouts, better error handling, and automatic re-synchronization capabilities to recover from timeout scenarios.

## Glossary

- **MCP Server**: The Model Context Protocol server process that manages system processes with security boundaries
- **VSCode Extension**: The Visual Studio Code extension that provides the UI and communicates with the MCP Server
- **Initialization Handshake**: The JSON-RPC protocol exchange where the client sends an "initialize" request and waits for the server's response
- **Request Timeout**: The maximum duration the client will wait for a server response before considering the request failed
- **Re-synchronization**: The process of re-establishing communication between the client and server after a timeout or connection failure
- **Tree Provider**: The VSCode UI component that displays process lists and security boundaries in the sidebar
- **JSON-RPC**: The Remote Procedure Call protocol used for communication between the extension and server

## Requirements

### Requirement 1

**User Story:** As a developer using the MCP Process Manager, I want the extension to successfully connect to the server even when initialization takes longer than expected, so that I can use the process management features without manual intervention.

#### Acceptance Criteria

1. WHEN the MCP Server takes longer than 30 seconds to initialize THEN the VSCode Extension SHALL continue waiting up to a configurable timeout before failing
2. WHEN the initialization timeout is reached THEN the VSCode Extension SHALL log detailed diagnostic information including server process status
3. WHEN the server process is running but unresponsive THEN the VSCode Extension SHALL attempt re-synchronization before declaring failure
4. WHEN initialization completes successfully THEN the VSCode Extension SHALL update all UI components to reflect the connected state
5. WHEN initialization fails after all retry attempts THEN the VSCode Extension SHALL provide actionable error messages with recovery options

### Requirement 2

**User Story:** As a developer, I want configurable timeout settings for different types of operations, so that I can tune the extension behavior for my system's performance characteristics.

#### Acceptance Criteria

1. WHEN the extension starts THEN the System SHALL load timeout configuration from VSCode settings with sensible defaults
2. WHEN a user modifies timeout settings THEN the System SHALL validate that initialization timeout is greater than or equal to standard request timeout
3. WHEN a user sets an initialization timeout below 10 seconds THEN the System SHALL reject the configuration with a validation error
4. WHEN a user sets an initialization timeout above 300 seconds THEN the System SHALL accept the configuration but log a warning
5. WHERE timeout settings are not explicitly configured THEN the System SHALL use 60 seconds for initialization and 30 seconds for standard requests

### Requirement 3

**User Story:** As a developer, I want the extension to automatically recover from timeout scenarios, so that I don't have to manually restart the extension or reload VSCode.

#### Acceptance Criteria

1. WHEN an initialization timeout occurs AND the server process is still running THEN the System SHALL attempt to re-send the initialize request
2. WHEN re-synchronization is attempted THEN the System SHALL clear all pending requests before retrying
3. WHEN re-synchronization succeeds THEN the System SHALL restore normal operation and refresh all UI components
4. WHEN re-synchronization fails after 3 attempts THEN the System SHALL offer the user options to restart the server or view diagnostics
5. WHILE re-synchronization is in progress THEN the System SHALL display a status indicator showing the retry attempt number

### Requirement 4

**User Story:** As a developer, I want clear visibility into connection status and timeout issues, so that I can diagnose problems and understand what the extension is doing.

#### Acceptance Criteria

1. WHEN the extension is waiting for server initialization THEN the System SHALL display a progress indicator with elapsed time
2. WHEN a timeout occurs THEN the System SHALL log the request type, timeout duration, and server process status
3. WHEN the server process exists but is unresponsive THEN the System SHALL distinguish this from "server not started" in error messages
4. WHEN displaying connection status in the UI THEN the System SHALL show one of: "Connecting", "Connected", "Timeout - Retrying", "Disconnected", or "Error"
5. WHEN the user views the output channel THEN the System SHALL include timestamps and request IDs for all communication events

### Requirement 5

**User Story:** As a developer, I want the Tree Providers to accurately reflect server connection status, so that I know when the process management features are available.

#### Acceptance Criteria

1. WHEN the server is initializing THEN the Tree Providers SHALL display a "Connecting to server..." message
2. WHEN the server connection times out THEN the Tree Providers SHALL display "Connection timeout - retrying..." with retry count
3. WHEN the server is connected THEN the Tree Providers SHALL display process and security information
4. WHEN the server connection is lost THEN the Tree Providers SHALL immediately update to show disconnected state
5. WHEN re-synchronization succeeds THEN the Tree Providers SHALL automatically refresh to display current data

### Requirement 6

**User Story:** As a developer, I want different timeout values for different operation types, so that long-running operations don't fail prematurely while keeping interactive operations responsive.

#### Acceptance Criteria

1. WHEN sending an initialize request THEN the System SHALL use the initialization timeout value
2. WHEN sending a tools/list request THEN the System SHALL use the initialization timeout value
3. WHEN sending a process_start request THEN the System SHALL use the standard request timeout value
4. WHEN sending a process_get_stats request THEN the System SHALL use the standard request timeout value
5. WHEN sending any other tool call THEN the System SHALL use the standard request timeout value

### Requirement 7

**User Story:** As a developer, I want the extension to detect when the server process has crashed or exited, so that I can be notified immediately rather than waiting for a timeout.

#### Acceptance Criteria

1. WHEN the server process exits during initialization THEN the System SHALL immediately fail initialization with a "server exited" error
2. WHEN the server process exits with a non-zero exit code THEN the System SHALL log the exit code and any stderr output
3. WHEN the server process is killed by a signal THEN the System SHALL log the signal name
4. WHEN the server process exits unexpectedly THEN the System SHALL offer to restart the server automatically
5. WHEN the server process cannot be spawned THEN the System SHALL provide diagnostic information about the executable path and environment

### Requirement 8

**User Story:** As a developer, I want manual commands to force re-synchronization or restart the server, so that I can recover from error states without reloading VSCode.

#### Acceptance Criteria

1. WHEN the user executes the "Reconnect to Server" command THEN the System SHALL attempt re-synchronization without restarting the server process
2. WHEN the user executes the "Restart Server" command THEN the System SHALL terminate the existing server process and start a new one
3. WHEN the user executes the "Show Server Diagnostics" command THEN the System SHALL display server process status, pending requests, and recent communication logs
4. WHEN a manual reconnect succeeds THEN the System SHALL display a success notification
5. WHEN a manual reconnect fails THEN the System SHALL display an error notification with the failure reason
