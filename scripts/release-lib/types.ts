/**
 * @fileoverview Type definitions for the release automation system
 * These TypeScript types provide comprehensive type safety for the release process
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * File pattern for version synchronization
 */
export interface VersionSyncFile {
  /** Path to the file to sync (relative to submodule root) */
  path: string;
  /** Pattern to match for replacement */
  pattern: string | RegExp;
  /** Replacement string (can use $VERSION placeholder) */
  replacement: string;
}

/**
 * Submodule configuration loaded from JSON files
 */
export interface SubmoduleConfig {
  /** Short name (e.g., 'mcp-debugger-server', 'mcp-screenshot') */
  name: string;
  /** Display name for user-facing messages */
  displayName: string;
  /** Relative path from monorepo root */
  path: string;
  /** Repository information */
  repository: {
    /** GitHub owner/organization */
    owner: string;
    /** Repository name */
    name: string;
    /** Full repository URL */
    url: string;
  };
  /** Artifact types to publish */
  artifacts: {
    /** Whether to publish to NPM */
    npm: boolean;
    /** Whether to publish Docker images */
    docker: boolean;
    /** Whether to publish VSCode extension */
    vscode: boolean;
    /** Whether to build standalone binaries */
    binaries: boolean;
  };
  /** Build and test commands */
  build: {
    /** Command to build the package */
    command: string;
    /** Command to run tests */
    testCommand: string;
  };
  /** Publishing configuration */
  publish: {
    /** NPM package name (if different from name) */
    npmPackageName?: string;
    /** Docker image name */
    dockerImageName?: string;
    /** VSCode extension ID */
    vscodeExtensionId?: string;
  };
  /** Version synchronization configuration */
  versionSync: {
    /** Files to sync versions in */
    files: VersionSyncFile[];
  };
}

// ============================================================================
// Release Options and State
// ============================================================================

/**
 * Options for the release command
 */
export interface ReleaseOptions {
  /** One or more submodule names to release */
  submodules: string[];
  /** Version bump type */
  versionBump: "patch" | "minor" | "major";
  /** Release mode (local or remote) */
  mode: "local" | "remote";
  /** Simulate release without publishing */
  dryRun: boolean;
  /** Skip test execution (not recommended) */
  skipTests: boolean;
  /** Skip build step (not recommended) */
  skipBuild: boolean;
  /** Include Docker image publishing (local mode only) */
  includeDocker: boolean;
  /** Run without prompts (use defaults) */
  nonInteractive: boolean;
  /** Skip post-release verification */
  skipVerify: boolean;
  /** Don't update submodule reference in monorepo */
  skipSubmoduleUpdate: boolean;
  /** Custom log file path */
  logFile?: string;
}

/**
 * Current state of a release in progress
 */
export interface ReleaseState {
  /** Release options */
  options: ReleaseOptions;
  /** Submodule configuration */
  submodule: SubmoduleConfig;
  /** When the release started */
  startTime: Date;
  /** Results of each step */
  steps: StepResult[];
  /** New version after bump */
  newVersion?: string;
  /** Published artifacts */
  artifacts?: ReleaseArtifacts;
  /** GitHub Actions workflow run (for remote releases) */
  workflowRun?: WorkflowRun;
}

// ============================================================================
// Pre-flight Checker Types
// ============================================================================

/**
 * Result of a single pre-flight check
 */
export interface CheckResult {
  /** Name of the check */
  name: string;
  /** Whether the check passed */
  passed: boolean;
  /** Optional message with details */
  message?: string;
}

/**
 * Result of all pre-flight checks
 */
export interface PreflightResult {
  /** Whether all checks passed */
  passed: boolean;
  /** Individual check results */
  checks: CheckResult[];
}

/**
 * Pre-flight checker interface
 */
export interface PreflightChecker {
  /**
   * Run all pre-flight checks for a submodule
   */
  runChecks(
    submodulePath: string,
    config: SubmoduleConfig,
    options?: Partial<ReleaseOptions>
  ): Promise<PreflightResult>;
}

// ============================================================================
// Version Manager Types
// ============================================================================

/**
 * Result of version synchronization
 */
export interface SyncResult {
  /** List of files that were updated */
  filesUpdated: string[];
  /** List of errors encountered */
  errors: string[];
}

/**
 * Version manager interface
 */
