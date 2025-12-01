# Docker MCP Registry Submission Guide

This document provides step-by-step instructions for submitting the MCP Debugger Server to the **Docker MCP Registry** (hub.docker.com/mcp).

## Important: Two Different Registries

There are **two separate MCP registries**:

1. **Regular MCP Registry** (modelcontextprotocol.io) - ✅ Already submitted (see `MCP-REGISTRY-SUBMISSION.md`)
2. **Docker MCP Registry** (hub.docker.com/mcp) - ⏳ This document covers this submission

## Prerequisites

Before submitting to the Docker MCP Registry, ensure:

1. ✅ **Docker Image Published**: Image must be available on Docker Hub
   - Current image: `digidefiance/mcp-debugger-server:latest`
   - Verified: https://hub.docker.com/r/digidefiance/mcp-debugger-server

2. ✅ **Dockerfile in Repository**: Dockerfile must be in the GitHub repository
   - Location: `packages/mcp-debugger-server/Dockerfile`
   - Repository: https://github.com/digital-defiance/ai-capabilities-suite

3. ✅ **Submission Files Created**: Required files for Docker MCP Registry
   - `server.yaml` - Server configuration ✅
   - `tools.json` - Tool definitions (25 tools) ✅
   - `readme.md` - Documentation ✅
   - Location: `packages/mcp-debugger-server/docker-mcp-registry/`

4. ✅ **License**: MIT License (allows consumption)

## Current Status

- ✅ Package name: `@ai-capabilities-suite/mcp-debugger-server`
- ✅ Docker image: `digidefiance/mcp-debugger-server:latest`
- ✅ Version: 1.0.3
- ✅ License: MIT
- ✅ Repository: https://github.com/digital-defiance/ai-capabilities-suite
- ✅ Submission files: Created in `docker-mcp-registry/` directory
- ⏳ Fork docker/mcp-registry: Pending (manual step)
- ⏳ Submit PR: Pending (manual step)

## Submission Process

### Step 1: Fork the Docker MCP Registry Repository

1. Visit https://github.com/docker/mcp-registry
2. Click the "Fork" button in the top right
3. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/mcp-registry.git
cd mcp-registry
```

### Step 2: Create Server Directory

Create a directory for our server in the `servers/` folder:

```bash
cd servers
mkdir ts-mcp-debugger
cd ts-mcp-debugger
```

### Step 3: Copy Submission Files

Copy the prepared submission files from our repository:

```bash
# From the mcp-registry/servers/ts-mcp-debugger directory
# Copy the three required files:
cp /path/to/ai-capabilities-suite/packages/mcp-debugger-server/docker-mcp-registry/server.yaml .
cp /path/to/ai-capabilities-suite/packages/mcp-debugger-server/docker-mcp-registry/tools.json .
cp /path/to/ai-capabilities-suite/packages/mcp-debugger-server/docker-mcp-registry/readme.md .
```

Or manually create them with the content from the `docker-mcp-registry/` directory.

### Step 4: Verify File Structure

Your directory structure should look like this:

```
mcp-registry/
└── servers/
    └── ts-mcp-debugger/
        ├── server.yaml    # Server configuration
        ├── tools.json     # Tool definitions (25 tools)
        └── readme.md      # Documentation
```

### Step 5: Install Prerequisites (Optional - for local testing)

If you want to test locally before submitting:

```bash
# Install Go (required for task commands)
# macOS
brew install go

# Linux
sudo apt-get install golang-go

# Install Task
# macOS
brew install go-task/tap/go-task

# Linux
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin
```

### Step 6: Test Locally (Optional but Recommended)

Test your server configuration locally:

```bash
# From the mcp-registry root directory

# Build the catalog
task catalog -- ts-mcp-debugger

# Import into Docker Desktop
docker mcp catalog import $PWD/catalogs/ts-mcp-debugger/catalog.yaml

# Enable the server in Docker Desktop MCP Toolkit
# Test the server with your AI agent

