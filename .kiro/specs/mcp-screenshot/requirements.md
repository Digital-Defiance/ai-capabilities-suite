# MCP Screenshot - Requirements Document

## Introduction

This document specifies requirements for a Model Context Protocol (MCP) server that provides screenshot capture capabilities for AI agents. The MCP Screenshot Server enables AI agents to capture screen content, specific windows, or regions in multiple formats, allowing them to visually analyze user interfaces, document features, and assist with visual debugging.

## Glossary

- **MCP Server**: A server implementing the Model Context Protocol that exposes screenshot tools to AI agents
- **Display**: A physical or virtual monitor connected to the system
- **Window**: An application window managed by the operating system's window manager
- **Region**: A rectangular area of the screen defined by coordinates and dimensions
- **Capture Session**: A temporary context for performing multiple related screenshot operations
- **Image Format**: The file format for storing captured images (PNG, JPEG, WebP, BMP)
- **Compression Quality**: A numeric value controlling the trade-off between file size and image quality
- **Screen Coordinates**: Pixel positions relative to the primary display's top-left corner (0,0)
- **PII Masking**: Automatic detection and redaction of personally identifiable information in screenshots

## Requirements

### Requirement 1

**User Story:** As an AI agent, I want to capture full screen screenshots in multiple formats, so that I can analyze the entire visible desktop environment.

#### Acceptance Criteria

1. WHEN the AI agent requests a full screen capture, THE MCP Server SHALL capture all pixels from the primary display
2. WHERE a display identifier is provided, THE MCP Server SHALL capture the specified display in multi-monitor setups
3. WHEN the AI agent specifies an image format, THE MCP Server SHALL encode the screenshot in that format (PNG, JPEG, WebP, BMP)
4. WHERE a quality parameter is provided for lossy formats, THE MCP Server SHALL apply the specified compression quality
5. WHEN the capture completes, THE MCP Server SHALL return the image data as base64-encoded content with metadata including dimensions and format

### Requirement 2

**User Story:** As an AI agent, I want to capture specific application windows, so that I can focus on relevant content without background clutter.

#### Acceptance Criteria

1. WHEN the AI agent requests a window list, THE MCP Server SHALL return all visible windows with their titles, process names, and window identifiers
2. WHEN the AI agent provides a window identifier, THE MCP Server SHALL capture only that window's content area
3. WHERE a window title pattern is provided, THE MCP Server SHALL find and capture the first matching window
4. WHEN a window is minimized or hidden, THE MCP Server SHALL return an error indicating the window is not capturable
5. WHEN the AI agent requests window capture with frame inclusion, THE MCP Server SHALL include the window's title bar and borders

### Requirement 3

**User Story:** As an AI agent, I want to capture specific screen regions, so that I can focus on particular UI elements or areas of interest.

#### Acceptance Criteria

1. WHEN the AI agent provides coordinates and dimensions, THE MCP Server SHALL capture the specified rectangular region
2. WHERE the specified region extends beyond screen boundaries, THE MCP Server SHALL capture only the visible portion and report the actual captured dimensions
3. WHEN the AI agent provides negative coordinates, THE MCP Server SHALL return an error indicating invalid region parameters
4. WHEN the AI agent specifies a region with zero width or height, THE MCP Server SHALL return an error indicating invalid dimensions
5. WHEN multiple displays are present, THE MCP Server SHALL interpret coordinates relative to the virtual desktop coordinate system

### Requirement 4

**User Story:** As an AI agent, I want to optimize screenshot file sizes, so that I can efficiently store and transmit captured images.

#### Acceptance Criteria

1. WHEN the AI agent requests PNG format, THE MCP Server SHALL apply lossless compression with configurable compression level
2. WHEN the AI agent requests JPEG format with quality parameter, THE MCP Server SHALL apply lossy compression with the specified quality (1-100)
3. WHEN the AI agent requests WebP format, THE MCP Server SHALL support both lossy and lossless WebP encoding
4. WHEN the AI agent requests automatic format selection, THE MCP Server SHALL choose the format that produces the smallest file size while maintaining acceptable quality
5. WHEN the AI agent specifies maximum file size, THE MCP Server SHALL adjust compression parameters to meet the size constraint

### Requirement 5

**User Story:** As an AI agent, I want to save screenshots to disk or receive them in memory, so that I can choose the appropriate storage method for my use case.

#### Acceptance Criteria

1. WHEN the AI agent provides a file path, THE MCP Server SHALL save the screenshot to that location with appropriate file permissions
2. WHEN no file path is provided, THE MCP Server SHALL return the screenshot as base64-encoded data in the response
3. WHERE the specified directory does not exist, THE MCP Server SHALL create the directory structure with secure permissions (700)
4. IF the file path points outside allowed directories, THEN THE MCP Server SHALL reject the operation and return a path validation error
5. WHEN saving to disk, THE MCP Server SHALL return the absolute file path and file size in the response

### Requirement 6

**User Story:** As an AI agent, I want to capture screenshots with privacy protection, so that sensitive information is not inadvertently exposed.