export interface VersionManager {
  /**
   * Bump version in package.json
   */
  bumpVersion(
    submodulePath: string,
    bumpType: "patch" | "minor" | "major"
  ): Promise<string>;

  /**
   * Sync version across all configured files
   */
  syncVersions(
    submodulePath: string,
    config: SubmoduleConfig,
    version: string
  ): Promise<SyncResult>;

  /**
   * Verify all files have the correct version
   */
  verifyVersions(
    submodulePath: string,
    config: SubmoduleConfig,
    version: string
  ): Promise<boolean>;
}

// ============================================================================
// Build Pipeline Types
// ============================================================================

/**
 * Result of a build operation
 */
export interface BuildResult {
  /** Whether the build succeeded */
  success: boolean;
  /** Build output */
  output?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Result of test execution
 */
export interface TestResult {
  /** Whether tests passed */
  success: boolean;
  /** Test output */
  output?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Build pipeline interface
 */
export interface BuildPipeline {
  /**
   * Build the package
   */
  build(submodulePath: string, config: SubmoduleConfig): Promise<BuildResult>;

  /**
   * Run tests
   */
  test(submodulePath: string, config: SubmoduleConfig): Promise<TestResult>;
}

/**
 * Binary artifact information
 */
export interface BinaryArtifact {
  /** Platform name (e.g., 'linux-x64', 'macos-x64', 'windows-x64') */
  platform: string;
  /** Path to the binary file */
  path: string;
  /** SHA256 checksum */
  checksum: string;
}

/**
 * Result of binary building
 */
export interface BinaryResult {
  /** Built binary artifacts */
  binaries: BinaryArtifact[];
  /** SHA256 checksums for each binary */
  checksums: Map<string, string>;
}

/**
 * Binary builder interface
 */
export interface BinaryBuilder {
  /**
   * Build standalone binaries for all platforms
   */
  buildBinaries(submodulePath: string, version: string): Promise<BinaryResult>;

  /**
   * Generate SHA256 checksums for binaries
   */
  generateChecksums(binaries: string[]): Promise<Map<string, string>>;
}

/**
 * VSCode extension builder interface
 */
export interface VscodeBuilder {
  /**
   * Compile TypeScript code
   */
  compile(extensionPath: string): Promise<void>;

  /**
   * Package extension as VSIX
   * @returns Path to the .vsix file
   */
  package(extensionPath: string): Promise<string>;
}

// ============================================================================
// Publishing Pipeline Types
// ============================================================================

/**
 * Result of a publishing operation
 */
export interface PublishResult {
  /** Whether publishing succeeded */
  success: boolean;
  /** URL to published artifact */
  url?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * NPM publisher interface
 */
export interface NpmPublisher {
  /**
   * Publish package to NPM
   */
  publish(submodulePath: string, dryRun: boolean): Promise<PublishResult>;

  /**
   * Verify package is accessible on NPM
   */
  verify(packageName: string, version: string): Promise<boolean>;
}

/**
 * Docker publisher interface
 */
export interface DockerPublisher {
  /**
   * Build Docker image
   */
  build(
    submodulePath: string,
    imageName: string,
    version: string
  ): Promise<void>;

  /**
   * Tag Docker image
   */
  tag(imageName: string, tags: string[]): Promise<void>;

  /**
   * Push Docker image to registry
   */
  push(imageName: string, tags: string[]): Promise<void>;

  /**
   * Verify image is accessible on Docker Hub
   */
  verify(imageName: string, version: string): Promise<boolean>;
}

/**
 * VSCode marketplace publisher interface
 */
export interface VscodePublisher {
  /**
   * Publish extension to VSCode marketplace
   */
  publish(vsixPath: string, dryRun: boolean): Promise<PublishResult>;

  /**
   * Verify extension is accessible on marketplace
   */
  verify(extensionId: string, version: string): Promise<boolean>;
}

// ============================================================================
// Git Operations Types
// ============================================================================

/**
 * Repository information
 */
export interface RepositoryInfo {
  /** GitHub owner/organization */
  owner: string;
  /** Repository name */
  name: string;
}

/**
 * GitHub release data
 */
export interface GithubReleaseData {
  /** Git tag name (e.g., 'v1.2.3') */
  tag: string;
  /** Release name */
  name: string;
  /** Release notes (markdown) */
  body: string;
  /** Whether this is a draft release */
  draft: boolean;
  /** Whether this is a prerelease */
  prerelease: boolean;
}

/**
 * Git operations interface
 */
export interface GitOperations {
  /**
   * Commit changes in submodule
   */
  commitChanges(submodulePath: string, message: string): Promise<void>;

