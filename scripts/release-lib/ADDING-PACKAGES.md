# Adding New Packages to Release Automation

The release automation system is designed to be extensible. Adding a new package requires only creating a configuration file - no code changes needed.

## Steps to Add a New Package

### 1. Create Configuration File

Create a new JSON file in `scripts/release-config/` named after your package (e.g., `process.json`, `filesystem.json`).

### 2. Configuration Schema

Your configuration file must include all required fields:

```json
{
  "packageName": "your-package-name",
  "npmPackageName": "@ai-capabilities-suite/mcp-your-package",
  "vscodeExtensionName": "mcp-your-package",
  "dockerImageName": "digitaldefiance/mcp-your-package",
  "packageDir": "packages/mcp-your-package",
  "vscodeExtensionDir": "packages/vscode-mcp-your-package",
  "buildBinaries": false,
  "testCommand": "nx test mcp-your-package",
  "buildCommand": "nx build mcp-your-package",
  "filesToSync": [
    {
      "path": "packages/mcp-your-package/package.json",
      "pattern": "\"version\":\\s*\"[^\"]+\"",
      "replacement": "\"version\": \"$VERSION\""
    }
  ],
  "githubReleaseTemplate": "## Your Package v$VERSION\n\n### What's Changed\n\n$CHANGELOG"
}
```

### 3. Configuration Fields

#### Required Fields

- **packageName**: Short name used in CLI commands (e.g., `debugger`, `screenshot`, `process`)
- **npmPackageName**: Full NPM package name (e.g., `@ai-capabilities-suite/mcp-process`)
- **vscodeExtensionName**: VSCode extension identifier
- **dockerImageName**: Docker Hub image name (if applicable)
- **packageDir**: Relative path to package directory from project root
- **vscodeExtensionDir**: Relative path to VSCode extension directory (if applicable)
- **buildBinaries**: Boolean indicating whether to build standalone binaries
- **testCommand**: Command to run tests (executed from project root)
- **buildCommand**: Command to build the package (executed from project root)
- **filesToSync**: Array of files to update with version numbers
- **githubReleaseTemplate**: Template for GitHub release notes

#### Optional Fields

- **binaryPlatforms**: Array of platforms to build binaries for (required if `buildBinaries` is true)
  - Example: `["node18-linux-x64", "node18-macos-x64", "node18-win-x64"]`

### 4. File Sync Configuration

The `filesToSync` array specifies which files should have their version numbers updated. Each entry requires:

- **path**: Relative path to the file from project root
- **pattern**: Regular expression to match the version string
- **replacement**: Replacement string (use `$VERSION` placeholder)

#### Common Patterns

**package.json version:**
```json
{
  "path": "packages/your-package/package.json",
  "pattern": "\"version\":\\s*\"[^\"]+\"",
  "replacement": "\"version\": \"$VERSION\""
}
```

**Dependency version in package.json:**
```json
{
  "path": "packages/your-extension/package.json",
  "pattern": "\"@ai-capabilities-suite/your-package\":\\s*\"\\^[^\"]+\"",
  "replacement": "\"@ai-capabilities-suite/your-package\": \"^$VERSION\""
}
```

**README installation instructions:**
```json
{
  "path": "packages/your-package/README.md",
  "pattern": "@ai-capabilities-suite/your-package@[0-9]+\\.[0-9]+\\.[0-9]+",
  "replacement": "@ai-capabilities-suite/your-package@$VERSION"
}
```

**Docker image tags:**
```json
{
  "path": "packages/your-package/docker-compose.yml",
  "pattern": "image:\\s*digitaldefiance/your-package:[0-9]+\\.[0-9]+\\.[0-9]+",
  "replacement": "image: digitaldefiance/your-package:$VERSION"
}
```

### 5. GitHub Release Template

The `githubReleaseTemplate` field supports these placeholders:

- **$VERSION**: The release version
- **$CHANGELOG**: Auto-generated changelog from commits

Example template:
```markdown
## Your Package v$VERSION

### What's Changed

$CHANGELOG

### Installation

**NPM:**
\`\`\`bash
npm install -g @ai-capabilities-suite/your-package@$VERSION
\`\`\`

### Documentation

- [README](https://github.com/digital-defiance/ai-capabilities-suite/blob/main/packages/your-package/README.md)
```

### 6. Environment Variable Overrides

You can override certain configuration values using environment variables:

- `RELEASE_NPM_PACKAGE_NAME`: Override `npmPackageName`
- `RELEASE_DOCKER_IMAGE_NAME`: Override `dockerImageName`
- `RELEASE_TEST_COMMAND`: Override `testCommand`
- `RELEASE_BUILD_COMMAND`: Override `buildCommand`

### 7. Using the New Package

Once the configuration file is created, you can immediately use it:

```bash
# Set version
node scripts/set-version.js your-package-name 1.0.0

# Release (when implemented)
node scripts/release.js your-package-name 1.0.0
```

## Examples

### Simple Package (No Binaries, No VSCode Extension)

```json
{
  "packageName": "process",
  "npmPackageName": "@ai-capabilities-suite/mcp-process",
  "vscodeExtensionName": "mcp-process",
  "dockerImageName": "digitaldefiance/mcp-process",
  "packageDir": "packages/mcp-process",
  "vscodeExtensionDir": "packages/vscode-mcp-process",
  "buildBinaries": false,
  "testCommand": "nx test mcp-process",
  "buildCommand": "nx build mcp-process",
  "filesToSync": [
    {
      "path": "packages/mcp-process/package.json",
      "pattern": "\"version\":\\s*\"[^\"]+\"",
      "replacement": "\"version\": \"$VERSION\""
    }
  ],
  "githubReleaseTemplate": "## MCP Process v$VERSION\n\n$CHANGELOG"
}
```

### Complex Package (With Binaries and VSCode Extension)

See `scripts/release-config/debugger.json` for a complete example with:
- Binary building for multiple platforms
- VSCode extension
- Multiple file syncs
- Comprehensive release template

## Validation

The system automatically validates your configuration when loaded. Common validation errors:

- Missing required fields
- Invalid `buildBinaries` value (must be boolean)
- Missing `binaryPlatforms` when `buildBinaries` is true
- Invalid `filesToSync` entries (missing path, pattern, or replacement)
- Empty string values for required fields

## Testing Your Configuration

Test that your configuration loads correctly:

```bash
node -e "const { loadConfig } = require('./scripts/release-lib/config-loader'); console.log(loadConfig('your-package-name'));"
```

List all available packages:

```bash
node -e "const { getAvailablePackages } = require('./scripts/release-lib/config-loader'); console.log(getAvailablePackages());"
```

## Architecture Benefits

This configuration-driven approach provides:

1. **Zero Code Changes**: Add packages without modifying release automation code
2. **Package Isolation**: Each package has independent configuration
3. **Flexibility**: Different packages can have different build/test commands
4. **Maintainability**: Configuration is declarative and easy to understand
5. **Validation**: Automatic validation ensures configuration correctness
6. **Environment Overrides**: Support for CI/CD customization

## Future Packages

The system is ready to support any future packages you add to the monorepo:
- mcp-filesystem
- mcp-recording
- Any other MCP servers or tools

Simply create a configuration file and start using the release automation!
