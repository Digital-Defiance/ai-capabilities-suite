# MCP Filesystem - Implementation Plan

- [ ] 1. Set up project structure and core interfaces

  - Create directory structure for MCP server, batch operations, directory watcher, search engine, and security manager
  - Initialize package.json with MCP SDK, chokidar, lunr, fast-glob, and crypto dependencies
  - Configure TypeScript with appropriate compiler options
  - Set up testing framework (Jest) with fast-check for property-based testing
  - _Requirements: 12.1, 13.1_

- [ ] 2. Implement security manager (CRITICAL - Must be first)

  - [ ] 2.1 Create SecurityManager class with multi-layer validation

    - Implement workspace root enforcement
    - Implement 10-layer path validation
    - Implement hardcoded system path blocklist
    - Implement hardcoded sensitive file pattern blocklist
    - _Requirements: 9.1, 9.2, 11.1-11.5, 13.2-13.5_

  - [ ] 2.2 Implement path validation with all security layers

    - Layer 1: Resolve to absolute path
    - Layer 2: Check workspace boundary
    - Layer 3: Check for path traversal sequences
    - Layer 4: Check against system paths (ALWAYS blocked)
    - Layer 5: Check against sensitive patterns (ALWAYS blocked)
    - Layer 6: Check allowed subdirectories (if configured)
    - Layer 7: Check user-configured blocklist
    - Layer 8: Check user-configured patterns
    - Layer 9: Check read-only mode
    - Layer 10: Resolve and validate symlinks
    - _Requirements: 9.1, 9.2, 11.1_

  - [ ] 2.3 Implement symlink validation

    - Validate symlink targets are within workspace
    - Recursively validate symlink chains
    - Prevent symlink escape attacks
    - _Requirements: 6.4, 11.2_

  - [ ] 2.4 Implement rate limiting

    - Track operations per agent per time window
    - Enforce maximum operations per minute
    - Return rate limit errors
    - _Requirements: 13.4_

  - [ ] 2.5 Implement audit logging

    - Log all filesystem operations
    - Log security violations separately
    - Include timestamps, paths, and results
    - _Requirements: 13.5_

  - [ ] 2.6 Write property test for workspace boundary

    - **Property 12: Workspace boundary enforcement**
    - **Validates: Requirements 9.1**

  - [ ] 2.7 Write property test for path traversal prevention

    - **Property 13: Path traversal prevention**
    - **Validates: Requirements 9.2**

  - [ ] 2.8 Write property test for symlink security
    - **Property 18: Symlink security enforcement**
    - **Validates: Requirements 11.2**

- [ ] 3. Implement batch operations

  - [ ] 3.1 Create BatchOperationManager class

    - Implement batch copy operations
    - Implement batch move operations
    - Implement batch delete operations
    - Implement atomic rollback on failure
    - _Requirements: 1.1-1.5_

  - [ ] 3.2 Implement atomic operations

    - Track completed operations for rollback
    - Implement rollback logic
    - Ensure all-or-nothing semantics
    - _Requirements: 1.2, 9.5_

  - [ ] 3.3 Implement operation validation

    - Validate all paths before execution
    - Check file sizes against limits
    - Check total batch size against limits
    - _Requirements: 1.4, 9.1, 9.2_

  - [ ] 3.4 Write property test for batch copy

    - **Property 1: Batch copy completeness**
    - **Validates: Requirements 1.1**

  - [ ] 3.5 Write property test for atomic operations
    - **Property 2: Atomic batch operations**
    - **Validates: Requirements 1.2**

- [ ] 4. Implement directory watching

  - [ ] 4.1 Create DirectoryWatcher class

    - Implement directory watching using chokidar
    - Support recursive watching
    - Implement event filtering
    - Track watch sessions
    - _Requirements: 2.1-2.5_

  - [ ] 4.2 Implement event handling

    - Detect create events
    - Detect modify events
    - Detect delete events
    - Detect rename events
    - _Requirements: 2.1_

  - [ ] 4.3 Implement event filtering

    - Filter by file patterns
    - Filter by event types
    - Apply user-specified filters
    - _Requirements: 2.4_

  - [ ] 4.4 Write property test for event detection

    - **Property 3: Directory watching event detection**
    - **Validates: Requirements 2.1**

  - [ ] 4.5 Write property test for event filtering
    - **Property 4: Event filtering accuracy**
    - **Validates: Requirements 2.4**

