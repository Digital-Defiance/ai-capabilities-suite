# NPM Publishing Troubleshooting Guide

This guide covers common issues encountered when publishing to NPM and their solutions.

## Table of Contents

- [Authentication Issues](#authentication-issues)
- [Permission Issues](#permission-issues)
- [Version Issues](#version-issues)
- [Build Issues](#build-issues)
- [Package Size Issues](#package-size-issues)
- [GitHub Actions Issues](#github-actions-issues)
- [Post-Publish Issues](#post-publish-issues)

## Authentication Issues

### Issue: "You must be logged in to publish packages"

**Error Message:**
```
npm ERR! code ENEEDAUTH
npm ERR! need auth This command requires you to be logged in.
```

**Cause**: Not logged into NPM.

**Solution:**
```bash
# Login to NPM
npm login

# Enter credentials when prompted:
# - Username
# - Password  
# - Email
# - 2FA code (if enabled)

# Verify login
npm whoami
# Should output your username
```

---

### Issue: "Invalid authentication token"

**Error Message:**
```
npm ERR! code EINVALIDAUTH
npm ERR! Invalid authentication token.
```

**Causes:**
- Token expired
- Token revoked
- Wrong token in GitHub Actions

**Solutions:**

**For Local Publishing:**
```bash
# Re-login to NPM
npm logout
npm login
```

**For GitHub Actions:**
1. Generate new NPM token at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
2. Update GitHub secret:
   - Go to Settings → Secrets → Actions
   - Update `NPM_TOKEN` with new token
3. Re-run workflow

---

### Issue: "Two-factor authentication required"

**Error Message:**
```
npm ERR! code EOTP
npm ERR! This operation requires a one-time password.
```

**Cause**: 2FA is enabled but code not provided.

**Solution:**

**For Local Publishing:**
```bash
# NPM will prompt for 2FA code
npm publish
# Enter 6-digit code from authenticator app
```

**For GitHub Actions:**
- Use an "Automation" token (doesn't require 2FA)
- Generate at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
- Select "Automation" type

---

## Permission Issues

### Issue: "You do not have permission to publish"

**Error Message:**
```
npm ERR! code E403
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/@ai-capabilities-suite%2fmcp-debugger-server
npm ERR! You do not have permission to publish "@ai-capabilities-suite/mcp-debugger-server"
```

**Causes:**
1. Not a member of the organization
2. Package name already taken
3. Insufficient permissions

**Solutions:**

**Solution 1: Join Organization**
```bash
# Check organization membership
npm org ls @ai-capabilities-suite

# Request access from organization owner
# They need to run:
npm org set @ai-capabilities-suite yourname developer
```

**Solution 2: Use Your Own Scope**
```json
// In package.json, change:
{
  "name": "@yourusername/mcp-debugger-server"
}
```

**Solution 3: Use Unscoped Name**
```json
// In package.json, change:
{
  "name": "mcp-debugger-server-yourname"
}
```

---

### Issue: "Package name too similar to existing package"

**Error Message:**
```
npm ERR! Package name too similar to existing package
```

**Cause**: NPM prevents similar names to avoid confusion.

**Solution:**
```json
// Use a more distinctive name:
{
  "name": "@yourusername/mcp-debugger-server",
  // or
  "name": "mcp-debugger-server-by-yourname"
}
```

---

## Version Issues

### Issue: "Version already exists"

**Error Message:**
```
npm ERR! code E403
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/@ai-capabilities-suite%2fmcp-debugger-server
npm ERR! You cannot publish over the previously published versions: 1.0.0
```

**Cause**: Trying to publish a version that already exists.

**Solution:**
```bash
# Increment version
npm version patch  # 1.0.0 → 1.0.1
# or
npm version minor  # 1.0.0 → 1.1.0
# or
npm version major  # 1.0.0 → 2.0.0

# Then publish
npm publish
```

---

### Issue: "Version not following semver"

**Error Message:**
```
npm ERR! Invalid version: "1.0"
```

**Cause**: Version doesn't follow semantic versioning (MAJOR.MINOR.PATCH).

**Solution:**
```json
// In package.json, use proper semver:
{
  "version": "1.0.0"  // Not "1.0" or "1"
}
```

---

## Build Issues

### Issue: "Cannot find module" after publish

**Error Message:**
```
Error: Cannot find module '@ai-capabilities-suite/mcp-debugger-server'
```

**Causes:**
1. Build files not included in package
2. Wrong `main` field in package.json
3. Missing `files` array

**Solutions:**

**Solution 1: Verify Package Contents**
```bash
# Check what will be published
npm pack --dry-run

# Or create tarball and inspect
npm pack
tar -tzf ai-capabilities-suite-mcp-debugger-server-*.tgz
```

**Solution 2: Fix package.json**
```json
{
  "main": "./dist/src/index.js",
  "types": "./dist/src/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

**Solution 3: Ensure Build Runs**
```bash
# Clean and rebuild
yarn clean
yarn build

# Verify dist directory exists
ls -la dist/
```

---

### Issue: "TypeScript types not found"

**Error Message:**
```
Could not find a declaration file for module '@ai-capabilities-suite/mcp-debugger-server'
```

**Cause**: TypeScript declaration files not included.

**Solution:**
```json
// In package.json:
{
  "types": "./dist/src/index.d.ts",
  "files": [
    "dist/**/*.d.ts",
    "dist/**/*.js"
  ]
}
```

```json
// In tsconfig.json:
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  }
}
```

---

## Package Size Issues

### Issue: "Package size too large"

**Error Message:**
```
npm WARN tarball tarball data for @ai-capabilities-suite/mcp-debugger-server@1.0.0 seems to be corrupted. Trying again.
```

**Cause**: Package exceeds size limits or includes unnecessary files.

**Solution:**

**Check Package Size:**
```bash
npm pack --dry-run | grep "package size"
```

**Exclude Unnecessary Files:**
```bash
# Create/update .npmignore
cat > .npmignore << EOF
# Tests
*.spec.ts
*.test.ts
**/*.spec.js
**/*.test.js
test/
tests/
__tests__/
coverage/

# Source files (if publishing dist only)
src/

# Development files
.github/
.vscode/
*.log
.DS_Store
.env
.env.*

# Build artifacts
*.tsbuildinfo
tsconfig.tsbuildinfo
EOF
```

**Verify Exclusions:**
```bash
npm pack
tar -tzf *.tgz | less
```

---

## GitHub Actions Issues

### Issue: "NPM_TOKEN secret not found"

**Error Message:**
```
Error: Input required and not supplied: token
```

**Cause**: NPM_TOKEN secret not configured in GitHub.

**Solution:**
1. Generate NPM token at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
2. Go to GitHub repo → Settings → Secrets → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your NPM token
6. Click "Add secret"

---

### Issue: "Workflow fails on npm publish"

**Error Message:**
```
npm ERR! code E403
npm ERR! 403 Forbidden
```

**Causes:**
1. Wrong token type (use "Automation" not "Publish")
2. Token expired
3. Insufficient permissions

**Solution:**

**Generate Correct Token:**
1. Go to [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
2. Click "Generate New Token" → "Classic Token"
3. Select **"Automation"** type (not "Publish")
4. Copy token
5. Update GitHub secret

**Verify Token Permissions:**
- ✅ Read and write packages
- ✅ Read and write to registry

---

### Issue: "Tests fail in CI but pass locally"

**Causes:**
1. Different Node.js versions
2. Missing environment variables
3. Platform-specific issues

**Solutions:**

**Match Node.js Version:**
```yaml
# In .github/workflows/npm-publish.yml
- uses: actions/setup-node@v4
  with:
    node-version: "20"  # Match your local version
```

**Add Environment Variables:**
```yaml
- name: Run tests
  run: yarn test
  env:
    CI: true
    NODE_ENV: test
```

**Debug CI:**
```yaml
- name: Debug environment
  run: |
    node --version
    npm --version
    yarn --version
    pwd
    ls -la
```

---

## Post-Publish Issues

### Issue: "Package not found after publishing"

**Error Message:**
```
npm ERR! code E404
npm ERR! 404 Not Found - GET https://registry.npmjs.org/@ai-capabilities-suite%2fmcp-debugger-server
```

**Causes:**
1. NPM registry propagation delay (usually < 1 minute)
2. Package name typo
3. Publish failed silently

**Solutions:**

**Wait and Retry:**
```bash
# Wait 1-2 minutes, then try again
npm install @ai-capabilities-suite/mcp-debugger-server
```

**Verify Package Exists:**
```bash
# Check package info
npm info @ai-capabilities-suite/mcp-debugger-server

# Or visit NPM website
open https://www.npmjs.com/package/@ai-capabilities-suite/mcp-debugger-server
```

**Check Publish Logs:**
```bash
# Review publish output for errors
npm publish --verbose
```

---

### Issue: "CLI command not found after install"

**Error Message:**
```
bash: ts-mcp-server: command not found
```

**Causes:**
1. Binary not configured in package.json
2. Binary not executable
3. Global install path not in PATH

**Solutions:**

**Verify Binary Configuration:**
```json
// In package.json:
{
  "bin": {
    "ts-mcp-server": "./dist/src/cli.js",
    "mcp-debugger": "./dist/src/cli.js"
  }
}
```

**Make Binary Executable:**
```bash
# Add shebang to cli.js
#!/usr/bin/env node

# Make executable
chmod +x dist/src/cli.js
```

**Use npx:**
```bash
# Instead of global install
npx ts-mcp-server --version
```

---

### Issue: "Module not found when importing"

**Error Message:**
```
Error: Cannot find module '@ai-capabilities-suite/mcp-debugger-server'
```

**Causes:**
1. Package not installed
2. Wrong import path
3. TypeScript configuration issue

**Solutions:**

**Verify Installation:**
```bash
npm list @ai-capabilities-suite/mcp-debugger-server
```

**Check Import:**
```javascript
// Correct import
const mcp = require('@ai-capabilities-suite/mcp-debugger-server');
// or
import mcp from '@ai-capabilities-suite/mcp-debugger-server';
```

**Verify Exports:**
```json
// In package.json:
{
  "main": "./dist/src/index.js",
  "module": "./dist/src/index.js",
  "types": "./dist/src/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/src/index.d.ts",
      "import": "./dist/src/index.js",
      "default": "./dist/src/index.js"
    }
  }
}
```

---

## Debugging Commands

### Check NPM Configuration

```bash
# View NPM config
npm config list

# Check registry
npm config get registry

# Check logged in user
npm whoami

# View package info
npm info @ai-capabilities-suite/mcp-debugger-server

# View all versions
npm view @ai-capabilities-suite/mcp-debugger-server versions
```

### Verify Package Contents

```bash
# Dry run publish
npm publish --dry-run

# Create tarball
npm pack

# List tarball contents
tar -tzf *.tgz

# Extract and inspect
tar -xzf *.tgz
cd package
ls -la
```

### Test Installation

```bash
# Create test directory
mkdir /tmp/test-install && cd /tmp/test-install

# Initialize package
npm init -y

# Install package
npm install @ai-capabilities-suite/mcp-debugger-server

# Test CLI
npx ts-mcp-server --version

# Test import
node -e "const mcp = require('@ai-capabilities-suite/mcp-debugger-server'); console.log('Success!');"
```

### Clean and Reset

```bash
# Clear NPM cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Rebuild
yarn clean && yarn build
```

## Getting Help

If you're still stuck:

1. **Check NPM Status**: [status.npmjs.org](https://status.npmjs.org/)
2. **Search NPM Issues**: [github.com/npm/cli/issues](https://github.com/npm/cli/issues)
3. **Review Documentation**: [docs.npmjs.com](https://docs.npmjs.com/)
4. **Ask for Help**: Open an issue on GitHub

## Additional Resources

- [PUBLISHING.md](./PUBLISHING.md) - Full publishing guide
- [NPM-SETUP-GUIDE.md](./NPM-SETUP-GUIDE.md) - Quick setup guide
- [NPM Documentation](https://docs.npmjs.com/)
- [NPM CLI Commands](https://docs.npmjs.com/cli/v9/commands)
- [Package.json Reference](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)

---

**Last Updated**: 2024
**Package**: @ai-capabilities-suite/mcp-debugger-server
