# Release Automation System

This directory contains the shared modules for the automated release system that handles the complete release lifecycle for MCP packages.

## Architecture

The release automation system follows a modular pipeline architecture:

```
Release CLI (release.js)
├── Configuration Loader (config-loader.js)
├── Pre-flight Checker (preflight-checker.js)
├── Version Manager (version-manager.js)
├── Build Pipeline
│   ├── NPM Builder (builders/npm-builder.js)
│   ├── Binary Builder (builders/binary-builder.js)
│   └── VSCode Extension Builder (builders/vscode-builder.js)
├── Publishing Pipeline
│   ├── NPM Publisher (publishers/npm-publisher.js)
│   ├── Docker Publisher (publishers/docker-publisher.js)
│   └── VSCode Marketplace Publisher (publishers/vscode-publisher.js)
├── Git Operations (git-operations.js)
├── Verification Pipeline (verification-pipeline.js)
├── Changelog Generator (changelog-generator.js)
├── Release Manifest Writer (manifest-writer.js)
├── Error Handler (error-handler.js)
└── Logger (logger.js)
```

## Modules

### Core Modules

- **config-loader.js** - Loads and validates package-specific configuration
- **preflight-checker.js** - Validates environment before release
- **version-manager.js** - Synchronizes versions across all files
- **logger.js** - Structured logging with file and console output
- **error-handler.js** - Error handling and rollback logic

### Build Modules

- **builders/npm-builder.js** - Builds NPM packages
- **builders/binary-builder.js** - Builds standalone binaries (debugger only)
- **builders/vscode-builder.js** - Compiles and packages VSCode extensions

### Publishing Modules

- **publishers/npm-publisher.js** - Publishes to NPM registry
- **publishers/docker-publisher.js** - Builds and pushes Docker images
- **publishers/vscode-publisher.js** - Publishes to VSCode marketplace

### Release Modules

- **git-operations.js** - Git commits, tags, and GitHub releases
- **changelog-generator.js** - Generates release notes from commits
- **verification-pipeline.js** - Verifies published artifacts
- **manifest-writer.js** - Tracks release metadata

## Type Definitions

All TypeScript/JSDoc type definitions are in `types.js` for IDE support and type checking.

## Usage

These modules are used by the main release CLI scripts:

```bash
# Full release
node scripts/release.js <package> <version> [options]

# Set version only
node scripts/set-version.js <package> <version>
```

See the main README in the scripts directory for detailed usage instructions.

## Testing

Tests for these modules are located in `scripts/__tests__/`:

- `unit/` - Unit tests for individual modules
- `integration/` - Integration tests for pipelines
- `property/` - Property-based tests for correctness properties

## Configuration

Package-specific configurations are stored in `scripts/release-config/`:

- `debugger.json` - Configuration for mcp-debugger-server
- `screenshot.json` - Configuration for mcp-screenshot

Each configuration defines:
- Package names and directories
- Build and test commands
- Files to sync versions in
- GitHub release template
- Binary build settings (if applicable)
