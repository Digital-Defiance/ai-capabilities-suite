# Implementation Plan - MCP Testing Server

## Overview

This implementation plan breaks down the MCP Testing Server and VS Code Extension into discrete, manageable tasks. Each task builds incrementally on previous tasks, with property-based tests integrated throughout to validate correctness properties from the design document.

## Task List

- [x] 1. Set up project structure and core infrastructure

  - Create monorepo package at packages/mcp-testing for MCP Server
  - Create monorepo package at packages/vscode-mcp-acs-testing for VS Code Extension
  - Set up TypeScript configuration with strict mode for both packages
  - Configure Jest for unit testing and fast-check for property-based testing
  - Set up ESLint and Prettier
  - Create package.json for mcp-testing with dependencies (@modelcontextprotocol/sdk, zod, fast-check)
  - Create package.json for vscode-mcp-acs-testing with dependencies (@ai-capabilities-suite/mcp-client-base, @ai-capabilities-suite/vscode-shared-status-bar)
  - Configure build scripts and CI/CD pipeline
  - _Requirements: All (foundational)_

- [x] 2. Implement MCP Server core components

  - Don't forget to base off mcp-client-base

- [x] 2.1 Create FrameworkDetector component

  - Implement framework detection from package.json and config files
  - Support Jest, Mocha, Pytest, Vitest detection
  - Implement configuration file parsing
  - Validate framework compatibility
  - _Requirements: 18.1, 19.1_

- [x] 2.2 Create SecurityManager component

  - Implement framework allowlist validation
  - Implement resource limit enforcement
  - Create audit logging system
  - Implement dangerous operation blocking
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 2.3 Write property test for security enforcement

  - **Property 46: Non-allowlisted frameworks are rejected**
  - **Property 47: Resource limits terminate processes**
  - **Property 48: Operations are audit logged**
  - **Property 49: Dangerous operations are blocked**
  - **Validates: Requirements 11.2, 11.3, 11.4, 11.5**

- [x] 2.4 Create ResultParser component

  - Implement parsers for Jest, Mocha, Pytest, Vitest output formats
  - Normalize results to common TestResult format
  - Extract error messages and stack traces
  - Parse test metadata (duration, tags, etc.)
  - Support streaming results
  - _Requirements: 1.2_

- [x] 2.5 Write property test for result parsing

  - **Property 1: Test execution produces structured results**
  - **Validates: Requirements 1.1, 1.2**

- [x] 3. Implement TestRunnerManager and test execution
- [x] 3.1 Create TestRunnerManager component

  - Implement test execution via mcp-process integration
  - Support parallel test execution with worker limits
  - Implement timeout management
  - Support watch mode with file change detection
  - Handle test process lifecycle (start, stop, monitor)
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [x] 3.2 Write property test for timeout enforcement

  - **Property 2: Timeout enforcement terminates tests**
  - **Validates: Requirements 1.3**

- [x] 3.3 Write property test for parallel execution

  - **Property 3: Parallel execution respects limits**
  - **Validates: Requirements 1.4**

- [x] 3.4 Write property test for watch mode

  - **Property 4: Watch mode re-runs affected tests**
  - **Validates: Requirements 1.5**

- [x] 3.5 Integrate with mcp-process for test runner spawning

  - Call mcp-process tools to spawn test processes
  - Pass security configuration to mcp-process
  - Handle process output capture
  - _Requirements: 20.3_

- [x] 3.6 Write property test for process integration

  - **Property 73: Process integration works**
  - **Validates: Requirements 20.3**

- [x] 4. Implement CoverageAnalyzer
- [x] 4.1 Create CoverageAnalyzer component

  - Implement coverage instrumentation for each framework
  - Parse coverage reports (JSON, LCOV, Cobertura)
  - Calculate line, branch, function, statement coverage
  - Identify coverage gaps
  - Track coverage trends over time
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4.2 Write property test for coverage analysis

  - **Property 5: Coverage analysis returns all metrics**
  - **Property 6: Threshold violations are reported**
  - **Property 7: Coverage gaps are identified**
  - **Property 8: Coverage trends are calculated**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 4.3 Implement coverage report generation

  - Generate JSON format reports
  - Generate HTML format reports
  - Generate LCOV format reports
  - Generate Cobertura format reports
  - _Requirements: 2.5_

