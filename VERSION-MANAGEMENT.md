# Version Management Guide

This document explains how version numbers are managed across the monorepo.

## Overview

The monorepo contains multiple packages with interdependencies. To maintain consistency, we use a **single source of truth** approach for version management.

## Version Sources of Truth

### MCP Debugger Server
**Source:** `packages/mcp-debugger-server/package.json`

This version is automatically synced to:
- `packages/mcp-debugger-server/src/cli.ts` - CLI version constant
- `packages/mcp-debugger-server/src/lib/mcp-server.ts` - Server version
- `packages/mcp-debugger-server/server.json` - MCP registry metadata
- `packages/mcp-debugger-server/docker-build-push.sh` - Docker build script
- `packages/mcp-debugger-server/Dockerfile` - Docker image label
- `packages/mcp-debugger-server/Dockerfile.local` - Local Docker image label
- `packages/vscode-mcp-debugger/package.json` - VS Code extension dependency

### MCP Screenshot
**Source:** `packages/mcp-screenshot/package.json`

Currently independent, no automatic syncing needed.

### VS Code Extension
**Source:** `packages/vscode-mcp-debugger/package.json`

The extension version is independent, but its dependency on `@ai-capabilities-suite/mcp-debugger-server` is automatically synced.

## Automated Version Syncing

### The sync-versions Script

The `scripts/sync-versions.js` script automatically updates all version references when the source package.json changes.

**Usage:**
```bash
# Sync all versions from package.json
npm run sync-versions
```

**When to run:**
- After manually updating `packages/mcp-debugger-server/package.json`
- After running `npm version` in the debugger-server package
- Before committing version changes
- Automatically runs in CI/CD workflows

### Automatic Syncing

The script is automatically triggered:
1. **After version bump:** When you run `npm version` in the debugger-server package
2. **In CI/CD:** During the release workflow
3. **Pre-commit hook:** (Optional - can be added)

## Version Bump Workflow

### Option 1: Using npm version (Recommended)

```bash
# Navigate to the package
cd packages/mcp-debugger-server

# Bump version (patch, minor, or major)
npm version patch  # 1.0.4 → 1.0.5
npm version minor  # 1.0.4 → 1.1.0
npm version major  # 1.0.4 → 2.0.0

# Sync versions across all files
cd ../..
npm run sync-versions

# Commit and push
git add .
git commit -m "chore: bump version to $(node -p "require('./packages/mcp-debugger-server/package.json').version")"
git push
```

### Option 2: Using GitHub Actions

1. Go to **Actions** → **Create Release (Debugger Only)**
2. Click **Run workflow**
3. Select version bump type (patch/minor/major)
4. Select package to release
5. The workflow will:
   - Bump the version
   - Run sync-versions script
   - Run tests
   - Create a PR with the changes

### Option 3: Manual Version Update

If you manually edit `package.json`:

```bash
# Edit the version in package.json
vim packages/mcp-debugger-server/package.json

# Sync all version references
npm run sync-versions

# Verify changes
git diff

# Commit
git add .
git commit -m "chore: bump version to X.Y.Z"
```

## Version Consistency Checks

### Pre-commit Check (Optional)

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
npm run sync-versions
git add packages/mcp-debugger-server packages/vscode-mcp-debugger
```

### CI Check

The CI workflow verifies version consistency:
```bash
# Check if versions are in sync
node scripts/sync-versions.js --check
```

## Troubleshooting

### Versions are out of sync

Run the sync script:
```bash
npm run sync-versions
```

### Script fails

Check that all files exist:
```bash
ls -la packages/mcp-debugger-server/src/cli.ts
ls -la packages/mcp-debugger-server/src/lib/mcp-server.ts
ls -la packages/vscode-mcp-debugger/package.json
```

### Need to add a new file to sync

Edit `scripts/sync-versions.js` and add to the `filesToUpdate` array:
```javascript
{
  path: path.join(DEBUGGER_SERVER_DIR, 'path', 'to', 'file.ts'),
  pattern: /version: "[^"]+"/,
  replacement: `version: "${VERSION}"`,
}
```

## Release Checklist

When releasing a new version:

- [ ] Update CHANGELOG.md with changes
- [ ] Run `npm version [patch|minor|major]` in the package directory
- [ ] Run `npm run sync-versions` from root
- [ ] Verify all version references are updated: `git diff`
- [ ] Run tests: `npm test`
- [ ] Build packages: `npm run build`
- [ ] Commit changes: `git commit -m "chore: release vX.Y.Z"`
- [ ] Create git tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
- [ ] Push changes and tags: `git push && git push --tags`
- [ ] Publish to npm: `npm run publish:debugger`
- [ ] Create GitHub release with binaries

## CI/CD Integration

### Release Workflows

The repository has two release workflows that **only run for debugger changes**:

1. **`.github/workflows/release.yml`** - Creates release PRs
   - Triggers on: Manual workflow dispatch
   - Path filters: `packages/mcp-debugger-*/**`
   - Automatically runs `sync-versions` script

2. **`.github/workflows/release-binaries.yml`** - Builds and releases binaries
   - Triggers on: Tags matching `mcp-debugger-server-v*.*.*`
   - Path filters: `packages/mcp-debugger-*/**`
   - Builds binaries for Linux, macOS, Windows

### Path Filtering

Both workflows use path filters to only run when debugger-related files change:
```yaml
on:
  push:
    paths:
      - "packages/mcp-debugger-server/**"
      - "packages/mcp-debugger-core/**"
```

This ensures:
- Screenshot changes don't trigger debugger releases
- CI resources are used efficiently
- Clear separation of concerns

## Best Practices

1. **Always use the sync script** after version changes
2. **Never manually update version strings** in code files
3. **Use semantic versioning** (MAJOR.MINOR.PATCH)
4. **Test after version bumps** to ensure nothing breaks
5. **Document breaking changes** in CHANGELOG.md
6. **Keep dependencies in sync** between packages

## Future Improvements

- [ ] Add pre-commit hook for automatic syncing
- [ ] Add `--check` mode to verify versions without updating
- [ ] Extend to other packages (screenshot, etc.)
- [ ] Add version validation in CI
- [ ] Create interactive version bump CLI tool
