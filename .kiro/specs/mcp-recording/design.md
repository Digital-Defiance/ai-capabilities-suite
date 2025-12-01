# MCP Recording - Design Document

## Overview

The MCP Recording server enables AI agents to record screen activity with audio, encode videos in multiple formats, extract frames, and add annotations. The server supports full screen, window, and region recording with configurable quality settings and security policies.

## Architecture

```
┌─────────────────┐
│   AI Agent      │
│   (Kiro)        │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│ MCP Recording   │
│     Server      │
└────────┬────────┘
         │ Platform APIs
         ├──────────────────┬──────────────┐
         │                  │              │
┌────────▼────────┐ ┌──────▼──────┐ ┌────▼─────┐
│  Video Capture  │ │Audio Capture│ │  Encoder │
└─────────────────┘ └─────────────┘ └──────────┘
```

## Core Components

### 1. MCP Server
- Implements MCP protocol
- Exposes recording tools
- Manages recording sessions
- Handles tool calls from AI agent

### 2. Video Capture Engine
- Captures screen frames at specified FPS
- Tracks windows during recording
- Handles multi-monitor setups
- Manages frame buffers

### 3. Audio Capture Engine
- Captures microphone input
- Captures system audio
- Mixes multiple audio sources
- Handles audio synchronization

### 4. Video Encoder
- Encodes with H.264, H.265, VP9, AV1
- Applies bitrate and quality settings
- Generates keyframes
- Writes to MP4, WebM, MKV containers

### 5. Session Manager
- Tracks active recording sessions
- Manages pause/resume state
- Handles resource cleanup
- Enforces concurrent session limits

### 6. Frame Extractor
- Extracts frames at timestamps
- Generates thumbnails
- Saves frames in multiple formats
- Provides frame metadata

### 7. Annotation Engine
- Renders text overlays
- Highlights cursor
- Visualizes clicks
- Adds timestamps

### 8. Security Manager
- Validates file paths
- Enforces directory restrictions
- Applies resource limits
- Manages audit logging

## Data Models

```typescript
interface RecordingSession {
  id: string;
  state: 'recording' | 'paused' | 'stopped';
  startTime: Date;
  duration: number;
  config: RecordingConfig;
  stats: RecordingStats;
}

interface RecordingConfig {
  target: 'screen' | 'window' | 'region';
  targetId?: string;
  frameRate: number;
  codec: 'h264' | 'h265' | 'vp9' | 'av1';
  bitrate: number;
  audioEnabled: boolean;
  audioSources: ('microphone' | 'system')[];
  maxDuration?: number;
  outputPath: string;
  annotations?: AnnotationConfig;
}

interface RecordingStats {
  framesCaptured: number;
  bytesWritten: number;
  currentFileSize: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface AnnotationConfig {
  textOverlay?: string;
  cursorHighlight?: boolean;
  clickVisualization?: boolean;
  timestamp?: boolean;
  opacity?: number;
}
```

## MCP Tool Implementations

### Tool: recording_start
```typescript
{
  name: 'recording_start',
  description: 'Start screen recording',
  inputSchema: {
    type: 'object',
    properties: {
      target: { type: 'string', enum: ['screen', 'window', 'region'] },
      targetId: { type: 'string' },
      frameRate: { type: 'number', default: 30 },
      codec: { type: 'string', enum: ['h264', 'h265', 'vp9', 'av1'] },
      bitrate: { type: 'number', default: 5000000 },
      audioEnabled: { type: 'boolean', default: false },
      audioSources: { type: 'array', items: { type: 'string' } },
      maxDuration: { type: 'number' },
      outputPath: { type: 'string', required: true }
    }
  },
  async handler(args) {
    // Validate security
    validatePath(args.outputPath);
    checkConcurrentLimit();
    
    // Create session
    const session = await createRecordingSession(args);
    
    // Start capture
    await startVideoCapture(session);
    if (args.audioEnabled) {
      await startAudioCapture(session, args.audioSources);
    }
    
    return {
      status: 'success',
      sessionId: session.id,
      state: 'recording'
    };
  }
}
```