- [x] 4.4 Write property test for coverage export

  - **Property 9: Coverage export supports multiple formats**
  - **Validates: Requirements 2.5**

- [x] 5. Implement TestGenerator
- [x] 5.1 Create TestGenerator component

  - Implement function signature analysis
  - Implement edge case identification
  - Generate unit test templates
  - Generate property-based test templates
  - Follow project test patterns
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.2 Write property test for test generation

  - **Property 10: Test generation analyzes functions**
  - **Property 11: Edge cases are identified**
  - **Property 12: Fixtures are generated from requirements**
  - **Property 13: Test suggestions improve coverage**
  - **Property 14: Generated tests follow project patterns**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 5.3 Integrate with mcp-filesystem for code reading

  - Call mcp-filesystem to read source files
  - Call mcp-filesystem to write generated tests
  - Handle file system errors gracefully
  - _Requirements: 20.4_

- [x] 5.4 Write property test for filesystem integration

  - **Property 74: Filesystem integration works**
  - **Validates: Requirements 20.4**

- [x] 6. Implement debugging integration
- [x] 6.1 Create DebugIntegration component

  - Capture complete error information from test failures
  - Extract failure location (file, line, column)
  - Integrate with mcp-debugger-server for debug sessions
  - Provide variable inspection at failure points
  - Implement root cause analysis
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6.2 Write property test for debugging features

  - **Property 15: Test failures capture complete error information**
  - **Property 16: Debugger integration starts at failure point**
  - **Property 17: Debug sessions provide execution context**
  - **Property 18: Root cause suggestions are provided**
  - **Property 19: Failure comparison highlights differences**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 6.3 Integrate with mcp-debugger-server

  - Call debugger_start tool with failure location
  - Pass test context to debugger
  - Handle debugger connection errors
  - _Requirements: 20.1_

- [x] 6.4 Write property test for debugger integration

  - **Property 71: Debugger integration works**
  - **Validates: Requirements 20.1**

- [x] 7. Implement test lifecycle management
- [x] 7.1 Create TestManager component

  - Implement test discovery across project
  - Implement test search with pattern matching
  - Implement test filtering by status, duration, tags
  - Implement test grouping by file, suite, tag
  - Implement test tagging operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7.2 Write property test for test management

  - **Property 20: Test discovery finds all tests**
  - **Property 21: Test organization supports multiple criteria**
  - **Property 22: Test tagging operations work correctly**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 8. Implement visual regression testing
- [x] 8.1 Create VisualRegressionTester component

  - Integrate with mcp-screenshot for captures
  - Implement image comparison algorithm
  - Calculate visual difference percentages
  - Generate diff images
  - Manage baseline images
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 8.2 Write property test for visual regression

  - **Property 23: Screenshot integration captures images**
  - **Property 24: Image comparison calculates differences**
  - **Property 25: Threshold violations fail tests**
  - **Property 26: Baseline updates replace images**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

- [x] 8.3 Integrate with mcp-screenshot

  - Call screenshot_capture tools
  - Handle screenshot errors
  - Store screenshots with test results
  - _Requirements: 20.2_

- [x] 8.4 Write property test for screenshot integration

  - **Property 72: Screenshot integration works**
  - **Validates: Requirements 20.2**

- [x] 9. Implement FlakyDetector
- [x] 9.1 Create FlakyDetector component

  - Implement repeated test execution
  - Track result consistency across runs
  - Calculate failure rates
  - Analyze flakiness causes (timing, race conditions, external deps)
  - Suggest fixes for flaky tests
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9.2 Write property test for flaky detection

  - **Property 27: Flaky detection executes multiple times**
  - **Property 28: Inconsistent results mark tests as flaky**
  - **Property 29: Flakiness causes are analyzed**
  - **Property 30: Flaky history is tracked**
  - **Property 31: Flaky fixes are suggested**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 10. Implement MutationTester
