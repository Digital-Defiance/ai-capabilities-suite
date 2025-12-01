/**
 * Custom error classes for MCP Screenshot server
 */

/**
 * Base screenshot error
 */
export class ScreenshotError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = "ScreenshotError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Security-related error
 */
export class SecurityError extends ScreenshotError {
  constructor(message: string, details?: any) {
    super(message, ErrorCodes.SECURITY_ERROR, details);
    this.name = "SecurityError";
  }
}

/**
 * Path validation error
 */
export class PathValidationError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, details);
    this.code = ErrorCodes.INVALID_PATH;
    this.name = "PathValidationError";
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, details);
    this.code = ErrorCodes.RATE_LIMIT_EXCEEDED;
    this.name = "RateLimitError";
  }
}

/**
 * Window not found error
 */
export class WindowNotFoundError extends ScreenshotError {
  constructor(message: string, details?: any) {
    super(message, ErrorCodes.WINDOW_NOT_FOUND, details);
    this.name = "WindowNotFoundError";
  }
}

/**
 * Display not found error
 */
export class DisplayNotFoundError extends ScreenshotError {
  constructor(message: string, details?: any) {
    super(message, ErrorCodes.DISPLAY_NOT_FOUND, details);
    this.name = "DisplayNotFoundError";
  }
}

/**
 * Capture failed error
 */
export class CaptureFailedError extends ScreenshotError {
  constructor(message: string, details?: any) {
    super(message, ErrorCodes.CAPTURE_FAILED, details);
    this.name = "CaptureFailedError";
  }
}

/**
 * Unsupported format error
 */
export class UnsupportedFormatError extends ScreenshotError {
  constructor(message: string, details?: any) {
    super(message, ErrorCodes.UNSUPPORTED_FORMAT, details);
    this.name = "UnsupportedFormatError";
  }
}

/**
 * Permission denied error
 */
export class PermissionDeniedError extends ScreenshotError {
  constructor(message: string, details?: any) {
    super(message, ErrorCodes.PERMISSION_DENIED, details);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Error codes
 */
export const ErrorCodes = {
  PERMISSION_DENIED: "PERMISSION_DENIED",
  INVALID_PATH: "INVALID_PATH",
  WINDOW_NOT_FOUND: "WINDOW_NOT_FOUND",
  DISPLAY_NOT_FOUND: "DISPLAY_NOT_FOUND",
  UNSUPPORTED_FORMAT: "UNSUPPORTED_FORMAT",
  CAPTURE_FAILED: "CAPTURE_FAILED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  SECURITY_ERROR: "SECURITY_ERROR",
  INVALID_REGION: "INVALID_REGION",
  OUT_OF_MEMORY: "OUT_OF_MEMORY",
} as const;
