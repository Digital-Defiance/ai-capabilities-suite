# Design Document

## Overview

This design implements a comprehensive settings UI for the MCP Process Manager VS Code extension, exposing all 50+ configuration options from the underlying MCP Process Server through VS Code's native settings interface. **VS Code settings become the primary configuration method**, eliminating the need for users to manually create or edit JSON configuration files.

The extension will automatically generate the server configuration from VS Code settings, making the external config file optional (only needed for advanced use cases or when running the server standalone). Users configure everything through the familiar VS Code settings UI, and the extension handles translating those settings to the server's configuration format.

The design follows VS Code's settings best practices by using the native settings UI rather than custom webviews, ensuring consistency with other extensions and leveraging VS Code's built-in validation, search, and synchronization features.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Settings UI                       │
│  (PRIMARY CONFIG SOURCE - settings.json / Settings GUI)      │
│  User configures everything here - no manual JSON editing    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Read/Write settings
                     │
┌────────────────────▼────────────────────────────────────────┐
│              package.json Configuration Schema               │
│  (Defines all settings with types, defaults, validation)    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Settings change events
                     │
┌────────────────────▼────────────────────────────────────────┐
│            Settings Manager (TypeScript)                     │
│  - Listens to configuration changes                         │
│  - Validates settings                                        │
│  - Auto-generates server configuration in memory            │
│  - Passes config directly to server via IPC                 │
│  - Handles presets and import/export (optional)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Pass configuration via IPC/stdin
                     │ (Optional: write to temp file)
                     │
┌────────────────────▼────────────────────────────────────────┐
│              MCP Process Server                              │
│  - Receives configuration from extension                     │
│  - Falls back to config file if running standalone          │
│  - Manages processes with security                          │
└─────────────────────────────────────────────────────────────┘

Optional (for advanced users or standalone server):
┌─────────────────────────────────────────────────────────────┐
│         MCP Process Server Configuration File                │
│              (mcp-process-config.json)                       │
│  Only needed for standalone server or advanced overrides    │
└─────────────────────────────────────────────────────────────┘
```

### Configuration Priority

1. **VS Code Settings** (Primary): All settings configured through VS Code UI
2. **Config File** (Fallback): Only used if:
   - Server is running standalone (not launched by extension)
   - User explicitly sets `mcp-process.server.useConfigFile: true`
   - Advanced users want to override specific settings

This approach means users never need to create or edit a config file when using the extension.

### Settings Organization

Settings will be organized into the following categories using VS Code's dot notation:

1. **mcp-process.server** - Server connection settings
2. **mcp-process.executable** - Executable control settings
3. **mcp-process.resources** - Resource limit settings
4. **mcp-process.process** - Process limit settings
5. **mcp-process.io** - I/O control settings
6. **mcp-process.security** - Advanced security settings
7. **mcp-process.audit** - Audit and monitoring settings
8. **mcp-process.ui** - UI preferences

## Components and Interfaces

### 1. Settings Schema (package.json)

The `package.json` file will be extended with comprehensive configuration properties. Each setting includes:

- Type definition (string, number, boolean, array, object)
- Default value
- Description with markdown formatting
- Validation rules (min, max, enum, pattern)
- Deprecation notices if applicable
- Scope (application, window, resource)

### 2. Settings Manager

A new TypeScript module that handles settings management:

```typescript
interface SettingsManager {
  // Listen to configuration changes
  onConfigurationChanged(
    callback: (changes: ConfigurationChange) => void
  ): void;

  // Get current configuration
  getConfiguration(): SecurityConfig;

  // Validate configuration
  validateConfiguration(config: Partial<SecurityConfig>): ValidationResult;

  // Apply preset configuration
  applyPreset(preset: ConfigurationPreset): Promise<void>;

  // Export configuration
  exportConfiguration(): Promise<string>;

  // Import configuration
  importConfiguration(json: string): Promise<void>;

  // Generate server configuration (in-memory, passed to server via IPC)
  generateServerConfig(): SecurityConfig;

  // Optional: Write configuration to file (only if useConfigFile is true)
  writeConfigFile(): Promise<void>;
}
```

### 3. Configuration Presets

Predefined configuration profiles for common use cases:

```typescript
interface ConfigurationPreset {
  name: string;
  description: string;
  securityLevel: "low" | "medium" | "high";
  config: Partial<SecurityConfig>;
}

