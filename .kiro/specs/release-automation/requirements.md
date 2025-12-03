# Requirements Document

## Introduction

This document specifies the requirements for an automated release coordination system for the AI Capabilities Suite monorepo. The system manages releases across multiple independent Git submodule repositories, each with their own GitHub workflows, versioning, and release processes. The system provides both local release capabilities and coordination with GitHub Actions workflows in submodule repositories.

## Glossary

- **Monorepo**: The main ai-capabilities-suite repository that contains submodules
- **Submodule**: An independent Git repository linked as a submodule (e.g., mcp-debugger-server, mcp-screenshot)
- **Submodule Repository**: The standalone GitHub repository for a submodule package
- **Release Coordinator**: The tooling in the monorepo that orchestrates releases across submodules
- **Local Release**: Releasing a submodule directly from the monorepo without using GitHub Actions
- **Remote Release**: Triggering a submodule's GitHub Actions workflow to perform the release
- **Package**: A distributable submodule (e.g., mcp-debugger-server, mcp-screenshot, vscode-mcp-debugger)
- **Artifact**: A distributable output (NPM package, Docker image, VSCode extension, or binary)
- **Release Manifest**: A JSON file tracking releases across all submodules

## Requirements

### Requirement 1

**User Story:** As a maintainer, I want to release a submodule package with a single command from the monorepo, so that I can deploy updates without navigating to individual submodule directories.

#### Acceptance Criteria

1. WHEN a maintainer executes the release command with a submodule name and version THEN the Release Coordinator SHALL execute the release for that specific submodule
2. WHEN the release command is executed THEN the Release Coordinator SHALL support both local and remote release modes
3. WHEN a release fails THEN the Release Coordinator SHALL report the failure with actionable error messages
4. WHEN a release completes successfully THEN the Release Coordinator SHALL generate a release summary report
5. WHEN the maintainer specifies a dry-run flag THEN the Release Coordinator SHALL simulate the release without publishing artifacts

### Requirement 2

**User Story:** As a maintainer, I want to trigger GitHub Actions workflows in submodule repositories, so that releases can be performed by CI/CD infrastructure.

#### Acceptance Criteria

1. WHEN a remote release is requested THEN the Release Coordinator SHALL trigger the workflow_dispatch event in the submodule repository
2. WHEN triggering a remote release THEN the Release Coordinator SHALL pass the version bump type (patch, minor, major) as input
3. WHEN triggering a remote release THEN the Release Coordinator SHALL support dry-run mode via workflow inputs
4. WHEN a remote release is triggered THEN the Release Coordinator SHALL monitor the workflow run status
5. WHEN a remote workflow completes THEN the Release Coordinator SHALL report the final status (success or failure)

### Requirement 3

**User Story:** As a maintainer, I want to perform local releases from the monorepo, so that I can release packages without depending on GitHub Actions.

#### Acceptance Criteria

1. WHEN a local release is requested THEN the Release Coordinator SHALL navigate to the submodule directory
2. WHEN performing a local release THEN the Release Coordinator SHALL execute version bumping in the submodule
3. WHEN performing a local release THEN the Release Coordinator SHALL build and test the submodule package
4. WHEN performing a local release THEN the Release Coordinator SHALL publish artifacts (NPM, Docker, VSCode) based on package configuration
5. WHEN performing a local release THEN the Release Coordinator SHALL create Git tags and GitHub releases in the submodule repository

### Requirement 4

**User Story:** As a maintainer, I want automatic version synchronization within submodules, so that version numbers remain consistent across package files.

#### Acceptance Criteria

1. WHEN a version is bumped in a submodule THEN the Release Coordinator SHALL update the package.json version
2. WHEN version sync executes THEN the Release Coordinator SHALL update version strings in source code files
3. WHEN version sync executes THEN the Release Coordinator SHALL update version references in Docker files
4. WHEN version sync executes THEN the Release Coordinator SHALL update version references in documentation files
5. WHEN version sync completes THEN the Release Coordinator SHALL verify all version references match the target version

### Requirement 5

**User Story:** As a maintainer, I want comprehensive pre-flight checks before releasing, so that I can catch issues before artifacts are published.

#### Acceptance Criteria

1. WHEN pre-flight checks execute THEN the Release Coordinator SHALL verify the submodule working directory is clean
2. WHEN pre-flight checks execute THEN the Release Coordinator SHALL verify the submodule is on the main branch
3. WHEN pre-flight checks execute THEN the Release Coordinator SHALL verify all tests pass for the submodule
4. WHEN pre-flight checks execute THEN the Release Coordinator SHALL verify the build completes successfully
5. WHEN pre-flight checks execute for local releases THEN the Release Coordinator SHALL verify required credentials are available
6. WHEN any pre-flight check fails THEN the Release Coordinator SHALL report the failure and halt execution

