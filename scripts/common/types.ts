/**
 * Common type definitions for build and release scripts
 */

/**
 * Represents a file update operation with pattern matching
 */
export interface FileUpdate {
  /** Package name this update belongs to */
  package?: string;
  /** Path to the file to update */
  path: string;
  /** Regular expression pattern to match */
  pattern: RegExp;
  /** Replacement string (can include capture groups like $1) */
  replacement: string;
  /** Whether this file is optional (won't error if missing) */
  optional?: boolean;
}

/**
 * Result of executing a shell command
 */
export interface ExecResult {
  /** Standard output from the command */
  stdout: string;
  /** Standard error from the command */
  stderr: string;
  /** Exit code (0 for success) */
  exitCode: number;
}

/**
 * Semantic version information
 */
export interface VersionInfo {
  /** Major version number */
  major: number;
  /** Minor version number */
  minor: number;
  /** Patch version number */
  patch: number;
  /** Pre-release identifier (e.g., 'alpha', 'beta') */
  prerelease?: string;
  /** Build metadata */
  build?: string;
}

/**
 * Package information from package.json
 */
export interface PackageInfo {
  /** Package name */
  name: string;
  /** Current version */
  version: string;
  /** Directory path relative to project root */
  directory: string;
  /** Full package.json content */
  packageJson?: Record<string, unknown>;
}

/**
 * Build target configuration for binary compilation
 */
export interface BuildTarget {
  /** Target platform (linux, macos, windows) */
  platform: string;
  /** Target architecture (x64, arm64) */
  arch: string;
  /** pkg target string (e.g., 'node18-linux-x64') */
  target: string;
  /** Output filename */
  outputName: string;
}

/**
 * Changelog entry representing a single commit
 */
export interface ChangelogEntry {
  /** Type of change (feature, fix, breaking, etc.) */
  type:
    | "feature"
    | "fix"
    | "breaking"
    | "docs"
    | "performance"
    | "refactor"
    | "test"
    | "chore"
    | "other";
  /** Scope of the change (optional) */
  scope?: string;
  /** Commit message */
  message: string;
  /** Short commit hash */
  hash: string;
  /** Full commit body (optional) */
  body?: string;
}

/**
 * Options for build-binaries script
 */
export interface BuildBinariesOptions {
  /** Platforms to build for (defaults to all) */
  platforms?: string[];
  /** Output directory for binaries */
  outputDir?: string;
  /** Whether to clean output directory first */
  clean?: boolean;
}

/**
 * Options for generate-changelog script
 */
export interface GenerateChangelogOptions {
  /** Starting git tag/ref */
  fromTag?: string;
  /** Ending git tag/ref (defaults to HEAD) */
  toTag?: string;
  /** Output file path */
  outputFile?: string;
}

/**
 * Options for set-version script
 */
export interface SetVersionOptions {
  /** Version string to set */
  version: string;
  /** Dry run mode (don't actually write files) */
  dryRun?: boolean;
  /** Specific packages to update (defaults to all) */
  packages?: string[];
}

/**
 * Options for sync-versions script
 */
export interface SyncVersionsOptions {
  /** Specific package to sync (debugger, screenshot, or undefined for all) */
  package?: string;
  /** Verify mode (check without updating) */
  verify?: boolean;
}

/**
 * Result of a version sync operation
 */
export interface SyncResult {
  /** Number of files updated */
  updatedCount: number;
  /** Number of files skipped */
  skippedCount: number;
  /** Number of errors encountered */
  errorCount: number;
  /** List of updated file paths */
  filesUpdated: string[];
  /** List of error messages */
  errors: string[];
}
