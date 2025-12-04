# MCP Process E2E Testing - Requirements Document

## Introduction

This document specifies requirements for adding comprehensive End-to-End (E2E) socket-to-process behavior functionality testing to the MCP Process Server. These tests will validate that the MCP Server correctly implements the Model Context Protocol by spawning the server as a child process and communicating via stdio using JSON-RPC, ensuring the complete request/response cycle works as expected in real-world usage scenarios.

## Glossary

- **E2E Test**: End-to-End test that validates the complete system behavior from external interface to final output
- **Socket-to-Process Communication**: Communication pattern where a client process communicates with a server process via standard input/output streams
- **JSON-RPC**: A remote procedure call protocol encoded in JSON format
- **stdio**: Standard input/output streams (stdin, stdout, stderr) used for inter-process communication
- **MCP Protocol**: Model Context Protocol defining how AI agents communicate with MCP servers
- **Child Process**: A process spawned by a test process for validation purposes
- **Integration Test**: Test that validates interaction between multiple components within the same process
- **Smoke Test**: Quick test that validates basic functionality is working

## Requirements

### Requirement 1

**User Story:** As a developer, I want comprehensive e2e tests that spawn the MCP server as a child process, so that I can validate the server works correctly when run as a standalone process.

#### Acceptance Criteria

1. WHEN the e2e test suite runs, THE test framework SHALL spawn the MCP server as a child process using Node.js spawn
2. WHEN the server process starts, THE test framework SHALL establish stdio communication channels for stdin, stdout, and stderr
3. WHEN the server is ready, THE test framework SHALL wait for the server to initialize before sending requests
4. WHEN tests complete, THE test framework SHALL gracefully terminate the server process and clean up resources
5. WHEN the server process fails to start, THE test framework SHALL report a clear error with diagnostic information

### Requirement 2

**User Story:** As a developer, I want e2e tests to validate MCP protocol initialization, so that I can ensure the server correctly implements the protocol handshake.

#### Acceptance Criteria

1. WHEN the test sends an initialize request, THE MCP Server SHALL respond with protocol version and server information
2. WHEN the initialize response is received, THE response SHALL include server name as "mcp-process"
3. WHEN the initialize response is received, THE response SHALL include capabilities object with tools capability
4. WHEN the initialize request uses protocol version "2024-11-05", THE MCP Server SHALL accept and respond successfully
5. WHEN the initialize request includes client information, THE MCP Server SHALL acknowledge the client details

### Requirement 3

**User Story:** As a developer, I want e2e tests to validate tool discovery, so that I can ensure all process management tools are correctly exposed via the MCP protocol.

#### Acceptance Criteria

1. WHEN the test sends a tools/list request, THE MCP Server SHALL return an array of all available tools
2. WHEN the tools list is returned, THE response SHALL include process_start, process_terminate, process_get_status, and process_list tools
3. WHEN each tool is listed, THE tool definition SHALL include name, description, and inputSchema properties
4. WHEN the inputSchema is provided, THE schema SHALL define all required and optional parameters with correct types
5. WHEN the test validates tool schemas, THE schemas SHALL match the expected structure for each tool

### Requirement 4

**User Story:** As a developer, I want e2e tests to validate process launch via MCP protocol, so that I can ensure the complete request/response cycle works for starting processes.

#### Acceptance Criteria

1. WHEN the test sends a tools/call request for process_start, THE MCP Server SHALL spawn the requested process and return success
2. WHEN the process starts successfully, THE response SHALL include status "success", PID, and start time
3. WHEN the test launches a process with allowed executable, THE MCP Server SHALL accept the request and return process information
4. WHEN the test attempts to launch a blocked executable, THE MCP Server SHALL reject the request with a security error
5. WHEN the test launches a process with environment variables, THE MCP Server SHALL set those variables and return success

### Requirement 5

**User Story:** As a developer, I want e2e tests to validate process monitoring via MCP protocol, so that I can ensure resource statistics are correctly reported through the protocol.

#### Acceptance Criteria

