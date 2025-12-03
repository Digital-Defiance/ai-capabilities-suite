# Implementation Plan

- [x] 1. Set up project structure and type definitions

  - Create `scripts/release-lib/` directory for shared modules
  - Create `scripts/release-config/` directory for submodule configurations
  - Create `scripts/release-lib/types.ts` with TypeScript interfaces
  - Set up TypeScript configuration for scripts
  - _Requirements: 17.1_

- [x] 2. Implement configuration loader

  - Create `config-loader.ts` with JSON schema validation
  - Implement loading of submodule-specific configuration files
  - Add validation for required configuration fields
  - Implement default configuration fallback
  - Add support for environment variable overrides
  - _Requirements: 17.1, 17.2, 17.5_

- [x] 2.1 Write unit tests for configuration loader

  - Test loading valid configurations
  - Test validation of invalid configurations
  - Test default configuration fallback
  - Test environment variable overrides
  - _Requirements: 17.1, 17.5_

- [x] 2.2 Write property test for configuration defaults

  - **Property 12: Configuration defaults**
  - **Validates: Requirements 17.5**

- [x] 3. Implement version manager for submodules

  - Create `version-manager.ts` with version bumping functionality
  - Implement npm version command execution in submodule directory
  - Implement file pattern matching and replacement for version sync
  - Add version format validation (semver)
  - Implement verification that all files were updated correctly
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.1 Write property test for version consistency

  - **Property 3: Version consistency after sync**
  - **Validates: Requirements 4.5**

- [x] 3.2 Write unit tests for version manager

  - Test version bumping (patch, minor, major)
  - Test file pattern matching
  - Test verification logic
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4. Implement pre-flight checker

  - Create `preflight-checker.ts` with validation checks
  - Implement Git status check (clean working directory) in submodule
  - Implement branch check (must be on main) in submodule
  - Implement test execution check in submodule
  - Implement build check in submodule
  - Implement credential checks (NPM, VSCode, Docker, GitHub) for local mode
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 4.1 Write property test for pre-flight checks

  - **Property 4: Pre-flight checks prevent invalid releases**
  - **Validates: Requirements 5.6**

- [x] 4.2 Write unit tests for pre-flight checker

  - Test each individual check
  - Test check failure handling
  - Test credential validation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 5. Implement build pipeline for local releases

  - Create `build-pipeline.ts` with build and test execution
  - Implement build command execution in submodule directory
  - Implement test command execution in submodule directory
  - Add build output validation
  - Add test result parsing
  - _Requirements: 3.3_

- [ ] 5.1 Write unit tests for build pipeline

  - Test build execution
  - Test test execution
  - Test error handling
  - _Requirements: 3.3_

- [ ] 6. Implement binary builder (debugger only)

  - Create `binary-builder.ts` for standalone binaries
  - Implement binary building for Linux, macOS, Windows using pkg
  - Implement checksum generation (SHA256)
  - Implement binary compression (tar.gz for Unix, zip for Windows)
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 6.1 Write property test for binary checksums

  - **Property 7: Binary checksums are deterministic**
  - **Validates: Requirements 9.4**

- [ ] 6.2 Write unit tests for binary builder

  - Test binary building for each platform
  - Test checksum generation
  - Test compression
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 7. Implement VSCode extension builder

  - Create `vscode-builder.ts` for extension packaging
  - Implement TypeScript compilation in extension directory
  - Implement VSIX packaging using vsce
  - Add validation of packaged extension
  - _Requirements: 8.1, 8.2_

- [ ] 7.1 Write unit tests for VSCode builder

  - Test compilation
  - Test packaging
  - Test validation
  - _Requirements: 8.1, 8.2_

- [ ] 8. Implement NPM publisher for local releases

  - Create `npm-publisher.ts` for NPM publishing
  - Implement npm publish with public access in submodule directory
  - Implement dry-run mode (npm pack)
  - Implement verification (check package exists on registry)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8.1 Write unit tests for NPM publisher

  - Test publish execution
  - Test dry-run mode
  - Test verification
  - Test credential error handling
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9. Implement Docker publisher for local releases

  - Create `docker-publisher.ts` for Docker image publishing
  - Implement Docker image building in submodule directory
  - Implement image tagging (version, latest, v-prefixed)
  - Implement image pushing to Docker Hub
  - Implement verification (check image exists on registry)
  - _Requirements: 7.4, 7.5_

