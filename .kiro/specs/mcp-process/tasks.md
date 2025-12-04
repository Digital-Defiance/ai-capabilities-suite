# MCP Process - Implementation Plan

- [x] 1. Set up project structure and core interfaces

  - Create directory structure for MCP server, process launcher, resource monitor, and security manager
  - Initialize package.json with MCP SDK, pidusage, which, and minimatch dependencies
  - Configure TypeScript with appropriate compiler options
  - Set up testing framework (Jest) with fast-check for property-based testing
  - _Requirements: 13.1, 14.1_

- [x] 2. Implement security manager (CRITICAL - Must be first)

  - [x] 2.1 Create SecurityManager class with multi-layer validation

    - Implement executable allowlist enforcement
    - Implement 6-layer executable validation
    - Implement hardcoded dangerous executable blocklist
    - Implement hardcoded dangerous environment variable blocklist
    - _Requirements: 1.4, 11.1-11.5, 14.2-14.5_

  - [x] 2.2 Implement executable validation with all security layers

    - Layer 1: Resolve executable path
    - Layer 2: Check against dangerous executables (ALWAYS blocked)
    - Layer 3: Check against shell interpreters (if configured)
    - Layer 4: Check for setuid/setgid executables (if configured)
    - Layer 5: Check allowlist
    - Layer 6: Validate arguments for injection attacks
    - _Requirements: 1.4, 11.1-11.3_

  - [x] 2.3 Implement argument validation

    - Check for command injection patterns
    - Check for path traversal in arguments
    - Prevent shell metacharacters
    - _Requirements: 11.1_

  - [x] 2.4 Implement environment sanitization

    - Remove dangerous environment variables
    - Check for command injection in values
    - Limit environment size
    - _Requirements: 11.4_

  - [x] 2.5 Implement working directory validation

    - Validate against allowed directories (if configured)
    - Prevent access to restricted paths
    - _Requirements: 1.3_

  - [x] 2.6 Implement rate limiting

    - Track process launches per agent per time window
    - Enforce maximum launches per minute
    - Return rate limit errors
    - _Requirements: 14.3_

  - [x] 2.7 Implement audit logging

    - Log all process operations
    - Log security violations separately
    - Include timestamps, commands, PIDs, and results
    - _Requirements: 14.5_

  - [x] 2.8 Write property test for allowlist enforcement

    - **Property 2: Allowlist enforcement on launch**
    - **Validates: Requirements 1.4, 11.2, 14.2**

  - [x] 2.9 Write property test for environment sanitization
    - **Property 15: Environment variable sanitization**
    - **Validates: Requirements 11.4**

- [x] 3. Implement process launcher

  - [x] 3.1 Create ProcessLauncher class

    - Spawn child processes with validated executables
    - Set environment variables
    - Configure working directory
    - Capture stdout/stderr
    - _Requirements: 1.1-1.5_

  - [x] 3.2 Implement process spawning

    - Use child_process.spawn
    - Configure stdio pipes
    - Handle spawn errors
    - Track process PIDs
    - _Requirements: 1.1, 1.5_

  - [x] 3.3 Implement output capture

    - Buffer stdout separately
    - Buffer stderr separately
    - Limit buffer sizes
    - Handle binary data
    - _Requirements: 3.1-3.3_

  - [x] 3.4 Write property test for process launch

    - **Property 1: Process launch returns PID**
    - **Validates: Requirements 1.1**

  - [x] 3.5 Write property test for output capture

    - **Property 4: Output capture separation**
    - **Validates: Requirements 3.1**

  - [x] 3.6 Write property test for output flush
    - **Property 5: Output flush on termination**
    - **Validates: Requirements 3.5**