  /**
   * Create Git tag in submodule
   */
  createTag(submodulePath: string, tag: string): Promise<void>;

  /**
   * Push commits and tags to remote
   */
  pushToRemote(submodulePath: string, includeTags: boolean): Promise<void>;

  /**
   * Create GitHub release
   * @returns Release ID
   */
  createGithubRelease(
    repo: RepositoryInfo,
    release: GithubReleaseData
  ): Promise<string>;

  /**
   * Attach assets to GitHub release
   */
  attachAssets(
    repo: RepositoryInfo,
    releaseId: string,
    assets: string[]
  ): Promise<void>;
}

// ============================================================================
// Remote Release Pipeline Types
// ============================================================================

/**
 * GitHub Actions workflow inputs
 */
export interface WorkflowInputs {
  /** Version bump type */
  version: "patch" | "minor" | "major";
  /** Dry run mode */
  dry_run: boolean;
}

/**
 * GitHub Actions workflow run
 */
export interface WorkflowRun {
  /** Workflow run ID */
  id: number;
  /** Current status */
  status: "queued" | "in_progress" | "completed";
  /** Final conclusion (only when completed) */
  conclusion?: "success" | "failure" | "cancelled";
  /** URL to workflow run */
  html_url: string;
}

/**
 * GitHub API client interface
 */
export interface GitHubApiClient {
  /**
   * Trigger workflow_dispatch event
   */
  triggerWorkflow(
    repo: RepositoryInfo,
    workflowId: string,
    inputs: WorkflowInputs
  ): Promise<WorkflowRun>;
}

/**
 * Workflow monitor interface
 */
export interface WorkflowMonitor {
  /**
   * Poll workflow status
   */
  pollWorkflowStatus(
    repo: RepositoryInfo,
    runId: number,
    pollInterval: number
  ): AsyncGenerator<WorkflowRun>;

  /**
   * Wait for workflow to complete
   */
  waitForCompletion(
    repo: RepositoryInfo,
    runId: number,
    timeout: number
  ): Promise<WorkflowRun>;
}

// ============================================================================
// Verification Pipeline Types
// ============================================================================

/**
 * Result of a single verification check
 */
export interface VerificationCheck {
  /** Whether verification passed */
  passed: boolean;
  /** URL that was verified */
  url: string;
  /** Optional message with details */
  message?: string;
}

/**
 * Result of all verification checks
 */
export interface VerificationResult {
  /** NPM package verification */
  npm?: VerificationCheck;
  /** Docker image verification */
  docker?: VerificationCheck;
  /** VSCode extension verification */
  vscode?: VerificationCheck;
  /** GitHub release verification */
  github: VerificationCheck;
}

/**
 * Verification pipeline interface
 */
export interface VerificationPipeline {
  /**
   * Verify all published artifacts
   */
  verifyAll(manifest: ReleaseArtifacts): Promise<VerificationResult>;
}

// ============================================================================
// Changelog Generator Types
// ============================================================================

/**
 * Commit information
 */
export interface CommitInfo {
  /** Commit hash */
  hash: string;
  /** Commit message */
  message: string;
  /** Commit author */
  author: string;
  /** Commit date */
  date: Date;
  /** Pull request number (if applicable) */
  pr?: number;
}

/**
 * Changelog organized by category
 */
export interface Changelog {
  /** Feature commits */
  features: CommitInfo[];
  /** Bug fix commits */
  fixes: CommitInfo[];
  /** Breaking change commits */
  breaking: CommitInfo[];
  /** Other commits */
  other: CommitInfo[];
}

/**
 * Changelog generator interface
 */
export interface ChangelogGenerator {
  /**
   * Generate changelog from Git history
   */
  generate(
    submodulePath: string,
    fromTag: string,
    toTag: string
  ): Promise<Changelog>;

