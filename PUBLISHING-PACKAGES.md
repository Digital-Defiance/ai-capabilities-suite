# Publishing MCP Debugger Packages

Quick reference for publishing the MCP Debugger packages to NPM.

## Package Structure

The MCP Debugger consists of two NPM packages:

```
@ai-capabilities-suite/
├── mcp-debugger-core      (Core debugging engine)
└── mcp-debugger-server    (MCP server interface)
                           └── depends on → mcp-debugger-core
```

### Package Descriptions

1. **@ai-capabilities-suite/mcp-debugger-core**
   - Core debugging engine
   - Inspector Protocol integration
   - Breakpoint management, variable inspection, profiling
   - Can be used standalone or as a library
   - **Must be published first**

2. **@ai-capabilities-suite/mcp-debugger-server**
   - MCP server implementation
   - Exposes 25+ debugging tools via MCP protocol
   - Depends on mcp-debugger-core
   - **Publish after core**

## Quick Publish Commands

### Automated (Recommended)

```bash
# From repository root

# Build, test, and publish both packages
npm run publish:debugger:check

# Or just publish (skip build/test)
npm run publish:debugger

# Publish individual packages
npm run publish:core    # Core only
npm run publish:server  # Server only
```

### Manual

```bash
# 1. Build and test
yarn build
yarn test

# 2. Publish core first
cd packages/mcp-debugger-core
npm publish --access public

# 3. Publish server second
cd ../mcp-debugger-server
npm publish --access public
```

## Publishing Order

**CRITICAL**: Always publish in this order:

1. ✅ **mcp-debugger-core** (dependency)
2. ✅ **mcp-debugger-server** (depends on core)

If you publish server before core, users will get dependency resolution errors.

## Version Management

### Keep Versions Synchronized

It's recommended to keep both packages at the same version:

```bash
# Update both to 1.0.1
cd packages/mcp-debugger-core
npm version patch

cd ../mcp-debugger-server
npm version patch

# Commit and publish
git add .
git commit -m "chore: bump version to 1.0.1"
git push
npm run publish:debugger
```

### Version Bump Commands

```bash
# Patch (1.0.0 → 1.0.1) - Bug fixes
npm version patch

# Minor (1.0.0 → 1.1.0) - New features
npm version minor

# Major (1.0.0 → 2.0.0) - Breaking changes
npm version major
```

## Pre-Publish Checklist

Before publishing, ensure:

- [ ] All tests passing: `yarn test`
- [ ] Code built successfully: `yarn build`
- [ ] Versions updated in both packages
- [ ] CHANGELOG.md updated
- [ ] Documentation updated
- [ ] Logged into NPM: `npm whoami`
- [ ] On main/master branch
- [ ] No uncommitted changes

## First-Time Setup

If this is your first time publishing:

1. **Create NPM account**: [npmjs.com/signup](https://www.npmjs.com/signup)
2. **Enable 2FA**: Required for publishing
3. **Login**: `npm login`
4. **Generate token**: For GitHub Actions automation
5. **Add to GitHub**: Settings → Secrets → `NPM_TOKEN`

See [packages/mcp-debugger-server/NPM-SETUP-GUIDE.md](./packages/mcp-debugger-server/NPM-SETUP-GUIDE.md) for detailed setup.

## Automated Publishing via GitHub Actions

The repository includes a GitHub Actions workflow that automatically publishes on release:

```bash
# Create and push tag
git tag v1.0.0
git push origin v1.0.0

# Create GitHub release
# Go to GitHub → Releases → "Draft a new release"
# The workflow will automatically publish both packages
```

## Verification

After publishing, verify both packages:

```bash
# Check core package
npm info @ai-capabilities-suite/mcp-debugger-core

# Check server package
npm info @ai-capabilities-suite/mcp-debugger-server

# Test installation
mkdir /tmp/test-install && cd /tmp/test-install
npm init -y
npm install @ai-capabilities-suite/mcp-debugger-server

# Test CLI
npx ts-mcp-server --version
```

## Troubleshooting

### "Cannot find module @ai-capabilities-suite/mcp-debugger-core"

**Cause**: Server published before core, or core publish failed.

**Solution**: Publish core package first:
```bash
cd packages/mcp-debugger-core
npm publish --access public
```

### "Version already exists"

**Cause**: Trying to republish same version.

**Solution**: Bump version:
```bash
npm version patch
npm publish
```

### "You do not have permission"

**Cause**: Not a member of @ai-capabilities-suite organization.

**Solution**: Request access or publish under your own scope.

## Documentation

For comprehensive publishing documentation:

- **Quick Setup**: [packages/mcp-debugger-server/NPM-SETUP-GUIDE.md](./packages/mcp-debugger-server/NPM-SETUP-GUIDE.md)
- **Full Guide**: [packages/mcp-debugger-server/PUBLISHING.md](./packages/mcp-debugger-server/PUBLISHING.md)
- **Troubleshooting**: [packages/mcp-debugger-server/NPM-TROUBLESHOOTING.md](./packages/mcp-debugger-server/NPM-TROUBLESHOOTING.md)
- **Checklist**: [packages/mcp-debugger-server/.publish-checklist.md](./packages/mcp-debugger-server/.publish-checklist.md)

## Support

For publishing issues:
- GitHub Issues: [ai-capabilities-suite/issues](https://github.com/digital-defiance/ai-capabilities-suite/issues)
- Email: info@digitaldefiance.org

---

**Quick Reference**:
```bash
npm run publish:debugger:check  # Build, test, publish both
npm run publish:debugger        # Publish both packages
npm run publish:core            # Publish core only
npm run publish:server          # Publish server only
```
