# Requirements Document

## Introduction

This document specifies the requirements for an automated release system that handles the complete release lifecycle for both MCP-DEBUGGER and MCP-SCREENSHOT packages. The system will automate version management, building, testing, publishing to multiple platforms (NPM, Docker, VSCode Marketplace), Git tagging, and GitHub release creation.

## Glossary

- **Release System**: The automated tooling that orchestrates the complete release process
- **Package**: Either mcp-debugger-server or mcp-screenshot
- **Artifact**: A distributable output (NPM package, Docker image, VSCode extension, or binary)
- **Version Sync**: The process of ensuring version numbers are consistent across all files
- **Pre-flight Check**: Validation steps performed before starting a release
- **Release Manifest**: A JSON file tracking what was released and verification URLs
- **Rollback**: The process of reverting a failed release
- **Dry Run**: Executing the release process without actually publishing artifacts

## Requirements

### Requirement 1

**User Story:** As a maintainer, I want to release a package with a single command, so that I can deploy updates quickly and consistently.

#### Acceptance Criteria

1. WHEN a maintainer executes the release command with a package name and version THEN the Release System SHALL execute all release steps in sequence
2. WHEN the release command is executed THEN the Release System SHALL support both interactive and non-interactive modes
3. WHEN a release step fails THEN the Release System SHALL halt execution and report the failure
4. WHEN all release steps complete successfully THEN the Release System SHALL generate a release summary report
5. WHEN the maintainer specifies a dry-run flag THEN the Release System SHALL simulate the release without publishing artifacts

### Requirement 2

**User Story:** As a maintainer, I want automatic version synchronization across all files, so that version numbers remain consistent throughout the codebase.

#### Acceptance Criteria

1. WHEN a version is specified for release THEN the Release System SHALL update all package.json files with the new version
2. WHEN version sync executes THEN the Release System SHALL update version strings in source code files
3. WHEN version sync executes THEN the Release System SHALL update version references in Docker files
4. WHEN version sync executes THEN the Release System SHALL update version references in documentation files
5. WHEN version sync completes THEN the Release System SHALL verify all version references match the target version

### Requirement 2a

**User Story:** As a maintainer, I want a standalone version-setting command, so that I can update versions without performing a full release.

#### Acceptance Criteria

1. WHEN the set-version command is executed with a package and version THEN the Release System SHALL update the package.json version
2. WHEN the set-version command completes THEN the Release System SHALL automatically execute the sync-versions script
3. WHEN the set-version command completes THEN the Release System SHALL verify all version references are synchronized
4. WHEN the set-version command is executed THEN the Release System SHALL not perform any publishing operations
5. WHEN the set-version command is executed THEN the Release System SHALL commit the version changes to Git

### Requirement 3

**User Story:** As a maintainer, I want comprehensive pre-flight checks before releasing, so that I can catch issues before artifacts are published.

#### Acceptance Criteria

1. WHEN pre-flight checks execute THEN the Release System SHALL verify the working directory is clean with no uncommitted changes
2. WHEN pre-flight checks execute THEN the Release System SHALL verify the current branch is the main branch
3. WHEN pre-flight checks execute THEN the Release System SHALL verify all tests pass for the package
4. WHEN pre-flight checks execute THEN the Release System SHALL verify the build completes successfully
5. WHEN pre-flight checks execute THEN the Release System SHALL verify required credentials are available for publishing
6. WHEN any pre-flight check fails THEN the Release System SHALL report the failure and halt execution

### Requirement 4

**User Story:** As a maintainer, I want to publish NPM packages automatically, so that users can install via npm/npx.

#### Acceptance Criteria

1. WHEN NPM publishing executes THEN the Release System SHALL build the package with production settings
2. WHEN NPM publishing executes THEN the Release System SHALL publish the package to the NPM registry with public access
3. WHEN NPM publishing completes THEN the Release System SHALL verify the package is accessible on NPM
4. WHEN NPM publishing is in dry-run mode THEN the Release System SHALL use npm pack instead of npm publish
5. WHEN NPM credentials are missing THEN the Release System SHALL report an authentication error

### Requirement 5

**User Story:** As a maintainer, I want Docker image publishing to be optional, so that the CI system can handle it automatically when tags are pushed.

#### Acceptance Criteria

1. WHEN the release command includes a docker flag THEN the Release System SHALL build the Docker image with the correct version tag
2. WHEN Docker publishing executes THEN the Release System SHALL tag the image with version, latest, and v-prefixed tags
3. WHEN Docker publishing executes THEN the Release System SHALL push all image tags to Docker Hub
4. WHEN the docker flag is omitted THEN the Release System SHALL skip Docker publishing and rely on CI automation
5. WHEN Docker publishing completes THEN the Release System SHALL verify the images are accessible on Docker Hub

### Requirement 6

**User Story:** As a maintainer, I want to publish VSCode extensions automatically, so that users can install from the marketplace.

#### Acceptance Criteria

1. WHEN VSCode extension publishing executes THEN the Release System SHALL compile the extension TypeScript code
2. WHEN VSCode extension publishing executes THEN the Release System SHALL package the extension as a VSIX file
3. WHEN VSCode extension publishing executes THEN the Release System SHALL publish the extension to the VSCode Marketplace
4. WHEN VSCode extension publishing completes THEN the Release System SHALL verify the extension is accessible on the marketplace
5. WHEN VSCode marketplace credentials are missing THEN the Release System SHALL report an authentication error

