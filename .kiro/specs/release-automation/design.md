# Design Document

## Overview

The release automation system provides a unified command-line interface for coordinating releases across multiple independent Git submodule repositories in the AI Capabilities Suite monorepo. The system supports two release modes: **local releases** (executing all steps from the monorepo) and **remote releases** (triggering GitHub Actions workflows in submodule repositories). It orchestrates version management, building, testing, publishing to multiple platforms, and verification while maintaining a centralized release manifest in the monorepo.

## Architecture

The system follows a coordinator pattern with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                  Monorepo Release CLI                        │
│  (scripts/release.ts - Entry point & orchestration)         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├──> Configuration Loader
                   │    (Load submodule-specific config)
                   │
                   ├──> Release Mode Selector
                   │    ├──> Local Release Pipeline
                   │    └──> Remote Release Pipeline
                   │
┌──────────────────┴──────────────────────────────────────────┐
│              Local Release Pipeline                          │
│  (Execute all steps within monorepo)                        │
├─────────────────────────────────────────────────────────────┤
│  ├──> Pre-flight Checker                                    │
│  │    (Git status, tests, builds, credentials)              │
│  │                                                           │
│  ├──> Version Manager                                       │
│  │    (Sync versions within submodule)                      │
│  │                                                           │
│  ├──> Build Pipeline                                        │
│  │    ├──> NPM Builder                                      │
│  │    ├──> Binary Builder (debugger only)                   │
│  │    └──> VSCode Extension Builder                         │
│  │                                                           │
│  ├──> Publishing Pipeline                                   │
│  │    ├──> NPM Publisher                                    │
│  │    ├──> Docker Publisher (optional)                      │
│  │    └──> VSCode Marketplace Publisher                     │
│  │                                                           │
│  ├──> Git Operations (in submodule)                         │
│  │    ├──> Commit & Tag                                     │
│  │    └──> GitHub Release Creator                           │
│  │                                                           │
│  └──> Verification Pipeline                                 │
│       (Verify all artifacts are accessible)                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Remote Release Pipeline                         │
│  (Trigger GitHub Actions in submodule repo)                 │
├─────────────────────────────────────────────────────────────┤
│  ├──> GitHub API Client                                     │
│  │    (Trigger workflow_dispatch event)                     │
│  │                                                           │
│  ├──> Workflow Monitor                                      │
│  │    (Poll workflow run status)                            │
│  │                                                           │
│  └──> Verification Pipeline                                 │
│       (Verify artifacts after workflow completes)           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Shared Components                               │
├─────────────────────────────────────────────────────────────┤
│  ├──> Changelog Generator                                   │
│  │    (Generate release notes from commits)                 │
│  │                                                           │
│  ├──> Release Manifest Writer                               │
│  │    (Track releases in monorepo)                          │
│  │                                                           │
│  ├──> Submodule Reference Updater                           │
│  │    (Update submodule commits in monorepo)                │
│  │                                                           │
│  └──> Logger                                                 │
│       (Structured logging with file output)                 │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Release CLI (`scripts/release.ts`)

Main entry point that orchestrates the release process.

**Interface:**

```bash
# Release a single submodule
yarn release <submodule> <version-bump> [options]

# Release multiple submodules
yarn release <submodule1>,<submodule2> <version-bump> [options]

Arguments:
  submodule      Submodule(s) to release: 'mcp-debugger-server', 'mcp-screenshot', etc.
                 Multiple submodules separated by commas
  version-bump   Version bump type: 'patch', 'minor', or 'major'

Options:
  --mode <mode>          Release mode: 'local' or 'remote' (default: 'remote')
  --dry-run              Simulate release without publishing
  --skip-tests           Skip test execution (not recommended)
  --skip-build           Skip build step (not recommended)
  --docker               Include Docker image publishing (local mode only)
  --non-interactive      Run without prompts (use defaults)
  --skip-verify          Skip post-release verification
  --skip-submodule-update  Don't update submodule reference in monorepo
  --log-file <path>      Custom log file path
```

