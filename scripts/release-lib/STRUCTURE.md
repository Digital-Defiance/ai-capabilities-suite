# Release Library Structure

This directory contains the release automation system for the AI Capabilities Suite monorepo.

## Directory Structure

```
release-lib/
├── types.ts                    # TypeScript type definitions
├── index.ts                    # Main entry point
├── config-loader.ts            # Configuration loader
├── release-mode-selector.ts    # Release mode selection logic
│
├── local-release/              # Local release pipeline
│   ├── preflight-checker.ts    # Pre-flight validation
│   ├── version-manager.ts      # Version bumping and syncing
│   ├── build-pipeline.ts       # Build orchestration
│   ├── binary-builder.ts       # Standalone binary building
│   ├── vscode-builder.ts       # VSCode extension building
│   ├── npm-publisher.ts        # NPM publishing
│   ├── docker-publisher.ts     # Docker image publishing
│   ├── vscode-publisher.ts     # VSCode marketplace publishing
│   └── git-operations.ts       # Git and GitHub operations
│
├── remote-release/             # Remote release pipeline
│   ├── github-api-client.ts    # GitHub API integration
│   └── workflow-monitor.ts     # Workflow status monitoring
│
├── shared/                     # Shared utilities
│   ├── verification-pipeline.ts        # Post-release verification
│   ├── changelog-generator.ts          # Changelog generation
│   ├── manifest-writer.ts              # Release manifest management
│   ├── submodule-reference-updater.ts  # Submodule reference updates
│   └── logger.ts                       # Structured logging
│
├── builders/                   # Legacy builders (to be migrated)
│   ├── binary-builder.js
│   ├── npm-builder.js
│   └── vscode-builder.js
│
├── publishers/                 # Legacy publishers (to be migrated)
│   ├── docker-publisher.js
│   ├── npm-publisher.js
│   └── vscode-publisher.js
│
└── __tests__/                  # Test files
    ├── unit/                   # Unit tests
    ├── integration/            # Integration tests
    └── property/               # Property-based tests
```

## Type System

All types are defined in `types.ts` and exported through `index.ts`. The type system provides:

- **Configuration Types**: `SubmoduleConfig`, `VersionSyncFile`
- **Release Types**: `ReleaseOptions`, `ReleaseState`, `ReleaseArtifacts`
- **Pipeline Types**: Interfaces for each pipeline component
- **Result Types**: Standardized result types for operations
- **Error Types**: Error handling and resolution types

## Usage

```typescript
import {
  SubmoduleConfig,
  ReleaseOptions,
  PreflightChecker,
  VersionManager,
  // ... other types and interfaces
} from "./release-lib";
```

## Development Guidelines

1. **Type Safety**: All new modules must use TypeScript and export proper types
2. **Interface Compliance**: Implement the interfaces defined in `types.ts`
3. **Error Handling**: Use the `ReleaseError` type for consistent error handling
4. **Testing**: Write unit tests, integration tests, and property-based tests
5. **Documentation**: Document all public APIs with JSDoc comments

## Migration Plan

The existing JavaScript modules in `builders/` and `publishers/` will be gradually migrated to TypeScript and reorganized into the new structure:

- `builders/binary-builder.js` → `local-release/binary-builder.ts`
- `builders/vscode-builder.js` → `local-release/vscode-builder.ts`
- `publishers/npm-publisher.js` → `local-release/npm-publisher.ts`
- `publishers/docker-publisher.js` → `local-release/docker-publisher.ts`
- `publishers/vscode-publisher.js` → `local-release/vscode-publisher.ts`

## Configuration

Configuration files are stored in `../release-config/`:

- `mcp-debugger-server.json` - Debugger package configuration
- `mcp-screenshot.json` - Screenshot package configuration
- `vscode-mcp-debugger.json` - VSCode debugger extension configuration
- `defaults.json` - Default configuration values

## Testing

Tests are organized by type:

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test component interactions
- **Property-Based Tests**: Test universal properties using fast-check

Run tests with:

```bash
npm test scripts/release-lib
```

## Release Modes

The system supports two release modes:

1. **Local Release**: Execute all steps from the monorepo

   - Build, test, and publish directly
   - Requires local credentials
   - Full control over the process

2. **Remote Release**: Trigger GitHub Actions workflows
   - Delegate to CI/CD infrastructure
   - Monitor workflow execution
   - Verify results after completion
