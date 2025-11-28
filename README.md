# 🚀 AI Capability Extension Suite

**Give AI agents superpowers with comprehensive MCP servers for capabilities they've never had before.**

This monorepo provides a complete suite of Model Context Protocol (MCP) servers that extend AI agents with professional-grade debugging, system interaction, and automation capabilities.

## 🎯 Vision

AI agents are powerful at code generation and analysis, but they lack:
- **Runtime visibility** - Can't see what code actually does when it runs
- **System interaction** - Can't capture screens, record videos, or manage processes
- **Physical world access** - Can't interact with the user's actual environment

This suite solves all of that.

## 📦 Packages

### 🐛 Debugging Capabilities
- **mcp-debugger-core** - Core debugging engine with Chrome DevTools Protocol integration
- **mcp-debugger-server** - MCP server with 25+ professional debugging tools
  - Breakpoints, variable inspection, execution control
  - Performance profiling (CPU, memory, timeline)
  - Hang detection and infinite loop identification
  - TypeScript source map support
  - Enterprise security and compliance features
  - **94.53% test coverage** with 1,059 tests
  - See [DEBUGGER-README.md](./DEBUGGER-README.md) for full details

### 🖥️ System Capabilities
- **mcp-screenshot** - Screen capture and image operations
- **mcp-recording** - Screen recording and video operations
- **mcp-filesystem** - Advanced file system operations
- **mcp-process** - Process and application management

### 🔧 Shared Infrastructure
- **mcp-core** - Common MCP patterns, base classes, and utilities

## 🚀 Getting Started

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Run tests
yarn test
```

## 📋 Development

```bash
# Build specific package
npx nx build mcp-debugger-server
npx nx build mcp-screenshot

# Test specific package
npx nx test mcp-debugger-core
npx nx test mcp-screenshot

# Watch mode
npx nx build mcp-screenshot --watch
```

## 🏆 Highlights

### MCP Debugger (Production-Ready)
- **25+ professional debugging tools** for AI agents
- **Enterprise-grade** security, compliance, and observability
- **94.53% test coverage** exceeding industry standards
- **Production-ready** with graceful shutdown, circuit breakers, retry logic
- **Cross-platform** support (Linux, macOS, Windows)
- See [DEBUGGER-README.md](./DEBUGGER-README.md) for the full story

### System Capabilities (In Development)
- Screenshot capture with multiple formats
- Screen recording with video encoding
- Advanced file operations beyond basic read/write
- Process management and monitoring

## 🤝 Contributing

This project follows a spec-driven development approach with comprehensive testing and documentation.

## 📄 License

MIT - See [LICENSE](./LICENSE) for details