- [x] 10.1 Create MutationTester component

  - Generate code mutations (operators, conditions, returns)
  - Execute test suite against each mutation
  - Track killed vs survived mutations
  - Calculate mutation score
  - Generate mutation reports
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10.2 Write property test for mutation testing

  - **Property 32: Mutations are generated from code**
  - **Property 33: Mutation testing tracks caught mutations**
  - **Property 34: Surviving mutations are reported**
  - **Property 35: Mutation score is calculated**
  - **Property 36: Mutation reports are comprehensive**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [x] 11. Implement ImpactAnalyzer
- [x] 11.1 Create ImpactAnalyzer component

  - Analyze code changes from git diff
  - Map changed files to test files using imports
  - Use coverage data for impact analysis
  - Prioritize affected tests by impact severity
  - Support selective test execution
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 11.2 Write property test for impact analysis

  - **Property 37: Impact analysis identifies affected tests**
  - **Property 38: File mapping uses imports and coverage**
  - **Property 39: Affected tests are prioritized**
  - **Property 40: Selective execution runs only affected tests**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 12. Implement performance benchmarking
- [x] 12.1 Create PerformanceBenchmarker component

  - Measure test execution times
  - Identify slow tests exceeding thresholds
  - Track performance trends over time
  - Detect performance regressions
  - Suggest optimization opportunities
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12.2 Write property test for performance benchmarking

  - **Property 41: Test durations are measured**
  - **Property 42: Slow tests are identified**
  - **Property 43: Performance trends detect regressions**
  - **Property 44: Optimization suggestions are provided**
  - **Property 45: Performance reports are comprehensive**
  - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 13. Implement MCP Server and tools
- [x] 13.1 Create MCP Server with tool definitions

  - Define all 25+ MCP tools with Zod schemas
  - Implement test_run tool
  - Implement test_stop tool
  - Implement test_list tool
  - Implement test_search tool
  - _Requirements: 1.1, 5.1, 5.2_

- [x] 13.2 Implement coverage tools

  - Implement test_coverage_analyze tool
  - Implement test_coverage_report tool
  - Implement test_coverage_gaps tool
  - Implement test_coverage_trends tool
  - Implement test_coverage_export tool
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 13.3 Implement test generation tools

  - Implement test_generate tool
  - Implement test_generate_from_code tool
  - Implement test_generate_fixtures tool
  - Implement test_suggest_cases tool
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 13.4 Implement debugging tools

  - Implement test_debug tool
  - Implement test_analyze_failure tool
  - Implement test_compare_values tool
  - _Requirements: 4.2, 4.4, 4.5_

- [x] 13.5 Implement advanced testing tools

  - Implement test_detect_flaky tool
  - Implement test_mutation_run tool
  - Implement test_impact_analyze tool
  - Implement test_performance_benchmark tool
  - _Requirements: 7.1, 8.1, 9.1, 10.1_

- [x] 13.6 Implement configuration tools

  - Implement test_configure_framework tool
  - Implement test_get_config tool
  - Implement test_set_config tool
  - _Requirements: 19.1, 19.3, 19.4_

- [x] 13.7 Write property test for configuration management

  - **Property 67: Configuration loading works for all frameworks**
  - **Property 68: Custom configuration merges correctly**
  - **Property 69: Invalid configuration returns errors**
  - **Property 70: Configuration changes trigger reload**
  - **Validates: Requirements 19.1, 19.3, 19.4, 19.5**

- [x] 14. Implement error handling and recovery
- [x] 14.1 Create error handling system

  - Define error codes and messages
  - Implement error response formatting
  - Implement retry with exponential backoff
  - Implement graceful degradation
  - Implement circuit breaker pattern
  - _Requirements: All (error handling)_

- [x] 14.2 Write property test for integration failures

  - **Property 75: Integration failures degrade gracefully**
  - **Validates: Requirements 20.5**

