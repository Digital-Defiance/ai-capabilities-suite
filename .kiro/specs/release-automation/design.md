# Design Document

## Overview

The release automation system provides a unified command-line interface for releasing both MCP-DEBUGGER and MCP-SCREENSHOT packages. The system orchestrates the complete release lifecycle including version management, building, testing, publishing to multiple platforms, and verification. It is designed to be safe (with dry-run and rollback), transparent (with detailed logging), and flexible (supporting both interactive and automated workflows).

## Architecture

The system follows a pipeline architecture with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                     Release CLI                              │
│  (scripts/release.js - Entry point & orchestration)         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├──> Configuration Loader
                   │    (Load package-specific config)
                   │
                   ├──> Pre-flight Checker
                   │    (Git status, tests, builds, credentials)
                   │
                   ├──> Version Manager
                   │    (Sync versions across all files)
                   │
                   ├──> Build Pipeline
                   │    ├──> NPM Builder
                   │    ├──> Binary Builder (debugger only)
                   │    └──> VSCode Extension Builder
                   │
                   ├──> Publishing Pipeline
                   │    ├──> NPM Publisher
                   │    ├──> Docker Publisher (optional)
                   │    └──> VSCode Marketplace Publisher
                   │
                   ├──> Git Operations
                   │    ├──> Commit & Tag
                   │    └──> GitHub Release Creator
                   │
                   ├──> Verification Pipeline
                   │    (Verify all artifacts are accessible)
                   │
                   ├──> Changelog Generator
                   │    (Generate release notes from commits)
                   │
                   └──> Release Manifest Writer
                        (Track release metadata)
```

## Components and Interfaces

### 1. Release CLI (`scripts/release.js`)

Main entry point that orchestrates the release process.

**Interface:**
```bash
# Full release
node scripts/release.js <package> <version> [options]

# Set version only (no release)
node scripts/set-version.js <package> <version>

Arguments:
  package    Package to release: 'debugger' or 'screenshot'
  version    Version to release (semver format)

Options (release.js):
  --dry-run           Simulate release without publishing
  --skip-tests        Skip test execution (not recommended)
  --skip-build        Skip build step (not recommended)
  --docker            Include Docker image publishing
  --non-interactive   Run without prompts (use defaults)
  --skip-verify       Skip post-release verification
  --log-file <path>   Custom log file path
```

**Responsibilities:**
- Parse command-line arguments
- Load package configuration
- Execute release pipeline steps in order
- Handle errors and rollback if needed
- Generate release summary

### 2. Configuration Loader

Loads package-specific configuration from JSON files.

**Configuration Files:**
- `scripts/release-config/debugger.json`
- `scripts/release-config/screenshot.json`

**Configuration Schema:**
```typescript
interface ReleaseConfig {
  packageName: string;
  npmPackageName: string;
  vscodeExtensionName: string;
  dockerImageName: string;
  packageDir: string;
  vscodeExtensionDir: string;
  buildBinaries: boolean;
  binaryPlatforms?: string[];
  testCommand: string;
  buildCommand: string;
  filesToSync: VersionSyncFile[];
  githubReleaseTemplate: string;
}

interface VersionSyncFile {
  path: string;
  pattern: string | RegExp;
  replacement: string;
}
```

### 3. Pre-flight Checker

Validates the environment before starting the release.

**Checks:**
1. Git working directory is clean
2. Current branch is `main`
3. Local branch is up-to-date with remote
4. All tests pass
5. Build succeeds
6. NPM authentication is configured
7. VSCode marketplace token is available
8. Docker authentication is configured (if --docker flag)
9. GitHub token is available

**Interface:**
```typescript
interface PreflightChecker {
  runChecks(config: ReleaseConfig, options: ReleaseOptions): Promise<PreflightResult>;
}

interface PreflightResult {
  passed: boolean;
  checks: CheckResult[];
}

