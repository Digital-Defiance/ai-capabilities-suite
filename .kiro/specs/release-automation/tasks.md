# Implementation Plan

- [x] 1. Set up project structure and configuration system
  - Create `scripts/release-lib/` directory for shared modules
  - Create `scripts/release-config/` directory for package configurations
  - Create configuration files for debugger and screenshot packages
  - Set up TypeScript/JSDoc types for better IDE support
  - _Requirements: 13.5_

- [x] 2. Implement configuration loader
  - Create `config-loader.ts` with configuration schema validation
  - Implement loading of package-specific configuration from JSON files
  - Add validation for required configuration fields
  - Add support for environment variable overrides
  - _Requirements: 13.5_

- [x] 2.1 Write unit tests for configuration loader
  - Test loading valid configurations
  - Test validation of invalid configurations
  - Test environment variable overrides
  - _Requirements: 13.5_

- [x] 3. Implement version manager
  - Create `version-manager.ts` with version sync functionality
  - Implement file pattern matching and replacement
  - Add version format validation (semver)
  - Implement verification that all files were updated correctly
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.1 Write property test for version sync
  - **Property 1: Version consistency after sync**
  - **Validates: Requirements 2.5**

- [x] 3.2 Write unit tests for version manager
  - Test version format validation
  - Test file pattern matching
  - Test verification logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Implement set-version command
  - Create `set-version.ts` CLI script
  - Parse command-line arguments (package, version)
  - Update package.tson with new version
  - Execute sync-versions script automatically
  - Commit version changes to Git
  - Make it available from root package json (via yarn set-version)
  - _Requirements: 2a.1, 2a.2, 2a.3, 2a.4, 2a.5_

- [x] 4.1 Write integration test for set-version command
  - Test full version setting workflow
  - Verify all files are updated
  - Verify Git commit is created
  - _Requirements: 2a.1, 2a.2, 2a.3, 2a.4, 2a.5_

- [ ] 5. Implement pre-flight checker
  - Create `preflight-checker.ts` with validation checks
  - Implement Git status check (clean working directory)
  - Implement branch check (must be on main)
  - Implement test execution check
  - Implement build check
  - Implement credential checks (NPM, VSCode, Docker, GitHub)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 5.1 Write property test for pre-flight checks
  - **Property 2: Pre-flight checks prevent invalid releases**
  - **Validates: Requirements 3.6**

- [ ] 5.2 Write unit tests for pre-flight checker
  - Test each individual check
  - Test check failure handling
  - Test credential validation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 6. Implement NPM builder
  - Create `builders/npm-builder.ts`
  - Implement build command execution
  - Implement test command execution
  - Add build output validation
  - _Requirements: 4.1_

- [ ] 6.1 Write unit tests for NPM builder
  - Test build execution
  - Test test execution
  - Test error handling
  - _Requirements: 4.1_

- [ ] 7. Implement binary builder (debugger only)
  - Create `builders/binary-builder.ts`
  - Implement binary building for Linux, macOS, Windows
  - Implement checksum generation (SHA256)
  - Implement binary compression (tar.gz for Unix, zip for Windows)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 7.1 Write property test for binary checksums
  - **Property 8: Binary checksums are deterministic**
  - **Validates: Requirements 7.4**

- [ ] 7.2 Write unit tests for binary builder
  - Test binary building for each platform
  - Test checksum generation
  - Test compression
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Implement VSCode extension builder
  - Create `builders/vscode-builder.ts`
  - Implement TypeScript compilation
  - Implement VSIX packaging
  - Add validation of packaged extension
  - _Requirements: 6.1, 6.2_

- [x] 8.1 Write unit tests for VSCode builder
  - Test compilation
  - Test packaging
  - Test validation
  - _Requirements: 6.1, 6.2_

- [x] 9. Implement NPM publisher
  - Create `publishers/npm-publisher.ts`
  - Implement npm publish with public access
  - Implement dry-run mode (npm pack)
  - Implement verification (check package exists on registry)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9.1 Write unit tests for NPM publisher
  - Test publish execution
  - Test dry-run mode
  - Test verification
  - Test credential error handling
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 10. Implement Docker publisher
  - Create `publishers/docker-publisher.ts`
  - Implement Docker image building
  - Implement image tagging (version, latest, v-prefixed)
  - Implement image pushing to Docker Hub
  - Implement verification (check image exists on registry)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10.1 Write unit tests for Docker publisher
  - Test image building
  - Test tagging
  - Test pushing
  - Test verification
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [-] 11. Implement VSCode marketplace publisher
  - Create `publishers/vscode-publisher.ts`
  - Implement vsce publish command execution
  - Implement verification (check extension exists on marketplace)
  - Add credential validation
  - _Requirements: 6.3, 6.4, 6.5_

- [ ] 11.1 Write unit tests for VSCode publisher
  - Test publish execution
  - Test verification
  - Test credential error handling
  - _Requirements: 6.3, 6.4, 6.5_

