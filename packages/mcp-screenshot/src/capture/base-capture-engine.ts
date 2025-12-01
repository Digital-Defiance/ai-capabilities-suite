/**
 * Base capture engine implementation
 */

import { ICaptureEngine } from "../interfaces";
import { DisplayInfo, WindowInfo } from "../types";

/**
 * Abstract base class for platform-specific capture engines
 */
export abstract class BaseCaptureEngine implements ICaptureEngine {
  abstract captureScreen(displayId?: string): Promise<Buffer>;
  abstract captureWindow(
    windowId: string,
    includeFrame: boolean
  ): Promise<Buffer>;
  abstract captureRegion(
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Buffer>;
  abstract getDisplays(): Promise<DisplayInfo[]>;
  abstract getWindows(): Promise<WindowInfo[]>;
  abstract getWindowById(windowId: string): Promise<WindowInfo | null>;
  abstract getWindowByTitle(titlePattern: string): Promise<WindowInfo | null>;

  /**
   * Detect the current platform
   */
  protected getPlatform(): "linux" | "darwin" | "win32" {
    return process.platform as "linux" | "darwin" | "win32";
  }

  /**
   * Check if running on Linux
   */
  protected isLinux(): boolean {
    return this.getPlatform() === "linux";
  }

  /**
   * Check if running on macOS
   */
  protected isMacOS(): boolean {
    return this.getPlatform() === "darwin";
  }

  /**
   * Check if running on Windows
   */
  protected isWindows(): boolean {
    return this.getPlatform() === "win32";
  }
}