- [ ] 9.1 Write unit tests for Docker publisher

  - Test image building
  - Test tagging
  - Test pushing
  - Test verification
  - _Requirements: 7.4, 7.5_

- [ ] 10. Implement VSCode marketplace publisher

  - Create `vscode-publisher.ts` for marketplace publishing
  - Implement vsce publish command execution
  - Implement verification (check extension exists on marketplace)
  - Add credential validation
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 10.1 Write unit tests for VSCode publisher

  - Test publish execution
  - Test verification
  - Test credential error handling
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 11. Implement Git operations for submodules

  - Create `git-operations.ts` with Git and GitHub functionality
  - Implement commit creation in submodule with descriptive messages
  - Implement tag creation in submodule with proper format (v{version})
  - Implement push to remote (commits and tags) in submodule
  - Implement GitHub release creation via API in submodule repository
  - Implement asset attachment to GitHub releases
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 11.1 Write property test for Git tag format

  - **Property 6: Git tag format consistency**
  - **Validates: Requirements 10.2**

- [ ] 11.2 Write unit tests for Git operations

  - Test commit creation
  - Test tag creation
  - Test push operations
  - Test GitHub release creation
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 12. Implement changelog generator

  - Create `changelog-generator.ts` for release notes
  - Implement commit extraction from Git history in submodule
  - Implement commit categorization (features, fixes, breaking, other)
  - Implement markdown formatting
  - Add PR and commit link generation for submodule repository
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 12.1 Write property test for changelog categorization

  - **Property 8: Changelog categorization completeness**
  - **Validates: Requirements 11.2**

- [ ] 12.2 Write unit tests for changelog generator

  - Test commit extraction
  - Test categorization logic
  - Test markdown formatting
  - Test link generation
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 13. Implement verification pipeline

  - Create `verification-pipeline.ts` for post-release checks
  - Implement NPM package verification (installable)
  - Implement Docker image verification (pullable)
  - Implement VSCode extension verification (accessible)
  - Implement GitHub release verification (exists in submodule repo)
  - Run verifications in parallel for performance
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 13.1 Write property test for verification

  - **Property 9: Verification matches published artifacts**
  - **Validates: Requirements 12.5**

- [ ] 13.2 Write unit tests for verification pipeline

  - Test each verification type
  - Test parallel execution
  - Test failure reporting
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 14. Implement release manifest writer

  - Create `manifest-writer.ts` for tracking releases
  - Implement manifest loading from monorepo
  - Implement manifest creation with metadata
  - Implement adding release entries to manifest
  - Add verification URLs to manifest
  - Add artifact checksums to manifest
  - Save manifest to monorepo releases directory
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 14.1 Write property test for manifest completeness

  - **Property 13: Manifest completeness**
  - **Validates: Requirements 13.5**

- [ ] 14.2 Write unit tests for manifest writer

  - Test manifest loading
  - Test manifest creation
  - Test adding releases
  - Test manifest saving
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 15. Implement submodule reference updater

  - Create `submodule-reference-updater.ts` for Git submodule management
  - Implement updating submodule reference to new commit
  - Implement committing submodule update to monorepo
  - Implement verification that submodule is at correct commit
  - Add option to skip submodule update
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 15.1 Write property test for submodule reference correctness

  - **Property 10: Submodule reference correctness**
  - **Validates: Requirements 14.1, 14.5**

- [ ] 15.2 Write unit tests for submodule reference updater

  - Test reference updating
  - Test commit creation
  - Test verification
  - Test skip option
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 16. Implement GitHub API client for remote releases

  - Create `github-api-client.ts` using @octokit/rest
  - Implement workflow_dispatch trigger
  - Implement passing version bump type and dry_run inputs
  - Add authentication handling
  - Add error handling for API failures
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 16.1 Write property test for remote workflow triggering

  - **Property 5: Remote workflow triggering**
  - **Validates: Requirements 2.1**

- [ ] 16.2 Write unit tests for GitHub API client

  - Test workflow triggering
  - Test input passing
  - Test authentication
  - Test error handling
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 17. Implement workflow monitor for remote releases

  - Create `workflow-monitor.ts` for tracking workflow runs
  - Implement polling workflow run status
  - Implement waiting for workflow completion
  - Add timeout handling
  - Implement status reporting (success/failure)
  - _Requirements: 2.4, 2.5_

- [ ] 17.1 Write unit tests for workflow monitor

  - Test status polling
  - Test completion waiting
  - Test timeout handling
  - Test status reporting
  - _Requirements: 2.4, 2.5_