- [x] 4. Implement resource monitoring

  - [x] 4.1 Create ResourceMonitor class

    - Monitor CPU usage using pidusage
    - Monitor memory usage
    - Monitor I/O statistics
    - Track historical data
    - _Requirements: 2.1-2.5, 7.1-7.5_

  - [x] 4.2 Implement resource limit enforcement

    - Check CPU limits
    - Check memory limits
    - Check file descriptor limits
    - Terminate processes exceeding limits
    - _Requirements: 7.1-7.4_

  - [x] 4.3 Implement system-wide statistics

    - Query total CPU usage
    - Query total memory usage
    - Query process counts
    - _Requirements: 2.5_

  - [x] 4.4 Write property test for statistics completeness

    - **Property 3: Process statistics completeness**
    - **Validates: Requirements 2.1**

  - [x] 4.5 Write property test for resource limit enforcement
    - **Property 11: Resource limit enforcement**
    - **Validates: Requirements 7.4**

- [x] 5. Implement I/O management

  - [x] 5.1 Create IOManager class

    - Manage stdin input
    - Manage stdout/stderr output
    - Handle binary data
    - Implement EOF signaling
    - _Requirements: 3.1-3.5, 4.1-4.5_

  - [x] 5.2 Implement stdin operations

    - Write data to process stdin
    - Handle encoding
    - Close stdin stream
    - _Requirements: 4.1-4.3_

  - [x] 5.3 Implement output retrieval

    - Return buffered stdout
    - Return buffered stderr
    - Include byte counts
    - _Requirements: 3.2, 3.5_

  - [x] 5.4 Write property test for stdin delivery
    - **Property 6: Stdin data delivery**
    - **Validates: Requirements 4.1**

- [x] 6. Implement process termination

  - [x] 6.1 Create ProcessTerminator class

    - Implement graceful termination (SIGTERM)
    - Implement forced termination (SIGKILL)
    - Implement timeout escalation
    - Handle process groups
    - _Requirements: 5.1-5.5_

  - [x] 6.2 Implement graceful termination

    - Send SIGTERM signal
    - Wait for process exit
    - Escalate to SIGKILL on timeout
    - _Requirements: 5.1, 5.3_

  - [x] 6.3 Implement forced termination

    - Send SIGKILL signal
    - Ensure process is killed
    - _Requirements: 5.2_

  - [x] 6.4 Write property test for graceful termination

    - **Property 7: Graceful termination sends SIGTERM**
    - **Validates: Requirements 5.1**

  - [x] 6.5 Write property test for timeout escalation
    - **Property 8: Timeout escalation to SIGKILL**
    - **Validates: Requirements 5.3**

- [x] 7. Implement process management

  - [x] 7.1 Create ManagedProcess class

    - Track process state (running, stopped, crashed)
    - Store process configuration
    - Track resource usage
    - Manage output buffers
    - _Requirements: 6.1-6.5_

  - [x] 7.2 Create ProcessManager class

    - Track all managed processes
    - Provide process lookup
    - Enforce concurrent process limits
    - Clean up terminated processes
    - _Requirements: 6.1-6.5, 14.3_

  - [x] 7.3 Implement process status queries

    - Return process state
    - Return uptime
    - Return resource usage
    - Return exit code if terminated
    - _Requirements: 6.1, 6.3_

  - [x] 7.4 Write property test for status completeness

    - **Property 9: Process status completeness**
    - **Validates: Requirements 6.1**

  - [x] 7.5 Write property test for process list

    - **Property 10: Process list completeness**
    - **Validates: Requirements 6.2**

  - [x] 7.6 Write property test for concurrent limit
    - **Property 17: Concurrent process limit enforcement**
    - **Validates: Requirements 14.3**

- [x] 8. Implement timeout management

  - [x] 8.1 Create TimeoutManager class

    - Track process start times
    - Enforce timeout limits
    - Extend timeouts on request
    - Apply default timeouts
    - _Requirements: 9.1-9.5_

  - [x] 8.2 Implement timeout enforcement

    - Monitor process execution time
    - Terminate processes exceeding timeout
    - Return timeout errors
    - _Requirements: 9.1, 9.2_

  - [x] 8.3 Write property test for timeout enforcement
    - **Property 13: Timeout enforcement**
    - **Validates: Requirements 9.1**

