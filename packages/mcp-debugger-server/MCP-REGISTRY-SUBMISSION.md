# MCP Registry Submission Guide

This document provides step-by-step instructions for submitting the MCP Debugger Server to the official MCP Registry.

## Prerequisites

Before submitting to the MCP Registry, ensure:

1. ✅ **Package Published to NPM**: The package must be published to npm with public access
2. ✅ **mcpName in package.json**: The `mcpName` property is set in package.json
3. ✅ **server.json Created**: The server.json metadata file is created and validated
4. ✅ **Documentation Complete**: README, API docs, and examples are comprehensive
5. ✅ **GitHub Repository**: Code is hosted on GitHub with proper licensing

## Current Status

- ✅ Package name: `@ai-capabilities-suite/mcp-debugger-server`
- ✅ MCP name: `org.digitaldefiance/ts-mcp-debugger`
- ✅ Version: 1.0.0
- ✅ License: MIT
- ✅ Repository: https://github.com/digitaldefiance/ai-capabilities-suite
- ✅ server.json: Created and validated
- ⏳ NPM publish: Pending (manual step)
- ⏳ Registry submission: Pending (manual step)

## Step-by-Step Submission Process

### Step 1: Verify Package Configuration

Ensure `package.json` includes the `mcpName` property:

```json
{
  "name": "@ai-capabilities-suite/mcp-debugger-server",
  "version": "1.0.0",
  "mcpName": "org.digitaldefiance/ts-mcp-debugger",
  ...
}
```

The `mcpName` value **must** match the `name` property in `server.json`.

### Step 2: Validate server.json

Verify the `server.json` file is valid:

```bash
# Navigate to the package directory
cd packages/mcp-debugger-server

# Validate against the schema
npx ajv-cli validate \
  -s https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json \
  -d server.json
```

### Step 3: Build the Package

Ensure the package is built and ready for publishing:

```bash
# From the repository root
npx nx build @ai-capabilities-suite/mcp-debugger-core
npx nx build @ai-capabilities-suite/mcp-debugger-server

# Verify the build
ls -la packages/mcp-debugger-server/dist
```

### Step 4: Publish to NPM

**Note**: This is a manual step that requires NPM authentication.

```bash
# Navigate to the package directory
cd packages/mcp-debugger-server

# Login to NPM (if not already logged in)
npm login

# Publish the package with public access
npm publish --access public

# Verify publication
npm view @ai-capabilities-suite/mcp-debugger-server
```

Expected output:
```
@ai-capabilities-suite/mcp-debugger-server@1.0.0 | MIT | deps: 3 | versions: 1
Enterprise-grade MCP server providing advanced debugging capabilities...
https://github.com/digitaldefiance/ai-capabilities-suite/tree/main/packages/mcp-debugger-server#readme
```

### Step 5: Install mcp-publisher CLI

Install the official MCP Registry publisher tool:

**macOS/Linux:**
```bash
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher && sudo mv mcp-publisher /usr/local/bin/
```

**Windows (PowerShell):**
```powershell
$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture -eq "Arm64") { "arm64" } else { "amd64" }
Invoke-WebRequest -Uri "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_windows_$arch.tar.gz" -OutFile "mcp-publisher.tar.gz"
tar xf mcp-publisher.tar.gz mcp-publisher.exe
rm mcp-publisher.tar.gz
# Move mcp-publisher.exe to a directory in your PATH
```

**Homebrew:**
```bash
brew install mcp-publisher
```

Verify installation:
```bash
mcp-publisher --help
```

### Step 6: Authenticate with MCP Registry

**Option A: DNS Authentication (Recommended for Custom Domains)**

For publishing under `org.digitaldefiance/*`, you need to prove ownership of `digitaldefiance.org`:

```bash
# Start DNS authentication
mcp-publisher login dns

# Follow the prompts to add a TXT record to your DNS
# Example: Add TXT record to _mcp.digitaldefiance.org with the provided token
```

**Option B: GitHub Authentication (Alternative)**

If using GitHub-based namespace (e.g., `io.github.digitaldefiance/*`):

```bash
# Start GitHub authentication
mcp-publisher login github

# Follow the prompts:
# 1. Visit https://github.com/login/device
# 2. Enter the authorization code
# 3. Authorize the application
```

### Step 7: Publish to MCP Registry

Once authenticated, publish the server:

```bash
# Navigate to the package directory
cd packages/mcp-debugger-server

# Publish to the registry
mcp-publisher publish

# Expected output:
# Publishing to https://registry.modelcontextprotocol.io...
# ✓ Successfully published
# ✓ Server org.digitaldefiance/ts-mcp-debugger version 1.0.0
```

### Step 8: Verify Publication

Verify the server is published and discoverable:

