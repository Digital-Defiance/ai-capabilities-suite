# Implementation Plan

## Status Update

**This spec has been superseded by the `shared-mcp-client-timeout-fix` spec**, which implemented a shared `@ai-capabilities-suite/mcp-client-base` package that provides timeout handling, re-synchronization, and connection state management for ALL MCP extensions (Process, Screenshot, Debugger, and Filesystem).

The Process extension has already been migrated to use `BaseMCPClient` from the shared package, which provides all the core functionality originally planned in this spec:

- ✅ TimeoutManager, ConnectionStateManager, and ReSyncManager (implemented in shared package)
- ✅ Configurable timeouts with validation
- ✅ Automatic re-synchronization with exponential backoff
- ✅ Connection state management with listener notifications
- ✅ Enhanced error handling and diagnostics
- ✅ Comprehensive property-based and unit tests

**Remaining Process-Specific Work:**

The tasks below focus on Process extension-specific features that were not covered by the shared implementation.

---

## Completed by Shared Implementation

- [x] 1. Create core manager classes _(Completed in mcp-client-base package)_
- [x] 1.1 Write property test for timeout configuration validation _(Completed in mcp-client-base)_
- [x] 1.2 Write property test for retry backoff _(Completed in mcp-client-base)_
- [x] 1.3 Write property test for connection state transitions _(Completed in mcp-client-base)_
- [x] 1.4 Write unit tests for manager classes _(Completed in mcp-client-base)_
- [x] 3. Enhance MCPProcessClient with timeout management _(Completed via BaseMCPClient)_
- [x] 3.1 Write property test for timeout selection _(Completed in mcp-client-base)_
- [x] 3.2 Write property test for initialization timeout _(Completed in mcp-client-base)_
- [x] 3.3 Write unit tests for timeout handling _(Completed in mcp-client-base)_
- [x] 4. Implement connection state management _(Completed via BaseMCPClient)_
- [x] 4.1 Write property test for state change notifications _(Completed in mcp-client-base)_
- [x] 4.2 Write unit tests for state transitions _(Completed in mcp-client-base)_
- [x] 5. Implement re-synchronization logic _(Completed via BaseMCPClient)_
- [x] 5.1 Write property test for pending request clearing _(Completed in mcp-client-base)_
- [x] 5.2 Write property test for server process detection _(Completed in mcp-client-base)_
- [x] 5.3 Write unit tests for re-sync scenarios _(Completed in mcp-client-base)_
- [x] 6. Implement enhanced error handling and diagnostics _(Completed via BaseMCPClient)_
- [x] 6.1 Write property test for error message differentiation _(Completed in mcp-client-base)_
- [x] 6.2 Write property test for diagnostic completeness _(Completed in mcp-client-base)_
- [x] 6.3 Write property test for log metadata _(Completed in mcp-client-base)_
- [x] 6.4 Write unit tests for error scenarios _(Completed in mcp-client-base)_
- [x] 9. Update extension activation to use enhanced client _(Completed via BaseMCPClient migration)_
- [x] 9.1 Write integration tests for initialization flow _(Completed in shared-mcp-client-timeout-fix)_
- [x] 11. Add comprehensive logging _(Completed via BaseMCPClient)_
- [x] 11.1 Write unit tests for log format _(Completed in mcp-client-base)_

## Process Extension-Specific Tasks

### ✅ Completed Tasks

- [x] **2. Add VSCode settings schema for Process extension** _(Completed)_

  - ✅ Added Process-specific timeout configuration settings to package.json
  - ✅ Added Process-specific reconnect configuration settings
  - ✅ Implemented settings validation that uses shared TimeoutManager
  - ✅ Added configuration change handlers that update BaseMCPClient config
  - ✅ All 342 tests passing
  - _Requirements: 2.1, 2.3, 2.4, 2.5_
  - _Note: The shared package provides the validation logic; this task adds Process extension UI for configuration_

- [x] **2.1 Write property test for settings validation** _(Completed)_

  - ✅ **Property 7: Timeout respects configuration**
  - ✅ **Validates: Requirements 1.1, 2.1**
  - ✅ Created `timeoutConfig.property.test.ts` with 6 property tests
  - ✅ All tests passing
  - _Note: Verify Process extension properly passes config to BaseMCPClient_

- [x] **2.2 Write unit tests for settings edge cases** _(Completed)_

  - ✅ Test timeout below 10 seconds (should reject)
  - ✅ Test timeout above 300 seconds (should warn)
  - ✅ Test missing configuration (should use defaults)
  - ✅ Created `timeoutConfig.unit.test.ts` with comprehensive edge case tests
  - ✅ All tests passing
  - _Requirements: 2.3, 2.4, 2.5_

### 🔄 Remaining Tasks

- [x] 7. Update Tree Providers to use connection state

  - Update ProcessTreeDataProvider to subscribe to BaseMCPClient connection state
  - Update SecurityTreeDataProvider to subscribe to BaseMCPClient connection state
  - Implement connection status display in tree views
  - Add "Connecting..." message during initialization
  - Add "Timeout - retrying (X/3)" message during re-sync
  - Add automatic refresh on connection state changes
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - _Note: BaseMCPClient provides the state management; this task connects it to Process UI_

- [x] 7.1 Write unit tests for tree provider updates

  - Test tree provider shows connecting message
  - Test tree provider shows timeout message with retry count
  - Test tree provider shows connected state with data
  - Test tree provider auto-refreshes on state change
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Add manual recovery commands for Process extension

  - Add "Reconnect to Process Server" command using BaseMCPClient.reconnect()
  - Add "Show Process Server Diagnostics" command using BaseMCPClient.getDiagnostics()
  - Update existing "Restart Process Server" command to use BaseMCPClient error handling
  - Add command handlers in extension.ts
  - Register commands in package.json
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - _Note: BaseMCPClient provides reconnect() and getDiagnostics(); this task adds Process-specific commands_

- [x] 8.1 Write unit tests for manual commands

  - Test reconnect command calls BaseMCPClient.reconnect()
  - Test restart command kills and restarts process
  - Test diagnostics command shows required information from BaseMCPClient.getDiagnostics()
  - Test success/failure notifications
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Checkpoint - Ensure all Process extension tests pass

  - Ensure all tests pass, ask the user if questions arise.
  - Verify Process extension works with BaseMCPClient
  - Verify no regressions in Process-specific functionality

- [x] 12. Update Process extension documentation

  - Update README with new timeout settings specific to Process extension
  - Add troubleshooting section for timeout issues
  - Document manual recovery commands
  - Add examples of configuration for different scenarios
  - Reference shared mcp-client-base package documentation
  - _Requirements: All_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify Process extension fully integrated with shared BaseMCPClient
  - Verify all Process-specific features work correctly