interface CheckResult {
  name: string;
  passed: boolean;
  message?: string;
}
```

### 4. Version Manager

Synchronizes version numbers across all files in the codebase.

**Interface:**
```typescript
interface VersionManager {
  syncVersions(config: ReleaseConfig, version: string): Promise<SyncResult>;
  verifyVersions(config: ReleaseConfig, version: string): Promise<boolean>;
}

interface SyncResult {
  filesUpdated: string[];
  errors: string[];
}
```

**Files to Sync (per package):**
- package.json files
- Source code version constants
- Docker files
- Documentation files
- VSCode extension manifests

### 5. Build Pipeline

Builds all artifacts for the release.

**NPM Builder:**
```typescript
interface NpmBuilder {
  build(config: ReleaseConfig): Promise<BuildResult>;
  test(config: ReleaseConfig): Promise<TestResult>;
}
```

**Binary Builder (debugger only):**
```typescript
interface BinaryBuilder {
  buildBinaries(config: ReleaseConfig, version: string): Promise<BinaryResult>;
  generateChecksums(binaries: string[]): Promise<Map<string, string>>;
}

interface BinaryResult {
  binaries: BinaryArtifact[];
  checksums: Map<string, string>;
}

interface BinaryArtifact {
  platform: string;
  path: string;
  size: number;
}
```

**VSCode Extension Builder:**
```typescript
interface VscodeBuilder {
  compile(extensionDir: string): Promise<void>;
  package(extensionDir: string): Promise<string>; // Returns .vsix path
}
```

### 6. Publishing Pipeline

Publishes artifacts to various platforms.

**NPM Publisher:**
```typescript
interface NpmPublisher {
  publish(config: ReleaseConfig, dryRun: boolean): Promise<PublishResult>;
  verify(packageName: string, version: string): Promise<boolean>;
}
```

**Docker Publisher:**
```typescript
interface DockerPublisher {
  build(config: ReleaseConfig, version: string): Promise<void>;
  tag(imageName: string, tags: string[]): Promise<void>;
  push(imageName: string, tags: string[]): Promise<void>;
  verify(imageName: string, version: string): Promise<boolean>;
}
```

**VSCode Marketplace Publisher:**
```typescript
interface VscodePublisher {
  publish(vsixPath: string, dryRun: boolean): Promise<PublishResult>;
  verify(extensionName: string, version: string): Promise<boolean>;
}
```

### 7. Git Operations

Handles Git commits, tags, and GitHub releases.

**Interface:**
```typescript
interface GitOperations {
  commitChanges(message: string): Promise<void>;
  createTag(tag: string): Promise<void>;
  pushToRemote(includeTags: boolean): Promise<void>;
  createGithubRelease(release: GithubReleaseData): Promise<string>; // Returns release URL
  attachAssets(releaseId: string, assets: string[]): Promise<void>;
}

interface GithubReleaseData {
  tag: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
}
```

### 8. Verification Pipeline

Verifies that all published artifacts are accessible.

**Interface:**
```typescript
interface VerificationPipeline {
  verifyAll(manifest: ReleaseManifest): Promise<VerificationResult>;
}

interface VerificationResult {
  npm: VerificationCheck;
  docker?: VerificationCheck;
  vscode: VerificationCheck;
  github: VerificationCheck;
}

interface VerificationCheck {
  passed: boolean;
  url: string;
  message?: string;
}
```

### 9. Changelog Generator

Generates release notes from Git commit history.

**Interface:**
```typescript
interface ChangelogGenerator {
  generate(fromTag: string, toTag: string): Promise<Changelog>;
  format(changelog: Changelog, template: string): string;
}

interface Changelog {
  features: CommitInfo[];
  fixes: CommitInfo[];
  breaking: CommitInfo[];
  other: CommitInfo[];
}

interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: Date;
  pr?: number;
}
```

### 10. Release Manifest Writer

Tracks release metadata and artifact information.

**Interface:**
```typescript
interface ManifestWriter {
  create(release: ReleaseInfo): Promise<string>; // Returns manifest path
  update(manifestPath: string, updates: Partial<ReleaseManifest>): Promise<void>;
}

