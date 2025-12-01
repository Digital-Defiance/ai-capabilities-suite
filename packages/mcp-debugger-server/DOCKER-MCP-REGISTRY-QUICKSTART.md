# Docker MCP Registry Submission - Quick Start

## TL;DR

All files are ready. Just need to submit a PR to docker/mcp-registry.

## Quick Steps

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/mcp-registry.git
cd mcp-registry

# 2. Create directory
mkdir -p servers/ts-mcp-debugger
cd servers/ts-mcp-debugger

# 3. Copy files (from ai-capabilities-suite repo)
cp /path/to/ai-capabilities-suite/packages/mcp-debugger-server/docker-mcp-registry/server.yaml .
cp /path/to/ai-capabilities-suite/packages/mcp-debugger-server/docker-mcp-registry/tools.json .
cp /path/to/ai-capabilities-suite/packages/mcp-debugger-server/docker-mcp-registry/readme.md .

# 4. Commit and push
cd ../..
git add servers/ts-mcp-debugger/
git commit -m "Add ts-mcp-debugger: Enterprise Node.js/TypeScript debugging with 25+ tools"
git push origin main

# 5. Create PR on GitHub
# Go to your fork and click "Contribute" → "Open pull request"
```

## PR Title

```
Add ts-mcp-debugger: Enterprise Node.js/TypeScript debugging
```

## PR Description (Copy/Paste)

```markdown
## Server Information

- **Name**: ts-mcp-debugger
- **Category**: debugging
- **Type**: Local (containerized)
- **Image**: digitaldefiance/ts-mcp-server:latest
- **Repository**: https://github.com/digitaldefiance/ai-capabilities-suite

## Description

Enterprise-grade MCP server providing comprehensive debugging capabilities for Node.js and TypeScript applications. Features 25+ specialized tools including breakpoints, variable inspection, execution control, CPU/memory profiling, hang detection, source map support, and comprehensive observability.

## Key Features

- **Core Debugging**: Breakpoints, execution control, variable inspection, call stack navigation
- **Advanced Features**: Hang detection, TypeScript support, performance profiling, test framework integration
- **Enterprise Features**: Observability, security, production readiness

## Tools Provided

25 debugging tools covering session management, breakpoints, execution control, variable inspection, call stack, and advanced features.

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

## Links

- **NPM**: https://www.npmjs.com/package/@ai-capabilities-suite/mcp-debugger-server
- **Docker Hub**: https://hub.docker.com/r/digitaldefiance/ts-mcp-server
- **Docs**: https://github.com/digitaldefiance/ai-capabilities-suite/tree/main/packages/mcp-debugger-server
- **License**: MIT
```

## Files to Copy

All files are in: `packages/mcp-debugger-server/docker-mcp-registry/`

1. ✅ `server.yaml` - Server configuration
2. ✅ `tools.json` - Tool definitions (25 tools)
3. ✅ `readme.md` - Documentation

## Verification

Before submitting, verify:

```bash
# Check files exist
ls -la servers/ts-mcp-debugger/
# Should show: server.yaml, tools.json, readme.md

# Validate JSON
cat servers/ts-mcp-debugger/tools.json | jq .

# Check YAML
cat servers/ts-mcp-debugger/server.yaml
```

## Optional: Test Locally

```bash
# Install prerequisites (if not already installed)
brew install go-task  # macOS
# or
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin  # Linux

# Test the server
task catalog -- ts-mcp-debugger
docker mcp catalog import $PWD/catalogs/ts-mcp-debugger/catalog.yaml

# Test in Docker Desktop MCP Toolkit
# When done:
docker mcp catalog reset
```

## After PR is Merged

Server will be available within 24 hours at:
- https://hub.docker.com/mcp
- Docker Desktop MCP Toolkit
- https://hub.docker.com/u/mcp (if Docker builds the image)

## Need Help?

- **Full Guide**: See `DOCKER-MCP-REGISTRY-SUBMISSION.md`
- **Troubleshooting**: See `DOCKER-MCP-REGISTRY-SUBMISSION.md` section
- **Issues**: https://github.com/docker/mcp-registry/issues
- **Email**: info@digitaldefiance.org

## Status

✅ All files ready
⏳ Waiting for manual PR submission

---

**Quick Reference**: Keep this file handy when submitting the PR!