- [x] 9. Implement process groups and pipelines

  - [x] 9.1 Create ProcessGroup class

    - Track group members
    - Assign group identifiers
    - Support pipeline connections
    - _Requirements: 10.1-10.5_

  - [x] 9.2 Implement group operations

    - Add processes to groups
    - Remove processes from groups
    - Terminate entire groups
    - Query group status
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

  - [x] 9.3 Implement pipeline connections

    - Connect stdout to stdin
    - Handle pipeline failures
    - _Requirements: 10.3_

  - [x] 9.4 Write property test for group termination
    - **Property 14: Process group termination**
    - **Validates: Requirements 10.4**

- [x] 10. Implement service management

  - [x] 10.1 Create ServiceManager class

    - Launch services in detached mode
    - Implement auto-restart
    - Perform health checks
    - Track service state
    - _Requirements: 8.1-8.5_

  - [x] 10.2 Implement auto-restart

    - Detect service crashes
    - Restart crashed services
    - Apply backoff strategy
    - Enforce max retries
    - _Requirements: 8.2_

  - [x] 10.3 Implement health checks

    - Execute health check commands
    - Monitor health status
    - Restart unhealthy services
    - _Requirements: 8.3, 8.4_

  - [x] 10.4 Write property test for auto-restart
    - **Property 12: Auto-restart on crash**
    - **Validates: Requirements 8.2**

- [x] 11. Implement MCP tools

  - [x] 11.1 Implement process_start tool

    - Accept executable, args, cwd, env, timeout, resourceLimits parameters
    - Validate executable against allowlist
    - Spawn process
    - Return PID and start time
    - _Requirements: 1.1-1.5, 13.1_

  - [x] 11.2 Implement process_terminate tool

    - Accept pid, force, timeout parameters
    - Terminate process gracefully or forcefully
    - Return exit code and termination reason
    - _Requirements: 5.1-5.5, 13.1_

  - [x] 11.3 Implement process_get_stats tool

    - Accept pid, includeHistory parameters
    - Return resource usage statistics
    - Return historical data if requested
    - _Requirements: 2.1-2.5, 13.1_

  - [x] 11.4 Implement process_send_stdin tool

    - Accept pid, data, encoding parameters
    - Write data to process stdin
    - Return bytes written
    - _Requirements: 4.1-4.5, 13.1_

  - [x] 11.5 Implement process_get_output tool

    - Accept pid, stream, encoding parameters
    - Return stdout and/or stderr
    - Include byte counts
    - _Requirements: 3.1-3.5, 13.1_

  - [x] 11.6 Implement process_list tool

    - Return all managed processes
    - Include PIDs, commands, states
    - _Requirements: 6.2, 13.1_

  - [x] 11.7 Implement process_get_status tool

    - Accept pid parameter
    - Return process state, uptime, resource usage
    - _Requirements: 6.1, 13.1_

  - [x] 11.8 Implement process_create_group tool

    - Accept name, pipeline parameters
    - Create process group
    - Return group ID
    - _Requirements: 10.1, 13.1_

  - [x] 11.9 Implement process_add_to_group tool

    - Accept groupId, pid parameters
    - Add process to group
    - _Requirements: 10.2, 13.1_

  - [x] 11.10 Implement process_terminate_group tool

    - Accept groupId parameter
    - Terminate all processes in group
    - _Requirements: 10.4, 13.1_

  - [x] 11.11 Implement process_start_service tool

    - Accept service configuration
    - Start service with auto-restart
    - Return service ID
    - _Requirements: 8.1-8.5, 13.1_

  - [x] 11.12 Implement process_stop_service tool

    - Accept serviceId parameter
    - Stop service and disable auto-restart
    - _Requirements: 8.5, 13.1_

  - [x] 11.13 Write property test for process information
    - **Property 16: Process information completeness**
    - **Validates: Requirements 13.3**

