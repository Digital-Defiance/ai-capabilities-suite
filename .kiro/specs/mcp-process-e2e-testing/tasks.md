# Implementation Plan

- [x] 1. Create comprehensive e2e test file structure

  - Create `packages/mcp-process/src/lib/server.e2e.spec.ts` with test scaffolding
  - Create `packages/mcp-process/src/lib/server.minimal.e2e.spec.ts` with minimal test scaffolding
  - Set up test suite structure matching mcp-screenshot and mcp-debugger-server patterns
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 17.1, 17.2, 17.5_

- [x] 2. Implement server lifecycle management helpers

  - [x] 2.1 Implement startServer() function with CLI path resolution
    - Add logic to search for dist/cli.js in multiple locations
    - Add recursive directory search with package.json verification
    - Add server process spawning with stdio pipes
    - Add event listeners for stdout, stderr, and errors
    - Add initialization wait period (2 seconds)
    - Add error handling with diagnostic information
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 13.1, 13.2, 13.3, 13.4, 17.3_
  - [x] 2.2 Implement stopServer() function
    - Add event listener cleanup to prevent memory leaks
    - Add graceful process termination
    - Add resource cleanup
    - _Requirements: 1.4, 16.3_
  - [x] 2.3 Implement safeParseResponse() helper
    - Add JSON parsing with error handling
    - Add plain text error detection and wrapping
    - Add error format recognition
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 11.5_

- [x] 3. Implement JSON-RPC communication helpers

  - [x] 3.1 Implement sendRequest() function
    - Add JSON-RPC request construction with unique message IDs
    - Add request writing to server stdin
    - Add response listening on server stdout
    - Add response buffering for partial JSON
    - Add response parsing and ID matching
    - Add timeout handling with configurable duration
    - Add error handling for communication failures
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [x] 3.2 Write property test for JSON-RPC ID matching
    - **Property 11: JSON-RPC protocol compliance**
    - **Validates: Requirements 11.1, 11.2, 11.3**
  - [x] 3.3 Write property test for concurrent request handling
    - **Property 2: Concurrent request handling**
    - **Validates: Requirements 11.3, 11.4**

- [x] 4. Implement MCP protocol initialization tests

  - [x] 4.1 Write test for initialize request/response
    - Send initialize request with protocol version "2024-11-05"
    - Verify response contains protocol version
    - Verify response contains server info with name "mcp-process"
    - Verify response contains capabilities object with tools
    - Verify response includes client acknowledgment
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 4.2 Write property test for server initialization round trip
    - **Property 1: Server initialization round trip**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 5. Implement tool discovery tests

  - [x] 5.1 Write test for tools/list request
    - Send tools/list request
    - Verify response contains array of tools
    - Verify all expected tools are present (process_start, process_terminate, etc.)
    - Verify each tool has name, description, and inputSchema
    - Verify inputSchema defines required and optional parameters
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 5.2 Write property test for tool discovery completeness
    - **Property 2: Tool discovery completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 6. Implement process launch operation tests

  - [x] 6.1 Write test for launching allowed executable
    - Send tools/call request for process_start with "node" executable
    - Verify response status is "success"
    - Verify response includes valid PID
    - Verify response includes start time
    - Wait for process to complete and verify cleanup
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 6.2 Write test for launching with environment variables
    - Send tools/call request with environment variables
    - Verify process starts successfully
    - Verify environment variables are set
    - _Requirements: 4.5_
  - [x] 6.3 Write test for rejecting blocked executable
    - Send tools/call request for process_start with "sudo" executable
    - Verify response status is "error"
    - Verify error code indicates security violation
    - _Requirements: 4.4, 10.1, 10.2_
  - [x] 6.4 Write property test for allowed executable launches
    - **Property 3: Process launch with allowed executable succeeds**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  - [x] 6.5 Write property test for blocked executable rejection
    - **Property 4: Process launch with blocked executable fails**
    - **Validates: Requirements 4.4, 10.1, 10.2**