### Requirement 6

**User Story:** As a maintainer, I want to publish NPM packages from local releases, so that users can install via npm/npx.

#### Acceptance Criteria

1. WHEN NPM publishing executes locally THEN the Release Coordinator SHALL build the package with production settings
2. WHEN NPM publishing executes locally THEN the Release Coordinator SHALL publish the package to the NPM registry with public access
3. WHEN NPM publishing completes THEN the Release Coordinator SHALL verify the package is accessible on NPM
4. WHEN NPM publishing is in dry-run mode THEN the Release Coordinator SHALL use npm pack instead of npm publish
5. WHEN NPM credentials are missing THEN the Release Coordinator SHALL report an authentication error

### Requirement 7

**User Story:** As a maintainer, I want Docker images to be published automatically when tags are pushed, so that Docker deployment is handled by CI/CD.

#### Acceptance Criteria

1. WHEN a Git tag is pushed to a submodule repository THEN the submodule's GitHub Actions SHALL automatically build the Docker image
2. WHEN Docker publishing executes via GitHub Actions THEN the workflow SHALL tag the image with version, latest, and v-prefixed tags
3. WHEN Docker publishing executes via GitHub Actions THEN the workflow SHALL push all image tags to Docker Hub
4. WHEN performing a local release THEN the Release Coordinator SHALL optionally build and push Docker images if requested
5. WHEN Docker publishing completes THEN the Release Coordinator SHALL verify the images are accessible on Docker Hub

### Requirement 8

**User Story:** As a maintainer, I want to publish VSCode extensions from local releases, so that users can install from the marketplace.

#### Acceptance Criteria

1. WHEN VSCode extension publishing executes locally THEN the Release Coordinator SHALL compile the extension TypeScript code
2. WHEN VSCode extension publishing executes locally THEN the Release Coordinator SHALL package the extension as a VSIX file
3. WHEN VSCode extension publishing executes locally THEN the Release Coordinator SHALL publish the extension to the VSCode Marketplace
4. WHEN VSCode extension publishing completes THEN the Release Coordinator SHALL verify the extension is accessible on the marketplace
5. WHEN VSCode marketplace credentials are missing THEN the Release Coordinator SHALL report an authentication error

### Requirement 9

**User Story:** As a maintainer, I want to build standalone binaries for the debugger, so that users can run it without Node.js installed.

#### Acceptance Criteria

1. WHEN binary building executes for mcp-debugger-server THEN the Release Coordinator SHALL build binaries for Linux x64
2. WHEN binary building executes for mcp-debugger-server THEN the Release Coordinator SHALL build binaries for macOS x64
3. WHEN binary building executes for mcp-debugger-server THEN the Release Coordinator SHALL build binaries for Windows x64
4. WHEN binary building completes THEN the Release Coordinator SHALL generate SHA256 checksums for each binary
5. WHEN binary building completes THEN the Release Coordinator SHALL attach binaries to the GitHub release

### Requirement 10

**User Story:** As a maintainer, I want automatic Git tagging and GitHub releases in submodule repositories, so that releases are properly tracked in version control.

#### Acceptance Criteria

1. WHEN Git operations execute THEN the Release Coordinator SHALL commit version changes in the submodule
2. WHEN Git operations execute THEN the Release Coordinator SHALL create a Git tag with the version (e.g., v1.2.3)
3. WHEN Git operations execute THEN the Release Coordinator SHALL push commits and tags to the submodule's remote repository
4. WHEN GitHub release creation executes THEN the Release Coordinator SHALL create a GitHub release in the submodule repository
5. WHEN GitHub release creation executes for mcp-debugger-server THEN the Release Coordinator SHALL attach binary artifacts to the release

### Requirement 11

**User Story:** As a maintainer, I want automatic changelog generation, so that users can see what changed in each release.

#### Acceptance Criteria

1. WHEN changelog generation executes THEN the Release Coordinator SHALL extract commit messages since the last release in the submodule
2. WHEN changelog generation executes THEN the Release Coordinator SHALL categorize changes by type (features, fixes, breaking changes)
3. WHEN changelog generation executes THEN the Release Coordinator SHALL format the changelog in markdown
4. WHEN changelog generation executes THEN the Release Coordinator SHALL include links to commits and pull requests in the submodule repository
5. WHEN changelog generation completes THEN the Release Coordinator SHALL use the changelog for the GitHub release notes

