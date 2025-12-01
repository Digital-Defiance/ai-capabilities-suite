# MCP Screenshot - Design Document

## Overview

The MCP Screenshot server provides AI agents with visual awareness by enabling screen capture in multiple formats. The server supports full screen, window-specific, and region-based captures with privacy protection through PII masking and configurable security policies.

## Architecture

```
┌─────────────────┐
│   AI Agent      │
│   (Kiro)        │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│ MCP Screenshot  │
│     Server      │
└────────┬────────┘
         │ Platform APIs
         ├─────────────────┐
         │                 │
┌────────▼────────┐ ┌─────▼──────┐
│  Display/Window │ │   Image    │
│    Capture      │ │  Processing│
└─────────────────┘ └────────────┘
```

## Core Components

### 1. MCP Server
- Implements MCP protocol
- Exposes screenshot tools
- Manages capture sessions
- Handles tool calls from AI agent
- Enforces security policies

### 2. Capture Engine
- Interfaces with platform-specific APIs
- Captures full screen, windows, or regions
- Handles multi-monitor setups
- Manages display enumeration
- Tracks window positions

### 3. Image Processor
- Encodes images in multiple formats
- Applies compression and optimization
- Handles format conversion
- Generates thumbnails
- Computes image metadata

### 4. Privacy Manager
- Detects and masks PII
- Applies window exclusion rules
- Performs OCR-based text detection
- Redacts sensitive patterns
- Tracks masking statistics

### 5. Security Manager
- Validates file paths
- Enforces directory restrictions
- Applies rate limiting
- Manages audit logging
- Loads security policies

## Platform-Specific Implementation

### Linux (X11/Wayland)
```typescript
import { exec } from 'child_process';
import sharp from 'sharp';

async function captureScreenLinux(): Promise<Buffer> {
  // X11: Use xwd or import command
  if (process.env.DISPLAY) {
    return new Promise((resolve, reject) => {
      exec('import -window root png:-', { encoding: 'buffer' }, (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout);
      });
    });
  }
  
  // Wayland: Use grim
  return new Promise((resolve, reject) => {
    exec('grim -', { encoding: 'buffer' }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}
```

### macOS
```typescript
import { exec } from 'child_process';

async function captureScreenMacOS(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    exec('screencapture -x -t png -', { encoding: 'buffer' }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}
```

### Windows
```typescript
import screenshot from 'screenshot-desktop';

async function captureScreenWindows(): Promise<Buffer> {
  return await screenshot({ format: 'png' });
}
```

## Data Models

### Screenshot Metadata
```typescript
interface ScreenshotMetadata {
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp' | 'bmp';
  fileSize: number;
  timestamp: string;
  display?: DisplayInfo;
  window?: WindowInfo;
  region?: RegionInfo;
  piiMasking?: MaskingStats;
}

interface DisplayInfo {
  id: string;
  name: string;
  resolution: { width: number; height: number };
  position: { x: number; y: number };
  isPrimary: boolean;
}

interface WindowInfo {
  id: string;
  title: string;
  processName: string;
  pid: number;
  bounds: { x: number; y: number; width: number; height: number };
}

interface RegionInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MaskingStats {
  emailsRedacted: number;
  phonesRedacted: number;
  creditCardsRedacted: number;
  customPatternsRedacted: number;
}
```

## MCP Tool Implementations

### Tool: screenshot_capture_full
```typescript
{
  name: 'screenshot_capture_full',
  description: 'Capture full screen screenshot',
  inputSchema: {
    type: 'object',
    properties: {
      display: { type: 'string', description: 'Display ID (optional)' },
      format: { type: 'string', enum: ['png', 'jpeg', 'webp', 'bmp'] },
      quality: { type: 'number', minimum: 1, maximum: 100 },
      savePath: { type: 'string', description: 'File path (optional)' },
      enablePIIMasking: { type: 'boolean', default: false }
    }
  },
  async handler(args) {
    // Validate security policies
    if (args.savePath) {
      validatePath(args.savePath);
    }
    
    // Capture screen
    const buffer = await captureScreen(args.display);
    
    // Apply PII masking if enabled
    if (args.enablePIIMasking) {
      const { maskedBuffer, stats } = await maskPII(buffer);
      buffer = maskedBuffer;
    }
    
    // Encode in requested format
    const encoded = await encodeImage(buffer, args.format, args.quality);
    
    // Save or return base64
    if (args.savePath) {
      await saveImage(encoded, args.savePath);
      return {
        status: 'success',
        filePath: path.resolve(args.savePath),
        metadata: getMetadata(encoded)
      };
    } else {
      return {
        status: 'success',
        data: encoded.toString('base64'),
        mimeType: `image/${args.format}`,
        metadata: getMetadata(encoded)
      };
    }
  }
}
```