- [x] 7. Implement process monitoring operation tests

  - [x] 7.1 Write test for process statistics retrieval
    - Launch a process via tools/call
    - Send tools/call request for process_get_stats
    - Verify response includes CPU and memory usage
    - Verify response includes timestamp
    - Clean up process
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 7.2 Write test for process status query
    - Launch a process via tools/call
    - Send tools/call request for process_get_status
    - Verify response includes running state and uptime
    - Clean up process
    - _Requirements: 5.3_
  - [x] 7.3 Write test for process list
    - Launch multiple processes via tools/call
    - Send tools/call request for process_list
    - Verify response includes all launched processes
    - Clean up processes
    - _Requirements: 5.3_
  - [x] 7.4 Write test for non-existent process query
    - Send tools/call request for process_get_stats with invalid PID
    - Verify response status is "error"
    - Verify error code is "PROCESS_NOT_FOUND"
    - _Requirements: 5.4_
  - [x] 7.5 Write property test for process statistics retrieval
    - **Property 5: Process statistics retrieval**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 8. Implement process termination operation tests

  - [x] 8.1 Write test for graceful termination
    - Launch a long-running process via tools/call
    - Send tools/call request for process_terminate with force=false
    - Verify response status is "success"
    - Verify process exits
    - Verify exit code is returned
    - _Requirements: 6.1, 6.2, 6.4, 6.5_
  - [x] 8.2 Write test for forced termination
    - Launch a long-running process via tools/call
    - Send tools/call request for process_terminate with force=true
    - Verify response status is "success"
    - Verify termination reason is "forced"
    - Verify process exits immediately
    - _Requirements: 6.2, 6.4_
  - [x] 8.3 Write test for timeout escalation
    - Launch a long-running process via tools/call
    - Send tools/call request for process_terminate with short timeout
    - Verify process is terminated (escalated to SIGKILL)
    - _Requirements: 6.3_
  - [x] 8.4 Write property test for process termination cleanup
    - **Property 6: Process termination cleanup**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 9. Implement output capture operation tests

  - [x] 9.1 Write test for stdout capture
    - Launch a process that writes to stdout via tools/call
    - Wait for process to complete
    - Send tools/call request to retrieve output
    - Verify stdout contains expected data
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 9.2 Write test for stderr capture
    - Launch a process that writes to stderr via tools/call
    - Wait for process to complete
    - Send tools/call request to retrieve output
    - Verify stderr contains expected data
    - _Requirements: 7.1, 7.2_
  - [x] 9.3 Write test for output after completion
    - Launch a process via tools/call
    - Wait for process to complete
    - Send tools/call request to retrieve output
    - Verify all output is available
    - _Requirements: 7.5_
  - [x] 9.4 Write property test for output capture completeness
    - **Property 7: Output capture completeness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 10. Implement service management operation tests

  - [x] 10.1 Write test for service start
    - Send tools/call request for process_start_service
    - Verify response includes service ID and PID
    - Verify service is running
    - Stop service and clean up
    - _Requirements: 8.1, 8.2_
  - [x] 10.2 Write test for service stop
    - Start a service via tools/call
    - Send tools/call request for process_stop_service
    - Verify service stops gracefully
    - Verify process exits
    - _Requirements: 8.5_
  - [x] 10.3 Write test for service auto-restart
    - Start a service with auto-restart enabled via tools/call
    - Wait for service to crash
    - Verify service restarts automatically
    - Stop service and clean up
    - _Requirements: 8.2_
  - [x] 10.4 Write property test for service lifecycle management
    - **Property 8: Service lifecycle management**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [x] 11. Implement error handling tests

  - [x] 11.1 Write test for unknown tool error
    - Send tools/call request with unknown tool name
    - Verify response has isError true
    - Verify error message is clear
    - _Requirements: 9.1_
  - [x] 11.2 Write test for missing parameter error
    - Send tools/call request with missing required parameters
    - Verify response status is "error"
    - Verify error indicates missing parameters
    - _Requirements: 9.2_
  - [x] 11.3 Write test for invalid parameter type error
    - Send tools/call request with invalid parameter types
    - Verify response status is "error"
    - Verify error indicates type mismatch
    - _Requirements: 9.3_
  - [x] 11.4 Write property test for error response structure
    - **Property 9: Error response structure**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [x] 12. Implement security policy enforcement tests

  - [x] 12.1 Write test for allowlist enforcement
    - Send tools/call request with executable not in allowlist
    - Verify response status is "error"
    - Verify error code indicates security violation
    - _Requirements: 10.1, 10.2_
  - [x] 12.2 Write test for dangerous executable rejection
    - Send tools/call request with "sudo" or "rm" executable
    - Verify response status is "error"
    - Verify error message indicates security issue
    - _Requirements: 10.2_
  - [x] 12.3 Write test for environment variable sanitization
    - Send tools/call request with dangerous environment variables
    - Verify request is rejected or variables are sanitized
    - _Requirements: 10.3_
  - [x] 12.4 Write test for command injection prevention
    - Send tools/call request with command injection in arguments
    - Verify request is rejected
    - Verify error indicates security violation
    - _Requirements: 10.4_
  - [x] 12.5 Write property test for security policy enforcement
    - **Property 10: Security policy enforcement**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 13. Implement resource limit enforcement tests

  - [x] 13.1 Write test for CPU limit enforcement
    - Launch a process with CPU limit via tools/call
    - Verify process is terminated if limit exceeded
    - Verify error indicates resource limit exceeded
    - _Requirements: 14.1, 14.3_
  - [x] 13.2 Write test for memory limit enforcement
    - Launch a process with memory limit via tools/call
    - Verify process is terminated if limit exceeded
    - Verify error indicates resource limit exceeded
    - _Requirements: 14.2, 14.3_
  - [x] 13.3 Write property test for resource limit enforcement
    - **Property 12: Resource limit enforcement**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