interface ReleaseManifest {
  package: string;
  version: string;
  timestamp: string;
  artifacts: {
    npm?: ArtifactInfo;
    docker?: ArtifactInfo;
    vscode?: ArtifactInfo;
    binaries?: BinaryArtifact[];
    github?: ArtifactInfo;
  };
  verification: VerificationResult;
  changelog: string;
}

interface ArtifactInfo {
  published: boolean;
  url: string;
  checksum?: string;
}
```

## Data Models

### Release Options
```typescript
interface ReleaseOptions {
  package: 'debugger' | 'screenshot';
  version: string;
  dryRun: boolean;
  skipTests: boolean;
  skipBuild: boolean;
  includeDocker: boolean;
  nonInteractive: boolean;
  skipVerify: boolean;
  logFile?: string;
}
```

### Release State
```typescript
interface ReleaseState {
  options: ReleaseOptions;
  config: ReleaseConfig;
  startTime: Date;
  steps: StepResult[];
  manifest?: ReleaseManifest;
  rollbackNeeded: boolean;
}

interface StepResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  error?: Error;
  output?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Version consistency after sync
*For any* package and target version, after version synchronization completes, all configured files should contain the target version string.
**Validates: Requirements 2.5**

### Property 2: Pre-flight checks prevent invalid releases
*For any* release attempt, if any pre-flight check fails, then no artifacts should be published.
**Validates: Requirements 3.6**

### Property 3: Rollback restores pre-release state
*For any* failed release, executing rollback should result in no published artifacts and no Git tags.
**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

### Property 4: Dry-run produces no side effects
*For any* release executed with dry-run flag, no artifacts should be published and no Git operations should be performed.
**Validates: Requirements 1.5**

### Property 5: Release manifest completeness
*For any* completed release, the release manifest should contain entries for all published artifacts.
**Validates: Requirements 12.3**

### Property 6: Package-specific configuration isolation
*For any* package release, only that package's artifacts should be built and published.
**Validates: Requirements 13.1, 13.2, 13.5**

### Property 7: Verification matches published artifacts
*For any* completed release, all verification URLs in the manifest should return successful responses.
**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

### Property 8: Binary checksums are deterministic
*For any* binary artifact, generating the checksum multiple times should produce the same result.
**Validates: Requirements 7.4**

### Property 9: Git tag format consistency
*For any* package and version, the Git tag should follow the format `{package}-v{version}`.
**Validates: Requirements 8.2**

### Property 10: Changelog categorization completeness
*For any* set of commits, every commit should appear in exactly one category in the generated changelog.
**Validates: Requirements 9.2**

## Error Handling

### Error Categories

1. **Pre-flight Errors**: Validation failures before release starts
   - Action: Report error, exit without changes
   - Examples: Dirty git state, failing tests, missing credentials

2. **Build Errors**: Failures during artifact building
   - Action: Report error, exit without publishing
   - Examples: Compilation errors, packaging failures

3. **Publishing Errors**: Failures during artifact publishing
   - Action: Initiate rollback, report error
   - Examples: NPM publish failure, Docker push failure

4. **Verification Errors**: Failures during post-release verification
   - Action: Report error, provide remediation steps
   - Examples: Artifact not accessible, incorrect version

5. **Rollback Errors**: Failures during rollback process
   - Action: Report error, provide manual cleanup steps
   - Examples: Cannot unpublish NPM package, cannot delete tag

### Error Recovery Strategy

```typescript
interface ErrorHandler {
  handle(error: ReleaseError, state: ReleaseState): Promise<ErrorResolution>;
}

interface ErrorResolution {
  action: 'retry' | 'rollback' | 'abort' | 'continue';
  message: string;
  manualSteps?: string[];
}
```

### Rollback Procedure