### Tool: recording_stop
```typescript
{
  name: 'recording_stop',
  description: 'Stop recording and finalize video',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', required: true }
    }
  },
  async handler(args) {
    const session = getSession(args.sessionId);
    
    // Stop capture
    await stopCapture(session);
    
    // Finalize video
    await finalizeVideo(session);
    
    // Get metadata
    const metadata = await getVideoMetadata(session.config.outputPath);
    
    return {
      status: 'success',
      filePath: path.resolve(session.config.outputPath),
      metadata: {
        duration: session.duration,
        fileSize: metadata.size,
        resolution: metadata.resolution,
        frameRate: session.config.frameRate,
        codec: session.config.codec
      }
    };
  }
}
```

### Tool: recording_pause
```typescript
{
  name: 'recording_pause',
  description: 'Pause active recording',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', required: true }
    }
  },
  async handler(args) {
    const session = getSession(args.sessionId);
    
    if (session.state !== 'recording') {
      throw new Error('Session is not recording');
    }
    
    await pauseCapture(session);
    session.state = 'paused';
    
    return {
      status: 'success',
      state: 'paused',
      elapsedTime: session.duration
    };
  }
}
```

### Tool: recording_resume
```typescript
{
  name: 'recording_resume',
  description: 'Resume paused recording',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', required: true }
    }
  },
  async handler(args) {
    const session = getSession(args.sessionId);
    
    if (session.state !== 'paused') {
      throw new Error('Session is not paused');
    }
    
    await resumeCapture(session);
    session.state = 'recording';
    
    return {
      status: 'success',
      state: 'recording'
    };
  }
}
```

### Tool: recording_extract_frames
```typescript
{
  name: 'recording_extract_frames',
  description: 'Extract frames from video',
  inputSchema: {
    type: 'object',
    properties: {
      videoPath: { type: 'string', required: true },
      timestamps: { type: 'array', items: { type: 'number' } },
      interval: { type: 'number' },
      count: { type: 'number' },
      format: { type: 'string', enum: ['png', 'jpeg'] }
    }
  },
  async handler(args) {
    validatePath(args.videoPath);
    
    const frames = await extractFrames(args);
    
    return {
      status: 'success',
      frames: frames.map(f => ({
        path: f.path,
        timestamp: f.timestamp,
        dimensions: f.dimensions
      }))
    };
  }
}
```

## Video Encoding Implementation

```typescript
import ffmpeg from 'fluent-ffmpeg';

async function encodeVideo(session: RecordingSession): Promise<void> {
  const command = ffmpeg()
    .input(session.frameBuffer)
    .inputFPS(session.config.frameRate)
    .videoCodec(getCodecName(session.config.codec))
    .videoBitrate(session.config.bitrate)
    .size(`${session.resolution.width}x${session.resolution.height}`);
  
  if (session.audioBuffer) {
    command
      .input(session.audioBuffer)
      .audioCodec('aac')
      .audioBitrate('128k');
  }
  
  command
    .output(session.config.outputPath)
    .on('progress', (progress) => {
      session.stats.bytesWritten = progress.targetSize * 1024;
    })
    .on('end', () => {
      session.state = 'stopped';
    })
    .run();
}

function getCodecName(codec: string): string {
  const codecs = {
    h264: 'libx264',
    h265: 'libx265',
    vp9: 'libvpx-vp9',
    av1: 'libaom-av1'
  };
  return codecs[codec];
}
```

## Security Implementation

```typescript
class RecordingSecurityManager {
  private maxConcurrentSessions: number = 5;
  private maxDuration: number = 3600000; // 1 hour
  private maxFileSize: number = 5 * 1024 * 1024 * 1024; // 5GB
  private allowedDirectories: string[];
  
  validatePath(filePath: string): void {
    const resolved = path.resolve(filePath);
    
    if (resolved.includes('..')) {
      throw new SecurityError('Path traversal detected');
    }
    
    const allowed = this.allowedDirectories.some(dir => 
      resolved.startsWith(path.resolve(dir))
    );
    
    if (!allowed) {
      throw new SecurityError('Path outside allowed directories');
    }
  }
  
  checkConcurrentLimit(): void {
    const activeSessions = Array.from(sessions.values())
      .filter(s => s.state === 'recording').length;
    
    if (activeSessions >= this.maxConcurrentSessions) {
      throw new Error('Maximum concurrent recordings reached');
    }
  }
  
  enforceResourceLimits(session: RecordingSession): void {
    if (session.duration > this.maxDuration) {
      stopRecording(session);
      throw new Error('Maximum duration exceeded');
    }
    
    if (session.stats.currentFileSize > this.maxFileSize) {
      stopRecording(session);
      throw new Error('Maximum file size exceeded');
    }
  }
}
```

