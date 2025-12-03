# Workflow Documentation

## Overview

This repository has been restructured to use Git submodules for each package. Each package now has its own repository with independent workflows for CI/CD, releases, and publishing.

## Repository Structure

```
ai-capabilities-suite/
├── .github/workflows/
│   └── submodule-sync.yml          # Syncs submodules
└── packages/
    ├── mcp-debugger-server/        # Submodule with own workflows
    ├── mcp-debugger-core/          # Submodule with own workflows
    ├── mcp-screenshot/             # Submodule with own workflows
    ├── vscode-mcp-debugger/        # Submodule with own workflows
    ├── vscode-mcp-screenshot/      # Submodule with own workflows
    ├── mcp-core/                   # Submodule with own workflows
    └── mcp-process/                # Submodule with own workflows
```

## Package Workflows

Each package submodule contains its own `.github/workflows/` directory with:

### Core Packages (mcp-debugger-core, mcp-core, mcp-process)
- **ci.yml**: Runs tests on multiple Node.js versions and platforms
- **release.yml**: Handles version bumping, tagging, and NPM publishing

### Server Packages (mcp-debugger-server, mcp-screenshot)
- **ci.yml**: Runs tests on multiple Node.js versions and platforms
- **release.yml**: Handles version bumping, tagging, and NPM publishing
- **docker-publish.yml**: Builds and publishes Docker images on tag push

### Binary Packages (mcp-debugger-server only)
- **build-binaries.yml**: Creates standalone binaries for Linux, macOS, and Windows

### VSCode Extensions (vscode-mcp-debugger, vscode-mcp-screenshot)
- **ci.yml**: Runs tests and packages the extension
- **publish.yml**: Publishes to VSCode Marketplace and creates GitHub releases

## Release Process

### For Individual Packages

1. Navigate to the specific package repository
2. Use the "Release" workflow dispatch with version bump type (patch/minor/major)
3. The workflow will:
   - Bump version in package.json
   - Run tests and build
   - Create Git tag
   - Publish to appropriate registry (NPM/Docker/VSCode Marketplace)
   - Create GitHub release

### For Docker Images

Docker images are automatically built and published when tags are pushed to package repositories.

### For Binaries

Binaries are automatically built when tags matching `v*.*.*` are pushed to mcp-debugger-server.

## Workflow Features

### Automated Version Management
- Version bumping via workflow dispatch
- Automatic changelog generation
- Git tagging and pushing

### Multi-Platform Testing
- Tests run on Ubuntu, Windows, and macOS
- Multiple Node.js versions (20.x, 22.x)
- Special handling for display-dependent tests (screenshot package)

### Security
- Vulnerability scanning with Trivy
- NPM provenance for published packages
- SBOM generation for Docker images

### Publishing
- **NPM**: Automatic publishing with provenance
- **Docker**: Multi-architecture builds (amd64, arm64)
- **VSCode Marketplace**: Extension publishing with VSCE
- **GitHub Releases**: Automatic release creation with changelogs

## Required Secrets

Each package repository needs these secrets configured:

### NPM Publishing
- `NPM_TOKEN`: NPM authentication token

### Docker Publishing
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_TOKEN`: Docker Hub access token

### VSCode Extensions
- `VSCE_PAT`: Visual Studio Code Extension Personal Access Token

### Optional
- `SNYK_TOKEN`: For enhanced security scanning

## Migration Benefits

1. **Independent Releases**: Each package can be released independently
2. **Focused CI/CD**: Workflows only run for relevant changes
3. **Better Security**: Isolated secrets and permissions
4. **Scalability**: Easy to add new packages
5. **Maintainability**: Clear separation of concerns

## Usage Examples

### Release a Package
```bash
# Go to package repository and use GitHub Actions UI
# Or use GitHub CLI:
gh workflow run release.yml -f version=patch
```

### Sync Submodules
```bash
# From main repository
gh workflow run submodule-sync.yml -f submodule=all
```

### Check Package Status
The submodule-sync workflow automatically generates a status report showing current commits for all packages.