# Implementation Plan

- [x] 1. Set up language server infrastructure
- [x] 1.1 Install LSP dependencies (vscode-languageserver, vscode-languageserver-textdocument)
  - Add dependencies to packages/vscode-mcp-screenshot/package.json
  - Run yarn install
  - _Requirements: 6.1_

- [x] 1.2 Create languageServer.ts file with basic LSP connection
  - Create packages/vscode-mcp-screenshot/src/languageServer.ts
  - Implement connection initialization
  - Set up text document manager
  - Register basic capabilities (textDocumentSync)
  - _Requirements: 6.1, 6.5_

- [x] 1.3 Create MCP client accessor module
  - Create packages/vscode-mcp-screenshot/src/mcpClientAccessor.ts
  - Implement singleton pattern for client access
  - Provide safe getter/setter methods
  - _Requirements: 6.1, 6.3_

- [x] 1.4 Write property test for MCP client accessor
  - **Property 15: MCP client delegation**
  - **Validates: Requirements 6.3**

- [x] 2. Integrate language server with extension
- [x] 2.1 Modify extension.ts to start language server
  - Import LanguageClient from vscode-languageclient/node
  - Add startLanguageServer function
  - Call startLanguageServer in activate()
  - Handle language server startup errors gracefully
  - _Requirements: 6.1, 6.2, 6.6_

- [x] 2.2 Update extension.ts to provide MCP client to language server
  - Set MCP client in accessor after initialization
  - Update client reference when state changes
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 2.3 Update extension deactivation to stop language server
  - Stop language client in deactivate()
  - Ensure clean shutdown
  - _Requirements: 6.5_

- [x] 2.4 Write property test for backward compatibility
  - **Property 17: Backward compatibility**
  - **Validates: Requirements 6.6**

- [x] 2.5 Write unit tests for extension integration
  - Test language server startup
  - Test MCP client accessor integration
  - Test graceful degradation without MCP client
  - _Requirements: 6.1, 6.2, 6.5, 6.6_

- [x] 3. Implement hover provider
- [x] 3.1 Add hover provider capability to language server
  - Register hoverProvider in capabilities
  - Implement onHover handler
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3.2 Implement screenshot function hover information
  - Detect screenshot function calls (captureFullScreen, captureWindow, captureRegion)
  - Return markdown documentation with parameters and examples
  - _Requirements: 1.1, 1.4_

- [x] 3.3 Implement configuration object hover information
  - Detect screenshot configuration objects
  - Return property names and types
  - _Requirements: 1.2, 1.4_

- [x] 3.4 Implement identifier hover information
  - Detect display/window identifiers
  - Query MCP client for resource information
  - Handle unavailable information gracefully
  - _Requirements: 1.3_

- [x] 3.5 Write property test for hover information
  - **Property 1: Hover information for screenshot APIs**
  - **Validates: Requirements 1.1, 1.2, 1.4**

- [x] 3.6 Write property test for identifier hover
  - **Property 2: Hover information for identifiers**
  - **Validates: Requirements 1.3**

- [x] 4. Implement code lens provider
- [x] 4.1 Add code lens provider capability to language server
  - Register codeLensProvider in capabilities
  - Implement onCodeLens handler
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 4.2 Implement pattern detection for screenshot operations
  - Create pattern matching utilities
  - Detect capture, list displays, list windows patterns
  - _Requirements: 2.1, 2.2, 2.3, 8.1, 8.2, 8.3_

- [x] 4.3 Generate code lenses for detected patterns
  - Create code lens for capture patterns with "📸 Capture Screenshot"
  - Create code lens for display enumeration with "🖥️ List Displays"
  - Create code lens for window enumeration with "🪟 List Windows"
  - Position code lenses at correct line numbers
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 4.4 Implement code lens command execution
  - Register executeCommand handler
  - Delegate commands to MCP client
  - Handle command execution errors
  - _Requirements: 2.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4.5 Write property test for code lens generation
  - **Property 3: Code lens generation for screenshot patterns**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**

- [x] 4.6 Write property test for code lens execution
  - **Property 4: Code lens execution**
  - **Validates: Requirements 2.4**

- [x] 4.7 Write property test for command execution
  - **Property 10: Command execution with parameters**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 4.8 Write property test for command error handling
  - **Property 11: Command error handling**
  - **Validates: Requirements 4.5**

- [x] 5. Implement diagnostic provider
- [x] 5.1 Add document validation on open and change
  - Implement validateTextDocument function
  - Listen to document open and change events
  - Send diagnostics to VSCode
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.2 Implement format validation diagnostics
  - Detect invalid format values
  - Create warning diagnostics with valid options
  - _Requirements: 3.1_

- [x] 5.3 Implement quality range validation diagnostics
  - Detect quality values outside 0-100 range
  - Create error diagnostics
  - _Requirements: 3.2_

- [x] 5.4 Implement missing parameter diagnostics
  - Detect screenshot calls with missing required parameters
  - Create error diagnostics
  - _Requirements: 3.3_