**Responsibilities:**

- Parse command-line arguments
- Load submodule configuration
- Select release mode (local vs remote)
- Execute release pipeline
- Handle errors and report status
- Generate release summary

### 2. Configuration Loader

Loads submodule-specific configuration from JSON files.

**Configuration Files:**

- `scripts/release-config/mcp-debugger-server.json`
- `scripts/release-config/mcp-screenshot.json`
- `scripts/release-config/vscode-mcp-debugger.json`
- etc.

**Configuration Schema:**

```typescript
interface SubmoduleConfig {
  name: string;
  displayName: string;
  path: string; // Relative path from monorepo root
  repository: {
    owner: string;
    name: string;
    url: string;
  };
  artifacts: {
    npm: boolean;
    docker: boolean;
    vscode: boolean;
    binaries: boolean;
  };
  build: {
    command: string;
    testCommand: string;
  };
  publish: {
    npmPackageName?: string;
    dockerImageName?: string;
    vscodeExtensionId?: string;
  };
  versionSync: {
    files: VersionSyncFile[];
  };
}

interface VersionSyncFile {
  path: string; // Relative to submodule root
  pattern: string | RegExp;
  replacement: string;
}
```

### 3. Release Mode Selector

Determines which release pipeline to use based on user input.

**Interface:**

```typescript
interface ReleaseModeSelector {
  selectMode(options: ReleaseOptions): "local" | "remote";
  validateMode(mode: string, config: SubmoduleConfig): boolean;
}
```

### 4. Local Release Pipeline

Executes all release steps from within the monorepo.

**Pre-flight Checker:**

```typescript
interface PreflightChecker {
  runChecks(
    submodulePath: string,
    config: SubmoduleConfig
  ): Promise<PreflightResult>;
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

**Version Manager:**

```typescript
interface VersionManager {
  bumpVersion(
    submodulePath: string,
    bumpType: "patch" | "minor" | "major"
  ): Promise<string>;
  syncVersions(
    submodulePath: string,
    config: SubmoduleConfig,
    version: string
  ): Promise<SyncResult>;
  verifyVersions(
    submodulePath: string,
    config: SubmoduleConfig,
    version: string
  ): Promise<boolean>;
}

interface SyncResult {
  filesUpdated: string[];
  errors: string[];
}
```

**Build Pipeline:**

```typescript
interface BuildPipeline {
  build(submodulePath: string, config: SubmoduleConfig): Promise<BuildResult>;
  test(submodulePath: string, config: SubmoduleConfig): Promise<TestResult>;
}

interface BinaryBuilder {
  buildBinaries(submodulePath: string, version: string): Promise<BinaryResult>;
  generateChecksums(binaries: string[]): Promise<Map<string, string>>;
}

interface VscodeBuilder {
  compile(extensionPath: string): Promise<void>;
  package(extensionPath: string): Promise<string>; // Returns .vsix path
}
```

**Publishing Pipeline:**

```typescript
interface NpmPublisher {
  publish(submodulePath: string, dryRun: boolean): Promise<PublishResult>;
  verify(packageName: string, version: string): Promise<boolean>;
}

interface DockerPublisher {
  build(
    submodulePath: string,
    imageName: string,
    version: string
  ): Promise<void>;
  tag(imageName: string, tags: string[]): Promise<void>;
  push(imageName: string, tags: string[]): Promise<void>;
  verify(imageName: string, version: string): Promise<boolean>;
}

interface VscodePublisher {
  publish(vsixPath: string, dryRun: boolean): Promise<PublishResult>;
  verify(extensionId: string, version: string): Promise<boolean>;
}
```

**Git Operations:**

```typescript
interface GitOperations {
  commitChanges(submodulePath: string, message: string): Promise<void>;
  createTag(submodulePath: string, tag: string): Promise<void>;
  pushToRemote(submodulePath: string, includeTags: boolean): Promise<void>;
  createGithubRelease(
    repo: RepositoryInfo,
    release: GithubReleaseData
  ): Promise<string>;
  attachAssets(
    repo: RepositoryInfo,
    releaseId: string,
    assets: string[]
  ): Promise<void>;
}

