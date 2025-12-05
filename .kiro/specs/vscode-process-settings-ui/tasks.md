# Implementation Plan

- [x] 1. Extend package.json with comprehensive settings schema

  - Add all 50+ settings to contributes.configuration in package.json
  - Organize settings into 8 categories using dot notation
  - Define types, defaults, descriptions, and validation rules for each setting
  - Add markdown formatting to descriptions for better readability
  - Include security implications and platform compatibility notes
  - _Requirements: 1.1, 1.3, 1.4, 8.1, 8.4_

- [x] 2. Create Settings Manager module
- [x] 2.1 Implement core Settings Manager class

  - Create SettingsManager class with configuration change listener
  - Implement getConfiguration() to read VS Code settings
  - Implement generateServerConfig() to convert VS Code settings to SecurityConfig
  - Add setting name mapping between VS Code format and server format
  - _Requirements: 1.2, 9.2_

- [x] 2.2 Write property test for configuration generation

  - **Property 2: Configuration synchronization**
  - **Validates: Requirements 1.2**

- [x] 2.3 Implement validation engine

  - Create ValidationResult, ValidationError, and ValidationWarning interfaces
  - Implement validateConfiguration() with all validation rules
  - Add type validation, range validation, enum validation
  - Add dependency validation (e.g., chrootDirectory requires enableChroot)
  - Add platform-specific validation
  - _Requirements: 1.4, 6.1, 6.5, 12.1, 12.2_

- [x] 2.4 Write property test for validation completeness

  - **Property 5: Validation error completeness**
  - **Validates: Requirements 12.2**

- [x] 2.5 Write property test for dependency validation

  - **Property 7: Dependency validation**
  - **Validates: Requirements 6.1**

- [-] 3. Implement configuration presets
- [x] 3.1 Create preset definitions

  - Define Development preset with permissive settings
  - Define Production preset with balanced settings
  - Define High Security preset with strict settings
  - Add preset metadata (name, description, security level)
  - _Requirements: 11.1, 11.5_

- [-] 3.2 Implement preset application logic

  - Create applyPreset() method in Settings Manager
  - Generate diff showing changes before applying
  - Implement confirmation dialog with diff display
  - Handle preset application with existing custom settings
  - _Requirements: 11.2, 11.3, 11.4_

- [ ] 3.3 Write property test for preset idempotence

  - **Property 3: Preset application idempotence**
  - **Validates: Requirements 11.2**

- [ ] 4. Implement import/export functionality
- [ ] 4.1 Create export functionality

  - Implement exportConfiguration() to generate JSON
  - Include all current settings in export
  - Add metadata (version, timestamp, platform)
  - Validate exported JSON is well-formed
  - _Requirements: 10.1, 10.4_

- [ ] 4.2 Create import functionality

  - Implement importConfiguration() to parse and validate JSON
  - Validate imported settings against schema
  - Handle platform-specific settings with warnings
  - Apply imported settings to VS Code configuration
  - _Requirements: 10.2, 10.3, 10.5_

- [ ] 4.3 Write property test for import/export round trip

  - **Property 4: Import/export round trip**
  - **Validates: Requirements 10.1, 10.2**

- [ ] 5. Implement server configuration passing
- [ ] 5.1 Update server launcher to accept configuration via IPC

  - Modify server startup to accept configuration object
  - Pass generated configuration from Settings Manager to server
  - Implement fallback to config file if useConfigFile is true
  - Add configuration validation on server side
  - _Requirements: 1.2, 9.2_

- [ ] 5.2 Implement configuration change handling

  - Listen for VS Code configuration change events
  - Determine which settings require server restart
  - Show notification with restart button for restart-required changes
  - Apply changes immediately for settings that don't require restart
  - Add status bar indicator for pending restart
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 6. Add VS Code commands for configuration management
- [ ] 6.1 Implement preset selection command

  - Create "MCP Process: Apply Configuration Preset" command
  - Show quick pick with preset options
  - Display preset description and security level
  - Show diff before applying
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 6.2 Implement import/export commands

  - Create "MCP Process: Export Configuration" command
  - Create "MCP Process: Import Configuration" command
  - Add file picker for import/export
  - Show validation results after import
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 6.3 Implement validation command

  - Create "MCP Process: Validate Configuration" command
  - Run full validation on current settings
  - Display validation results in output panel
  - Show errors, warnings, and success message
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 7. Update extension activation and initialization
- [ ] 7.1 Initialize Settings Manager on activation

  - Create Settings Manager instance on extension activation
  - Register configuration change listener
  - Generate initial server configuration
  - Start server with configuration if autoStart is true
  - _Requirements: 1.2, 9.2_