- [ ] 5. Implement file search and indexing

  - [ ] 5.1 Create FileIndexer class

    - Implement directory scanning
    - Build searchable index using lunr
    - Index file metadata
    - Index text file content
    - _Requirements: 3.1-3.5, 4.1-4.4_

  - [ ] 5.2 Implement search operations

    - Search by filename pattern
    - Search by content
    - Search by file type
    - Search by size and date
    - _Requirements: 3.1-3.4_

  - [ ] 5.3 Implement index maintenance

    - Update index on file changes
    - Rebuild index on demand
    - Track index statistics
    - _Requirements: 4.3, 4.4_

  - [ ] 5.4 Write property test for search completeness

    - **Property 5: File search completeness**
    - **Validates: Requirements 3.1**

  - [ ] 5.5 Write property test for indexed search performance

    - **Property 6: Indexed search performance**
    - **Validates: Requirements 3.5**

  - [ ] 5.6 Write property test for index updates
    - **Property 7: Index update on file changes**
    - **Validates: Requirements 4.3**

- [ ] 6. Implement symlink operations

  - [ ] 6.1 Implement symlink creation

    - Create symbolic links
    - Validate targets are within workspace
    - Handle platform differences
    - _Requirements: 6.1, 6.4_

  - [ ] 6.2 Implement symlink resolution

    - Resolve symlink targets
    - Return absolute paths
    - Handle broken symlinks
    - _Requirements: 6.3, 6.5_

  - [ ] 6.3 Implement hard link creation

    - Create hard links
    - Validate source files exist
    - _Requirements: 6.2_

  - [ ] 6.4 Write property test for symlink creation

    - **Property 8: Symlink creation correctness**
    - **Validates: Requirements 6.1**

  - [ ] 6.5 Write property test for symlink target validation
    - **Property 9: Symlink target validation**
    - **Validates: Requirements 6.4**

- [ ] 7. Implement checksum operations

  - [ ] 7.1 Create ChecksumManager class

    - Implement MD5 checksum computation
    - Implement SHA-1 checksum computation
    - Implement SHA-256 checksum computation
    - Implement SHA-512 checksum computation
    - _Requirements: 7.1-7.5_

  - [ ] 7.2 Implement checksum verification

    - Compare computed checksums with provided values
    - Return verification results
    - Handle file changes during computation
    - _Requirements: 7.2, 7.4_

  - [ ] 7.3 Implement batch checksum computation

    - Compute checksums for multiple files
    - Return results for each file
    - _Requirements: 7.3_

  - [ ] 7.4 Write property test for checksum accuracy

    - **Property 10: Checksum computation accuracy**
    - **Validates: Requirements 7.1**

  - [ ] 7.5 Write property test for checksum verification
    - **Property 11: Checksum verification correctness**
    - **Validates: Requirements 7.2**

- [ ] 8. Implement disk usage analysis

  - [ ] 8.1 Create DiskUsageAnalyzer class

    - Implement recursive directory size calculation
    - Implement largest files/directories identification
    - Implement file type breakdown
    - Query available disk space
    - _Requirements: 8.1-8.5_

  - [ ] 8.2 Implement size calculation

    - Calculate directory sizes recursively
    - Respect depth limits
    - Handle symlinks appropriately
    - _Requirements: 8.1, 8.3_

  - [ ] 8.3 Implement usage reporting
    - Generate size reports
    - Group by file type
    - Sort by size
    - _Requirements: 8.2, 8.4_