const PRESETS: ConfigurationPreset[] = [
  {
    name: "Development",
    description: "Permissive settings for local development",
    securityLevel: "low",
    config: {
      /* ... */
    },
  },
  {
    name: "Production",
    description: "Balanced settings for production use",
    securityLevel: "medium",
    config: {
      /* ... */
    },
  },
  {
    name: "High Security",
    description: "Strict settings for maximum security",
    securityLevel: "high",
    config: {
      /* ... */
    },
  },
];
```

### 4. Validation Engine

Validates settings for correctness and conflicts:

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  setting: string;
  message: string;
  suggestion?: string;
}

interface ValidationWarning {
  setting: string;
  message: string;
  severity: "low" | "medium" | "high";
}
```

## Data Models

### Settings Categories

#### 1. Server Settings (mcp-process.server.\*)

- `serverPath`: string - Path to MCP process server executable (optional, uses bundled server if empty)
- `useConfigFile`: boolean - Use external config file instead of VS Code settings (default: false)
- `configPath`: string - Path to server configuration file (only used if useConfigFile is true)
- `autoStart`: boolean - Auto-start server on VS Code startup (default: true)
- `logLevel`: enum - Log level (debug, info, warn, error) (default: info)

#### 2. Executable Control Settings (mcp-process.executable.\*)

- `allowedExecutables`: string[] - List of allowed executables
- `blockSetuidExecutables`: boolean - Block setuid/setgid executables
- `blockShellInterpreters`: boolean - Block shell interpreters
- `additionalBlockedExecutables`: string[] - Additional blocked executables
- `maxArgumentCount`: number - Maximum number of arguments
- `maxArgumentLength`: number - Maximum length of any argument
- `blockedArgumentPatterns`: string[] - Regex patterns to block in arguments

#### 3. Resource Limit Settings (mcp-process.resources.\*)

- `defaultMaxCpuPercent`: number - Default max CPU usage (0-100)
- `defaultMaxMemoryMB`: number - Default max memory in MB
- `defaultMaxFileDescriptors`: number - Default max file descriptors
- `defaultMaxCpuTime`: number - Default max CPU time in seconds
- `defaultMaxProcesses`: number - Default max processes in tree
- `maximumMaxCpuPercent`: number - Maximum allowed CPU limit
- `maximumMaxMemoryMB`: number - Maximum allowed memory limit
- `strictResourceEnforcement`: boolean - Terminate immediately on violation

#### 4. Process Limit Settings (mcp-process.process.\*)

- `maxConcurrentProcesses`: number - Max concurrent processes total
- `maxConcurrentProcessesPerAgent`: number - Max per agent
- `maxProcessLifetime`: number - Max lifetime in seconds
- `maxTotalProcesses`: number - Max total processes (server lifetime)
- `maxLaunchesPerMinute`: number - Max launches per minute per agent
- `maxLaunchesPerHour`: number - Max launches per hour per agent
- `rateLimitCooldownSeconds`: number - Cooldown after rate limit

#### 5. I/O Control Settings (mcp-process.io.\*)

- `allowStdinInput`: boolean - Allow stdin input
- `allowOutputCapture`: boolean - Allow stdout/stderr capture
- `maxOutputBufferSize`: number - Max buffer size in bytes
- `blockBinaryStdin`: boolean - Block binary data in stdin

#### 6. Security Settings (mcp-process.security.\*)

- `allowProcessTermination`: boolean - Allow process termination
- `allowGroupTermination`: boolean - Allow group termination
- `allowForcedTermination`: boolean - Allow SIGKILL
- `requireTerminationConfirmation`: boolean - Require confirmation
- `requireConfirmation`: boolean - Require confirmation for launches
- `requireConfirmationFor`: string[] - Executables requiring confirmation
- `autoApproveAfterCount`: number - Auto-approve after N launches
- `allowedWorkingDirectories`: string[] - Allowed working directories
- `blockedWorkingDirectories`: string[] - Blocked working directories
- `additionalBlockedEnvVars`: string[] - Additional blocked env vars
- `allowedEnvVars`: string[] - Allowed env vars (whitelist mode)
- `maxEnvVarCount`: number - Max environment variables

#### 7. Advanced Security Settings (mcp-process.security.advanced.\*)

