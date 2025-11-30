# MCP Debugger Server v{VERSION}

## 🎉 What's New

<!-- Automatically generated changelog will be inserted here -->

## 📦 Installation

### NPM (Recommended)

```bash
npm install -g @ai-capabilities-suite/mcp-debugger-server
```

### Standalone Binaries

Download the appropriate binary for your platform:

#### Linux

```bash
wget https://github.com/digitaldefiance/ai-capabilities-suite/releases/download/v{VERSION}/ts-mcp-server-linux-x64.tar.gz
tar -xzf ts-mcp-server-linux-x64.tar.gz
chmod +x ts-mcp-server-linux-x64
sudo mv ts-mcp-server-linux-x64 /usr/local/bin/ts-mcp-server
```

#### macOS

```bash
wget https://github.com/digitaldefiance/ai-capabilities-suite/releases/download/v{VERSION}/ts-mcp-server-macos-x64.tar.gz
tar -xzf ts-mcp-server-macos-x64.tar.gz
chmod +x ts-mcp-server-macos-x64
sudo mv ts-mcp-server-macos-x64 /usr/local/bin/ts-mcp-server
```

#### Windows (PowerShell)

```powershell
Invoke-WebRequest -Uri https://github.com/digitaldefiance/ai-capabilities-suite/releases/download/v{VERSION}/ts-mcp-server-win-x64.zip -OutFile ts-mcp-server.zip
Expand-Archive -Path ts-mcp-server.zip -DestinationPath .
Move-Item ts-mcp-server-win-x64.exe C:\Windows\System32\ts-mcp-server.exe
```

### Docker

```bash
docker pull digitaldefiance/ts-mcp-server:{VERSION}
docker run -it digitaldefiance/ts-mcp-server:{VERSION}
```

## 🚀 Quick Start

### Basic Usage

```bash
# Start the MCP server with stdio transport (default)
ts-mcp-server

# Start with debug logging
ts-mcp-server --log-level debug

# Show help
ts-mcp-server --help
```

### Configuration for AI Agents

#### Kiro

Add to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "debugger": {
      "command": "ts-mcp-server",
      "args": [],
      "env": {
        "MCP_LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Amazon Q

Add to your Amazon Q configuration:

```json
{
  "mcp": {
    "servers": {
      "debugger": {
        "command": "ts-mcp-server"
      }
    }
  }
}
```

## 🔧 Features

- **25+ Debugging Tools**: Comprehensive debugging capabilities
- **Breakpoint Management**: Set, remove, toggle, and list breakpoints
- **Variable Inspection**: Inspect local, global, and object properties
- **Execution Control**: Continue, step over, step into, step out, pause
- **Performance Profiling**: CPU and memory profiling
- **Hang Detection**: Detect infinite loops and hanging processes
- **Source Map Support**: Debug TypeScript with full source map support
- **Test Framework Integration**: Jest, Mocha, Vitest support
- **Enterprise Features**: Authentication, rate limiting, audit logging
- **Observability**: Structured logging, metrics, health checks

## 📚 Documentation

- [README](https://github.com/digitaldefiance/ai-capabilities-suite/tree/main/packages/mcp-debugger-server#readme)
- [API Documentation](https://github.com/digitaldefiance/ai-capabilities-suite/blob/main/packages/mcp-debugger-server/API.md)
- [Tool Reference](https://github.com/digitaldefiance/ai-capabilities-suite/blob/main/packages/mcp-debugger-server/TOOL-REFERENCE.md)
- [AI Agent Integration](https://github.com/digitaldefiance/ai-capabilities-suite/blob/main/packages/mcp-debugger-server/AI-AGENT-INTEGRATION.md)
- [VS Code Integration](https://github.com/digitaldefiance/ai-capabilities-suite/blob/main/packages/mcp-debugger-server/VSCODE-INTEGRATION.md)

## 🔐 Checksums

Verify your download with SHA256 checksums (included in release assets):

- `ts-mcp-server-linux-x64.tar.gz.sha256`
- `ts-mcp-server-macos-x64.tar.gz.sha256`
- `ts-mcp-server-win-x64.zip.sha256`

## 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/digitaldefiance/ai-capabilities-suite/issues/new).

## 💬 Support

- [GitHub Discussions](https://github.com/digitaldefiance/ai-capabilities-suite/discussions)
- [Issue Tracker](https://github.com/digitaldefiance/ai-capabilities-suite/issues)
- Email: info@digitaldefiance.org

## 📄 License

MIT License - see [LICENSE](https://github.com/digitaldefiance/ai-capabilities-suite/blob/main/LICENSE) for details.

---

**Full Changelog**: https://github.com/digitaldefiance/ai-capabilities-suite/compare/v{PREVIOUS_VERSION}...v{VERSION}
