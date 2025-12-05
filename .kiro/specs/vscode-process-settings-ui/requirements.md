# Requirements Document

## Introduction

The MCP Process Manager VS Code extension currently exposes only 6 basic settings (serverPath, configPath, autoStart, refreshInterval, showResourceUsage, logLevel), requiring users to manually edit JSON configuration files to access the 50+ advanced security and process management settings available in the underlying MCP Process Server. This creates a poor user experience and makes the powerful security features difficult to discover and configure. This feature will create a comprehensive settings UI that exposes all configuration options through VS Code's native settings interface, organized into logical categories with proper validation, descriptions, and defaults.

## Glossary

- **Extension**: The VS Code extension (vscode-mcp-acs-process) that provides the UI
- **MCP Process Server**: The underlying Node.js server that manages processes
- **SecurityConfig**: The TypeScript interface defining all security configuration options
- **VS Code Settings**: The native VS Code configuration system accessed via Settings UI or settings.json
- **Configuration Schema**: The JSON schema that defines available settings in package.json
- **Settings Category**: A logical grouping of related settings (e.g., "Executable Control", "Resource Limits")

## Requirements

### Requirement 1

**User Story:** As a developer, I want to configure all MCP Process Server settings through VS Code's settings UI, so that I can easily discover and modify configuration options without manually editing JSON files.

#### Acceptance Criteria

1. WHEN a user opens VS Code settings and searches for "mcp-process" THEN the system SHALL display all 50+ configuration options organized into logical categories
2. WHEN a user modifies a setting in the VS Code settings UI THEN the system SHALL validate the input and update the configuration file immediately
3. WHEN a user hovers over a setting THEN the system SHALL display a detailed description explaining the setting's purpose and valid values
4. WHEN a user sets an invalid value THEN the system SHALL display an error message and prevent the invalid value from being saved
5. WHEN a user wants to reset a setting THEN the system SHALL provide a way to restore the default value

### Requirement 2

**User Story:** As a security administrator, I want to configure executable allowlists and security boundaries through the settings UI, so that I can enforce security policies without editing JSON configuration files.

#### Acceptance Criteria

1. WHEN a user configures allowedExecutables THEN the system SHALL provide an array input with validation for executable paths
2. WHEN a user enables blockSetuidExecutables THEN the system SHALL provide a boolean toggle with security implications explained
3. WHEN a user enables blockShellInterpreters THEN the system SHALL provide a boolean toggle with a warning about potential compatibility issues
4. WHEN a user adds additionalBlockedExecutables THEN the system SHALL validate that entries are not in the allowed list
5. WHEN a user configures executable patterns THEN the system SHALL support glob patterns and provide pattern validation

### Requirement 3

**User Story:** As a developer, I want to configure resource limits through the settings UI, so that I can control CPU, memory, and process limits without understanding the JSON schema.

#### Acceptance Criteria

1. WHEN a user sets maxCpuPercent THEN the system SHALL validate the value is between 0 and 100
2. WHEN a user sets maxMemoryMB THEN the system SHALL validate the value is a positive integer
3. WHEN a user sets maxFileDescriptors THEN the system SHALL validate the value is within system limits
4. WHEN a user sets maxCpuTime THEN the system SHALL provide the value in seconds with clear units
5. WHEN a user sets maxProcesses THEN the system SHALL validate the value is a positive integer

### Requirement 4

**User Story:** As a developer, I want to configure process limits and rate limiting through the settings UI, so that I can prevent resource exhaustion and abuse.

#### Acceptance Criteria

1. WHEN a user sets maxConcurrentProcesses THEN the system SHALL validate the value is a positive integer
2. WHEN a user sets maxProcessLifetime THEN the system SHALL provide the value in seconds with clear units
3. WHEN a user sets maxLaunchesPerMinute THEN the system SHALL validate the value is a positive integer
4. WHEN a user sets maxLaunchesPerHour THEN the system SHALL validate the value is a positive integer
5. WHEN a user sets rateLimitCooldownSeconds THEN the system SHALL validate the value is a positive integer

### Requirement 5

**User Story:** As a developer, I want to configure I/O control settings through the settings UI, so that I can control stdin/stdout behavior and buffer sizes.

#### Acceptance Criteria

1. WHEN a user toggles allowStdinInput THEN the system SHALL provide a boolean toggle with implications explained
2. WHEN a user toggles allowOutputCapture THEN the system SHALL provide a boolean toggle with performance implications
3. WHEN a user sets maxOutputBufferSize THEN the system SHALL validate the value is a positive integer in bytes
4. WHEN a user toggles blockBinaryStdin THEN the system SHALL provide a boolean toggle with security implications
5. WHEN a user modifies I/O settings THEN the system SHALL warn if changes require server restart

