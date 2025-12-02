/**
 * Export capture engine components
 */

export * from "./base-capture-engine";
export * from "./linux-capture-engine";
export * from "./macos-capture-engine";
export * from "./windows-capture-engine";
export * from "./region-validator";

import { BaseCaptureEngine } from "./base-capture-engine";
import { LinuxCaptureEngine } from "./linux-capture-engine";
import { MacOSCaptureEngine } from "./macos-capture-engine";
import { WindowsCaptureEngine } from "./windows-capture-engine";

/**
 * Create a platform-specific capture engine
 */
export function createCaptureEngine(): BaseCaptureEngine {
  const platform = process.platform;

  switch (platform) {
    case "linux":
      return new LinuxCaptureEngine();
    case "darwin":
      return new MacOSCaptureEngine();
    case "win32":
      return new WindowsCaptureEngine();
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