### Tool: screenshot_capture_window
```typescript
{
  name: 'screenshot_capture_window',
  description: 'Capture specific window',
  inputSchema: {
    type: 'object',
    properties: {
      windowId: { type: 'string' },
      windowTitle: { type: 'string' },
      includeFrame: { type: 'boolean', default: false },
      format: { type: 'string', enum: ['png', 'jpeg', 'webp', 'bmp'] }
    }
  },
  async handler(args) {
    // Find window
    const window = args.windowId 
      ? await getWindowById(args.windowId)
      : await getWindowByTitle(args.windowTitle);
    
    if (!window) {
      throw new Error('Window not found');
    }
    
    if (window.isMinimized) {
      throw new Error('Cannot capture minimized window');
    }
    
    // Capture window
    const buffer = await captureWindow(window, args.includeFrame);
    
    // Encode
    const encoded = await encodeImage(buffer, args.format);
    
    return {
      status: 'success',
      data: encoded.toString('base64'),
      mimeType: `image/${args.format}`,
      metadata: {
        ...getMetadata(encoded),
        window: {
          id: window.id,
          title: window.title,
          processName: window.processName
        }
      }
    };
  }
}
```

### Tool: screenshot_capture_region
```typescript
{
  name: 'screenshot_capture_region',
  description: 'Capture screen region',
  inputSchema: {
    type: 'object',
    properties: {
      x: { type: 'number', minimum: 0 },
      y: { type: 'number', minimum: 0 },
      width: { type: 'number', minimum: 1 },
      height: { type: 'number', minimum: 1 },
      format: { type: 'string', enum: ['png', 'jpeg', 'webp', 'bmp'] }
    },
    required: ['x', 'y', 'width', 'height']
  },
  async handler(args) {
    // Validate dimensions
    if (args.width <= 0 || args.height <= 0) {
      throw new Error('Invalid dimensions');
    }
    
    // Capture full screen
    const fullScreen = await captureScreen();
    
    // Crop to region
    const cropped = await sharp(fullScreen)
      .extract({
        left: args.x,
        top: args.y,
        width: args.width,
        height: args.height
      })
      .toBuffer();
    
    // Encode
    const encoded = await encodeImage(cropped, args.format);
    
    return {
      status: 'success',
      data: encoded.toString('base64'),
      mimeType: `image/${args.format}`,
      metadata: {
        ...getMetadata(encoded),
        region: {
          x: args.x,
          y: args.y,
          width: args.width,
          height: args.height
        }
      }
    };
  }
}
```

### Tool: screenshot_list_displays
```typescript
{
  name: 'screenshot_list_displays',
  description: 'List all displays',
  inputSchema: { type: 'object', properties: {} },
  async handler() {
    const displays = await getDisplays();
    return {
      status: 'success',
      displays: displays.map(d => ({
        id: d.id,
        name: d.name,
        resolution: d.resolution,
        position: d.position,
        isPrimary: d.isPrimary
      }))
    };
  }
}
```

### Tool: screenshot_list_windows
```typescript
{
  name: 'screenshot_list_windows',
  description: 'List all visible windows',
  inputSchema: { type: 'object', properties: {} },
  async handler() {
    const windows = await getWindows();
    return {
      status: 'success',
      windows: windows.map(w => ({
        id: w.id,
        title: w.title,
        processName: w.processName,
        pid: w.pid,
        bounds: w.bounds,
        isMinimized: w.isMinimized
      }))
    };
  }
}
```

## PII Masking Implementation