interface RepositoryInfo {
  owner: string;
  name: string;
}

interface GithubReleaseData {
  tag: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
}
```

### 5. Remote Release Pipeline

Triggers GitHub Actions workflows in submodule repositories.

**GitHub API Client:**

```typescript
interface GitHubApiClient {
  triggerWorkflow(
    repo: RepositoryInfo,
    workflowId: string,
    inputs: WorkflowInputs
  ): Promise<WorkflowRun>;
}

interface WorkflowInputs {
  version: "patch" | "minor" | "major";
  dry_run: boolean;
}

interface WorkflowRun {
  id: number;
  status: "queued" | "in_progress" | "completed";
  conclusion?: "success" | "failure" | "cancelled";
  html_url: string;
}
```

**Workflow Monitor:**

```typescript
interface WorkflowMonitor {
  pollWorkflowStatus(
    repo: RepositoryInfo,
    runId: number,
    pollInterval: number
  ): AsyncGenerator<WorkflowRun>;

  waitForCompletion(
    repo: RepositoryInfo,
    runId: number,
    timeout: number
  ): Promise<WorkflowRun>;
}
```

### 6. Verification Pipeline

Verifies that all published artifacts are accessible.

**Interface:**

```typescript
interface VerificationPipeline {
  verifyAll(manifest: ReleaseArtifacts): Promise<VerificationResult>;
}

interface VerificationResult {
  npm?: VerificationCheck;
  docker?: VerificationCheck;
  vscode?: VerificationCheck;
  github: VerificationCheck;
}

