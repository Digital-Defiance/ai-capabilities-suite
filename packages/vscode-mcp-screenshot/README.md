# MCP Screenshot - VS Code Extension

Cross-platform screenshot capture extension for Visual Studio Code with Model Context Protocol (MCP) integration.

## Features

- **Full Screen Capture**: Capture entire displays or specific monitors
- **Window Capture**: Target specific application windows
- **Region Capture**: Capture rectangular screen regions
- **Multi-Format Support**: PNG, JPEG, WebP, BMP
- **PII Masking**: Automatic detection and redaction of sensitive information
- **Multi-Monitor Support**: Works seamlessly with multiple displays
- **MCP Integration**: Designed for AI agent workflows

## Installation

1. Install from VS Code Marketplace (coming soon)
2. Or install from VSIX file:
   ```bash
   code --install-extension mcp-screenshot-0.0.1.vsix
   ```

## Usage

### Commands

- **MCP Screenshot: Capture Full Screen** - Capture the entire screen
- **MCP Screenshot: Capture Window** - Select and capture a specific window
- **MCP Screenshot: Capture Region** - Capture a rectangular region
- **MCP Screenshot: List Displays** - Show all connected displays
- **MCP Screenshot: List Windows** - Show all visible windows
- **MCP Screenshot: Open Settings** - Configure extension settings

### Keyboard Shortcuts

You can assign custom keyboard shortcuts to any command via VS Code's keyboard shortcuts settings.

## Configuration

Configure the extension via VS Code settings:

```json
{
  "mcpScreenshot.defaultFormat": "png",
  "mcpScreenshot.defaultQuality": 90,
  "mcpScreenshot.saveDirectory": "${workspaceFolder}/screenshots",
  "mcpScreenshot.enablePIIMasking": false,
  "mcpScreenshot.autoSave": true,
  "mcpScreenshot.autoStart": true
}
```

### Settings

- `mcpScreenshot.defaultFormat`: Default image format (png, jpeg, webp, bmp)
- `mcpScreenshot.defaultQuality`: Default quality for lossy formats (1-100)
- `mcpScreenshot.saveDirectory`: Default directory for saving screenshots
- `mcpScreenshot.enablePIIMasking`: Enable PII detection and masking by default
- `mcpScreenshot.autoSave`: Automatically save screenshots to disk
- `mcpScreenshot.autoStart`: Automatically start MCP server when VS Code opens
- `mcpScreenshot.serverCommand`: Command to run MCP screenshot server
- `mcpScreenshot.serverArgs`: Arguments for MCP screenshot server command

## Requirements

- Visual Studio Code 1.85.0 or higher
- Node.js 18.0.0 or higher
- Platform-specific dependencies:
  - **Linux**: X11 or Wayland, ImageMagick
  - **macOS**: screencapture (built-in)
  - **Windows**: screenshot-desktop library

## Examples

### Capture Full Screen

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Run "MCP Screenshot: Capture Full Screen"
3. Screenshot is saved to configured directory

### Capture Specific Window

1. Open Command Palette
2. Run "MCP Screenshot: Capture Window"
3. Select window from the list
4. Choose whether to include window frame
5. Screenshot is captured

### Capture Region

1. Open Command Palette
2. Run "MCP Screenshot: Capture Region"
3. Enter coordinates and dimensions
4. Screenshot is captured

## Privacy & Security

- **PII Masking**: Automatically detect and redact emails, phone numbers, and credit cards
- **Window Exclusion**: Exclude password managers and authentication dialogs
- **Path Validation**: Restrict file saves to allowed directories
- **Rate Limiting**: Prevent capture spam

## Troubleshooting

### Extension Not Starting

Check the Output panel (View → Output → MCP Screenshot) for error messages.

### Permission Errors on Linux

Ensure X11 access:
```bash
xhost +local:
```

### macOS Screen Recording Permission

Grant screen recording permission:
1. System Preferences → Security & Privacy → Privacy
2. Select "Screen Recording"
3. Add Visual Studio Code

## Support

- GitHub: https://github.com/digital-defiance/ai-capabilities-suite
- Issues: https://github.com/digital-defiance/ai-capabilities-suite/issues
- Email: info@digitaldefiance.org

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please see our contributing guidelines in the repository.

## Changelog

### 0.0.1 (Initial Release)

- Full screen capture
- Window capture
- Region capture
- Multi-format support
- PII masking
- Multi-monitor support
- MCP integration