# When done testing, reset the catalog
docker mcp catalog reset
```

### Step 7: Commit and Push Changes

```bash
# From the mcp-registry root directory
git add servers/ts-mcp-debugger/
git commit -m "Add ts-mcp-debugger: Enterprise Node.js/TypeScript debugging with 25+ tools"
git push origin main
```

### Step 8: Create Pull Request

1. Go to your fork on GitHub: `https://github.com/YOUR_USERNAME/mcp-registry`
2. Click "Contribute" → "Open pull request"
3. Fill in the PR details:

**Title:**
```
Add ts-mcp-debugger: Enterprise Node.js/TypeScript debugging
```

**Description:**
```markdown
## Server Information

- **Name**: ts-mcp-debugger
- **Category**: debugging
- **Type**: Local (containerized)
- **Image**: digidefiance/mcp-debugger-server:latest
- **Repository**: https://github.com/digital-defiance/ai-capabilities-suite

## Description

Enterprise-grade MCP server providing comprehensive debugging capabilities for Node.js and TypeScript applications. Features 25+ specialized tools including breakpoints, variable inspection, execution control, CPU/memory profiling, hang detection, source map support, and comprehensive observability.

## Key Features

### Core Debugging
- Breakpoint management (set, remove, toggle, list) with conditions and hit counts
- Execution control (continue, step over/into/out, pause)
- Variable inspection (local, global, expressions, watches)
- Call stack navigation with context switching

### Advanced Features
- Hang detection for infinite loops and hanging processes
- Full TypeScript support with source maps
- Performance profiling (CPU, memory, heap snapshots)
- Test framework integration (Jest, Mocha, Vitest)

### Enterprise Features
- Observability (structured logging, metrics, health checks, Prometheus)
- Security (authentication, rate limiting, data masking, audit logging)
- Production ready (circuit breakers, retry logic, graceful shutdown)

## Tools Provided

25 debugging tools covering:
- Session management (2 tools)
- Breakpoints (4 tools)
- Execution control (5 tools)
- Variable inspection (7 tools)
- Call stack (2 tools)
- Advanced features (5 tools)

## Testing

- ✅ Docker image tested and working
- ✅ All 25 tools verified functional
- ✅ Tested with Kiro, Claude Desktop, and VS Code
- ✅ Documentation complete and comprehensive

## Checklist

- [x] Dockerfile exists in repository
- [x] Docker image published to Docker Hub
- [x] server.yaml created with proper metadata
- [x] tools.json includes all 25 tools
- [x] readme.md provides comprehensive documentation
- [x] MIT License (allows consumption)
- [x] Tested locally with Docker Desktop MCP Toolkit

## Additional Information

- **NPM Package**: https://www.npmjs.com/package/@ai-capabilities-suite/mcp-debugger-server
- **Docker Hub**: https://hub.docker.com/r/digidefiance/mcp-debugger-server
- **Documentation**: https://github.com/digital-defiance/ai-capabilities-suite/tree/main/packages/mcp-debugger-server
- **License**: MIT
- **Maintainer**: Digital Defiance (info@digitaldefiance.org)
```

4. Click "Create pull request"

### Step 9: Share Test Credentials (If Required)

If the Docker team needs test credentials to verify functionality, fill out the form:
https://forms.gle/6Lw3nsvu2d6nFg8e6

**Note**: Our server doesn't require authentication by default, so this may not be necessary.

### Step 10: Wait for Review

The Docker team will review your submission. They will check:
- ✅ Dockerfile exists and is valid
- ✅ Docker image is accessible
- ✅ server.yaml is properly formatted
- ✅ tools.json is complete
- ✅ Documentation is comprehensive
- ✅ License allows consumption
- ✅ CI passes

### Step 11: Respond to Feedback

If the Docker team requests changes:
1. Make the requested changes in your fork
2. Commit and push the changes
3. The PR will automatically update
4. Comment on the PR when ready for re-review

### Step 12: Merge and Publication

Once approved:
1. The Docker team will merge your PR
2. Your server will be available within 24 hours at:
   - **MCP Catalog**: https://hub.docker.com/mcp
   - **Docker Desktop MCP Toolkit**: Available in the UI
   - **Docker Hub mcp namespace**: https://hub.docker.com/u/mcp (if Docker builds the image)