- [ ] 9. Implement directory operations

  - [ ] 9.1 Implement directory copy

    - Copy directories recursively
    - Preserve metadata if requested
    - Apply exclusion patterns
    - _Requirements: 10.1, 10.3, 10.4_

  - [ ] 9.2 Implement directory sync

    - Copy only newer or missing files
    - Compare file timestamps
    - Apply exclusion patterns
    - _Requirements: 10.2, 10.3_

  - [ ] 9.3 Implement atomic file replacement

    - Write to temporary file
    - Atomically rename to target
    - Ensure no partial writes visible
    - _Requirements: 9.5_

  - [ ] 9.4 Write property test for recursive copy

    - **Property 15: Recursive copy completeness**
    - **Validates: Requirements 10.1**

  - [ ] 9.5 Write property test for sync efficiency

    - **Property 16: Sync operation efficiency**
    - **Validates: Requirements 10.2**

  - [ ] 9.6 Write property test for atomic replacement
    - **Property 14: Atomic file replacement**
    - **Validates: Requirements 9.5**

- [ ] 10. Implement MCP tools

  - [ ] 10.1 Implement fs_batch_operations tool

    - Accept operations array with type, source, destination
    - Validate all paths
    - Execute operations atomically or individually
    - Return results for each operation
    - _Requirements: 1.1-1.5, 12.1_

  - [ ] 10.2 Implement fs_watch_directory tool

    - Accept path, recursive, filters parameters
    - Create watch session
    - Return session ID
    - _Requirements: 2.1-2.5, 12.1_

  - [ ] 10.3 Implement fs_get_watch_events tool

    - Accept session ID
    - Return accumulated events
    - Clear event buffer
    - _Requirements: 2.1, 12.1_

  - [ ] 10.4 Implement fs_stop_watch tool

    - Accept session ID
    - Stop watching
    - Clean up resources
    - _Requirements: 2.5, 12.1_

  - [ ] 10.5 Implement fs_search_files tool

    - Accept query, searchType, fileTypes, size/date filters
    - Perform search (indexed or filesystem)
    - Return matching files with metadata
    - _Requirements: 3.1-3.5, 12.1_

  - [ ] 10.6 Implement fs_build_index tool

    - Accept path, includeContent parameters
    - Build file index
    - Return index statistics
    - _Requirements: 4.1, 4.2, 12.1_

  - [ ] 10.7 Implement fs_create_symlink tool

    - Accept linkPath, targetPath parameters
    - Validate target is within workspace
    - Create symlink
    - _Requirements: 6.1, 6.4, 12.1_

  - [ ] 10.8 Implement fs_compute_checksum tool

    - Accept path, algorithm parameters
    - Compute checksum
    - Return checksum value
    - _Requirements: 7.1, 12.1_

  - [ ] 10.9 Implement fs_verify_checksum tool

    - Accept path, checksum, algorithm parameters
    - Compute and compare checksums
    - Return verification result
    - _Requirements: 7.2, 12.1_

  - [ ] 10.10 Implement fs_analyze_disk_usage tool

    - Accept path, depth, groupByType parameters
    - Analyze disk usage
    - Return usage report
    - _Requirements: 8.1-8.5, 12.1_

  - [ ] 10.11 Implement fs_copy_directory tool

    - Accept source, destination, preserveMetadata, exclusions parameters
    - Copy directory recursively
    - Return copy statistics
    - _Requirements: 10.1, 10.3, 10.4, 12.1_

  - [ ] 10.12 Implement fs_sync_directory tool

    - Accept source, destination, exclusions parameters
    - Sync directories
    - Return sync statistics
    - _Requirements: 10.2, 10.3, 12.1_

  - [ ] 10.13 Write property test for response structure
    - **Property 17: Workspace root enforcement at startup**
    - **Validates: Requirements 11.1**

- [ ] 11. Set up MCP server

  - [ ] 11.1 Create MCP server instance

    - Initialize MCP server with name and version
    - Configure server capabilities
    - Set up stdio transport
    - _Requirements: 12.1_

  - [ ] 11.2 Register all MCP tools

    - Register all 12 filesystem tools with schemas
    - Connect tool handlers to implementation
    - Add input validation for each tool
    - _Requirements: 12.1_

  - [ ] 11.3 Implement server lifecycle management

    - Handle server startup and shutdown
    - Clean up all watch sessions on shutdown
    - Add logging for debugging
    - _Requirements: 12.2_

  - [ ] 11.4 Load security configuration
    - Load workspace root from configuration
    - Load allowed subdirectories
    - Load blocklists and patterns
    - Validate configuration
    - _Requirements: 13.1-13.5_