1. WHEN the test sends a tools/call request for process_get_stats, THE MCP Server SHALL return CPU and memory usage statistics
2. WHEN the statistics are returned, THE response SHALL include cpuPercent, memoryMB, and timestamp fields
3. WHEN the test requests statistics for a running process, THE MCP Server SHALL return current resource usage
4. WHEN the test requests statistics for a non-existent process, THE MCP Server SHALL return an error with code "PROCESS_NOT_FOUND"
5. WHEN the test requests historical statistics, THE MCP Server SHALL return an array of historical data points

### Requirement 6

**User Story:** As a developer, I want e2e tests to validate process termination via MCP protocol, so that I can ensure processes can be stopped correctly through the protocol.

#### Acceptance Criteria

1. WHEN the test sends a tools/call request for process_terminate, THE MCP Server SHALL terminate the specified process
2. WHEN graceful termination is requested, THE MCP Server SHALL send SIGTERM and return success when process exits
3. WHEN forced termination is requested, THE MCP Server SHALL send SIGKILL and return success
4. WHEN termination completes, THE response SHALL include exit code and termination reason
5. WHEN the test attempts to terminate a non-existent process, THE MCP Server SHALL return an error

### Requirement 7

**User Story:** As a developer, I want e2e tests to validate output capture via MCP protocol, so that I can ensure stdout and stderr are correctly captured and returned.

#### Acceptance Criteria

1. WHEN the test launches a process with output capture enabled, THE MCP Server SHALL buffer stdout and stderr
2. WHEN the test requests output via tools/call, THE MCP Server SHALL return buffered output with stream identification
3. WHEN a process writes to stdout, THE captured output SHALL be available in the response
4. WHEN a process writes to stderr, THE captured error output SHALL be available separately
5. WHEN the test retrieves output after process completion, THE MCP Server SHALL return all captured output

### Requirement 8

**User Story:** As a developer, I want e2e tests to validate service management via MCP protocol, so that I can ensure long-running services can be managed through the protocol.

#### Acceptance Criteria

1. WHEN the test sends a tools/call request for process_start_service, THE MCP Server SHALL start a service and return service ID
2. WHEN the service starts successfully, THE response SHALL include service ID, PID, and status
3. WHEN the test sends a tools/call request for process_stop_service, THE MCP Server SHALL stop the service gracefully
4. WHEN the test configures auto-restart, THE MCP Server SHALL restart the service if it crashes
5. WHEN the test queries service status, THE MCP Server SHALL return current service state and health information

### Requirement 9

**User Story:** As a developer, I want e2e tests to validate error handling via MCP protocol, so that I can ensure errors are correctly reported through the protocol.

#### Acceptance Criteria

1. WHEN the test sends a request for an unknown tool, THE MCP Server SHALL return an error response with isError true
2. WHEN the test sends a request with missing required parameters, THE MCP Server SHALL return a validation error
3. WHEN the test sends a request with invalid parameter types, THE MCP Server SHALL return a type error
4. WHEN an error occurs, THE response SHALL include error code, message, and status "error"
5. WHEN the test sends malformed JSON-RPC, THE MCP Server SHALL handle gracefully and return a protocol error

### Requirement 10

**User Story:** As a developer, I want e2e tests to validate security policy enforcement via MCP protocol, so that I can ensure security boundaries are enforced in real-world usage.

#### Acceptance Criteria

1. WHEN the test attempts to launch an executable not in the allowlist, THE MCP Server SHALL reject with security error
2. WHEN the test attempts to launch a dangerous executable like sudo, THE MCP Server SHALL reject the request
3. WHEN the test provides dangerous environment variables, THE MCP Server SHALL sanitize or reject them
4. WHEN the test attempts command injection in arguments, THE MCP Server SHALL detect and reject the request
5. WHEN security violations occur, THE response SHALL include clear error messages indicating the security issue

### Requirement 11

**User Story:** As a developer, I want e2e tests to validate JSON-RPC protocol compliance, so that I can ensure the server correctly implements the JSON-RPC specification.

#### Acceptance Criteria

1. WHEN the test sends a JSON-RPC request, THE request SHALL include jsonrpc "2.0", id, method, and params fields
2. WHEN the MCP Server responds, THE response SHALL include jsonrpc "2.0", id matching the request, and result or error
3. WHEN multiple requests are sent, THE MCP Server SHALL match responses to requests using the id field
4. WHEN the test sends requests via stdin, THE MCP Server SHALL respond via stdout with newline-delimited JSON
5. WHEN the test parses responses, THE responses SHALL be valid JSON-RPC 2.0 format