- [x] 14. Implement timeout handling tests

  - [x] 14.1 Write test for timeout enforcement
    - Launch a long-running process with timeout via tools/call
    - Verify process is terminated when timeout exceeded
    - Verify response includes timeout error
    - _Requirements: 15.1, 15.2_
  - [x] 14.2 Write test for process completion before timeout
    - Launch a quick process with timeout via tools/call
    - Verify process completes successfully
    - Verify full output is returned
    - _Requirements: 15.4_
  - [x] 14.3 Write property test for timeout enforcement
    - **Property 13: Timeout enforcement**
    - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

- [x] 15. Implement minimal e2e smoke tests

  - [x] 15.1 Write minimal test for initialize
    - Send initialize request
    - Verify response is valid
    - _Requirements: 12.1, 12.2, 12.3_
  - [x] 15.2 Write minimal test for tools/list
    - Send tools/list request
    - Verify response contains tools array
    - _Requirements: 12.1, 12.2, 12.3_
  - [x] 15.3 Write minimal test for basic process launch
    - Send tools/call request for process_start
    - Verify process starts successfully
    - _Requirements: 12.1, 12.2, 12.3_

- [-] 16. Add CI compatibility and cleanup

  - [-] 16.1 Add process cleanup in afterAll hooks
    - Ensure all spawned processes are terminated
    - Remove all event listeners
    - Clean up resources
    - _Requirements: 16.3, 16.4_
  - [ ] 16.2 Add timeout adjustments for CI environments
    - Detect CI environment
    - Increase timeouts by 50% for CI
    - _Requirements: 16.1, 16.2, 16.5_
  - [ ] 16.3 Add error diagnostics for debugging
    - Log all requests and responses
    - Capture server stderr on failures
    - Provide file system diagnostics
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 16.4_

- [ ] 17. Update package.json test scripts

  - Add test:e2e script for running only e2e tests
  - Add test:e2e:minimal script for running only minimal tests
  - Ensure existing test script runs all tests including e2e
  - _Requirements: 16.5_

- [ ] 18. Update documentation

  - Update README.md with e2e testing information
  - Add section on running e2e tests
  - Add section on debugging e2e test failures
  - Document CI compatibility considerations
  - _Requirements: 16.4_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