```typescript
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

async function maskPII(imageBuffer: Buffer): Promise<{ maskedBuffer: Buffer; stats: MaskingStats }> {
  const stats: MaskingStats = {
    emailsRedacted: 0,
    phonesRedacted: 0,
    creditCardsRedacted: 0,
    customPatternsRedacted: 0
  };
  
  // Perform OCR
  const { data: { text } } = await Tesseract.recognize(imageBuffer);
  
  // Detect PII patterns
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
  const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  
  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  const creditCards = text.match(ccRegex) || [];
  
  stats.emailsRedacted = emails.length;
  stats.phonesRedacted = phones.length;
  stats.creditCardsRedacted = creditCards.length;
  
  // Apply black boxes over detected PII
  // (Implementation would use OCR word bounding boxes)
  const maskedBuffer = await applyMasks(imageBuffer, [...emails, ...phones, ...creditCards]);
  
  return { maskedBuffer, stats };
}
```

## Security Implementation

```typescript
interface SecurityPolicy {
  allowedDirectories: string[];
  blockedWindowPatterns: string[];
  maxCapturesPerMinute: number;
  enableAuditLog: boolean;
}

class SecurityManager {
  private policy: SecurityPolicy;
  private captureCount: Map<string, number[]> = new Map();
  
  validatePath(filePath: string): void {
    const resolved = path.resolve(filePath);
    
    // Check for path traversal
    if (resolved.includes('..')) {
      throw new SecurityError('Path traversal detected');
    }
    
    // Check allowed directories
    const allowed = this.policy.allowedDirectories.some(dir => 
      resolved.startsWith(path.resolve(dir))
    );
    
    if (!allowed) {
      throw new SecurityError('Path outside allowed directories');
    }
  }
  
  checkRateLimit(agentId: string): void {
    const now = Date.now();
    const captures = this.captureCount.get(agentId) || [];
    
    // Remove captures older than 1 minute
    const recent = captures.filter(t => now - t < 60000);
    
    if (recent.length >= this.policy.maxCapturesPerMinute) {
      throw new SecurityError('Rate limit exceeded');
    }
    
    recent.push(now);
    this.captureCount.set(agentId, recent);
  }
  
  auditLog(operation: string, params: any, result: any): void {
    if (this.policy.enableAuditLog) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        operation,
        params,
        result: result.status
      }));
    }
  }
}
```

## Error Handling

```typescript
class ScreenshotError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ScreenshotError';
  }
}

// Error codes
const ErrorCodes = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_PATH: 'INVALID_PATH',
  WINDOW_NOT_FOUND: 'WINDOW_NOT_FOUND',
  DISPLAY_NOT_FOUND: 'DISPLAY_NOT_FOUND',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  CAPTURE_FAILED: 'CAPTURE_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};
```

## Testing Strategy

### Unit Tests
- Test image encoding in all formats
- Test PII detection patterns
- Test path validation logic
- Test rate limiting
- Test display/window enumeration
- Test region boundary validation

### Property-Based Tests
- Use fast-check library for TypeScript
- Each property test runs minimum 100 iterations
- Tag format: `// Feature: mcp-screenshot, Property {number}: {property_text}`

### Integration Tests
- Test full screen capture on each platform
- Test window capture with real windows
- Test region capture with various coordinates
- Test PII masking with sample images
- Test security policy enforcement

## Performance Considerations

1. **Image Compression**: Use sharp for fast encoding
2. **Caching**: Cache display/window lists for 1 second
3. **Streaming**: Stream large images to disk
4. **Memory**: Limit concurrent captures to prevent OOM

## Security Considerations

1. **Path Validation**: Strict path checking with allowlist
2. **Rate Limiting**: Prevent capture spam
3. **PII Protection**: Automatic masking of sensitive data
4. **Audit Logging**: Track all capture operations
5. **Window Exclusion**: Block password managers, auth dialogs

## Cross-Platform Support

| Feature | Linux | macOS | Windows |
|---------|-------|-------|---------|
| Full Screen | ✅ | ✅ | ✅ |
| Window Capture | ✅ | ✅ | ✅ |
| Region Capture | ✅ | ✅ | ✅ |
| Multi-Monitor | ✅ | ✅ | ✅ |
| PII Masking | ✅ | ✅ | ✅ |

## Dependencies

- `sharp`: Image processing and encoding
- `screenshot-desktop`: Cross-platform screen capture
- `tesseract.js`: OCR for PII detection
- `@modelcontextprotocol/sdk`: MCP protocol implementation


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Full screen capture dimensions match display resolution
*For any* primary display, when a full screen capture is requested, the captured image dimensions should match the display's resolution.
**Validates: Requirements 1.1**

