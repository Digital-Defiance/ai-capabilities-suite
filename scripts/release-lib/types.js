/**
 * @fileoverview Type definitions for the release automation system
 * These JSDoc types provide IDE support and type checking
 */

/**
 * @typedef {Object} VersionSyncFile
 * @property {string} path - Path to the file to sync
 * @property {string|RegExp} pattern - Pattern to match for replacement
 * @property {string} replacement - Replacement string (can use $VERSION placeholder)
 */

/**
 * @typedef {Object} ReleaseConfig
 * @property {string} packageName - Short name (e.g., 'debugger', 'screenshot')
 * @property {string} npmPackageName - Full NPM package name
 * @property {string} vscodeExtensionName - VSCode extension name
 * @property {string} dockerImageName - Docker image name
 * @property {string} packageDir - Path to package directory
 * @property {string} vscodeExtensionDir - Path to VSCode extension directory
 * @property {boolean} buildBinaries - Whether to build standalone binaries
 * @property {string[]} [binaryPlatforms] - Platforms to build binaries for
 * @property {string} testCommand - Command to run tests
 * @property {string} buildCommand - Command to build the package
 * @property {VersionSyncFile[]} filesToSync - Files to sync versions in
 * @property {string} githubReleaseTemplate - Template for GitHub release notes
 */

/**
 * @typedef {Object} ReleaseOptions
 * @property {'debugger'|'screenshot'} package - Package to release
 * @property {string} version - Version to release (semver format)
 * @property {boolean} dryRun - Simulate release without publishing
 * @property {boolean} skipTests - Skip test execution
 * @property {boolean} skipBuild - Skip build step
 * @property {boolean} includeDocker - Include Docker image publishing
 * @property {boolean} nonInteractive - Run without prompts
 * @property {boolean} skipVerify - Skip post-release verification
 * @property {string} [logFile] - Custom log file path
 */

/**
 * @typedef {Object} CheckResult
 * @property {string} name - Name of the check
 * @property {boolean} passed - Whether the check passed
 * @property {string} [message] - Optional message with details
 */

/**
 * @typedef {Object} PreflightResult
 * @property {boolean} passed - Whether all checks passed
 * @property {CheckResult[]} checks - Individual check results
 */

/**
 * @typedef {Object} SyncResult
 * @property {string[]} filesUpdated - List of files that were updated
 * @property {string[]} errors - List of errors encountered
 */

/**
 * @typedef {Object} BuildResult
 * @property {boolean} success - Whether the build succeeded
 * @property {string} [output] - Build output
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} TestResult
 * @property {boolean} success - Whether tests passed
 * @property {string} [output] - Test output
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} BinaryArtifact
 * @property {string} platform - Platform name (e.g., 'linux-x64')
 * @property {string} path - Path to the binary file
 * @property {number} size - File size in bytes
 */

/**
 * @typedef {Object} BinaryResult
 * @property {BinaryArtifact[]} binaries - Built binary artifacts
 * @property {Map<string, string>} checksums - SHA256 checksums for each binary
 */

/**
 * @typedef {Object} PublishResult
 * @property {boolean} success - Whether publishing succeeded
 * @property {string} [url] - URL to published artifact
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} GithubReleaseData
 * @property {string} tag - Git tag name
 * @property {string} name - Release name
 * @property {string} body - Release notes (markdown)
 * @property {boolean} draft - Whether this is a draft release
 * @property {boolean} prerelease - Whether this is a prerelease
 */

/**
 * @typedef {Object} CommitInfo
 * @property {string} hash - Commit hash
 * @property {string} message - Commit message
 * @property {string} author - Commit author
 * @property {Date} date - Commit date
 * @property {number} [pr] - Pull request number if applicable
 */

/**
 * @typedef {Object} Changelog
 * @property {CommitInfo[]} features - Feature commits
 * @property {CommitInfo[]} fixes - Bug fix commits
 * @property {CommitInfo[]} breaking - Breaking change commits
 * @property {CommitInfo[]} other - Other commits
 */

/**
 * @typedef {Object} ArtifactInfo
 * @property {boolean} published - Whether the artifact was published
 * @property {string} url - URL to the artifact
 * @property {string} [checksum] - SHA256 checksum if applicable
 */

/**
 * @typedef {Object} VerificationCheck
 * @property {boolean} passed - Whether verification passed
 * @property {string} url - URL that was verified
 * @property {string} [message] - Optional message with details
 */

/**
 * @typedef {Object} VerificationResult
 * @property {VerificationCheck} npm - NPM package verification
 * @property {VerificationCheck} [docker] - Docker image verification (optional)
 * @property {VerificationCheck} vscode - VSCode extension verification
 * @property {VerificationCheck} github - GitHub release verification
 */

/**
 * @typedef {Object} ReleaseManifest
 * @property {string} package - Package name
 * @property {string} version - Version released
 * @property {string} timestamp - ISO timestamp of release
 * @property {Object} artifacts - Published artifacts
 * @property {ArtifactInfo} [artifacts.npm] - NPM package info
 * @property {ArtifactInfo} [artifacts.docker] - Docker image info
 * @property {ArtifactInfo} [artifacts.vscode] - VSCode extension info
 * @property {BinaryArtifact[]} [artifacts.binaries] - Binary artifacts
 * @property {ArtifactInfo} [artifacts.github] - GitHub release info
 * @property {VerificationResult} verification - Verification results
 * @property {string} changelog - Generated changelog
 */

/**
 * @typedef {'pending'|'running'|'success'|'failed'|'skipped'} StepStatus
 */

/**
 * @typedef {Object} StepResult
 * @property {string} name - Step name
 * @property {StepStatus} status - Step status
 * @property {Date} [startTime] - When the step started
 * @property {Date} [endTime] - When the step ended
 * @property {Error} [error] - Error if step failed
 * @property {string} [output] - Step output
 */

/**
 * @typedef {Object} ReleaseState
 * @property {ReleaseOptions} options - Release options
 * @property {ReleaseConfig} config - Package configuration
 * @property {Date} startTime - When the release started
 * @property {StepResult[]} steps - Results of each step
 * @property {ReleaseManifest} [manifest] - Release manifest
 * @property {boolean} rollbackNeeded - Whether rollback is needed
 */

/**
 * @typedef {'retry'|'rollback'|'abort'|'continue'} ErrorAction
 */

/**
 * @typedef {Object} ErrorResolution
 * @property {ErrorAction} action - Action to take
 * @property {string} message - Message explaining the resolution
 * @property {string[]} [manualSteps] - Manual steps if needed
 */

module.exports = {};
