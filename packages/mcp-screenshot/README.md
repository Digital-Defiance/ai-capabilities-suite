# MCP Screenshot Server

Enterprise-grade MCP server providing screenshot capture capabilities for AI agents.

## Features

- **Multi-format Support**: PNG, JPEG, WebP, BMP
- **Flexible Capture**: Full screen, specific windows, or custom regions
- **Privacy Protection**: PII masking with OCR-based detection
- **Security Controls**: Path validation, rate limiting, audit logging
- **Cross-platform**: Linux (X11/Wayland), macOS, Windows

## Installation

```bash
npm install @ai-capabilities-suite/mcp-screenshot
```

## Usage

### Basic Window Capture

```typescript
import { createCaptureEngine } from '@ai-capabilities-suite/mcp-screenshot';

// Create a platform-specific capture engine
const engine = createCaptureEngine();

// Capture window by ID
const windowId = "12345";
const buffer = await engine.captureWindow(windowId, false);

// Capture window by title pattern
const window = await engine.getWindowByTitle("Chrome");
if (window) {
  const buffer = await engine.captureWindow(window.id, false);
  console.log(`Captured window: ${window.title}`);
} else {
  console.log("No matching window found");
}

// List all windows
const windows = await engine.getWindows();
windows.forEach(w => {
  console.log(`${w.id}: ${w.title} (${w.processName})`);
});
```

### Window Capture by Title Pattern

The `getWindowByTitle` method supports flexible pattern matching:

```typescript
// Exact match (case-insensitive)
const window1 = await engine.getWindowByTitle("Terminal - bash");

// Partial match
const window2 = await engine.getWindowByTitle("Chrome");

// Regex pattern
const window3 = await engine.getWindowByTitle("Visual.*Code");

// Handle no matches gracefully
const window4 = await engine.getWindowByTitle("NonExistent");
if (!window4) {
  console.log("No window found matching pattern");
}
```

### Capture with Frame Inclusion

```typescript
// Capture window content only
const contentOnly = await engine.captureWindow(windowId, false);

// Capture window with frame (title bar and borders)
const withFrame = await engine.captureWindow(windowId, true);
```

More documentation will be added as implementation progresses.

## Development

This package is part of the AI Capabilities Suite monorepo.

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## License

MIT