### Requirement 12

**User Story:** As a maintainer, I want post-release verification, so that I can confirm all artifacts are accessible.

#### Acceptance Criteria

1. WHEN post-release verification executes THEN the Release Coordinator SHALL verify the NPM package is installable
2. WHEN post-release verification executes THEN the Release Coordinator SHALL verify the Docker image is pullable
3. WHEN post-release verification executes for VSCode extensions THEN the Release Coordinator SHALL verify the extension is accessible
4. WHEN post-release verification executes THEN the Release Coordinator SHALL verify the GitHub release exists in the submodule repository
5. WHEN any verification fails THEN the Release Coordinator SHALL report the failure with remediation steps

### Requirement 13

**User Story:** As a maintainer, I want to track releases across all submodules, so that I can see the release history of the entire suite.

#### Acceptance Criteria

1. WHEN a release completes THEN the Release Coordinator SHALL create or update a release manifest in the monorepo
2. WHEN updating the manifest THEN the Release Coordinator SHALL record the submodule name, version, and timestamp
3. WHEN updating the manifest THEN the Release Coordinator SHALL include verification URLs for all published artifacts
4. WHEN updating the manifest THEN the Release Coordinator SHALL include artifact checksums where applicable
5. WHEN updating the manifest THEN the Release Coordinator SHALL commit the manifest to the monorepo

### Requirement 14

**User Story:** As a maintainer, I want to update submodule references in the monorepo, so that the monorepo tracks the latest released versions.

#### Acceptance Criteria

1. WHEN a submodule release completes THEN the Release Coordinator SHALL update the submodule reference to the new commit
2. WHEN updating submodule references THEN the Release Coordinator SHALL commit the change to the monorepo
3. WHEN updating submodule references THEN the Release Coordinator SHALL include the release version in the commit message
4. WHEN the maintainer requests THEN the Release Coordinator SHALL optionally skip updating submodule references
5. WHEN submodule references are updated THEN the Release Coordinator SHALL verify the submodule is at the correct commit

### Requirement 15

**User Story:** As a maintainer, I want detailed logging during releases, so that I can troubleshoot issues.

#### Acceptance Criteria

1. WHEN a release executes THEN the Release Coordinator SHALL log each step with timestamps
2. WHEN a release executes THEN the Release Coordinator SHALL log command outputs for debugging
3. WHEN a release executes THEN the Release Coordinator SHALL save logs to a file in the monorepo
4. WHEN a release fails THEN the Release Coordinator SHALL highlight error messages in the log
5. WHEN a release completes THEN the Release Coordinator SHALL provide a summary of all steps executed

### Requirement 16

**User Story:** As a maintainer, I want to release multiple submodules in sequence, so that I can coordinate releases across the suite.

#### Acceptance Criteria

1. WHEN multiple submodules are specified THEN the Release Coordinator SHALL release them in the specified order
2. WHEN releasing multiple submodules THEN the Release Coordinator SHALL wait for each release to complete before starting the next
3. WHEN a submodule release fails in a multi-release THEN the Release Coordinator SHALL halt and report which submodule failed
4. WHEN all submodule releases complete THEN the Release Coordinator SHALL generate a combined release summary
5. WHEN releasing multiple submodules THEN the Release Coordinator SHALL update the monorepo manifest with all releases

### Requirement 17

**User Story:** As a maintainer, I want to configure release behavior per submodule, so that different packages can have different release processes.

#### Acceptance Criteria

1. WHEN loading configuration THEN the Release Coordinator SHALL read submodule-specific configuration files
2. WHEN configuration specifies build steps THEN the Release Coordinator SHALL execute those steps for that submodule
3. WHEN configuration specifies artifact types THEN the Release Coordinator SHALL publish only those artifact types
4. WHEN configuration specifies binary building THEN the Release Coordinator SHALL build binaries only for configured submodules
5. WHEN configuration is missing for a submodule THEN the Release Coordinator SHALL use sensible defaults

### Requirement 18

**User Story:** As a maintainer, I want to validate release notes before publishing, so that I can ensure quality documentation.

#### Acceptance Criteria

1. WHEN release notes are generated THEN the Release Coordinator SHALL display them for review
2. WHEN in interactive mode THEN the Release Coordinator SHALL allow editing release notes before publishing
3. WHEN release notes are empty THEN the Release Coordinator SHALL warn the maintainer
4. WHEN release notes are approved THEN the Release Coordinator SHALL use them for the GitHub release
5. WHEN in non-interactive mode THEN the Release Coordinator SHALL use generated release notes without prompting