- [x] 15. Checkpoint - Ensure all MCP Server tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Create VS Code Extension foundation
- [x] 16.1 Set up VS Code extension project

  - Create extension package with proper structure
  - Configure extension manifest (package.json)
  - Set up activation events
  - Configure extension dependencies
  - Set up build and packaging scripts
  - _Requirements: 12.1_

- [x] 16.2 Create MCPTestingClient extending BaseMCPClient

  - Extend BaseMCPClient from @ai-capabilities-suite/mcp-client-base
  - Implement getServerCommand() to locate mcp-testing-server
  - Implement getServerEnv() for environment configuration
  - Implement onServerReady() for initialization
  - Create typed methods for all MCP tools
  - Implement event emitters for test events
  - _Requirements: 12.1_

- [x] 16.3 Write unit tests for MCPTestingClient

  - Test connection lifecycle
  - Test tool invocation
  - Test error handling
  - Test event emission
  - _Requirements: 12.1_

- [x] 17. Implement Test Explorer integration
- [x] 17.1 Create TestExplorerProvider using VS Code Testing API

  - Implement vscode.TestController
  - Discover tests from MCP Server
  - Create test items hierarchy
  - Handle test execution requests
  - Update test status in real-time
  - Support test run profiles (Run, Debug, Coverage)
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 17.2 Write property test for Test Explorer

  - **Property 50: Test Explorer displays discovered tests**
  - **Property 51: Test Explorer executes tests**
  - **Property 52: Failed tests show debug option**
  - **Property 53: Debug button starts debug session**
  - **Validates: Requirements 12.2, 12.3, 12.4, 12.5**

- [x] 18. Implement custom tree view providers
- [x] 18.1 Create TestHistoryTreeProvider

  - Implement vscode.TreeDataProvider
  - Display test run history grouped by time
  - Show pass/fail statistics
  - Support filtering and comparison
  - Provide context menu actions (rerun, compare, export)
  - _Requirements: 16.4 (from enhanced design)_

- [x] 18.2 Create CoverageTreeProvider

  - Implement vscode.TreeDataProvider
  - Display coverage organized by files and functions
  - Color-code by coverage percentage
  - Support drill-down navigation
  - Provide quick actions for uncovered code
  - _Requirements: 15.1, 15.2, 15.3_

- [x] 18.3 Create FlakyTestsTreeProvider

  - Implement vscode.TreeDataProvider
  - Display flaky tests grouped by severity
  - Show failure patterns and rates
  - Display suggested fixes
  - Provide analysis and fix actions
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 18.4 Create TestTagsTreeProvider

  - Implement vscode.TreeDataProvider
  - Display tests grouped by tags
  - Show test counts per tag
  - Support tag-based execution
  - Provide tag management actions
  - _Requirements: 5.5_

- [x] 18.5 Register all tree views in extension

  - Register tree views in package.json
  - Create view containers
  - Handle view visibility
  - Implement view refresh logic
  - _Requirements: All tree views_

- [x] 19. Implement CodeLens provider
- [x] 19.1 Create TestCodeLensProvider

  - Implement vscode.CodeLensProvider
  - Detect test functions in documents
  - Provide "Run Test" and "Debug Test" CodeLens
  - Show test status and duration
  - Display coverage percentage
  - Update CodeLens dynamically during test runs
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 19.2 Write property test for CodeLens

  - **Property 54: CodeLens provides test actions**
  - **Property 55: CodeLens shows loading state**
  - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

- [x] 20. Implement diagnostics provider
- [x] 20.1 Create TestDiagnosticsProvider

  - Create diagnostic collection
  - Display test failure diagnostics
  - Display coverage gap warnings
  - Display flaky test warnings
  - Provide code actions for fixes
  - Update diagnostics in real-time
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 20.2 Write property test for diagnostics

  - **Property 56: Diagnostics display test issues**
  - **Property 57: Diagnostics provide code actions**
  - **Property 58: Diagnostics can be cleared**
  - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

