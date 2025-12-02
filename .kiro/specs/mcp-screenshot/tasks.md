# MCP Screenshot - Implementation Plan

- [x] 1. Set up project structure and core interfaces
  - Observe the monorepo structure and be sure to create the directory structure appropriately, using NX tools as appropriate
  - Create directory structure for MCP server, capture engine, image processor, and security manager
  - Initialize package.json with MCP SDK, sharp, screenshot-desktop, and tesseract.js dependencies
  - Configure TypeScript with appropriate compiler options
  - Set up testing framework (Jest) with fast-check for property-based testing
  - _Requirements: 9.1, 10.1_

- [x] 2. Implement platform-specific capture engines
  - [x] 2.1 Create base CaptureEngine interface
    - Define interface for screen, window, and region capture
    - Define display and window information structures
    - Add error handling interfaces
    - _Requirements: 1.1, 2.1_

  - [x] 2.2 Implement Linux capture (X11/Wayland)
    - Implement X11 capture using import/xwd commands
    - Implement Wayland capture using grim
    - Auto-detect display server type
    - Handle multi-monitor setups
    - _Requirements: 1.1, 1.2_

  - [x] 2.3 Implement macOS capture
    - Implement capture using screencapture command
    - Handle Retina display scaling
    - Support multi-monitor setups
    - _Requirements: 1.1, 1.2_

  - [x] 2.4 Implement Windows capture
    - Implement capture using screenshot-desktop library
    - Handle multi-monitor setups
    - Support high-DPI displays
    - _Requirements: 1.1, 1.2_

  - [x] 2.5 Write property test for full screen capture
    - **Property 1: Full screen capture dimensions match display resolution**
    - **Validates: Requirements 1.1**

- [x] 3. Implement image processing and encoding
  - [x] 3.1 Create ImageProcessor class
    - Implement format encoding (PNG, JPEG, WebP, BMP)
    - Implement compression with quality settings
    - Implement image cropping and resizing
    - Add metadata extraction
    - _Requirements: 1.3, 1.4, 4.1-4.4_

  - [x] 3.2 Implement format conversion
    - Convert between image formats
    - Apply lossy/lossless compression
    - Optimize file sizes
    - _Requirements: 1.3, 4.1-4.3_

  - [x] 3.3 Write property test for format encoding
    - **Property 3: Format encoding correctness**
    - **Validates: Requirements 1.3**

  - [x] 3.4 Write property test for quality parameter
    - **Property 4: Quality parameter affects file size**
    - **Validates: Requirements 1.4**

- [x] 4. Implement display and window enumeration
  - [x] 4.1 Implement display enumeration
    - Get all connected displays
    - Get display resolutions and positions
    - Identify primary display
    - Handle virtual desktop coordinates
    - _Requirements: 1.2, 3.5, 7.1_

  - [x] 4.2 Implement window enumeration
    - Get all visible windows
    - Get window titles, positions, and dimensions
    - Get process information for windows
    - Handle minimized/hidden windows
    - _Requirements: 2.1, 2.4, 7.2_

  - [x] 4.3 Write property test for display information
    - **Property 20: Display information completeness**
    - **Validates: Requirements 7.1**

  - [x] 4.4 Write property test for window information
    - **Property 21: Window information completeness**
    - **Validates: Requirements 7.2**

- [ ] 5. Implement window capture
  - [x] 5.1 Implement window capture by ID
    - Capture specific window by identifier
    - Handle window content area vs frame
    - Validate window exists and is visible
    - _Requirements: 2.2, 2.5_

  - [x] 5.2 Implement window capture by title pattern
    - Search windows by title pattern
    - Capture first matching window
    - Handle no matches gracefully
    - _Requirements: 2.3_

  - [x] 5.3 Write property test for window capture
    - **Property 7: Window capture dimension accuracy**
    - **Validates: Requirements 2.2**

  - [x] 5.4 Write property test for frame inclusion
    - **Property 9: Frame inclusion increases dimensions**
    - **Validates: Requirements 2.5**