## Testing Strategy

### Unit Tests
- Test video encoding with each codec
- Test audio capture and mixing
- Test frame extraction at various timestamps
- Test annotation rendering
- Test session state transitions
- Test resource limit enforcement

### Property-Based Tests
- Use fast-check library for TypeScript
- Each property test runs minimum 100 iterations
- Tag format: `// Feature: mcp-recording, Property {number}: {property_text}`

### Integration Tests
- Test full recording workflow
- Test pause/resume functionality
- Test with real audio sources
- Test frame extraction from recorded videos
- Test security policy enforcement

## Performance Considerations

1. **Frame Buffering**: Use circular buffer to prevent memory growth
2. **Encoding**: Use hardware acceleration when available
3. **Audio Sync**: Maintain precise timestamp alignment
4. **Resource Monitoring**: Track CPU/memory and throttle if needed

## Security Considerations

1. **Path Validation**: Strict path checking with allowlist
2. **Resource Limits**: Enforce duration and file size limits
3. **Concurrent Sessions**: Limit to prevent resource exhaustion
4. **Audit Logging**: Track all recording operations
5. **Cleanup**: Ensure resources released on failure

## Dependencies

- `fluent-ffmpeg`: Video encoding and processing
- `node-record-lpcm16`: Audio capture
- `screenshot-desktop`: Frame capture
- `@modelcontextprotocol/sdk`: MCP protocol implementation


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Recording captures at specified frame rate
*For any* recording session with specified frame rate, the captured video should have approximately that frame rate (within 5% tolerance).
**Validates: Requirements 1.1**

### Property 2: Stop produces valid video file
*For any* recording session, when stopped, a valid video file should exist at the specified path with non-zero size.
**Validates: Requirements 1.4**

### Property 3: Window tracking maintains focus
*For any* window recording, when the window moves, the recorded content should continue to show that window's content.
**Validates: Requirements 2.2**

### Property 4: Audio capture includes microphone
*For any* recording with microphone enabled, the output video should contain an audio track with microphone input.
**Validates: Requirements 3.1**

### Property 5: Audio mixing combines sources
*For any* recording with both microphone and system audio enabled, the output should contain both audio sources mixed together.
**Validates: Requirements 3.3**

### Property 6: Frame extraction timestamp accuracy
*For any* video and requested timestamp, the extracted frame should be from within 100ms of that timestamp.
**Validates: Requirements 5.1**

### Property 7: Frame extraction completeness
*For any* frame extraction request, all requested frames should be extracted and their paths returned.
**Validates: Requirements 5.5**

### Property 8: Pause stops frame capture
*For any* recording session, when paused, no new frames should be captured until resumed.
**Validates: Requirements 6.1**

### Property 9: Resume continues recording
*For any* paused recording, when resumed, frame capture should continue and append to the same video file.
**Validates: Requirements 6.2**

### Property 10: Session list completeness
*For any* active sessions query, all currently active recording sessions should be returned with status and resource usage.
**Validates: Requirements 8.2**

### Property 11: Concurrent session limit enforcement
*For any* configured maximum concurrent sessions, when that limit is reached, new recording requests should be rejected.
**Validates: Requirements 8.3**

### Property 12: Response structure consistency
*For any* recording operation (success or failure), the response should be a structured JSON object with a status field.
**Validates: Requirements 10.1**

### Property 13: Recording metadata completeness
*For any* completed recording, the metadata should include duration, file size, resolution, frame rate, codec, and bitrate.
**Validates: Requirements 10.3**

### Property 14: Allowed directory enforcement
*For any* configured allowed directories, recording saves should only succeed for paths within those directories.
**Validates: Requirements 11.2**

### Property 15: Duration limit enforcement
*For any* configured maximum duration, recordings should automatically stop when that duration is reached.
**Validates: Requirements 11.3**

### Property 16: File size limit enforcement
*For any* configured maximum file size, recordings should automatically stop when that size is reached.
**Validates: Requirements 11.4**