- `enableChroot`: boolean - Enable chroot jail (Unix/Linux)
- `chrootDirectory`: string - Chroot directory path
- `enableNamespaces`: boolean - Enable Linux namespaces
- `namespacesPid`: boolean - Enable PID namespace
- `namespacesNetwork`: boolean - Enable network namespace
- `namespacesMount`: boolean - Enable mount namespace
- `namespacesUts`: boolean - Enable UTS namespace
- `namespacesIpc`: boolean - Enable IPC namespace
- `namespacesUser`: boolean - Enable user namespace
- `enableSeccomp`: boolean - Enable seccomp filtering
- `seccompProfile`: enum - Seccomp profile (strict, moderate, permissive)
- `blockNetworkAccess`: boolean - Block network access
- `allowedNetworkDestinations`: string[] - Allowed destinations
- `blockedNetworkDestinations`: string[] - Blocked destinations
- `enableMAC`: boolean - Enable mandatory access control
- `macProfile`: string - SELinux context or AppArmor profile
- `dropCapabilities`: string[] - Linux capabilities to drop
- `readOnlyFilesystem`: boolean - Read-only filesystem
- `tmpfsSize`: number - Temporary filesystem size in MB

#### 8. Audit Settings (mcp-process.audit.\*)

- `enableAuditLog`: boolean - Enable audit logging
- `auditLogPath`: string - Audit log file path
- `auditLogLevel`: enum - Log level (error, warn, info, debug)
- `enableSecurityAlerts`: boolean - Enable security alerts
- `securityAlertWebhook`: string - Alert webhook URL
- `allowedTimeWindows`: string[] - Allowed time windows (cron-like)
- `blockedTimeWindows`: string[] - Blocked time windows

#### 9. UI Settings (mcp-process.ui.\*)

- `refreshInterval`: number - Process list refresh interval (ms)
- `showResourceUsage`: boolean - Show CPU/memory in process list
- `showSecurityWarnings`: boolean - Show security warnings in UI
- `confirmDangerousOperations`: boolean - Confirm dangerous operations

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Settings validation consistency

_For any_ setting value provided by the user, validation in the VS Code settings UI should produce the same result as validation in the Settings Manager
**Validates: Requirements 1.4**

### Property 2: Configuration synchronization

_For any_ change to VS Code settings, the generated server configuration file should contain equivalent values that produce the same security behavior
**Validates: Requirements 1.2**

### Property 3: Preset application idempotence

_For any_ configuration preset, applying it twice should result in the same configuration state as applying it once
**Validates: Requirements 11.2**

### Property 4: Import/export round trip

_For any_ valid configuration, exporting then importing should produce an equivalent configuration
**Validates: Requirements 10.1, 10.2**

### Property 5: Validation error completeness

_For any_ invalid configuration, the validation engine should report all errors, not just the first error encountered
**Validates: Requirements 12.2**

### Property 6: Platform-specific setting filtering

_For any_ platform-specific setting (e.g., Linux namespaces), the setting should only be visible and editable on platforms where it is supported
**Validates: Requirements 6.5**

### Property 7: Dependency validation

_For any_ setting that depends on another setting (e.g., chrootDirectory requires enableChroot), validation should enforce the dependency relationship
**Validates: Requirements 6.1**

### Property 8: Default value consistency

_For any_ setting, the default value in package.json should match the default value in the MCP Process Server
**Validates: Requirements 1.1**

## Error Handling

### Validation Errors

1. **Invalid Value Type**: Display error with expected type and example
2. **Out of Range**: Display error with valid range
3. **Invalid Pattern**: Display error with pattern requirements
4. **Dependency Violation**: Display error explaining required dependency
5. **Platform Incompatibility**: Display warning about platform-specific features

### Configuration File Errors

1. **File Not Found**: Offer to create default configuration
2. **Parse Error**: Display JSON parse error with line number
3. **Permission Error**: Display error and suggest permission fix
4. **Write Error**: Display error and suggest alternative location

### Server Communication Errors

1. **Server Not Running**: Display notification with start button
2. **Connection Timeout**: Display error and suggest checking server logs
3. **Invalid Response**: Display error and suggest server restart
4. **Version Mismatch**: Display warning about incompatible versions

## Testing Strategy

### Test Coverage Requirements

**All settings must be tested.** The following coverage requirements apply:

1. **100% Setting Coverage**: Every setting defined in package.json must have:

   - At least one unit test for validation
   - At least one integration test for the complete flow
   - Manual test checklist entry

2. **Validation Coverage**: Every validation rule must be tested:

   - Type validation (string, number, boolean, array, object)
   - Range validation (min, max)
   - Enum validation (allowed values)
   - Pattern validation (regex)
   - Dependency validation (required settings)

3. **Category Coverage**: Each of the 8 setting categories must have:

   - Unit tests for all settings in the category
   - Integration test for category-level operations
   - Manual test for UI organization

4. **Test Documentation**: Each test must document:
   - Which setting(s) it tests
   - Which requirement(s) it validates
   - Expected behavior
   - Edge cases covered