- [x] 6. Implement region capture
  - [x] 6.1 Implement region capture with coordinates
    - Capture rectangular region by coordinates
    - Handle regions extending beyond screen
    - Clip to visible portion
    - _Requirements: 3.1, 3.2_

  - [x] 6.2 Implement coordinate validation
    - Validate coordinates are non-negative
    - Validate dimensions are positive
    - Handle multi-monitor coordinate systems
    - _Requirements: 3.3, 3.4, 3.5_

  - [x] 6.3 Write property test for region capture
    - **Property 10: Region capture dimension accuracy**
    - **Validates: Requirements 3.1**

  - [x] 6.4 Write property test for boundary clipping
    - **Property 11: Region boundary clipping**
    - **Validates: Requirements 3.2**

- [x] 7. Implement PII masking
  - [x] 7.1 Create PrivacyManager class
    - Implement OCR using tesseract.js
    - Detect PII patterns (emails, phones, credit cards)
    - Apply masking with black boxes
    - Track masking statistics
    - _Requirements: 6.1, 6.5_

  - [x] 7.2 Implement pattern detection
    - Detect email addresses
    - Detect phone numbers
    - Detect credit card numbers
    - Support custom patterns
    - _Requirements: 6.1_

  - [x] 7.3 Implement window exclusion
    - Exclude windows by title pattern
    - Exclude password managers
    - Exclude authentication dialogs
    - _Requirements: 6.2, 6.4_

  - [x] 7.4 Write property test for PII detection
    - **Property 18: PII detection accuracy**
    - **Validates: Requirements 6.1**

  - [x] 7.5 Write property test for masking statistics
    - **Property 19: Masking statistics accuracy**
    - **Validates: Requirements 6.5**

- [x] 8. Implement security manager
  - [x] 8.1 Create SecurityManager class
    - Implement path validation with workspace boundaries
    - Implement rate limiting
    - Implement audit logging
    - Load security policies from configuration
    - _Requirements: 5.4, 8.2, 10.1-10.5_

  - [x] 8.2 Implement path validation
    - Validate paths are within allowed directories
    - Prevent path traversal attacks
    - Check against blocklists
    - _Requirements: 5.4, 10.2_

  - [x] 8.3 Implement rate limiting
    - Track captures per agent per time window
    - Enforce maximum captures per minute
    - Return rate limit errors
    - _Requirements: 10.4_

  - [x] 8.4 Implement audit logging
    - Log all capture operations
    - Log security violations
    - Include timestamps and parameters
    - _Requirements: 10.5_

  - [x] 8.5 Write property test for path validation
    - **Property 16: Path validation rejects unauthorized paths**
    - **Validates: Requirements 5.4**

  - [x] 8.6 Write property test for rate limiting
    - **Property 26: Rate limiting enforcement**
    - **Validates: Requirements 10.4**

- [x] 9. Implement file operations
  - [x] 9.1 Implement file saving
    - Save screenshots to specified paths
    - Create directories if needed with secure permissions
    - Return absolute paths and file sizes
    - _Requirements: 5.1, 5.3, 5.5_

  - [x] 9.2 Implement base64 encoding
    - Encode images as base64 strings
    - Include MIME type information
    - Handle large images efficiently
    - _Requirements: 1.5, 5.2, 9.5_

  - [x] 9.3 Write property test for file save
    - **Property 13: File save creates file at path**
    - **Validates: Requirements 5.1**

  - [x] 9.4 Write property test for base64 encoding
    - **Property 14: Base64 encoding when no path provided**
    - **Validates: Requirements 5.2**

- [x] 10. Implement MCP tools
  - [x] 10.1 Implement screenshot_capture_full tool
    - Accept display, format, quality, savePath, enablePIIMasking parameters
    - Capture full screen or specified display
    - Apply PII masking if enabled
    - Save or return base64
    - _Requirements: 1.1-1.5, 9.1_

  - [x] 10.2 Implement screenshot_capture_window tool
    - Accept windowId, windowTitle, includeFrame, format parameters
    - Find and capture specified window
    - Handle minimized windows
    - _Requirements: 2.1-2.5, 9.1_

  - [x] 10.3 Implement screenshot_capture_region tool
    - Accept x, y, width, height, format parameters
    - Validate region parameters
    - Capture specified region
    - _Requirements: 3.1-3.5, 9.1_

  - [x] 10.4 Implement screenshot_list_displays tool
    - Return all displays with metadata
    - Include resolutions, positions, primary indicator
    - _Requirements: 7.1, 9.1_

  - [x] 10.5 Implement screenshot_list_windows tool
    - Return all visible windows with metadata
    - Include titles, positions, dimensions, process info
    - _Requirements: 7.2, 9.1_

  - [x] 10.6 Write property test for response structure
    - **Property 23: Response structure consistency**
    - **Validates: Requirements 9.1**

  - [x] 10.7 Write property test for metadata completeness
    - **Property 24: Metadata completeness**
    - **Validates: Requirements 9.3**