- [ ] 7.2 Add first-run experience

  - Detect first run (no settings configured)
  - Show welcome notification with preset options
  - Offer to apply recommended preset
  - Guide user to settings UI
  - _Requirements: 11.1_

- [ ] 8. Implement platform-specific setting handling
- [ ] 8.1 Add platform detection

  - Detect current platform (Windows, macOS, Linux)
  - Create platform capability detection (namespaces, chroot, etc.)
  - Add platform metadata to exports
  - _Requirements: 6.5, 10.4, 10.5_

- [ ] 8.2 Filter platform-specific settings

  - Hide unsupported settings in VS Code settings UI (via when clauses)
  - Show warnings when importing cross-platform configs
  - Validate platform-specific settings only on supported platforms
  - _Requirements: 6.5, 10.5_

- [ ] 8.3 Write property test for platform filtering

  - **Property 6: Platform-specific setting filtering**
  - **Validates: Requirements 6.5**

- [ ] 9. Add comprehensive error handling
- [ ] 9.1 Implement validation error handling

  - Show error notifications for invalid settings
  - Display helpful error messages with suggestions
  - Prevent invalid values from being saved
  - _Requirements: 1.4, 12.2_

- [ ] 9.2 Implement file operation error handling

  - Handle config file not found (offer to create)
  - Handle JSON parse errors (show line number)
  - Handle permission errors (suggest fixes)
  - Handle write errors (suggest alternative location)
  - _Requirements: Error Handling section_

- [ ] 9.3 Implement server communication error handling

  - Handle server not running (show start button)
  - Handle connection timeout (suggest checking logs)
  - Handle invalid response (suggest restart)
  - Handle version mismatch (show warning)
  - _Requirements: Error Handling section_

- [ ] 10. Create comprehensive test suite
- [ ] 10.1 Write unit tests for Settings Manager

  - Test getConfiguration() for all setting categories
  - Test generateServerConfig() produces valid SecurityConfig
  - Test validateConfiguration() for all validation rules
  - Test setting name mapping is correct
  - _Requirements: All requirements, Testing Strategy_

- [ ] 10.2 Write unit tests for validation engine

  - Test type validation for each setting type
  - Test range validation (min, max, enum)
  - Test pattern validation (regex)
  - Test dependency validation
  - Test platform-specific validation
  - _Requirements: 1.4, 6.1, 6.5, 12.1, 12.2_

- [ ] 10.3 Write unit tests for presets

  - Test each preset applies correct values
  - Test preset doesn't modify unrelated settings
  - Test preset validation
  - Test diff generation
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 10.4 Write unit tests for import/export

  - Test export includes all settings
  - Test export includes metadata
  - Test import validates settings
  - Test import handles invalid JSON
  - Test import handles platform differences
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 10.5 Write integration tests for settings flow

  - Test modifying settings in VS Code updates server config
  - Test applying preset updates all settings
  - Test importing configuration applies settings
  - Test exporting then importing produces same config
  - Test validation flow with invalid settings
  - Test restart notification for restart-required changes
  - _Requirements: All requirements, Testing Strategy_

- [ ] 10.6 Write property test for settings validation consistency

  - **Property 1: Settings validation consistency**
  - **Validates: Requirements 1.4**

- [ ] 10.7 Write property test for default value consistency

  - **Property 8: Default value consistency**
  - **Validates: Requirements 1.1**

- [ ] 11. Update documentation
- [ ] 11.1 Update README with settings documentation

  - Document all 8 setting categories
  - Add examples for common configurations
  - Document preset options
  - Add troubleshooting for settings issues
  - _Requirements: 1.1, 1.3, 8.1_

- [ ] 11.2 Create settings migration guide

  - Document migration from config file to VS Code settings
  - Provide examples of equivalent configurations
  - Explain when to use config file vs VS Code settings
  - _Requirements: 1.1_

- [ ] 11.3 Add inline documentation to package.json

  - Ensure all setting descriptions are clear and helpful
  - Add security implications to relevant settings
  - Add platform compatibility notes
  - Include examples in descriptions
  - _Requirements: 1.3, 6.5_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