#### Acceptance Criteria

1. WHEN the AI agent enables PII masking, THE MCP Server SHALL detect and redact text patterns matching email addresses, phone numbers, and credit card numbers
2. WHEN the AI agent provides a list of window titles to exclude, THE MCP Server SHALL skip capturing those windows in full screen captures
3. WHERE OCR-based masking is enabled, THE MCP Server SHALL detect text in images and mask specified sensitive patterns
4. WHEN the AI agent requests secure mode, THE MCP Server SHALL automatically exclude password fields, authentication dialogs, and credential managers
5. WHEN PII is detected and masked, THE MCP Server SHALL report the number and types of redactions in the response metadata

### Requirement 7

**User Story:** As an AI agent, I want to retrieve display and window information, so that I can make informed decisions about what to capture.

#### Acceptance Criteria

1. WHEN the AI agent requests display information, THE MCP Server SHALL return all displays with their resolutions, positions, and primary display indicator
2. WHEN the AI agent requests window information, THE MCP Server SHALL return visible windows with titles, positions, dimensions, and z-order
3. WHEN the AI agent queries active window, THE MCP Server SHALL return the currently focused window's information
4. WHEN the AI agent requests process information for a window, THE MCP Server SHALL return the process name and PID
5. WHEN display configuration changes, THE MCP Server SHALL detect the change and update cached display information

### Requirement 8

**User Story:** As an AI agent, I want the screenshot server to handle errors gracefully and enforce security boundaries, so that operations are safe and reliable.

#### Acceptance Criteria

1. IF a screenshot operation fails due to permissions, THEN THE MCP Server SHALL return a clear error indicating insufficient privileges
2. WHEN the AI agent attempts to save to a restricted path, THE MCP Server SHALL reject the operation and return a security error
3. IF the system does not support the requested image format, THEN THE MCP Server SHALL return an error listing supported formats
4. WHEN memory allocation fails during capture, THE MCP Server SHALL clean up resources and return an out-of-memory error
5. WHEN the AI agent requests capture of a non-existent window, THE MCP Server SHALL return a window-not-found error with available windows list

### Requirement 9

**User Story:** As an AI agent, I want structured responses with comprehensive metadata, so that I can programmatically process screenshot information.

#### Acceptance Criteria

1. WHEN any screenshot operation completes, THE MCP Server SHALL return a structured JSON response with operation status and results
2. WHEN an error occurs, THE MCP Server SHALL return an error response with error code, message, and suggested remediation
3. WHEN a screenshot is captured, THE MCP Server SHALL include metadata with dimensions, format, file size, capture timestamp, and display information
4. WHEN PII masking is applied, THE MCP Server SHALL include masking statistics in the metadata
5. WHEN returning base64 data, THE MCP Server SHALL include the MIME type for proper content handling

### Requirement 10

**User Story:** As a system administrator, I want to configure security policies for screenshot operations, so that I can control what AI agents can capture and access.

#### Acceptance Criteria

1. WHEN the MCP Server starts, THE MCP Server SHALL load security policies from a configuration file
2. WHERE allowed directories are configured, THE MCP Server SHALL restrict file saves to those directories only
3. WHEN window exclusion patterns are configured, THE MCP Server SHALL automatically exclude matching windows from all captures
4. WHERE rate limiting is configured, THE MCP Server SHALL enforce maximum captures per time period
5. WHEN audit logging is enabled, THE MCP Server SHALL log all capture operations with timestamps, requested parameters, and results


### Requirement 11

**User Story:** As a developer, I want to discover and install the MCP Screenshot server from registries, so that I can easily integrate it into my development environment.

#### Acceptance Criteria

1. WHEN the MCP Screenshot server is published, THE MCP Server SHALL be available in the official MCP registry with complete metadata
2. WHEN the MCP Screenshot server is published, THE MCP Server SHALL be available as a Docker image in Docker Hub and GitHub Container Registry
3. WHEN a developer searches the MCP registry, THE MCP Server SHALL appear with description, version, installation instructions, and usage examples
4. WHEN a developer installs via npm, THE MCP Server SHALL be installable with a single command and include all dependencies
5. WHEN a developer pulls the Docker image, THE MCP Server SHALL include a secure default configuration and documentation

### Requirement 12

**User Story:** As a VS Code user, I want a VS Code extension for the MCP Screenshot server, so that I can capture and analyze screenshots directly from my editor.

#### Acceptance Criteria

1. WHEN the VS Code extension is installed, THE extension SHALL provide a screenshot panel in the VS Code sidebar
2. WHEN a user captures a screenshot through the extension, THE extension SHALL display the image in a VS Code webview with annotation tools
3. WHERE multiple displays are present, THE extension SHALL allow selecting which display to capture from a dropdown
4. WHEN a user saves a screenshot, THE extension SHALL allow choosing the save location within the workspace
5. WHEN the extension connects to the MCP Server, THE extension SHALL validate the connection and display available capture modes