### Requirement 7

**User Story:** As a maintainer, I want to build standalone binaries for the debugger, so that users can run it without Node.js installed.

#### Acceptance Criteria

1. WHEN binary building executes for mcp-debugger THEN the Release System SHALL build binaries for Linux x64
2. WHEN binary building executes for mcp-debugger THEN the Release System SHALL build binaries for macOS x64
3. WHEN binary building executes for mcp-debugger THEN the Release System SHALL build binaries for Windows x64
4. WHEN binary building completes THEN the Release System SHALL generate SHA256 checksums for each binary
5. WHEN binary building completes THEN the Release System SHALL compress binaries into platform-specific archives

### Requirement 8

**User Story:** As a maintainer, I want automatic Git tagging and GitHub releases, so that releases are properly tracked in version control.

#### Acceptance Criteria

1. WHEN Git operations execute THEN the Release System SHALL commit all version changes with a descriptive message
2. WHEN Git operations execute THEN the Release System SHALL create a Git tag with the package name and version
3. WHEN Git operations execute THEN the Release System SHALL push commits and tags to the remote repository
4. WHEN GitHub release creation executes THEN the Release System SHALL create a GitHub release with generated release notes
5. WHEN GitHub release creation executes for mcp-debugger THEN the Release System SHALL attach binary artifacts to the release

### Requirement 9

**User Story:** As a maintainer, I want automatic changelog generation, so that users can see what changed in each release.

#### Acceptance Criteria

1. WHEN changelog generation executes THEN the Release System SHALL extract commit messages since the last release
2. WHEN changelog generation executes THEN the Release System SHALL categorize changes by type (features, fixes, breaking changes)
3. WHEN changelog generation executes THEN the Release System SHALL format the changelog in markdown
4. WHEN changelog generation executes THEN the Release System SHALL include links to commits and pull requests
5. WHEN changelog generation completes THEN the Release System SHALL update the CHANGELOG.md file

### Requirement 10

**User Story:** As a maintainer, I want post-release verification, so that I can confirm all artifacts are accessible.

#### Acceptance Criteria

1. WHEN post-release verification executes THEN the Release System SHALL verify the NPM package is installable
2. WHEN post-release verification executes THEN the Release System SHALL verify the Docker image is pullable
3. WHEN post-release verification executes THEN the Release System SHALL verify the VSCode extension is accessible
4. WHEN post-release verification executes THEN the Release System SHALL verify the GitHub release exists
5. WHEN any verification fails THEN the Release System SHALL report the failure with remediation steps

### Requirement 11

**User Story:** As a maintainer, I want rollback capabilities, so that I can revert a failed release.

#### Acceptance Criteria

1. WHEN rollback executes THEN the Release System SHALL unpublish the NPM package if it was published
2. WHEN rollback executes THEN the Release System SHALL delete Docker image tags if they were pushed
3. WHEN rollback executes THEN the Release System SHALL unpublish the VSCode extension if it was published
4. WHEN rollback executes THEN the Release System SHALL delete the Git tag if it was created
5. WHEN rollback executes THEN the Release System SHALL delete the GitHub release if it was created

### Requirement 12

**User Story:** As a maintainer, I want a release manifest, so that I can track what was released and verify artifacts.

#### Acceptance Criteria

1. WHEN a release starts THEN the Release System SHALL create a release manifest file with metadata
2. WHEN each release step completes THEN the Release System SHALL update the manifest with step status
3. WHEN a release completes THEN the Release System SHALL include verification URLs in the manifest
4. WHEN a release completes THEN the Release System SHALL include artifact checksums in the manifest
5. WHEN a release completes THEN the Release System SHALL save the manifest to a releases directory

### Requirement 13

**User Story:** As a maintainer, I want to release both packages independently, so that I can update them on different schedules.

#### Acceptance Criteria

1. WHEN the release command specifies mcp-debugger THEN the Release System SHALL release only debugger artifacts
2. WHEN the release command specifies mcp-screenshot THEN the Release System SHALL release only screenshot artifacts
3. WHEN releasing mcp-debugger THEN the Release System SHALL include binary building steps
4. WHEN releasing mcp-screenshot THEN the Release System SHALL skip binary building steps
5. WHEN releasing either package THEN the Release System SHALL use package-specific configuration

### Requirement 14

**User Story:** As a maintainer, I want detailed logging during releases, so that I can troubleshoot issues.

#### Acceptance Criteria

1. WHEN a release executes THEN the Release System SHALL log each step with timestamps
2. WHEN a release executes THEN the Release System SHALL log command outputs for debugging
3. WHEN a release executes THEN the Release System SHALL save logs to a file
4. WHEN a release fails THEN the Release System SHALL highlight error messages in the log
5. WHEN a release completes THEN the Release System SHALL provide a summary of all steps executed

### Requirement 15

**User Story:** As a maintainer, I want to validate release notes before publishing, so that I can ensure quality documentation.

#### Acceptance Criteria

1. WHEN release notes are generated THEN the Release System SHALL display them for review
2. WHEN in interactive mode THEN the Release System SHALL allow editing release notes before publishing
3. WHEN release notes are empty THEN the Release System SHALL warn the maintainer
4. WHEN release notes are approved THEN the Release System SHALL use them for the GitHub release
5. WHEN in non-interactive mode THEN the Release System SHALL use generated release notes without prompting