```bash
# Search for the server
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=ts-mcp-debugger"

# Get server details
curl "https://registry.modelcontextprotocol.io/v0.1/servers/org.digitaldefiance/ts-mcp-debugger"
```

Expected response should include:
```json
{
  "name": "org.digitaldefiance/ts-mcp-debugger",
  "description": "Enterprise-grade MCP server providing advanced debugging capabilities...",
  "version": "1.0.0",
  "packages": [...],
  ...
}
```

### Step 9: Test Installation

Test that users can install and use the server:

```bash
# Install globally
npm install -g @ai-capabilities-suite/mcp-debugger-server

# Verify installation
ts-mcp-server --version

# Test basic functionality
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | ts-mcp-server
```

## Authentication Methods

### DNS Authentication (Recommended)

**Pros:**
- Allows custom domain namespaces (e.g., `org.digitaldefiance/*`)
- Proves ownership of entire domain and subdomains
- Professional appearance

**Cons:**
- Requires DNS access
- Takes time for DNS propagation

**Steps:**
1. Run `mcp-publisher login dns`
2. Add TXT record to `_mcp.yourdomain.com` with provided token
3. Wait for DNS propagation (usually 5-15 minutes)
4. Complete authentication

### GitHub Authentication

**Pros:**
- Quick and easy
- No DNS configuration needed
- Works immediately

**Cons:**
- Limited to `io.github.username/*` namespace
- Requires GitHub account

**Steps:**
1. Run `mcp-publisher login github`
2. Visit device authorization URL
3. Enter authorization code
4. Authorize application

### HTTP Authentication

**Pros:**
- Alternative to DNS
- Proves domain ownership

**Cons:**
- Requires web server access
- More complex setup

**Steps:**
1. Run `mcp-publisher login http`
2. Place verification file at specified URL
3. Complete authentication

## Troubleshooting

### Error: "Registry validation failed for package"

**Cause**: Package doesn't include required `mcpName` property

**Solution**:
```bash
# Verify mcpName in package.json
grep mcpName packages/mcp-debugger-server/package.json

# If missing, add it and republish to npm
```

### Error: "Invalid or expired Registry JWT token"

**Cause**: Authentication token expired

**Solution**:
```bash
# Re-authenticate
mcp-publisher login dns  # or github
```

### Error: "You do not have permission to publish this server"

**Cause**: Authentication method doesn't match namespace

**Solution**:
- For `org.digitaldefiance/*`: Use DNS authentication
- For `io.github.username/*`: Use GitHub authentication

### Error: "Package not found on npm"

**Cause**: Package not published to npm or not public

**Solution**:
```bash
# Publish to npm first
npm publish --access public

# Verify publication
npm view @ai-capabilities-suite/mcp-debugger-server
```

### Error: "Version mismatch"

**Cause**: Version in server.json doesn't match package.json

**Solution**:
```bash
# Ensure versions match
grep version packages/mcp-debugger-server/package.json
grep version packages/mcp-debugger-server/server.json

# Update server.json if needed
```

## Post-Submission Checklist

After successful submission:

- [ ] Verify server appears in registry search
- [ ] Test installation from npm
- [ ] Test MCP client integration
- [ ] Update documentation with registry link
- [ ] Announce on social media / community channels
- [ ] Monitor for user feedback and issues
- [ ] Plan for future updates and maintenance

## Updating the Server

To publish updates:

1. Update version in `package.json` and `server.json`
2. Build and test changes
3. Publish updated package to npm
4. Run `mcp-publisher publish` again
5. Verify update in registry

## Support

If you encounter issues during submission:

- **MCP Registry Issues**: https://github.com/modelcontextprotocol/registry/issues
- **MCP Registry Discord**: https://discord.com/channels/1358869848138059966/1369487942862504016
- **Package Issues**: https://github.com/digitaldefiance/ai-capabilities-suite/issues
- **Email**: info@digitaldefiance.org

## Additional Resources

- **MCP Registry Documentation**: https://github.com/modelcontextprotocol/registry/tree/main/docs
- **MCP Registry Quickstart**: https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx
- **MCP Registry API**: https://registry.modelcontextprotocol.io/docs
- **Package Types Guide**: https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/package-types.mdx
- **Authentication Guide**: https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/authentication.mdx

## Automated Publishing (Future)

Consider setting up GitHub Actions for automated publishing:

```yaml
# .github/workflows/publish-mcp-registry.yml
name: Publish to MCP Registry

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - name: Install mcp-publisher
        run: |
          curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_linux_amd64.tar.gz" | tar xz
      - name: Publish to MCP Registry
        run: ./mcp-publisher publish
        env:
          MCP_REGISTRY_TOKEN: ${{ secrets.MCP_REGISTRY_TOKEN }}
```

## License

This submission guide is part of the MCP Debugger Server project and is licensed under the MIT License.