1. Identify which steps completed successfully
2. Execute reverse operations in reverse order:
   - Delete GitHub release
   - Delete Git tag (local and remote)
   - Unpublish VSCode extension (if possible)
   - Delete Docker tags (if possible)
   - Unpublish NPM package (if within time window)
3. Log all rollback actions
4. Report final state and any manual cleanup needed

## Testing Strategy

### Unit Tests

- Configuration loader parsing and validation
- Version sync pattern matching and replacement
- Changelog commit categorization
- Manifest file creation and updates
- Error handler decision logic
- Git tag format generation

### Integration Tests

- Pre-flight checker with mock Git repository
- Build pipeline with test packages
- Publishing pipeline with test registries (Verdaccio for NPM)
- Verification pipeline with mock HTTP responses
- End-to-end dry-run execution

### Property-Based Tests

Each correctness property will be implemented as a property-based test using fast-check:

1. **Property 1 Test**: Generate random version strings and file configurations, verify all files contain the version after sync
2. **Property 2 Test**: Generate random pre-flight check failures, verify no publishing occurs
3. **Property 3 Test**: Generate random release states, execute rollback, verify clean state
4. **Property 4 Test**: Generate random release configurations, execute with dry-run, verify no side effects
5. **Property 5 Test**: Generate random release executions, verify manifest contains all artifacts
6. **Property 6 Test**: Generate random package selections, verify only that package's artifacts are affected
7. **Property 7 Test**: Generate random release manifests, verify all URLs are accessible
8. **Property 8 Test**: Generate random binary data, verify checksum consistency
9. **Property 9 Test**: Generate random package/version combinations, verify tag format
10. **Property 10 Test**: Generate random commit sets, verify all commits appear in exactly one category

### Manual Testing

- Full release to test NPM registry
- Full release to test Docker registry
- Full release to test VSCode marketplace
- Rollback after partial failure
- Interactive mode with user prompts
- Non-interactive mode for CI

## Implementation Notes

### Technology Stack

- **Language**: Node.js (JavaScript/TypeScript)
- **CLI Framework**: Commander.js for argument parsing
- **Git Operations**: simple-git library
- **HTTP Requests**: node-fetch for verification
- **Process Execution**: child_process for running commands
- **Logging**: winston for structured logging
- **Testing**: Jest for unit tests, fast-check for property tests

### File Structure

```
scripts/
├── release.js                    # Main CLI entry point for full releases
├── set-version.js                # CLI for setting version only
├── release-lib/
│   ├── config-loader.js
│   ├── preflight-checker.js
│   ├── version-manager.js
│   ├── builders/
│   │   ├── npm-builder.js
│   │   ├── binary-builder.js
│   │   └── vscode-builder.js
│   ├── publishers/
│   │   ├── npm-publisher.js
│   │   ├── docker-publisher.js
│   │   └── vscode-publisher.js
│   ├── git-operations.js
│   ├── verification-pipeline.js
│   ├── changelog-generator.js
│   ├── manifest-writer.js
│   ├── error-handler.js
│   └── logger.js
├── release-config/
│   ├── debugger.json
│   └── screenshot.json
└── __tests__/
    ├── unit/
    ├── integration/
    └── property/
```

### Security Considerations

1. **Credential Management**: Never log credentials, use environment variables
2. **Dry-run Safety**: Ensure dry-run mode cannot accidentally publish
3. **Rollback Safety**: Verify rollback operations before executing
4. **Input Validation**: Validate all user inputs (version format, package names)
5. **Audit Trail**: Log all operations to file for audit purposes

### Performance Considerations

1. **Parallel Operations**: Run independent verifications in parallel
2. **Caching**: Cache pre-flight check results when safe
3. **Streaming**: Stream large file operations (binary building)
4. **Timeouts**: Set reasonable timeouts for all network operations

### Extensibility

The system is designed to be extensible for future packages:

1. Add new package configuration file
2. Define package-specific build/publish steps
3. Update release CLI to recognize new package name
4. No changes needed to core pipeline logic
