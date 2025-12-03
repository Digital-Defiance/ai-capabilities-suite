#!/usr/bin/env node

/**
 * Build standalone binaries for the MCP Debugger Server
 *
 * This script uses pkg to create standalone executables for:
 * - Linux (x64)
 * - macOS (x64)
 * - Windows (x64)
 */

import * as fs from "fs";
import * as path from "path";
import { BuildTarget, BuildBinariesOptions } from "./common/types";
import { executeCommandInherit } from "./common/exec-utils";
import { ensureDirectory } from "./common/file-utils";

const BINARIES_DIR: string = path.join(__dirname, "..", "binaries");
const SERVER_DIR: string = path.join(
  __dirname,
  "..",
  "packages",
  "mcp-debugger-server"
);

/**
 * Default build targets for all platforms
 */
const DEFAULT_TARGETS: BuildTarget[] = [
  {
    platform: "linux",
    arch: "x64",
    target: "node18-linux-x64",
    outputName: "ts-mcp-server-linux-x64",
  },
  {
    platform: "macos",
    arch: "x64",
    target: "node18-macos-x64",
    outputName: "ts-mcp-server-macos-x64",
  },
  {
    platform: "windows",
    arch: "x64",
    target: "node18-win-x64",
    outputName: "ts-mcp-server-win-x64.exe",
  },
];

/**
 * Filters build targets based on platform selection
 * @param platforms - Array of platform names to build for
 * @returns Filtered array of build targets
 */
function filterTargets(platforms?: string[]): BuildTarget[] {
  if (!platforms || platforms.length === 0) {
    return DEFAULT_TARGETS;
  }

  return DEFAULT_TARGETS.filter((target) =>
    platforms.includes(target.platform)
  );
}

/**
 * Builds a single binary for a specific target
 * @param target - Build target configuration
 * @param outputDir - Directory to write binary to
 * @throws Error if build fails
 */
function buildBinary(target: BuildTarget, outputDir: string): void {
  console.log(`Building ${target.platform} binary (${target.target})...`);

  try {
    const outputPath: string = path.join(outputDir, target.outputName);

    // Build using pkg
    executeCommandInherit(
      `npx pkg ${SERVER_DIR} --target ${target.target} --output ${outputPath}`
    );

    console.log(`✓ Built ${target.outputName}\n`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `✗ Failed to build ${target.platform} binary:`,
        error.message
      );
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Lists all built binaries with their sizes
 * @param outputDir - Directory containing binaries
 */
function listBinaries(outputDir: string): void {
  console.log("\nBuilt binaries:");

  try {
    const files: string[] = fs.readdirSync(outputDir);

    files.forEach((file: string) => {
      const filePath: string = path.join(outputDir, file);
      const stats: fs.Stats = fs.statSync(filePath);
      const sizeMB: string = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`  - ${file} (${sizeMB} MB)`);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Failed to list binaries:", error.message);
    }
  }
}

/**
 * Main build function
 * @param options - Build options
 */
function buildBinaries(options: BuildBinariesOptions = {}): void {
  const outputDir: string = options.outputDir || BINARIES_DIR;

  // Clean output directory if requested
  if (options.clean && fs.existsSync(outputDir)) {
    console.log("Cleaning output directory...\n");
    fs.rmSync(outputDir, { recursive: true, force: true });
  }

  // Ensure binaries directory exists
  ensureDirectory(outputDir);

  console.log("Building standalone binaries...\n");

  // Filter targets based on platform selection
  const targets: BuildTarget[] = filterTargets(options.platforms);

  // Build each target
  for (const target of targets) {
    buildBinary(target, outputDir);
  }

  console.log("All binaries built successfully!");
  console.log(`\nBinaries location: ${outputDir}`);

  // List built binaries
  listBinaries(outputDir);
}

// Run if executed directly
if (require.main === module) {
  buildBinaries();
}

export { buildBinaries, buildBinary, filterTargets, listBinaries };