- [ ] 12. Implement error handling

  - [ ] 12.1 Create error response formatting

    - Create structured error responses with codes
    - Handle permission errors
    - Handle not-found errors
    - Handle validation errors
    - _Requirements: 12.2_

  - [ ] 12.2 Implement graceful error handling
    - Handle filesystem errors
    - Handle validation errors
    - Handle security violations
    - Return clear error messages
    - _Requirements: 12.2_

- [ ] 13. Write integration tests

  - [ ] 13.1 Test batch operations workflow

    - Test batch copy
    - Test batch move
    - Test batch delete
    - Test atomic rollback
    - _Requirements: 1.1-1.5_

  - [ ] 13.2 Test directory watching workflow

    - Test event detection
    - Test event filtering
    - Test recursive watching
    - _Requirements: 2.1-2.5_

  - [ ] 13.3 Test search and indexing workflow

    - Test file search
    - Test content search
    - Test index building
    - Test index updates
    - _Requirements: 3.1-3.5, 4.1-4.4_

  - [ ] 13.4 Test security policy enforcement
    - Test workspace boundary enforcement
    - Test path traversal prevention
    - Test symlink validation
    - Test rate limiting
    - _Requirements: 11.1-11.5, 13.1-13.5_

- [ ] 14. Create documentation

  - [ ] 14.1 Write README documentation

    - Document installation instructions
    - Provide usage examples for each tool
    - Document security configuration (CRITICAL)
    - Add troubleshooting section
    - _Requirements: 12.2_

  - [ ] 14.2 Create security configuration guide

    - Document workspace root configuration
    - Document allowed subdirectories
    - Document blocklists and patterns
    - Provide example secure configurations
    - Document "What AI Agents CANNOT Do"
    - Document "What AI Agents CAN Do"
    - _Requirements: 13.1-13.5_

  - [ ] 14.3 Add code documentation
    - Add JSDoc comments to all public APIs
    - Document security validation layers
    - Document error codes and meanings
    - _Requirements: 12.2_

- [ ] 15. Package and distribute

  - [ ] 15.1 Publish to NPM registry

    - Configure package.json with proper metadata
    - Add CLI entry point
    - Create .npmignore file
    - Create GitHub Actions workflow for NPM publishing
    - _Requirements: 14.1-14.5_

  - [ ] 15.2 Create Docker image

    - Create optimized Dockerfile
    - Create docker-compose.yml with secure defaults
    - Create GitHub Actions workflow for Docker Hub publishing
    - _Requirements: 14.1-14.5_

  - [ ] 15.3 Submit to MCP Registry

    - Create MCP registry submission metadata
    - Create comprehensive server description
    - Create usage examples with security warnings
    - Submit PR to MCP registry
    - _Requirements: 14.1-14.5_
    - Also submit to https://modelcontextprotocol.info/tools/registry/ using API/CLI

  - [ ] 15.4 Create VS Code extension

    - Create extension project structure in vscode-mcp-acs-filesystem
    - Implement file operations panel
    - Display security boundaries in UI
    - Publish to VS Code marketplace
    - _Requirements: 15.1-15.5_
    - Develop extensive unit, integration, e2e tests (socket to file-operation as we have done with the other extensions)

  - [ ] 15.5 Create VS Code Language Server Extension for LSP/MCP Integration
    - Implement LSP 10 server with all possible features
    - **Overview**: Package the MCP debugger server as a VS Code extension to enable integration with VS Code and GitHub Copilot
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
      - Develop E2E extension tests with VS Code
      - Test extension activation on TypeScript/JavaScript files
      - Verify MCP server starts and communicates correctly
      - Test debugging commands from command palette
      - Validate Copilot can access debugging context
      - Test with multiple concurrent debug sessions
      - Test AI agent tool discovery and usage
    - _Requirements: VS Code/Copilot integration, LSP compliance, DAP support, AI agent compatibility_

- [ ] 16. Copy github workflows from other MCPs we've done (mcp-process -> mcp-filesystem, vscode-mcp-acs-process -> vscode-mcp-acs-filesystem)

- [ ] 17. Set up sync-versions.ts for mcp-filesystem

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