### Requirement 12

**User Story:** As a developer, I want minimal e2e smoke tests, so that I can quickly validate basic functionality without running the full test suite.

#### Acceptance Criteria

1. WHEN the minimal test suite runs, THE tests SHALL complete in under 30 seconds
2. WHEN the minimal tests run, THE tests SHALL validate initialize, tools/list, and one basic tool call
3. WHEN the minimal tests pass, THE basic MCP protocol functionality SHALL be confirmed working
4. WHEN the minimal tests fail, THE failure SHALL indicate which basic functionality is broken
5. WHEN running in CI, THE minimal tests SHALL provide quick feedback on basic functionality

### Requirement 13

**User Story:** As a developer, I want e2e tests to handle server startup failures gracefully, so that I can debug issues when the server fails to start.

#### Acceptance Criteria

1. WHEN the server executable is not found, THE test framework SHALL report a clear error with the searched paths
2. WHEN the server fails to start, THE test framework SHALL capture and display stderr output
3. WHEN the server crashes during startup, THE test framework SHALL report the crash with diagnostic information
4. WHEN the server is not built, THE test framework SHALL provide instructions to build the server
5. WHEN debugging is needed, THE test framework SHALL log all communication between test and server

### Requirement 14

**User Story:** As a developer, I want e2e tests to validate resource limit enforcement via MCP protocol, so that I can ensure resource limits work correctly in real-world usage.

#### Acceptance Criteria

1. WHEN the test launches a process with CPU limit, THE MCP Server SHALL enforce the limit and terminate if exceeded
2. WHEN the test launches a process with memory limit, THE MCP Server SHALL enforce the limit and terminate if exceeded
3. WHEN a process exceeds resource limits, THE MCP Server SHALL return an error indicating resource limit exceeded
4. WHEN the test queries resource usage, THE response SHALL include current usage and configured limits
5. WHEN resource limits are enforced, THE process SHALL be terminated and cleaned up properly

### Requirement 15

**User Story:** As a developer, I want e2e tests to validate timeout handling via MCP protocol, so that I can ensure timeout constraints work correctly through the protocol.

#### Acceptance Criteria

1. WHEN the test launches a process with timeout, THE MCP Server SHALL terminate the process if timeout is exceeded
2. WHEN a process times out, THE response SHALL include timeout error and output captured up to that point
3. WHEN the test extends a timeout, THE MCP Server SHALL update the timeout for the running process
4. WHEN a process completes before timeout, THE MCP Server SHALL return success with full output
5. WHEN no timeout is specified, THE MCP Server SHALL apply the default maximum timeout

### Requirement 16

**User Story:** As a developer, I want e2e tests to run in CI environments, so that I can ensure the server works correctly in automated testing pipelines.

#### Acceptance Criteria

1. WHEN e2e tests run in CI, THE tests SHALL handle headless environments without display servers
2. WHEN e2e tests run in CI, THE tests SHALL not require interactive input or user intervention
3. WHEN e2e tests run in CI, THE tests SHALL clean up all spawned processes even if tests fail
4. WHEN e2e tests run in CI, THE tests SHALL provide clear failure messages for debugging
5. WHEN e2e tests run in CI, THE tests SHALL complete within reasonable time limits (under 5 minutes)

### Requirement 17

**User Story:** As a developer, I want e2e test structure to match mcp-screenshot and mcp-debugger-server patterns, so that I can maintain consistency across MCP server implementations.

#### Acceptance Criteria

1. WHEN e2e tests are organized, THE test files SHALL be named server.e2e.spec.ts and server.minimal.e2e.spec.ts
2. WHEN e2e tests are structured, THE tests SHALL use the same helper functions pattern (startServer, sendRequest, stopServer)
3. WHEN e2e tests spawn the server, THE tests SHALL use the same CLI path resolution logic as other MCP servers
4. WHEN e2e tests communicate with the server, THE tests SHALL use the same JSON-RPC request/response pattern
5. WHEN e2e tests are written, THE test organization SHALL follow the same describe block structure as other MCP servers