- [x] 12. Implement Git operations
  - Create `git-operations.ts` with Git and GitHub functionality
  - Implement commit creation with descriptive messages
  - Implement tag creation with proper format
  - Implement push to remote (commits and tags)
  - Implement GitHub release creation via API
  - Implement asset attachment to GitHub releases
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 12.1 Write property test for Git tag format
  - **Property 9: Git tag format consistency**
  - **Validates: Requirements 8.2**

- [x] 12.2 Write unit tests for Git operations
  - Test commit creation
  - Test tag creation
  - Test push operations
  - Test GitHub release creation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13. Implement changelog generator
  - Create `changelog-generator.ts`
  - Implement commit extraction from Git history
  - Implement commit categorization (features, fixes, breaking, other)
  - Implement markdown formatting
  - Add PR and commit link generation
  - Update CHANGELOG.md file
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 13.1 Write property test for changelog categorization
  - **Property 10: Changelog categorization completeness**
  - **Validates: Requirements 9.2**

- [x] 13.2 Write unit tests for changelog generator
  - Test commit extraction
  - Test categorization logic
  - Test markdown formatting
  - Test link generation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 14. Implement verification pipeline
  - Create `verification-pipeline.ts`
  - Implement NPM package verification (installable)
  - Implement Docker image verification (pullable)
  - Implement VSCode extension verification (accessible)
  - Implement GitHub release verification (exists)
  - Run verifications in parallel for performance
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 14.1 Write property test for verification
  - **Property 7: Verification matches published artifacts**
  - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [ ] 14.2 Write unit tests for verification pipeline
  - Test each verification type
  - Test parallel execution
  - Test failure reporting
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15. Implement release manifest writer
  - Create `manifest-writer.ts`
  - Implement manifest creation with metadata
  - Implement manifest updates as steps complete
  - Add verification URLs to manifest
  - Add artifact checksums to manifest
  - Save manifest to releases directory
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 15.1 Write property test for manifest completeness
  - **Property 5: Release manifest completeness**
  - **Validates: Requirements 12.3**

- [ ] 15.2 Write unit tests for manifest writer
  - Test manifest creation
  - Test manifest updates
  - Test manifest saving
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 16. Implement error handler and rollback
  - Create `error-handler.ts` with rollback logic
  - Implement rollback for NPM (unpublish if possible)
  - Implement rollback for Docker (delete tags)
  - Implement rollback for VSCode (unpublish if possible)
  - Implement rollback for Git (delete tags)
  - Implement rollback for GitHub (delete release)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 16.1 Write property test for rollback
  - **Property 3: Rollback restores pre-release state**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [ ] 16.2 Write unit tests for error handler
  - Test rollback for each artifact type
  - Test partial rollback scenarios
  - Test error reporting
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 17. Implement logger
  - Create `logger.ts` with structured logging
  - Implement console output with colors and formatting
  - Implement file logging with timestamps
  - Add log levels (debug, info, warn, error)
  - Implement step tracking and progress display
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 17.1 Write unit tests for logger
  - Test console output
  - Test file logging
  - Test log levels
  - Test step tracking
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 18. Implement main release CLI
  - Create `release.ts` as main orchestrator
  - Parse command-line arguments with Commander.ts
  - Load package configuration
  - Execute release pipeline steps in order
  - Handle errors and trigger rollback if needed
  - Generate release summary report
  - Support interactive and non-interactive modes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 18.1 Write property test for dry-run
  - **Property 4: Dry-run produces no side effects**
  - **Validates: Requirements 1.5**

- [ ] 18.2 Write property test for package isolation
  - **Property 6: Package-specific configuration isolation**
  - **Validates: Requirements 13.1, 13.2, 13.5**

- [ ] 18.3 Write integration tests for release CLI
  - Test full release workflow (dry-run)
  - Test error handling and rollback
  - Test interactive mode
  - Test non-interactive mode
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 19. Create package configuration files
  - Create `release-config/debugger.tson` with all debugger settings
  - Create `release-config/screenshot.tson` with all screenshot settings
  - Include file sync patterns for each package
  - Include build commands and test commands
  - Include artifact names and registry URLs
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 20. Add release notes validation
  - Implement release notes display for review
  - Add interactive editing support
  - Add validation for empty release notes
  - Implement approval workflow
  - Support non-interactive mode with auto-approval
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 20.1 Write unit tests for release notes validation
  - Test display and review
  - Test editing
  - Test validation
  - Test approval workflow
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 21. Update existing sync-versions script
  - Ensure sync-versions.ts is compatible with new system
  - Add better error reporting
  - Add verification output
  - Ensure it can be called programmatically
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 22. Create documentation
  - Write README for release automation system
  - Document all CLI commands and options
  - Create troubleshooting guide
  - Document configuration file format
  - Add examples for common scenarios
  - _Requirements: 1.1, 1.2_

- [ ] 23. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Create GitHub Actions workflow
  - Create workflow for automated releases on tag push
  - Add workflow for Docker image building
  - Add workflow for binary building
  - Configure secrets for credentials
  - _Requirements: 5.4_

- [ ] 24.1 Test GitHub Actions workflows
  - Test release workflow
  - Test Docker workflow
  - Test binary workflow
  - _Requirements: 5.4_
