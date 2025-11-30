# NPM Publishing Quick Setup Guide

This is a streamlined guide for first-time publishers. For comprehensive documentation, see [PUBLISHING.md](./PUBLISHING.md).

## Quick Start (5 Minutes)

### Step 1: Create NPM Account (2 minutes)

1. Go to [npmjs.com/signup](https://www.npmjs.com/signup)
2. Fill in:
   - Username (e.g., `yourname`)
   - Email address
   - Password
3. Verify your email address
4. **Enable 2FA** (required for publishing):
   - Go to [npmjs.com/settings/profile](https://www.npmjs.com/settings/profile)
   - Click "Two-Factor Authentication"
   - Choose "Authorization and Publishing"
   - Scan QR code with authenticator app
   - Save recovery codes securely

### Step 2: Login to NPM (1 minute)

```bash
# Login from terminal
npm login

# Enter your credentials:
# - Username
# - Password
# - Email
# - 2FA code (from authenticator app)

# Verify login
npm whoami
# Should output: yourname
```

### Step 3: Generate Access Token (1 minute)

For automated publishing via GitHub Actions:

1. Go to [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
2. Click "Generate New Token" → "Classic Token"
3. Select **"Automation"** type
4. Name it: `GitHub Actions - MCP Debugger`
5. Click "Generate Token"
6. **Copy the token** (you won't see it again!)

### Step 4: Add Token to GitHub (1 minute)

1. Go to your GitHub repository
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your NPM token
6. Click "Add secret"

## First Publish

### Important: Two Packages to Publish

The MCP Debugger consists of two packages:
1. **mcp-debugger-core** - Core debugging engine
2. **mcp-debugger-server** - MCP server (depends on core)

**You must publish BOTH packages, in order: core first, then server.**

### Option A: Automated Publish (Recommended)

```bash
# From repository root
# This builds, tests, and publishes both packages in order
npm run publish:debugger:check
```

### Option B: Manual Publish (Step by Step)

```bash
# 1. Build all packages
yarn build

# 2. Run all tests
yarn test

# 3. Publish core package first
cd packages/mcp-debugger-core
npm pack --dry-run  # Verify contents
npm publish --access public

# 4. Verify core published
npm info @ai-capabilities-suite/mcp-debugger-core

# 5. Publish server package
cd ../mcp-debugger-server
npm pack --dry-run  # Verify contents
npm publish --access public

# 6. Verify server published
npm info @ai-capabilities-suite/mcp-debugger-server
```

### Option B: Automated Publish via GitHub Release

```bash
# 1. Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# 2. Create GitHub Release:
# - Go to GitHub → Releases → "Draft a new release"
# - Choose tag: v1.0.0
# - Title: "v1.0.0 - Initial Release"
# - Generate release notes
# - Click "Publish release"

# 3. GitHub Actions will automatically:
# - Build the package
# - Run tests
# - Publish to NPM
# - Comment on the release
```

## Verification Checklist

After publishing, verify everything works:

```bash
# ✅ Check package is visible on NPM
open https://www.npmjs.com/package/@ai-capabilities-suite/mcp-debugger-server

# ✅ Test installation in a new directory
mkdir /tmp/test-install && cd /tmp/test-install
npm init -y
npm install @ai-capabilities-suite/mcp-debugger-server

# ✅ Test the CLI works
npx ts-mcp-server --version

# ✅ Test programmatic import
node -e "const mcp = require('@ai-capabilities-suite/mcp-debugger-server'); console.log('✅ Success!');"
```

## Common First-Time Issues

### Issue: "You do not have permission to publish"

**Cause**: You're not a member of the `@ai-capabilities-suite` organization.

**Solutions**:
1. Request access from the organization owner
2. Or publish under your own scope:
   ```json
   // In package.json, change:
   "name": "@yourusername/mcp-debugger-server"
   ```

### Issue: "Package name already taken"

**Solution**: Use a scoped package name:
```json
{
  "name": "@yourusername/mcp-debugger-server"
}
```

### Issue: "npm ERR! need auth"

**Solution**: You're not logged in:
```bash
npm login
npm whoami  # Verify
```

### Issue: "npm ERR! 403 Forbidden"

**Causes**:
- 2FA not enabled
- Wrong credentials
- Token expired

**Solution**:
1. Enable 2FA on npmjs.com
2. Generate new token
3. Update GitHub secret

## Next Steps

After successful first publish:

1. ✅ **Update README.md** with installation instructions
2. ✅ **Create CHANGELOG.md** to track changes
3. ✅ **Set up automated publishing** (if not already done)
4. ✅ **Monitor package health** on npmjs.com
5. ✅ **Announce the release** (Twitter, Discord, etc.)

## Publishing Updates

For subsequent releases:

```bash
# 1. Update version
npm version patch  # or minor, or major

# 2. Build and test
yarn build && yarn test

# 3. Publish
npm publish

# 4. Create GitHub release
git push --tags
```

## Getting Help

- 📖 **Full Documentation**: [PUBLISHING.md](./PUBLISHING.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/digitaldefiance/ai-capabilities-suite/issues)
- 📚 **NPM Docs**: [docs.npmjs.com](https://docs.npmjs.com/)
- 💬 **Support**: Contact package maintainers

## Quick Reference

### Essential Commands

```bash
# Login
npm login

# Check login status
npm whoami

# Update version
npm version patch|minor|major

# Build
yarn build

# Test
yarn test

# Publish
npm publish

# Check package info
npm info @ai-capabilities-suite/mcp-debugger-server

# Install locally for testing
npm install ./path/to/package
```

### Version Bumping

```bash
# Bug fixes: 1.0.0 → 1.0.1
npm version patch

# New features: 1.0.0 → 1.1.0
npm version minor

# Breaking changes: 1.0.0 → 2.0.0
npm version major

# Pre-release: 1.0.0 → 1.0.1-beta.0
npm version prerelease --preid=beta
```

### NPM Tags

```bash
# Latest (default)
npm publish --tag latest

# Beta release
npm publish --tag beta

# Next/canary
npm publish --tag next
```

## Security Checklist

- ✅ 2FA enabled on NPM account
- ✅ NPM token stored in GitHub Secrets (not in code)
- ✅ Token type is "Automation" (not "Publish")
- ✅ Recovery codes saved securely
- ✅ `.npmignore` excludes sensitive files
- ✅ No credentials in package.json

## Success Indicators

You've successfully published when:

1. ✅ Package appears on [npmjs.com](https://www.npmjs.com/package/@ai-capabilities-suite/mcp-debugger-server)
2. ✅ `npm install` works in a fresh directory
3. ✅ CLI command works: `npx ts-mcp-server --version`
4. ✅ Package can be imported: `require('@ai-capabilities-suite/mcp-debugger-server')`
5. ✅ Documentation is accessible
6. ✅ GitHub release is created (if using automated workflow)

---

**Congratulations!** 🎉 You've published your first NPM package!

For detailed information, troubleshooting, and best practices, see [PUBLISHING.md](./PUBLISHING.md).