- [x] 11. Set up MCP server
  - [x] 11.1 Create MCP server instance
    - Initialize MCP server with name and version
    - Configure server capabilities
    - Set up stdio transport
    - _Requirements: 9.1_

  - [x] 11.2 Register all MCP tools
    - Register all 5 screenshot tools with schemas
    - Connect tool handlers to implementation
    - Add input validation for each tool
    - _Requirements: 9.1_

  - [x] 11.3 Implement server lifecycle management
    - Handle server startup and shutdown
    - Clean up resources on shutdown
    - Add logging for debugging
    - _Requirements: 8.1_

- [x] 12. Implement error handling
  - [x] 12.1 Create error response formatting
    - Create structured error responses with codes
    - Handle permission errors
    - Handle not-found errors
    - Handle format errors
    - _Requirements: 8.1-8.5, 9.2_

  - [x] 12.2 Implement graceful error handling
    - Handle capture failures
    - Handle encoding failures
    - Handle file system errors
    - Return clear error messages
    - _Requirements: 8.1-8.5_

- [x] 13. Write integration tests
  - [x] 13.1 Test full screen capture workflow
    - Test capture on each platform
    - Test with different formats
    - Test with PII masking
    - _Requirements: 1.1-1.5_

  - [x] 13.2 Test window capture workflow
    - Test with real windows
    - Test window enumeration
    - Test frame inclusion
    - _Requirements: 2.1-2.5_

  - [x] 13.3 Test region capture workflow
    - Test with various coordinates
    - Test boundary clipping
    - Test multi-monitor setups
    - _Requirements: 3.1-3.5_

  - [x] 13.4 Test security policy enforcement
    - Test path validation
    - Test rate limiting
    - Test audit logging
    - _Requirements: 10.1-10.5_

- [x] 14. Create documentation
  - [x] 14.1 Write README documentation
    - Document installation instructions
    - Provide usage examples for each tool
    - Document security configuration
    - Add troubleshooting section
    - _Requirements: 9.2_

  - [x] 14.2 Create configuration examples
    - Provide example security policies
    - Document allowed directory configuration
    - Show rate limiting configuration
    - _Requirements: 10.1-10.5_

  - [x] 14.3 Add code documentation
    - Add JSDoc comments to all public APIs
    - Document platform-specific behavior
    - Document error codes and meanings
    - _Requirements: 9.2_

- [x] 15. Package and distribute
  - [x] 15.1 Publish to NPM registry
    - Configure package.json with proper metadata
    - Add CLI entry point
    - Create .npmignore file
    - Create GitHub Actions workflow for NPM publishing
    - _Requirements: 11.1-11.5_

  - [x] 15.2 Create Docker image
    - Create optimized Dockerfile
    - Create docker-compose.yml
    - Create GitHub Actions workflow for Docker Hub publishing
    - _Requirements: 11.1-11.5_

  - [x] 15.3 Submit to MCP Registry
    - Create MCP registry submission metadata
    - Create comprehensive server description
    - Create usage examples
    - Submit PR to MCP registry
    - _Requirements: 11.1-11.5_

  - [x] 15.4 Publish to Docker MCP Registry
    - Create Docker MCP registry submission metadata
    - Create comprehensive server description
    - Create usage examples
    - Submit PR to Docker MCP registry
    - _Requirements: 11.1-11.5_

  - [x] 15.5 Create VS Code extension
    - Create extension project structure
    - Implement screenshot panel
    - Add annotation tools
    - Publish to VS Code marketplace
    - _Requirements: 12.1-12.5_

- [-] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