- [x] 12. Set up MCP server

  - [x] 12.1 Create MCP server instance

    - Initialize MCP server with name and version
    - Configure server capabilities
    - Set up stdio transport
    - _Requirements: 13.1_

  - [x] 12.2 Register all MCP tools

    - Register all 12 process tools with schemas
    - Connect tool handlers to implementation
    - Add input validation for each tool
    - _Requirements: 13.1_

  - [x] 12.3 Implement server lifecycle management

    - Handle server startup and shutdown
    - Clean up all processes on shutdown
    - Add logging for debugging
    - _Requirements: 13.2_

  - [x] 12.4 Load security configuration
    - Load executable allowlist from configuration
    - Load resource limits
    - Load working directory restrictions
    - Validate configuration (fail if allowlist empty)
    - _Requirements: 14.1-14.5_

- [x] 13. Implement error handling

  - [x] 13.1 Create error response formatting

    - Create structured error responses with codes
    - Handle spawn errors
    - Handle permission errors
    - Handle validation errors
    - _Requirements: 12.1-12.5, 13.2_

  - [x] 13.2 Implement graceful error handling
    - Handle process crashes
    - Handle zombie processes
    - Handle resource exhaustion
    - Return clear error messages
    - _Requirements: 12.1-12.5_

- [x] 14. Write integration tests

  - [x] 14.1 Test process launch workflow

    - Test with allowed executables
    - Test with blocked executables
    - Test with resource limits
    - _Requirements: 1.1-1.5, 11.1-11.5_

  - [x] 14.2 Test resource monitoring workflow

    - Test CPU monitoring
    - Test memory monitoring
    - Test limit enforcement
    - _Requirements: 2.1-2.5, 7.1-7.5_

  - [x] 14.3 Test I/O workflow

    - Test stdin input
    - Test stdout/stderr capture
    - Test binary data
    - _Requirements: 3.1-3.5, 4.1-4.5_

  - [x] 14.4 Test termination workflow

    - Test graceful termination
    - Test forced termination
    - Test timeout escalation
    - _Requirements: 5.1-5.5_

  - [x] 14.5 Test service management workflow

    - Test service start/stop
    - Test auto-restart
    - Test health checks
    - _Requirements: 8.1-8.5_

  - [x] 14.6 Test security policy enforcement
    - Test allowlist enforcement
    - Test argument validation
    - Test environment sanitization
    - Test rate limiting
    - _Requirements: 11.1-11.5, 14.1-14.5_

- [x] 15. Create documentation

  - [x] 15.1 Write README documentation

    - Document installation instructions
    - Provide usage examples for each tool
    - Document security configuration (CRITICAL)
    - Add troubleshooting section
    - _Requirements: 13.2_

  - [x] 15.2 Create security configuration guide

    - Document executable allowlist configuration
    - Document resource limits
    - Document working directory restrictions
    - Provide example secure configurations
    - Document "What AI Agents CANNOT Do"
    - Document "What AI Agents CAN Do"
    - Provide recommended allowlist examples
    - _Requirements: 14.1-14.5_

  - [x] 15.3 Add code documentation
    - Add JSDoc comments to all public APIs
    - Document security validation layers
    - Document error codes and meanings
    - _Requirements: 13.2_