## Submission Options

The Docker MCP Registry supports two submission types:

### Option A: Docker-Built Image (Recommended)

**Benefits:**
- Cryptographic signatures
- Provenance tracking
- Software Bills of Materials (SBOMs)
- Automatic security updates

**How to request:**
In your PR, request that Docker build and maintain the image. They will:
1. Build from your Dockerfile
2. Sign and publish to `mcp/ts-mcp-debugger`
3. Provide enhanced security features

### Option B: Self-Provided Image (Current)

**Current setup:**
- Image: `digidefiance/mcp-debugger-server:latest`
- Built and maintained by Digital Defiance
- Still benefits from container isolation

**Trade-offs:**
- No automatic security updates from Docker
- No cryptographic signatures from Docker
- No SBOMs from Docker

**Recommendation:** Consider requesting Option A in the PR for enhanced security features.

## Troubleshooting

### Error: "Dockerfile not found"

**Cause**: Dockerfile not in repository or wrong path

**Solution**:
- Verify Dockerfile exists at `packages/mcp-debugger-server/Dockerfile`
- Update `source.project` in `server.yaml` if needed

### Error: "Docker image not accessible"

**Cause**: Image not public or doesn't exist

**Solution**:
```bash
# Verify image is public
docker pull digidefiance/mcp-debugger-server:latest

# If not public, make it public on Docker Hub
```

### Error: "tools.json validation failed"

**Cause**: Invalid JSON format or missing required fields

**Solution**:
```bash
# Validate JSON
cat tools.json | jq .

# Ensure each tool has: name, description, arguments
```

### Error: "CI build failed"

**Cause**: Various issues with build process

**Solution**:
1. Check CI logs in the PR
2. Fix the reported issues
3. Push changes to update PR

## Post-Submission Checklist

After successful submission:

- [ ] Verify server appears in Docker Hub MCP catalog
- [ ] Test installation from Docker Desktop MCP Toolkit
- [ ] Test with AI agents (Kiro, Claude Desktop)
- [ ] Update main README with Docker MCP Registry link
- [ ] Announce on social media / community channels
- [ ] Monitor for user feedback and issues
- [ ] Plan for future updates

## Updating the Server

To publish updates:

1. Update version in `package.json` and `Dockerfile`
2. Build and push new Docker image
3. Update `server.yaml` if needed (version, tools, etc.)
4. Submit new PR to docker/mcp-registry
5. Wait for review and merge

## Support

If you encounter issues during submission:

- **Docker MCP Registry Issues**: https://github.com/docker/mcp-registry/issues
- **Package Issues**: https://github.com/digital-defiance/ai-capabilities-suite/issues
- **Email**: info@digitaldefiance.org

## Additional Resources

- **Docker MCP Registry**: https://github.com/docker/mcp-registry
- **Contributing Guide**: https://github.com/docker/mcp-registry/blob/main/CONTRIBUTING.md
- **Docker Hub MCP Catalog**: https://hub.docker.com/mcp
- **Docker Desktop**: https://www.docker.com/products/docker-desktop/
- **MCP Documentation**: https://modelcontextprotocol.io/

## Comparison: Docker MCP Registry vs Regular MCP Registry

| Feature | Docker MCP Registry | Regular MCP Registry |
|---------|-------------------|---------------------|
| **URL** | hub.docker.com/mcp | registry.modelcontextprotocol.io |
| **Format** | server.yaml | server.json |
| **Deployment** | Docker containers | NPM packages, binaries |
| **Discovery** | Docker Desktop, Docker Hub | MCP clients, npm search |
| **Security** | Container isolation, optional Docker-built images | Package-level security |
| **Our Status** | ⏳ Pending submission | ✅ Already submitted |

## License

This submission guide is part of the MCP Debugger Server project and is licensed under the MIT License.

---

**Last Updated**: 2025-01-XX (update when submitting)
**Version**: 1.0.3
**Maintainer**: Digital Defiance