- [x] 21. Implement coverage decorator
- [x] 21.1 Create CoverageDecorator

  - Create decoration types for covered/uncovered lines
  - Implement gutter decorations (green/red/yellow)
  - Implement heat map mode
  - Provide hover information
  - Support toggling coverage display
  - Update decorations when coverage changes
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 21.2 Write property test for coverage visualization

  - **Property 59: Coverage decorations show coverage state**
  - **Property 60: Coverage hovers provide information**
  - **Property 61: Coverage toggle removes decorations**
  - **Property 62: Threshold violations update status bar**
  - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

- [x] 22. Implement webview panels
- [x] 22.1 Create TestResultsWebviewPanel

  - Create webview panel with HTML/CSS/JS
  - Display test results in interactive table
  - Show pass/fail statistics with charts
  - Support filtering and sorting
  - Provide export functionality
  - Handle navigation to test locations
  - _Requirements: 16.1, 16.2, 16.5_

- [x] 22.2 Create CoverageReportWebviewPanel

  - Create webview panel for coverage
  - Display coverage metrics with charts
  - Show file-level breakdown
  - Provide drill-down navigation
  - Display coverage trends
  - Support coverage comparison
  - _Requirements: 16.3_

- [x] 22.3 Create TestGenerationWebviewPanel

  - Create webview panel for test generation
  - Display generated tests with syntax highlighting
  - Allow editing before saving
  - Show generation options
  - Support batch generation
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 22.4 Create MutationTestingWebviewPanel

  - Create webview panel for mutation results
  - Display mutation score with visualization
  - List surviving mutations
  - Provide code diff for mutations
  - Suggest additional tests
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 22.5 Create TestImpactWebviewPanel

  - Create webview panel for impact analysis
  - Display affected tests visualization
  - Show change-to-test mapping
  - Provide selective execution
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 22.6 Create TestPerformanceWebviewPanel

  - Create webview panel for performance
  - Display slowest tests with charts
  - Show performance trends
  - Provide optimization suggestions
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 22.7 Write property test for webviews

  - **Property 63: Webviews display test information**
  - **Property 64: Webview navigation works**
  - **Property 65: Webviews support interactions**
  - **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5**

- [x] 23. Implement additional editor providers
- [x] 23.1 Create HoverProvider

  - Implement vscode.HoverProvider
  - Show test information on hover
  - Display coverage details
  - Show test history
  - Provide quick actions
  - _Requirements: 15.2, 15.3_

- [x] 23.2 Create CompletionProvider

  - Implement vscode.CompletionItemProvider
  - Provide test template snippets
  - Suggest assertion methods
  - Provide fixture completions
  - _Requirements: 3.1, 3.3_

- [x] 23.3 Create DefinitionProvider

  - Implement vscode.DefinitionProvider
  - Navigate from test to implementation
  - Navigate from implementation to tests
  - Support multi-file navigation
  - _Requirements: 5.1_

- [x] 23.4 Create ReferenceProvider

  - Implement vscode.ReferenceProvider
  - Find all tests referencing a function
  - Find all code referenced by a test
  - Show test coverage references
  - _Requirements: 5.1_

- [x] 23.5 Create DocumentSymbolProvider

  - Implement vscode.DocumentSymbolProvider
  - Show test structure in outline
  - Display test suites and cases
  - Support navigation from outline
  - _Requirements: 5.1_

- [x] 23.6 Create WorkspaceSymbolProvider

  - Implement vscode.WorkspaceSymbolProvider
  - Search tests across workspace
  - Support fuzzy search
  - Provide quick navigation
  - _Requirements: 5.2_

- [x] 24. Implement status bar and notifications
- [x] 24.1 Create StatusBarManager using vscode-shared-status-bar

  - Use @ai-capabilities-suite/vscode-shared-status-bar package
  - Create status bar items for test status
  - Display coverage percentage
  - Show last run timestamp
  - Provide click actions
  - Update colors based on status
  - _Requirements: 15.5_

- [x] 24.2 Create NotificationManager

  - Show test completion notifications
  - Display error notifications
  - Show coverage threshold violations
  - Provide actionable notifications
  - Support notification preferences
  - _Requirements: All (notifications)_