- [ ] 18. Implement logger

  - Create `logger.ts` with structured logging using winston
  - Implement console output with colors and formatting
  - Implement file logging with timestamps
  - Add log levels (debug, info, warn, error)
  - Implement step tracking and progress display
  - Implement summary generation
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 18.1 Write unit tests for logger

  - Test console output
  - Test file logging
  - Test log levels
  - Test step tracking
  - Test summary generation
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 19. Implement local release pipeline orchestrator

  - Create `local-release-pipeline.ts` to coordinate local releases
  - Implement sequential execution of: preflight, version, build, publish, git, verify
  - Add error handling and early exit on failure
  - Implement dry-run mode support
  - Add progress reporting
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 19.1 Write integration tests for local release pipeline

  - Test full local release workflow (dry-run)
  - Test error handling at each step
  - Test artifact publishing
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 20. Implement remote release pipeline orchestrator

  - Create `remote-release-pipeline.ts` to coordinate remote releases
  - Implement workflow triggering via GitHub API
  - Implement workflow monitoring and status reporting
  - Implement verification after workflow completes
  - Add timeout and error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 20.1 Write integration tests for remote release pipeline

  - Test workflow triggering
  - Test workflow monitoring
  - Test verification after completion
  - Test error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 21. Implement release mode selector

  - Create `release-mode-selector.ts` for choosing local vs remote
  - Implement mode validation based on configuration
  - Add mode selection logic based on user input
  - Implement fallback to default mode
  - _Requirements: 1.2_

- [ ] 21.1 Write property test for mode availability

  - **Property 14: Mode availability**
  - **Validates: Requirements 1.2**

- [ ] 21.2 Write unit tests for release mode selector

  - Test mode selection
  - Test mode validation
  - Test fallback logic
  - _Requirements: 1.2_

- [ ] 22. Implement main release CLI

  - Create `release.ts` as main orchestrator using Commander.js
  - Parse command-line arguments (submodules, version-bump, options)
  - Load submodule configuration
  - Select release mode (local vs remote)
  - Execute appropriate release pipeline
  - Handle errors and report status
  - Generate release summary report
  - Update submodule references in monorepo
  - Update release manifest
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 22.1 Write property test for dry-run

  - **Property 2: Dry-run produces no side effects**
  - **Validates: Requirements 1.5**

- [ ] 22.2 Write property test for submodule isolation

  - **Property 1: Submodule isolation**
  - **Validates: Requirements 1.1**

- [ ] 22.3 Write integration tests for release CLI

  - Test full release workflow (dry-run)
  - Test local mode
  - Test remote mode
  - Test error handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 23. Implement multi-submodule release coordinator

  - Add support for releasing multiple submodules in sequence
  - Implement sequential execution with waiting between releases
  - Add failure handling (halt on first failure)
  - Implement combined release summary
  - Update manifest with all releases
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 23.1 Write property test for multi-release failure isolation

  - **Property 11: Multi-release failure isolation**
  - **Validates: Requirements 16.3**

- [ ] 23.2 Write integration tests for multi-submodule releases

  - Test releasing multiple submodules
  - Test failure handling
  - Test combined summary
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 24. Create submodule configuration files

  - Create `release-config/mcp-debugger-server.json` with all settings
  - Create `release-config/mcp-screenshot.json` with all settings
  - Create `release-config/vscode-mcp-debugger.json` with all settings
  - Create `release-config/defaults.json` with default settings
  - Include file sync patterns for each submodule
  - Include build commands and test commands
  - Include artifact types and registry URLs
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 25. Add release notes validation

  - Implement release notes display for review
  - Add interactive editing support using editor
  - Add validation for empty release notes
  - Implement approval workflow
  - Support non-interactive mode with auto-approval
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 25.1 Write unit tests for release notes validation

  - Test display and review
  - Test editing
  - Test validation
  - Test approval workflow
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 26. Create documentation

  - Write README for release automation system
  - Document all CLI commands and options
  - Create troubleshooting guide
  - Document configuration file format
  - Add examples for common scenarios (local, remote, multi-submodule)
  - Document GitHub Actions workflow requirements
  - _Requirements: 1.1, 1.2_

- [ ] 27. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 28. Add package.json scripts
  - Add `yarn release` script to root package.json
  - Add script aliases for common release scenarios
  - Document scripts in README
  - _Requirements: 1.1_