### Unit Testing

Unit tests will verify individual components in isolation. **Every setting added must have corresponding unit tests.**

1. **Settings Schema Validation**:

   - Test that package.json schema correctly validates all setting types
   - Test each setting's type validation (string, number, boolean, array, object)
   - Test each setting's range validation (min, max, enum values)
   - Test each setting's pattern validation (regex patterns)
   - Test each setting's default value is valid

2. **Settings Manager**:

   - Test configuration generation for each setting
   - Test validation logic for each setting
   - Test synchronization to server config for each setting
   - Test that all settings are included in generated config

3. **Preset Application**:

   - Test that presets apply correct values for all included settings
   - Test that presets don't modify settings not in the preset
   - Test preset validation before application

4. **Import/Export**:

   - Test JSON serialization includes all settings
   - Test JSON deserialization handles all settings
   - Test import validation for each setting type
   - Test export includes metadata

5. **Validation Engine**:
   - Test error detection for each setting's validation rules
   - Test error reporting includes setting name and helpful message
   - Test warning generation for risky configurations
   - Test dependency validation between related settings

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using the `fast-check` library for TypeScript. Each test will run a minimum of 100 iterations with randomly generated inputs.

1. **Property 1 Test**: Generate random setting values, validate in both UI and Settings Manager, verify results match
2. **Property 2 Test**: Generate random VS Code settings, convert to server config, verify equivalent behavior
3. **Property 3 Test**: Generate random presets, apply twice, verify idempotence
4. **Property 4 Test**: Generate random configurations, export then import, verify equivalence
5. **Property 5 Test**: Generate invalid configurations, verify all errors reported
6. **Property 6 Test**: Generate platform-specific settings, verify filtering on different platforms
7. **Property 7 Test**: Generate dependent settings, verify dependency validation
8. **Property 8 Test**: Compare all defaults between package.json and server, verify consistency

### Integration Testing

Integration tests will verify component interactions. **Every setting must be tested in at least one integration test.**

1. **Settings Change Flow**:

   - Test modifying each setting category in VS Code
   - Verify server config file is updated with correct values
   - Verify server receives configuration changes
   - Test that changes requiring restart trigger notifications

2. **Preset Application Flow**:

   - Test applying each preset (Development, Production, High Security)
   - Verify all settings in preset are applied correctly
   - Verify diff display shows all changes
   - Test canceling preset application

3. **Import Flow**:

   - Test importing valid configuration with all settings
   - Test importing partial configuration (subset of settings)
   - Test importing configuration with invalid values
   - Verify settings are applied to VS Code configuration

4. **Export Flow**:

   - Test exporting configuration includes all settings
   - Test exported file is valid JSON
   - Test exported file includes metadata
   - Test re-importing exported file produces same configuration

5. **Validation Flow**:

   - Test entering invalid values for each setting type
   - Verify appropriate error messages are displayed
   - Test that invalid values are rejected
   - Test that valid values are accepted

6. **End-to-End Setting Tests**:
   - For each setting category, test the complete flow:
     - Modify setting in UI → Verify in config file → Verify server behavior
   - Test at least 3 settings from each category in E2E tests

### Manual Testing

Manual testing will verify user experience. **A manual test checklist must be created covering all settings.**

1. **Settings UI Navigation**:

   - Verify all 8 categories are present and organized logically
   - Verify search finds settings by name, description, and category
   - Verify category expansion state persists
   - Test navigation with keyboard shortcuts

2. **Setting Descriptions**:

   - Review all 50+ setting descriptions for clarity
   - Verify descriptions explain purpose and valid values
   - Verify descriptions include security implications where relevant
   - Test hover tooltips display correctly

3. **Validation Messages**:

   - Test invalid input for each setting type
   - Verify error messages are clear and actionable
   - Verify error messages include suggestions for fixes
   - Test that validation happens in real-time

4. **Preset Selection**:

   - Test applying each of the 3 presets
   - Verify diff display shows all changes accurately
   - Verify preset descriptions explain use case
   - Test canceling and confirming preset application

5. **Platform Compatibility**:

   - Test on Windows, macOS, and Linux
   - Verify platform-specific settings are hidden on unsupported platforms
   - Verify warnings appear for platform-specific features
   - Test that exported configs include platform metadata

6. **Setting-Specific Tests**:
   - Create a checklist of all 50+ settings
   - Manually test each setting can be modified
   - Verify each setting's validation works correctly
   - Verify each setting's change is reflected in server config