- [x] 25. Implement task and debug providers
- [x] 25.1 Create TaskProvider

  - Implement vscode.TaskProvider
  - Create test run tasks
  - Create coverage tasks
  - Create test generation tasks
  - Support task customization
  - _Requirements: All (task execution)_

- [x] 25.2 Create DebugConfigurationProvider

  - Implement vscode.DebugConfigurationProvider
  - Create debug configurations for tests
  - Support framework-specific debugging
  - Integrate with mcp-debugger-server
  - _Requirements: 12.5, 13.3, 20.1_

- [x] 26. Implement keyboard shortcuts and commands
- [x] 26.1 Register all commands

  - Register 50+ commands in package.json
  - Implement command handlers
  - Support command palette
  - Provide context menu commands
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 26.2 Write property test for keyboard shortcuts

  - **Property 66: Keyboard shortcuts perform actions**
  - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5**

- [x] 26.3 Configure default keybindings

  - Set Ctrl+Shift+T for run test
  - Set Ctrl+Shift+D for debug test
  - Set Ctrl+Shift+C for coverage toggle
  - Set Ctrl+Shift+G for generate tests
  - Set Ctrl+Shift+R for rerun failed
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 27. Implement extension settings
- [x] 27.1 Define all configuration settings

  - Define 50+ settings in package.json
  - Organize settings by category
  - Provide default values
  - Add setting descriptions
  - _Requirements: All (configuration)_

- [x] 27.2 Implement settings management

  - Read settings from workspace configuration
  - Handle setting changes
  - Validate setting values
  - Apply settings to components
  - _Requirements: All (configuration)_

- [x] 28. Implement framework-specific support
- [x] 28.1 Add Jest support

  - Implement Jest test runner integration
  - Support Jest configuration
  - Support snapshot testing
  - Support watch mode
  - _Requirements: 18.2_

- [x] 28.2 Add Mocha support

  - Implement Mocha test runner integration
  - Support Mocha configuration
  - Support watch mode
  - _Requirements: 18.3_

- [x] 28.3 Add Pytest support

  - Implement Pytest test runner integration
  - Support Pytest configuration
  - Support fixtures and parametrized tests
  - _Requirements: 18.4_

- [x] 28.4 Add Vitest support

  - Implement Vitest test runner integration
  - Support Vitest configuration
  - Support UI mode
  - _Requirements: 18.5_

- [x] 29. Checkpoint - Ensure all VS Code extension tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 30. Integration testing and polish
- [x] 30.1 Write integration tests

  - Test MCP Server ↔ VS Code Extension communication
  - Test all MCP tool invocations from extension
  - Test error handling and recovery
  - Test concurrent operations
  - _Requirements: All_

- [x] 30.2 Write E2E tests

  - Test complete user workflows
  - Test Jest workflow end-to-end
  - Test Mocha workflow end-to-end
  - Test Pytest workflow end-to-end
  - Test Vitest workflow end-to-end
  - _Requirements: All_

- [x] 30.3 Performance optimization

  - Optimize test discovery
  - Optimize result parsing
  - Optimize coverage analysis
  - Optimize webview rendering
  - _Requirements: All (performance)_

- [x] 30.4 Documentation

  - Write comprehensive README for MCP Server
  - Write comprehensive README for VS Code Extension
  - Create user guide with screenshots
  - Document all MCP tools with examples
  - Create troubleshooting guide
  - _Requirements: All_

- [x] 30.5 Package and publish

  - Build MCP Server package
  - Build VS Code Extension VSIX
  - Publish to npm registry
  - Publish to VS Code Marketplace
  - Create GitHub releases
  - _Requirements: All_

- [x] 31. Final Checkpoint - Complete system validation with zero failures.

  - Ensure ALL tests pass, ask the user if questions arise.
  - Verify all requirements are met
  - Validate all correctness properties
  - Confirm integration with AI Capabilities Suite

- [ ] 32. Publish to MCP registry via pull request to mcp-registry

  - /mcp-registry/servers/mcp-testing

- [ ] 33. Publish to other MCP registry via API mcp-publisher
  - https://github.com/modelcontextprotocol/registry