- [x] 5.5 Implement deprecated API diagnostics
  - Detect deprecated screenshot API usage
  - Create informational diagnostics with migration guidance
  - _Requirements: 3.4_

- [x] 5.6 Ensure diagnostic completeness
  - Validate all diagnostics have valid ranges
  - Ensure all diagnostics have clear messages
  - Add suggested fixes where applicable
  - _Requirements: 3.5_

- [x] 5.7 Write property test for format diagnostics
  - **Property 5: Invalid format diagnostics**
  - **Validates: Requirements 3.1**

- [x] 5.8 Write property test for quality diagnostics
  - **Property 6: Quality range diagnostics**
  - **Validates: Requirements 3.2**

- [x] 5.9 Write property test for missing parameter diagnostics
  - **Property 7: Missing parameter diagnostics**
  - **Validates: Requirements 3.3**

- [x] 5.10 Write property test for deprecated API diagnostics
  - **Property 8: Deprecated API diagnostics**
  - **Validates: Requirements 3.4**

- [x] 5.11 Write property test for diagnostic completeness
  - **Property 9: Diagnostic completeness**
  - **Validates: Requirements 3.5**

- [x] 6. Implement completion provider
- [x] 6.1 Add completion provider capability to language server
  - Register completionProvider in capabilities
  - Implement onCompletion handler
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6.2 Implement configuration object completion
  - Detect cursor position in screenshot configuration objects
  - Provide completion items for valid properties
  - Include documentation for each property
  - _Requirements: 5.1, 5.4_

- [x] 6.3 Implement parameter-specific completion
  - Provide format completions (png, jpeg, webp)
  - Provide quality completions (80, 90, 95, 100)
  - _Requirements: 5.2, 5.3_

- [x] 6.4 Implement completion item insertion
  - Ensure correct syntax in inserted text
  - Apply proper formatting
  - _Requirements: 5.5_

- [x] 6.5 Write property test for configuration completion
  - **Property 12: Configuration completion**
  - **Validates: Requirements 5.1, 5.4**

- [x] 6.6 Write property test for parameter completion
  - **Property 13: Parameter-specific completion**
  - **Validates: Requirements 5.2, 5.3**

- [x] 6.7 Write property test for completion insertion
  - **Property 14: Completion insertion**
  - **Validates: Requirements 5.5**

- [x] 7. Implement file type support
- [x] 7.1 Configure document selector for supported file types
  - Add JavaScript, TypeScript, JSX, TSX to document selector
  - Add JSON for configuration files
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 7.2 Implement file type-specific feature activation
  - Provide full features for JS/TS/JSX/TSX files
  - Provide configuration validation for JSON files
  - Skip unsupported file types
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7.3 Write property test for file type support
  - **Property 18: File type support**
  - **Validates: Requirements 7.1, 7.2, 7.4**

- [x] 7.4 Write property test for JSON validation
  - **Property 19: JSON configuration validation**
  - **Validates: Requirements 7.3**

- [x] 7.5 Write property test for unsupported file types
  - **Property 20: Unsupported file type handling**
  - **Validates: Requirements 7.5**

- [x] 8. Implement pattern detection and performance optimization
- [x] 8.1 Implement comprehensive pattern detection
  - Detect capture patterns
  - Detect display enumeration patterns
  - Detect window selection patterns
  - Detect region capture patterns
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 8.2 Integrate pattern detection with all providers
  - Use pattern detection in code lens provider
  - Use pattern detection in hover provider
  - Use pattern detection in diagnostic provider
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 8.3 Implement performance optimizations
  - Add debouncing for document changes (100ms)
  - Implement AST caching
  - Use incremental text document sync
  - Limit diagnostic computation to visible range
  - _Requirements: 8.5_

- [x] 8.4 Write property test for pattern detection
  - **Property 21: Pattern detection and feature provision**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 8.5 Write property test for performance
  - **Property 22: Pattern detection performance**
  - **Validates: Requirements 8.5**

- [x] 9. Update extension packaging and configuration
- [x] 9.1 Update package.json with new activation events
  - Add onLanguage activation events for supported file types
  - Add new command contributions
  - Update extension description
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9.2 Update tsconfig.json for language server compilation
  - Ensure language server is included in build
  - Configure proper output paths
  - _Requirements: 6.1_

- [x] 9.3 Update build scripts
  - Compile language server separately
  - Bundle language server with extension
  - _Requirements: 6.1_

- [x] 9.4 Write integration tests
  - Test LSP startup with extension
  - Test LSP communication with MCP client
  - Test features in actual VSCode editor
  - Test backward compatibility
  - _Requirements: 6.1, 6.2, 6.5, 6.6_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Documentation and final polish
- [x] 11.1 Update README with LSP features
  - Document hover capabilities
  - Document code lens features
  - Document diagnostic features
  - Document completion features
  - Document AI agent command support
  - _Requirements: All_

- [x] 11.2 Add inline code documentation
  - Document all public interfaces
  - Add JSDoc comments to functions
  - Document pattern matching logic
  - _Requirements: All_

- [x] 11.3 Create usage examples
  - Add example code showing LSP features
  - Add screenshots of features in action
  - _Requirements: All_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
