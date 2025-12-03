# Release Automation Scripts

Automated release system for MCP packages in the AI Capabilities Suite monorepo.

## Overview

This release automation system provides a unified command-line interface for releasing both MCP-DEBUGGER and MCP-SCREENSHOT packages. It orchestrates the complete release lifecycle including:

- ✅ Version synchronization across all files
- ✅ Pre-flight validation (tests, builds, credentials)
- ✅ Building artifacts (NPM packages, binaries, VSCode extensions)
- ✅ Publishing to multiple platforms (NPM, Docker, VSCode Marketplace)
- ✅ Git tagging and GitHub releases
- ✅ Post-release verification
- ✅ Automatic changelog generation
- ✅ Rollback capabilities
- ✅ Dry-run mode for testing

## Quick Start

### Full Release

```bash
# Release debugger package
node scripts/release.js debugger 1.2.0

# Release screenshot package
node scripts/release.js screenshot 1.0.1

# Dry run (no actual publishing)
node scripts/release.js debugger 1.2.0 --dry-run

# Include Docker publishing
node scripts/release.js debugger 1.2.0 --docker

# Non-interactive mode (for CI)
node scripts/release.js debugger 1.2.0 --non-interactive
```

### Set Version Only

```bash
# Update version without releasing
node scripts/set-version.js debugger 1.2.0
node scripts/set-version.js screenshot 1.0.1
```

## Commands

### release.js

Main release orchestrator that handles the complete release process.

**Usage:**
```bash
node scripts/release.js <package> <version> [options]
```

**Arguments:**
- `package` - Package to release: `debugger` or `screenshot`
- `version` - Version to release (semver format, e.g., `1.2.0`)

**Options:**
- `--dry-run` - Simulate release without publishing
- `--skip-tests` - Skip test execution (not recommended)
- `--skip-build` - Skip build step (not recommended)
- `--docker` - Include Docker image publishing
- `--non-interactive` - Run without prompts (use defaults)
- `--skip-verify` - Skip post-release verification
- `--log-file <path>` - Custom log file path

**Examples:**
```bash
# Standard release
node scripts/release.js debugger 1.2.0

# Dry run to test the process
node scripts/release.js debugger 1.2.0 --dry-run

# Release with Docker images
node scripts/release.js debugger 1.2.0 --docker

# Non-interactive for CI/CD
node scripts/release.js debugger 1.2.0 --non-interactive --docker
```

### set-version.js

Updates version numbers across all files without performing a release.

**Usage:**
```bash
node scripts/set-version.js <package> <version>
```

**Arguments:**
- `package` - Package to update: `debugger` or `screenshot`
- `version` - New version (semver format)

**Examples:**
```bash
# Update debugger version
node scripts/set-version.js debugger 1.2.0

# Update screenshot version
node scripts/set-version.js screenshot 1.0.1
```

This command:
1. Updates the package.json version
2. Runs sync-versions script to update all references
3. Commits the changes to Git
4. Does NOT publish or create releases

## Release Process

The release system follows this pipeline:

1. **Configuration Loading** - Load package-specific settings
2. **Pre-flight Checks** - Validate environment
   - Git working directory is clean
   - On main branch
   - Tests pass
   - Build succeeds
   - Credentials available
3. **Version Sync** - Update versions in all files
4. **Build Pipeline** - Build all artifacts
   - NPM package
   - Binaries (debugger only)
   - VSCode extension
5. **Publishing Pipeline** - Publish to platforms
   - NPM registry
   - Docker Hub (optional)
   - VSCode Marketplace
6. **Git Operations** - Version control
   - Commit version changes
   - Create Git tag
   - Push to remote
   - Create GitHub release
7. **Verification** - Verify all artifacts are accessible
8. **Manifest** - Save release metadata

If any step fails, the system can rollback published artifacts.

## Configuration

Package configurations are stored in `release-config/`:

- `debugger.json` - MCP Debugger configuration
- `screenshot.json` - MCP Screenshot configuration

Each configuration defines:
- Package names and paths
- Build/test commands
- Files to sync versions in
- GitHub release template
- Binary build settings

## Environment Variables

Required credentials (set in your environment or CI):

```bash
# NPM publishing
NPM_TOKEN=your-npm-token

# VSCode Marketplace
VSCE_PAT=your-vscode-token

# Docker Hub (if using --docker)
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password

# GitHub releases
GITHUB_TOKEN=your-github-token
```

## Dry Run Mode

Always test releases with `--dry-run` first:

```bash
node scripts/release.js debugger 1.2.0 --dry-run
```

Dry run mode:
- ✅ Runs all pre-flight checks
- ✅ Builds all artifacts
- ✅ Simulates publishing (npm pack instead of publish)
- ❌ Does NOT publish to registries
- ❌ Does NOT create Git tags
- ❌ Does NOT create GitHub releases

## Rollback

If a release fails, the system automatically attempts to rollback:

1. Delete GitHub release (if created)
2. Delete Git tag (if created)
3. Unpublish VSCode extension (if possible)
4. Delete Docker tags (if pushed)
5. Unpublish NPM package (if within time window)

Manual rollback may be needed for some operations.

## Logs

Release logs are saved to:
- `releases/<package>-<version>-<timestamp>.log`

Logs include:
- Timestamps for each step
- Command outputs
- Error messages
- Verification results

## Release Manifest

Each release creates a manifest file:
- `releases/<package>-<version>-manifest.json`

The manifest contains:
- Package and version info
- Published artifact URLs
- Verification results
- Checksums
- Changelog

## Troubleshooting

### Pre-flight Check Failures

**Dirty Git State:**
```bash
git status
git add .
git commit -m "Prepare for release"
```

**Tests Failing:**
```bash
npm test
# Fix failing tests before releasing
```

**Missing Credentials:**
```bash
# Check environment variables
echo $NPM_TOKEN
echo $VSCE_PAT
echo $GITHUB_TOKEN
```

### Publishing Failures

If publishing fails, check:
1. Credentials are valid
2. Package name is available
3. Version doesn't already exist
4. Network connectivity

### Verification Failures

If verification fails:
1. Wait a few minutes (propagation delay)
2. Check registry status pages
3. Manually verify URLs in manifest

## CI/CD Integration

For automated releases in CI:

```yaml
# Example GitHub Actions workflow
- name: Release Package
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    VSCE_PAT: ${{ secrets.VSCE_PAT }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    node scripts/release.js debugger ${{ github.ref_name }} --non-interactive
```

## Development

### Project Structure

```
scripts/
├── release.js              # Main release CLI
├── set-version.js          # Version setter CLI
├── release-lib/            # Shared modules
│   ├── types.js           # Type definitions
│   ├── config-loader.js
│   ├── preflight-checker.js
│   ├── version-manager.js
│   ├── builders/
│   ├── publishers/
│   ├── git-operations.js
│   ├── verification-pipeline.js
│   ├── changelog-generator.js
│   ├── manifest-writer.js
│   ├── error-handler.js
│   └── logger.js
├── release-config/         # Package configurations
│   ├── debugger.json
│   └── screenshot.json
└── __tests__/             # Test suite
    ├── unit/
    ├── integration/
    └── property/
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run property-based tests
npm run test:property
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/digital-defiance/ai-capabilities-suite/issues
- Email: info@digitaldefiance.org

## License

MIT License - See LICENSE file for details