interface VerificationCheck {
  passed: boolean;
  url: string;
  message?: string;
}
```

### 7. Changelog Generator

Generates release notes from Git commit history.

**Interface:**

```typescript
interface ChangelogGenerator {
  generate(
    submodulePath: string,
    fromTag: string,
    toTag: string
  ): Promise<Changelog>;
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

### 8. Release Manifest Writer

Tracks release metadata across all submodules in the monorepo.

**Interface:**

```typescript
interface ManifestWriter {
  loadManifest(): Promise<ReleaseManifest>;
  addRelease(release: SubmoduleRelease): Promise<void>;
  save(): Promise<void>;
}

interface ReleaseManifest {
  version: string; // Manifest format version
  releases: SubmoduleRelease[];
}

interface SubmoduleRelease {
  submodule: string;
  version: string;
  timestamp: string;
  mode: "local" | "remote";
  artifacts: ReleaseArtifacts;
  verification: VerificationResult;
  changelog: string;
  commit: string; // Submodule commit hash
}

interface ReleaseArtifacts {
  npm?: ArtifactInfo;
  docker?: ArtifactInfo;
  vscode?: ArtifactInfo;
  binaries?: BinaryArtifact[];
  github: ArtifactInfo;
}

interface ArtifactInfo {
  published: boolean;
  url: string;
  checksum?: string;
}

interface BinaryArtifact {
  platform: string;
  path: string;
  checksum: string;
}
```

### 9. Submodule Reference Updater

Updates submodule commit references in the monorepo.

**Interface:**

```typescript
interface SubmoduleReferenceUpdater {
  updateReference(submoduleName: string, commitHash: string): Promise<void>;
  commitUpdate(submoduleName: string, version: string): Promise<void>;
  verifyReference(
    submoduleName: string,
    expectedCommit: string
  ): Promise<boolean>;
}
```

### 10. Logger

Provides structured logging with file output.

**Interface:**

```typescript
interface Logger {
  debug(message: string, meta?: object): void;
  info(message: string, meta?: object): void;
  warn(message: string, meta?: object): void;
  error(message: string, error?: Error, meta?: object): void;

  startStep(stepName: string): void;
  endStep(stepName: string, success: boolean): void;

  getSummary(): LogSummary;
}

interface LogSummary {
  steps: StepResult[];
  duration: number;
  success: boolean;
}

interface StepResult {
  name: string;
  status: "success" | "failed" | "skipped";
  duration: number;
  error?: string;
}
```

## Data Models

### Release Options

```typescript
interface ReleaseOptions {
  submodules: string[]; // One or more submodule names
  versionBump: "patch" | "minor" | "major";
  mode: "local" | "remote";
  dryRun: boolean;
  skipTests: boolean;
  skipBuild: boolean;
  includeDocker: boolean;
  nonInteractive: boolean;
  skipVerify: boolean;
  skipSubmoduleUpdate: boolean;
  logFile?: string;
}
```

### Release State

```typescript
interface ReleaseState {
  options: ReleaseOptions;
  submodule: SubmoduleConfig;
  startTime: Date;
  steps: StepResult[];
  newVersion?: string;
  artifacts?: ReleaseArtifacts;
  workflowRun?: WorkflowRun;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Submodule isolation

_For any_ release command with a specific submodule name, only that submodule's artifacts should be built and published, and no other submodules should be affected.
**Validates: Requirements 1.1**

### Property 2: Dry-run produces no side effects

_For any_ release configuration executed with dry-run flag, no artifacts should be published, no Git tags should be created, and no GitHub releases should be made.
**Validates: Requirements 1.5**

### Property 3: Version consistency after sync

_For any_ submodule and target version, after version synchronization completes, all configured files in that submodule should contain the target version string.
**Validates: Requirements 4.5**

### Property 4: Pre-flight checks prevent invalid releases

_For any_ release attempt, if any pre-flight check fails, then no artifacts should be published and no Git operations should be performed.
**Validates: Requirements 5.6**

### Property 5: Remote workflow triggering

_For any_ remote release request, the system should trigger exactly one workflow_dispatch event in the correct submodule repository with the correct inputs.
**Validates: Requirements 2.1**

### Property 6: Git tag format consistency

_For any_ version string, the Git tag created should follow the format `v{version}` (e.g., v1.2.3).
**Validates: Requirements 10.2**

### Property 7: Binary checksums are deterministic

_For any_ binary artifact, generating the SHA256 checksum multiple times should produce the same result.
**Validates: Requirements 9.4**

### Property 8: Changelog categorization completeness

_For any_ set of commits between two tags, every commit should appear in exactly one category (features, fixes, breaking, or other) in the generated changelog.
**Validates: Requirements 11.2**

### Property 9: Verification matches published artifacts

_For any_ completed release, all verification checks should pass for artifacts that were marked as published in the release manifest.
**Validates: Requirements 12.5**

### Property 10: Submodule reference correctness

_For any_ submodule release, after updating the submodule reference in the monorepo, the submodule should point to the commit that contains the new version.
**Validates: Requirements 14.1, 14.5**

### Property 11: Multi-release failure isolation

_For any_ multi-submodule release where one submodule fails, all subsequent submodules should not be processed, and the system should report which submodule failed.
**Validates: Requirements 16.3**

### Property 12: Configuration defaults

_For any_ submodule without a configuration file, the system should apply sensible defaults and complete the release successfully.
**Validates: Requirements 17.5**

### Property 13: Manifest completeness

_For any_ completed release, the release manifest should contain an entry with all required fields (submodule, version, timestamp, artifacts, verification).
**Validates: Requirements 13.5**

### Property 14: Mode availability

_For any_ submodule, both local and remote release modes should be available and functional.
**Validates: Requirements 1.2**

## Error Handling

### Error Categories

1. **Configuration Errors**: Invalid or missing configuration

   - Action: Report error with configuration path, exit without changes
   - Examples: Missing config file, invalid JSON, missing required fields

2. **Pre-flight Errors**: Validation failures before release starts

   - Action: Report error with specific check that failed, exit without changes
   - Examples: Dirty git state, failing tests, missing credentials

3. **Build Errors**: Failures during artifact building

   - Action: Report error, exit without publishing
   - Examples: Compilation errors, test failures, packaging failures

4. **Publishing Errors**: Failures during artifact publishing

   - Action: Report error, log what was published, provide cleanup steps
   - Examples: NPM publish failure, Docker push failure, GitHub API errors

5. **Verification Errors**: Failures during post-release verification

   - Action: Report error, provide remediation steps, mark in manifest
   - Examples: Artifact not accessible, incorrect version, 404 errors

6. **GitHub API Errors**: Failures when interacting with GitHub

   - Action: Report error with API response, provide retry guidance
   - Examples: Authentication failure, rate limiting, workflow not found

7. **Submodule Errors**: Failures related to Git submodules
   - Action: Report error, provide Git commands for manual fix
   - Examples: Submodule not initialized, detached HEAD, merge conflicts

### Error Recovery Strategy

```typescript
interface ErrorHandler {
  handle(error: ReleaseError, state: ReleaseState): Promise<ErrorResolution>;
}

interface ErrorResolution {
  action: "retry" | "abort" | "continue" | "manual";
  message: string;
  manualSteps?: string[];
  retryable: boolean;
}
```

### Cleanup Procedures

**Local Release Cleanup:**

1. Log all completed steps
2. Identify which artifacts were published
3. Provide commands to unpublish (where possible)
4. Provide commands to delete Git tags
5. Provide commands to delete GitHub releases

**Remote Release Cleanup:**

1. Log workflow run URL
2. Wait for workflow to complete or cancel it
3. Check workflow logs for published artifacts
4. Provide cleanup guidance based on workflow state

## Testing Strategy

### Unit Tests

- Configuration loader parsing and validation
- Version sync pattern matching and replacement
- Changelog commit categorization
- Manifest file creation and updates
- Git tag format generation
- Submodule path resolution
- Error handler decision logic

### Integration Tests

- Pre-flight checker with test Git repository
- Build pipeline with test submodule
- GitHub API client with mock server
- Workflow monitor with simulated workflow runs
- Verification pipeline with mock HTTP responses
- End-to-end dry-run execution

### Property-Based Tests

Each correctness property will be implemented as a property-based test using fast-check:

1. **Property 1 Test**: Generate random submodule names, execute release, verify only that submodule affected
2. **Property 2 Test**: Generate random release configurations, execute with dry-run, verify no side effects
3. **Property 3 Test**: Generate random version strings and file configurations, sync, verify all match
4. **Property 4 Test**: Generate random pre-flight check failures, verify no publishing occurs
5. **Property 5 Test**: Generate random remote release requests, verify correct workflow_dispatch calls
6. **Property 6 Test**: Generate random version strings, verify tag format
7. **Property 7 Test**: Generate random binary data, verify checksum consistency
8. **Property 8 Test**: Generate random commit sets, verify categorization completeness
9. **Property 9 Test**: Generate random release manifests, verify verification matches published artifacts
10. **Property 10 Test**: Generate random releases, verify submodule reference correctness
11. **Property 11 Test**: Generate random multi-release failures, verify correct halting
12. **Property 12 Test**: Test with missing configurations, verify defaults applied
13. **Property 13 Test**: Generate random releases, verify manifest completeness
14. **Property 14 Test**: Test both modes for all submodules, verify both work

### Manual Testing

- Full local release to test NPM registry
- Full remote release via GitHub Actions
- Multi-submodule release coordination
- Verification of all artifact types
- Interactive mode with user prompts
- Non-interactive mode for CI

## Implementation Notes

### Technology Stack

- **Language**: TypeScript (Node.js)
- **CLI Framework**: Commander.js for argument parsing
- **Git Operations**: simple-git library
- **GitHub API**: @octokit/rest for GitHub integration
- **HTTP Requests**: node-fetch for verification
- **Process Execution**: child_process for running commands
- **Logging**: winston for structured logging
- **Testing**: Jest for unit tests, fast-check for property tests

### File Structure

```
scripts/
├── release.ts                    # Main CLI entry point
├── release-lib/
│   ├── config-loader.ts
│   ├── release-mode-selector.ts
│   ├── local-release/
│   │   ├── preflight-checker.ts
│   │   ├── version-manager.ts
│   │   ├── build-pipeline.ts
│   │   ├── binary-builder.ts
│   │   ├── vscode-builder.ts
│   │   ├── npm-publisher.ts
│   │   ├── docker-publisher.ts
│   │   ├── vscode-publisher.ts
│   │   └── git-operations.ts
│   ├── remote-release/
│   │   ├── github-api-client.ts
│   │   └── workflow-monitor.ts
│   ├── shared/
│   │   ├── verification-pipeline.ts
│   │   ├── changelog-generator.ts
│   │   ├── manifest-writer.ts
│   │   ├── submodule-reference-updater.ts
│   │   └── logger.ts
│   └── types.ts
├── release-config/
│   ├── mcp-debugger-server.json
│   ├── mcp-screenshot.json
│   ├── vscode-mcp-debugger.json
│   └── defaults.json
└── __tests__/
    ├── unit/
    ├── integration/
    └── property/
```

### Security Considerations

1. **Credential Management**:

   - Never log credentials
   - Use environment variables for tokens
   - Validate token permissions before use
   - Support credential helpers (e.g., gh auth)

2. **Dry-run Safety**:

   - Ensure dry-run mode cannot accidentally publish
   - Use separate code paths for dry-run vs real publishing
   - Verify no network calls in dry-run mode

3. **Input Validation**:

   - Validate all user inputs (submodule names, versions)
   - Sanitize inputs before using in shell commands
   - Validate configuration files against schema

4. **Audit Trail**:
   - Log all operations to file
   - Include timestamps and user information
   - Preserve logs even on failure

### Performance Considerations

1. **Parallel Operations**:

   - Run independent verifications in parallel
   - Build multiple binaries in parallel
   - Verify multiple artifacts concurrently

2. **Caching**:

   - Cache pre-flight check results when safe
   - Reuse build artifacts when possible
   - Cache GitHub API responses

3. **Streaming**:

   - Stream large file operations (binary building)
   - Stream command output to logs
   - Use streaming for file uploads

4. **Timeouts**:
   - Set reasonable timeouts for all network operations
   - Set timeouts for workflow monitoring
   - Allow user to configure timeout values

### Extensibility

The system is designed to be extensible for future submodules:

1. Add new submodule configuration file
2. Define submodule-specific build/publish steps in config
3. No changes needed to core pipeline logic
4. System automatically discovers new submodules

### Workflow Integration

**GitHub Actions Workflow Requirements:**

Each submodule repository should have a `release.yml` workflow with:

- `workflow_dispatch` trigger
- Inputs: `version` (choice: patch/minor/major), `dry_run` (boolean)
- Steps: version bump, build, test, publish, tag, GitHub release
- Outputs: new version, release URL

**Example workflow_dispatch configuration:**

```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version bump type'
        required: true
        type: choice
        options:
          - patch
          - minor
          - major
      dry_run:
        description: 'Dry run (don't publish)'
        required: false
        type: boolean
        default: false
```

### Monorepo Coordination

**Submodule Reference Management:**

- After each release, update submodule reference to new commit
- Commit with message: `chore: update {submodule} to v{version}`
- Optionally create monorepo tag: `suite-v{date}` for coordinated releases

**Release Manifest Location:**

- `releases/manifest.json` in monorepo root
- Tracked in Git for history
- Updated after each submodule release

**Multi-Submodule Releases:**

- Release submodules in dependency order
- Wait for each to complete before starting next
- Update manifest after all complete
- Create suite-level tag if all succeed