### Property 2: Display-specific capture accuracy
*For any* valid display identifier in a multi-monitor setup, when a capture is requested for that display, the captured image dimensions should match that display's resolution.
**Validates: Requirements 1.2**

### Property 3: Format encoding correctness
*For any* requested image format (PNG, JPEG, WebP, BMP), when a screenshot is captured, the output should be a valid image file of that format.
**Validates: Requirements 1.3**

### Property 4: Quality parameter affects file size
*For any* lossy format with quality parameter, when quality increases, the file size should increase (assuming same content).
**Validates: Requirements 1.4**

### Property 5: Response structure completeness
*For any* screenshot capture operation, the response should include status, image data (or file path), and metadata with dimensions and format.
**Validates: Requirements 1.5**

### Property 6: Window list completeness
*For any* window list request, all returned windows should include title, process name, window identifier, and bounds.
**Validates: Requirements 2.1**

### Property 7: Window capture dimension accuracy
*For any* valid window identifier, when that window is captured, the image dimensions should match the window's content area dimensions.
**Validates: Requirements 2.2**

### Property 8: Window title pattern matching
*For any* window title pattern, when a matching window exists, the capture should succeed and return an image of that window.
**Validates: Requirements 2.3**

### Property 9: Frame inclusion increases dimensions
*For any* window capture, when frame inclusion is enabled, the captured dimensions should be larger than without frame inclusion.
**Validates: Requirements 2.5**

### Property 10: Region capture dimension accuracy
*For any* valid region coordinates and dimensions, when that region is captured, the output image dimensions should match the requested dimensions (or clipped dimensions if out of bounds).
**Validates: Requirements 3.1**

### Property 11: Region boundary clipping
*For any* region that extends beyond screen boundaries, the captured image should only include the visible portion and report actual dimensions.
**Validates: Requirements 3.2**

### Property 12: Multi-monitor coordinate system consistency
*For any* coordinates in a multi-monitor setup, the captured region should be consistent with the virtual desktop coordinate system.
**Validates: Requirements 3.5**

### Property 13: File save creates file at path
*For any* valid file path within allowed directories, when a screenshot is saved, a file should exist at that path with non-zero size.
**Validates: Requirements 5.1**

### Property 14: Base64 encoding when no path provided
*For any* screenshot capture without a file path, the response should contain base64-encoded image data.
**Validates: Requirements 5.2**

### Property 15: Directory creation with secure permissions
*For any* file path with non-existent parent directories, when a screenshot is saved, the directories should be created with 700 permissions.
**Validates: Requirements 5.3**

### Property 16: Path validation rejects unauthorized paths
*For any* file path outside allowed directories, the save operation should be rejected with a path validation error.
**Validates: Requirements 5.4**

### Property 17: Save response includes absolute path and size
*For any* screenshot saved to disk, the response should include the absolute file path and the file size in bytes.
**Validates: Requirements 5.5**

### Property 18: PII detection accuracy
*For any* image containing known PII patterns (emails, phones, credit cards), when PII masking is enabled, those patterns should be detected and masked.
**Validates: Requirements 6.1**

### Property 19: Masking statistics accuracy
*For any* PII masking operation, the reported redaction counts should match the actual number of patterns detected and masked.
**Validates: Requirements 6.5**

### Property 20: Display information completeness
*For any* display information request, all returned displays should include resolution, position, and primary display indicator.
**Validates: Requirements 7.1**

### Property 21: Window information completeness
*For any* window information request, all returned windows should include title, position, dimensions, and z-order.
**Validates: Requirements 7.2**

### Property 22: Security error for restricted paths
*For any* path in the restricted/blocked list, save operations should be rejected with a security error.
**Validates: Requirements 8.2**

### Property 23: Response structure consistency
*For any* screenshot operation (success or failure), the response should be a structured JSON object with a status field.
**Validates: Requirements 9.1**

### Property 24: Metadata completeness
*For any* successful screenshot capture, the metadata should include dimensions, format, file size, timestamp, and display/window/region information as applicable.
**Validates: Requirements 9.3**

### Property 25: Allowed directory enforcement
*For any* configured allowed directories, file saves should only succeed for paths within those directories.
**Validates: Requirements 10.2**

### Property 26: Rate limiting enforcement
*For any* configured rate limit, when the limit is exceeded within the time window, subsequent capture requests should be rejected with a rate limit error.
**Validates: Requirements 10.4**
