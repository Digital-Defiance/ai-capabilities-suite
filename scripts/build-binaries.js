#!/usr/bin/env node

/**
 * Build standalone binaries for the MCP Debugger Server
 *
 * This script uses pkg to create standalone executables for:
 * - Linux (x64)
 * - macOS (x64)
 * - Windows (x64)
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BINARIES_DIR = path.join(__dirname, "..", "binaries");
const SERVER_DIR = path.join(
  __dirname,
  "..",
  "packages",
  "mcp-debugger-server"
);

// Ensure binaries directory exists
if (!fs.existsSync(BINARIES_DIR)) {
  fs.mkdirSync(BINARIES_DIR, { recursive: true });
}

console.log("Building standalone binaries...\n");

const targets = [
  {
    platform: "linux",
    target: "node18-linux-x64",
    output: "ts-mcp-server-linux-x64",
  },
  {
    platform: "macos",
    target: "node18-macos-x64",
    output: "ts-mcp-server-macos-x64",
  },
  {
    platform: "windows",
    target: "node18-win-x64",
    output: "ts-mcp-server-win-x64.exe",
  },
];

for (const { platform, target, output } of targets) {
  console.log(`Building ${platform} binary (${target})...`);

  try {
    const outputPath = path.join(BINARIES_DIR, output);

    // Build using pkg
    execSync(
      `npx pkg ${SERVER_DIR} --target ${target} --output ${outputPath}`,
      { stdio: "inherit" }
    );

    console.log(`✓ Built ${output}\n`);
  } catch (error) {
    console.error(`✗ Failed to build ${platform} binary:`, error.message);
    process.exit(1);
  }
}

console.log("All binaries built successfully!");
console.log(`\nBinaries location: ${BINARIES_DIR}`);
console.log("\nBuilt binaries:");
fs.readdirSync(BINARIES_DIR).forEach((file) => {
  const filePath = path.join(BINARIES_DIR, file);
  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`  - ${file} (${sizeMB} MB)`);
});