  /**
   * Format changelog as markdown
   */
  format(changelog: Changelog, template: string): string;
}

// ============================================================================
// Release Manifest Types
// ============================================================================

/**
 * Artifact information
 */
export interface ArtifactInfo {
  /** Whether the artifact was published */
  published: boolean;
  /** URL to the artifact */
  url: string;
  /** SHA256 checksum (if applicable) */
  checksum?: string;
}

/**
 * Published artifacts for a release
 */
export interface ReleaseArtifacts {
  /** NPM package */
  npm?: ArtifactInfo;
  /** Docker image */
  docker?: ArtifactInfo;
  /** VSCode extension */
  vscode?: ArtifactInfo;
  /** Standalone binaries */
  binaries?: BinaryArtifact[];
  /** GitHub release */
  github: ArtifactInfo;
}

/**
 * Single submodule release entry
 */
export interface SubmoduleRelease {
  /** Submodule name */
  submodule: string;
  /** Version released */
  version: string;
  /** ISO timestamp of release */
  timestamp: string;
  /** Release mode used */
  mode: "local" | "remote";
  /** Published artifacts */
  artifacts: ReleaseArtifacts;
  /** Verification results */
  verification: VerificationResult;
  /** Generated changelog */
  changelog: string;
  /** Submodule commit hash */
  commit: string;
}

/**
 * Release manifest tracking all releases
 */
export interface ReleaseManifest {
  /** Manifest format version */
  version: string;
  /** All releases */
  releases: SubmoduleRelease[];
}

/**
 * Manifest writer interface
 */
export interface ManifestWriter {
  /**
   * Load existing manifest
   */
  loadManifest(): Promise<ReleaseManifest>;

  /**
   * Add a release to the manifest
   */
  addRelease(release: SubmoduleRelease): Promise<void>;

  /**
   * Save manifest to disk
   */
  save(): Promise<void>;
}

// ============================================================================
// Submodule Reference Updater Types
// ============================================================================

/**
 * Submodule reference updater interface
 */
export interface SubmoduleReferenceUpdater {
  /**
   * Update submodule reference to new commit
   */
  updateReference(submoduleName: string, commitHash: string): Promise<void>;

  /**
   * Commit submodule update to monorepo
   */
  commitUpdate(submoduleName: string, version: string): Promise<void>;

  /**
   * Verify submodule is at expected commit
   */
  verifyReference(
    submoduleName: string,
    expectedCommit: string
  ): Promise<boolean>;
}

// ============================================================================
// Logger Types
// ============================================================================

/**
 * Step execution status
 */
export type StepStatus = "success" | "failed" | "skipped";

/**
 * Result of a single step
 */
export interface StepResult {
  /** Step name */
  name: string;
  /** Step status */
  status: StepStatus;
  /** Step duration in milliseconds */
  duration: number;
  /** Error message if failed */
  error?: string;
}

/**
 * Log summary
 */
export interface LogSummary {
  /** All step results */
  steps: StepResult[];
  /** Total duration in milliseconds */
  duration: number;
  /** Whether the release succeeded */
  success: boolean;
}

/**
 * Logger interface
 */
export interface Logger {
  /**
   * Log debug message
   */
  debug(message: string, meta?: object): void;

  /**
   * Log info message
   */
  info(message: string, meta?: object): void;

  /**
   * Log warning message
   */
  warn(message: string, meta?: object): void;

  /**
   * Log error message
   */
  error(message: string, error?: Error, meta?: object): void;

  /**
   * Start tracking a step
   */
  startStep(stepName: string): void;

  /**
   * End tracking a step
   */
  endStep(stepName: string, success: boolean): void;

  /**
   * Get release summary
   */
  getSummary(): LogSummary;
}

// ============================================================================
// Release Mode Selector Types
// ============================================================================

/**
 * Release mode selector interface
 */
export interface ReleaseModeSelector {
  /**
   * Select release mode based on options
   */
  selectMode(options: ReleaseOptions): "local" | "remote";

  /**
   * Validate that a mode is available for a submodule
   */
  validateMode(mode: string, config: SubmoduleConfig): boolean;
}

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Error action to take
 */
export type ErrorAction = "retry" | "abort" | "continue" | "manual";

/**
 * Error resolution strategy
 */
export interface ErrorResolution {
  /** Action to take */
  action: ErrorAction;
  /** Message explaining the resolution */
  message: string;
  /** Manual steps if needed */
  manualSteps?: string[];
  /** Whether the error is retryable */
  retryable: boolean;
}

/**
 * Release error with context
 */
export interface ReleaseError extends Error {
  /** Error code */
  code?: string;
  /** Step where error occurred */
  step?: string;
  /** Whether error is retryable */
  retryable?: boolean;
}