- [ ] 16. Package and distribute

  - [x] 16.1 Publish to NPM registry

    - Configure package.json with proper metadata
    - Add CLI entry point
    - Create .npmignore file
    - Create GitHub Actions workflow for NPM publishing
    - _Requirements: 15.1-15.5_

  - [x] 16.2 Create Docker image

    - Create optimized Dockerfile
    - Create docker-compose.yml with secure defaults
    - Create GitHub Actions workflow for Docker Hub publishing
    - _Requirements: 15.1-15.5_

  - [ ] 16.3 Submit to MCP Registry

    - Create MCP registry submission metadata
    - Create comprehensive server description
    - Create usage examples with security warnings
    - Submit PR to MCP registry
    - _Requirements: 15.1-15.5_

  - [ ] 16.4 Create VS Code extension

    - Create extension project structure (under vscode-mcp-acs-process)
    - Implement process management panel
    - Display security boundaries in UI
    - Publish to VS Code marketplace
    - _Requirements: 16.1-16.5_

  - [ ] 16.5 Create VS Code Language Server Extension for LSP/MCP Integration
    - **Overview**: Package the MCP process server as a VS Code extension to enable integration with VS Code and GitHub Copilot
    - **Architecture**: Implement Language Server Protocol (LSP) wrapper around MCP server for editor communication
    - **Setup Extension Project**:
      - Use Yeoman generator: `yo code` → select "New Language Server"
      - Create client/server structure with TypeScript
      - Configure package.json with activation events: `onLanguage:typescript`, `onLanguage:javascript`
      - Define extension capabilities and contributes section
    - **Implement Language Client** (client/src/extension.ts):
      - Define ServerOptions with module path and transport (IPC/stdio)
      - Configure LanguageClientOptions with documentSelector for target file types
      - Set up synchronize options for configuration and file watching
      - Implement activate() to start LanguageClient
      - Implement deactivate() to gracefully stop client/server
    - **Adapt MCP Server for LSP**:
      - Implement LSP initialization handshake (initialize/initialized)
      - Handle document synchronization (didOpen/didChange/didClose)
      - Map MCP debugging tools to LSP custom commands (workspace/executeCommand)
      - Implement LSP diagnostics for debugging errors
      - Add hover providers for variable inspection
      - Add code lens for breakpoint suggestions
    - **Debug Adapter Protocol (DAP) Integration**:
      - Implement DebugAdapterDescriptorFactory for custom debug adapter
      - Create debug configuration provider for launch.json
      - Map MCP debugging operations to DAP protocol
      - Handle debug session lifecycle (start/stop/pause/continue)
      - Implement breakpoint management via DAP
    - **Copilot Integration Points**:
      - Expose debugging context via LSP for Copilot to consume
      - Register custom commands that Copilot agents can invoke
      - Provide symbolic information (definitions, types) for AI context
      - Document MCP tool signatures for agent mode usage
      - Create agent profiles/instructions for debugging workflows
      - Add tool schema validation for AI agent discovery
      - Implement context providers for debugging scenarios
    - **Agent Profile Documentation**:
      - Create Copilot agent instructions for debugging workflows
      - Document tool discovery patterns for AI agents
      - Provide debugging scenario templates
      - Add context enrichment for AI assistance
    - **Build and Package**:
      - Compile TypeScript: `npm run compile`
      - Create VSIX package: `vsce package`
      - Test locally: Install .vsix in VS Code
      - Validate extension activation and server communication
    - **Publish to Marketplace**:
      - Create publisher account on VS Code Marketplace
      - Configure publisher in package.json
      - Publish extension: `vsce publish`
      - Add marketplace badges and documentation
    - **Documentation**:
      - Write extension README with installation instructions
      - Document configuration options and settings
      - Provide debugging workflow examples
      - Include troubleshooting guide for common issues
      - Add animated GIFs showing debugger in action
      - Document AI agent integration patterns
    - **Testing**:
      - Test extension activation on TypeScript/JavaScript files
      - Verify MCP server starts and communicates correctly
      - Test debugging commands from command palette
      - Validate Copilot can access debugging context
      - Test with multiple concurrent debug sessions
      - Test AI agent tool discovery and usage
    - _Requirements: VS Code/Copilot integration, LSP compliance, DAP support, AI agent compatibility_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
