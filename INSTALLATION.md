# MCP Debugger Server - Installation Guide

This guide provides comprehensive installation instructions for the MCP Debugger Server across all supported platforms.

## Table of Contents

- [Quick Install](#quick-install)
- [Installation Methods](#installation-methods)
  - [NPM (Recommended)](#npm-recommended)
  - [Standalone Binaries](#standalone-binaries)
  - [Docker](#docker)
  - [Package Managers](#package-managers)
- [Platform-Specific Instructions](#platform-specific-instructions)
  - [Linux](#linux)
  - [macOS](#macos)
  - [Windows](#windows)
- [Verification](#verification)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Quick Install

### NPM (All Platforms)

```bash
npm install -g @ai-capabilities-suite/mcp-debugger-server
```

### One-Line Install Scripts

**Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/digitaldefiance/ai-capabilities-suite/main/scripts/install-linux.sh | bash
```

**macOS:**
```bash
curl -fsSL https://raw.githubusercontent.com/digitaldefiance/ai-capabilities-suite/main/scripts/install-macos.sh | bash
```

**Windows (PowerShell as Administrator):**
```powershell
iwr -useb https://raw.githubusercontent.com/digitaldefiance/ai-capabilities-suite/main/scripts/install-windows.ps1 | iex
```

## Installation Methods

### NPM (Recommended)

The easiest way to install the MCP Debugger Server is via NPM:

```bash
# Install globally
npm install -g @ai-capabilities-suite/mcp-debugger-server

# Verify installation
ts-mcp-server --version
```

**Advantages:**
- ✅ Automatic updates via `npm update -g`
- ✅ Works on all platforms
- ✅ Includes all dependencies
- ✅ Easy to uninstall

**Requirements:**
- Node.js 18.0.0 or higher
- NPM 8.0.0 or higher

### Standalone Binaries

Standalone binaries are self-contained executables that don't require Node.js to be installed.

**Download from GitHub Releases:**

Visit the [latest release page](https://github.com/digitaldefiance/ai-capabilities-suite/releases/latest) and download the appropriate binary for your platform:

- `ts-mcp-server-linux-x64.tar.gz` - Linux (x64)
- `ts-mcp-server-macos-x64.tar.gz` - macOS (x64)
- `ts-mcp-server-win-x64.zip` - Windows (x64)

**Advantages:**
- ✅ No Node.js required
- ✅ Single executable file
- ✅ Portable
- ✅ Fast startup

**Disadvantages:**
- ❌ Manual updates required
- ❌ Larger file size (~50MB)

### Docker

Run the MCP Debugger Server in a Docker container:

```bash
# Pull the latest image
docker pull digitaldefiance/ts-mcp-server:latest

# Run the server
docker run -it --rm digitaldefiance/ts-mcp-server:latest

# Run with volume mount for debugging local files
docker run -it --rm -v $(pwd):/workspace digitaldefiance/ts-mcp-server:latest
```

**Advantages:**
- ✅ Isolated environment
- ✅ Consistent across platforms
- ✅ Easy to deploy
- ✅ Version pinning

**Requirements:**
- Docker 20.10 or higher

### Package Managers

#### Homebrew (macOS)

```bash
# Coming soon
brew install ts-mcp-server
```

#### Chocolatey (Windows)

```bash
# Coming soon
choco install ts-mcp-server
```

#### APT (Debian/Ubuntu)

```bash
# Coming soon
sudo apt install ts-mcp-server
```

## Platform-Specific Instructions

### Linux

#### Method 1: Automated Script

```bash
curl -fsSL https://raw.githubusercontent.com/digitaldefiance/ai-capabilities-suite/main/scripts/install-linux.sh | bash
```

#### Method 2: Manual Installation

1. Download the binary:
   ```bash
   wget https://github.com/digitaldefiance/ai-capabilities-suite/releases/latest/download/ts-mcp-server-linux-x64.tar.gz
   ```

2. Download the checksum:
   ```bash
   wget https://github.com/digitaldefiance/ai-capabilities-suite/releases/latest/download/ts-mcp-server-linux-x64.tar.gz.sha256
   ```

3. Verify the checksum:
   ```bash
   sha256sum -c ts-mcp-server-linux-x64.tar.gz.sha256
   ```

4. Extract the binary:
   ```bash
   tar -xzf ts-mcp-server-linux-x64.tar.gz
   ```

5. Make it executable:
   ```bash
   chmod +x ts-mcp-server-linux-x64
   ```

6. Move to system path:
   ```bash
   sudo mv ts-mcp-server-linux-x64 /usr/local/bin/ts-mcp-server
   ```

7. Verify installation:
   ```bash
   ts-mcp-server --version
   ```

### macOS

#### Method 1: Automated Script

```bash
curl -fsSL https://raw.githubusercontent.com/digitaldefiance/ai-capabilities-suite/main/scripts/install-macos.sh | bash
```

#### Method 2: Manual Installation

1. Download the binary:
   ```bash
   wget https://github.com/digitaldefiance/ai-capabilities-suite/releases/latest/download/ts-mcp-server-macos-x64.tar.gz
   ```

2. Download the checksum:
   ```bash
   wget https://github.com/digitaldefiance/ai-capabilities-suite/releases/latest/download/ts-mcp-server-macos-x64.tar.gz.sha256
   ```

3. Verify the checksum:
   ```bash
   shasum -a 256 -c ts-mcp-server-macos-x64.tar.gz.sha256
   ```

4. Extract the binary:
   ```bash
   tar -xzf ts-mcp-server-macos-x64.tar.gz
   ```

5. Remove quarantine attribute:
   ```bash
   xattr -d com.apple.quarantine ts-mcp-server-macos-x64
   ```

6. Make it executable:
   ```bash
   chmod +x ts-mcp-server-macos-x64
   ```

7. Move to system path:
   ```bash
   sudo mv ts-mcp-server-macos-x64 /usr/local/bin/ts-mcp-server
   ```

8. Verify installation:
   ```bash
   ts-mcp-server --version
   ```

**Note:** On first run, macOS may show a security warning. If this happens:
1. Go to **System Preferences** > **Security & Privacy**
2. Click **Allow Anyway** for `ts-mcp-server`
3. Run the command again

### Windows

#### Method 1: Automated Script (PowerShell as Administrator)

```powershell
iwr -useb https://raw.githubusercontent.com/digitaldefiance/ai-capabilities-suite/main/scripts/install-windows.ps1 | iex
```

#### Method 2: Manual Installation

1. Download the binary:
   ```powershell
   Invoke-WebRequest -Uri https://github.com/digitaldefiance/ai-capabilities-suite/releases/latest/download/ts-mcp-server-win-x64.zip -OutFile ts-mcp-server.zip
   ```

2. Download the checksum:
   ```powershell
   Invoke-WebRequest -Uri https://github.com/digitaldefiance/ai-capabilities-suite/releases/latest/download/ts-mcp-server-win-x64.zip.sha256 -OutFile ts-mcp-server.zip.sha256
   ```

3. Verify the checksum:
   ```powershell
   $expectedHash = (Get-Content ts-mcp-server.zip.sha256).Split()[0]
   $actualHash = (Get-FileHash -Path ts-mcp-server.zip -Algorithm SHA256).Hash
   if ($expectedHash -eq $actualHash) { Write-Host "Checksum verified" -ForegroundColor Green } else { Write-Host "Checksum failed" -ForegroundColor Red }
   ```

4. Extract the binary:
   ```powershell
   Expand-Archive -Path ts-mcp-server.zip -DestinationPath .
   ```

5. Move to system directory (requires Administrator):
   ```powershell
   Move-Item ts-mcp-server-win-x64.exe C:\Windows\System32\ts-mcp-server.exe
   ```

6. Verify installation:
   ```powershell
   ts-mcp-server --version
   ```

## Verification

After installation, verify that the server is working correctly:

```bash
# Check version
ts-mcp-server --version

# Show help
ts-mcp-server --help

# Test the server (it will start and wait for MCP connections)
ts-mcp-server
```

Press `Ctrl+C` to stop the server.

## Configuration

### For AI Agents

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

#### GitHub Copilot

See [VSCODE-INTEGRATION.md](packages/mcp-debugger-server/VSCODE-INTEGRATION.md) for VS Code and GitHub Copilot integration.

### Environment Variables

Configure the server using environment variables:

```bash
# Set log level (debug, info, warn, error)
export MCP_LOG_LEVEL=debug

# Set authentication token
export MCP_AUTH_TOKEN=your-secret-token

# Set TCP port (if not using stdio)
export MCP_PORT=3000

# Set host (if not using stdio)
export MCP_HOST=localhost
```

## Troubleshooting

### Command Not Found

If you get a "command not found" error after installation:

**Linux/macOS:**
```bash
# Check if the binary is in your PATH
which ts-mcp-server

# If not, add the installation directory to your PATH
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Windows:**
```powershell
# Check if the binary is in your PATH
where.exe ts-mcp-server

# If not, add to PATH manually:
# 1. Open System Properties > Environment Variables
# 2. Edit the PATH variable
# 3. Add the installation directory
```

### Permission Denied (Linux/macOS)

If you get a "permission denied" error:

```bash
# Make the binary executable
chmod +x /usr/local/bin/ts-mcp-server
```

### macOS Security Warning

If macOS blocks the binary:

1. Go to **System Preferences** > **Security & Privacy**
2. Click **Allow Anyway** for `ts-mcp-server`
3. Run the command again

### Windows SmartScreen Warning

If Windows SmartScreen blocks the binary:

1. Click **More info**
2. Click **Run anyway**

### NPM Installation Fails

If NPM installation fails:

```bash
# Clear NPM cache
npm cache clean --force

# Try installing again
npm install -g @ai-capabilities-suite/mcp-debugger-server

# If still failing, try with sudo (Linux/macOS)
sudo npm install -g @ai-capabilities-suite/mcp-debugger-server --unsafe-perm
```

### Binary Doesn't Work

If the binary doesn't work:

1. Check system requirements:
   - Linux: glibc 2.17 or higher
   - macOS: macOS 10.13 or higher
   - Windows: Windows 10 or higher

2. Try the NPM installation instead:
   ```bash
   npm install -g @ai-capabilities-suite/mcp-debugger-server
   ```

## Uninstallation

### NPM

```bash
npm uninstall -g @ai-capabilities-suite/mcp-debugger-server
```

### Standalone Binary

**Linux/macOS:**
```bash
sudo rm /usr/local/bin/ts-mcp-server
```

**Windows:**
```powershell
Remove-Item C:\Windows\System32\ts-mcp-server.exe
```

### Docker

```bash
docker rmi digitaldefiance/ts-mcp-server
```

## Getting Help

- **Documentation:** [README.md](packages/mcp-debugger-server/README.md)
- **Issues:** [GitHub Issues](https://github.com/digitaldefiance/ai-capabilities-suite/issues)
- **Discussions:** [GitHub Discussions](https://github.com/digitaldefiance/ai-capabilities-suite/discussions)
- **Email:** info@digitaldefiance.org

## Next Steps

After installation, check out:

- [Quick Start Guide](packages/mcp-debugger-server/README.md#quick-start)
- [Tool Reference](packages/mcp-debugger-server/TOOL-REFERENCE.md)
- [AI Agent Integration](packages/mcp-debugger-server/AI-AGENT-INTEGRATION.md)
- [VS Code Integration](packages/mcp-debugger-server/VSCODE-INTEGRATION.md)