### Requirement 6

**User Story:** As a security administrator, I want to configure advanced security features through the settings UI, so that I can enable isolation, namespaces, and mandatory access control.

#### Acceptance Criteria

1. WHEN a user enables enableChroot THEN the system SHALL require chrootDirectory to be set
2. WHEN a user enables enableNamespaces THEN the system SHALL provide checkboxes for individual namespace types
3. WHEN a user enables enableSeccomp THEN the system SHALL provide a dropdown for seccomp profiles
4. WHEN a user enables blockNetworkAccess THEN the system SHALL provide array inputs for allowed/blocked destinations
5. WHEN a user enables platform-specific features THEN the system SHALL display warnings if the feature is not available on the current platform

### Requirement 7

**User Story:** As a developer, I want to configure audit logging and monitoring through the settings UI, so that I can track process operations and security violations.

#### Acceptance Criteria

1. WHEN a user toggles enableAuditLog THEN the system SHALL provide a boolean toggle with storage implications
2. WHEN a user sets auditLogPath THEN the system SHALL validate the path is writable
3. WHEN a user sets auditLogLevel THEN the system SHALL provide a dropdown with levels (error, warn, info, debug)
4. WHEN a user enables enableSecurityAlerts THEN the system SHALL require securityAlertWebhook to be set
5. WHEN a user sets securityAlertWebhook THEN the system SHALL validate the URL format

### Requirement 8

**User Story:** As a developer, I want settings to be organized into logical categories, so that I can easily find related configuration options.

#### Acceptance Criteria

1. WHEN a user views MCP Process settings THEN the system SHALL organize settings into categories (Executable Control, Resource Limits, Process Limits, I/O Control, Security, Audit)
2. WHEN a user searches for a setting THEN the system SHALL match against setting names, descriptions, and category names
3. WHEN a user expands a category THEN the system SHALL show all settings in that category with their current values
4. WHEN a user views a category THEN the system SHALL display a category description explaining the purpose of settings in that category
5. WHEN a user navigates settings THEN the system SHALL maintain category expansion state across sessions

### Requirement 9

**User Story:** As a developer, I want settings changes to be applied immediately or with clear restart instructions, so that I understand when changes take effect.

#### Acceptance Criteria

1. WHEN a user modifies a setting that requires server restart THEN the system SHALL display a notification with a restart button
2. WHEN a user modifies a setting that takes effect immediately THEN the system SHALL apply the change without notification
3. WHEN a user clicks the restart button THEN the system SHALL restart the MCP Process Server with the new configuration
4. WHEN a user has pending changes requiring restart THEN the system SHALL display a status bar indicator
5. WHEN a user restarts VS Code THEN the system SHALL apply all pending configuration changes

### Requirement 10

**User Story:** As a developer, I want to import and export configuration profiles, so that I can share settings across projects and teams.

#### Acceptance Criteria

1. WHEN a user clicks "Export Configuration" THEN the system SHALL generate a JSON file with all current settings
2. WHEN a user clicks "Import Configuration" THEN the system SHALL validate and apply settings from a JSON file
3. WHEN a user imports invalid configuration THEN the system SHALL display validation errors and prevent import
4. WHEN a user exports configuration THEN the system SHALL include metadata (version, timestamp, platform)
5. WHEN a user imports configuration from a different platform THEN the system SHALL warn about platform-specific settings

### Requirement 11

**User Story:** As a developer, I want to see setting recommendations based on my use case, so that I can quickly configure the extension for common scenarios.

#### Acceptance Criteria

1. WHEN a user opens settings for the first time THEN the system SHALL offer preset configurations (Development, Production, High Security)
2. WHEN a user selects a preset THEN the system SHALL apply recommended settings for that use case
3. WHEN a user applies a preset THEN the system SHALL show a diff of changes before applying
4. WHEN a user has custom settings THEN the system SHALL warn before overwriting with a preset
5. WHEN a user views a preset THEN the system SHALL display a description of the use case and security implications

### Requirement 12

**User Story:** As a developer, I want to validate my configuration before applying it, so that I can catch errors and conflicts before they cause issues.

#### Acceptance Criteria

1. WHEN a user clicks "Validate Configuration" THEN the system SHALL check all settings for validity and conflicts
2. WHEN validation finds errors THEN the system SHALL display a list of errors with suggestions for fixes
3. WHEN validation finds warnings THEN the system SHALL display warnings with explanations
4. WHEN validation succeeds THEN the system SHALL display a success message with a summary of the configuration
5. WHEN a user has validation errors THEN the system SHALL prevent server restart until errors are resolved
