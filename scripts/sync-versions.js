#!/usr/bin/env node
/**
 * Sync version numbers across all files in the monorepo
 * This ensures version consistency across package.json, CLI, server, docs, etc.
 *
 * Usage:
 *   node scripts/sync-versions.js [package-name]
 *
 * Examples:
 *   node scripts/sync-versions.js debugger    # Sync debugger versions
 *   node scripts/sync-versions.js screenshot  # Sync screenshot versions
 *   node scripts/sync-versions.js             # Sync all packages
 */

const fs = require("fs");
const path = require("path");

// Package directories
const DEBUGGER_SERVER_DIR = path.join(
  __dirname,
  "..",
  "packages",
  "mcp-debugger-server"
);
const VSCODE_EXTENSION_DIR = path.join(
  __dirname,
  "..",
  "packages",
  "vscode-mcp-debugger"
);
const SCREENSHOT_DIR = path.join(__dirname, "..", "packages", "mcp-screenshot");

// Get package filter from command line
const packageFilter = process.argv[2]; // 'debugger', 'screenshot', or undefined for all

// Read versions from package.json files (sources of truth)
const debuggerPackageJson = JSON.parse(
  fs.readFileSync(path.join(DEBUGGER_SERVER_DIR, "package.json"), "utf8")
);
const screenshotPackageJson = JSON.parse(
  fs.readFileSync(path.join(SCREENSHOT_DIR, "package.json"), "utf8")
);

const DEBUGGER_VERSION = debuggerPackageJson.version;
const SCREENSHOT_VERSION = screenshotPackageJson.version;

console.log(`📦 Package Versions:`);
console.log(`   Debugger: ${DEBUGGER_VERSION}`);
console.log(`   Screenshot: ${SCREENSHOT_VERSION}`);
console.log();

// Files to update with their update patterns
const debuggerFiles = [
  {
    package: "debugger",
    path: path.join(DEBUGGER_SERVER_DIR, "src", "cli.ts"),
    pattern: /const VERSION = "[^"]+"/,
    replacement: `const VERSION = "${DEBUGGER_VERSION}"`,
  },
  {
    package: "debugger",
    path: path.join(DEBUGGER_SERVER_DIR, "src", "lib", "mcp-server.ts"),
    pattern: /version: "[^"]+"/,
    replacement: `version: "${DEBUGGER_VERSION}"`,
  },
  {
    package: "debugger",
    path: path.join(DEBUGGER_SERVER_DIR, "server.json"),
    pattern: /"version": "[^"]+"/g,
    replacement: `"version": "${DEBUGGER_VERSION}"`,
  },
  {
    package: "debugger",
    path: path.join(DEBUGGER_SERVER_DIR, "docker-build-push.sh"),
    pattern: /VERSION="[^"]+"/,
    replacement: `VERSION="${DEBUGGER_VERSION}"`,
  },
  {
    package: "debugger",
    path: path.join(DEBUGGER_SERVER_DIR, "Dockerfile"),
    pattern: /org\.opencontainers\.image\.version="[^"]+"/,
    replacement: `org.opencontainers.image.version="${DEBUGGER_VERSION}"`,
  },
  {
    package: "debugger",
    path: path.join(DEBUGGER_SERVER_DIR, "Dockerfile.local"),
    pattern: /org\.opencontainers\.image\.version="[^"]+"/,
    replacement: `org.opencontainers.image.version="${DEBUGGER_VERSION}"`,
  },
  {
    package: "debugger",
    path: path.join(DEBUGGER_SERVER_DIR, "Dockerfile"),
    pattern:
      /npm install -g @ai-capabilities-suite\/mcp-debugger-server@[0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `npm install -g @ai-capabilities-suite/mcp-debugger-server@${DEBUGGER_VERSION}`,
  },
  {
    package: "debugger",
    path: path.join(
      __dirname,
      "..",
      ".github",
      "workflows",
      "release-debugger-binaries.yml"
    ),
    pattern:
      /npm install -g @ai-capabilities-suite\/mcp-debugger-server@[0-9]+\.[0-9]+\.[0-9]+/g,
    replacement: `npm install -g @ai-capabilities-suite/mcp-debugger-server@${DEBUGGER_VERSION}`,
  },
  {
    package: "debugger",
    path: path.join(VSCODE_EXTENSION_DIR, "package.json"),
    pattern: /"@ai-capabilities-suite\/mcp-debugger-server": "\^[^"]+"/,
    replacement: `"@ai-capabilities-suite/mcp-debugger-server": "^${DEBUGGER_VERSION}"`,
  },
  {
    package: "debugger",
    path: path.join(VSCODE_EXTENSION_DIR, "package.json"),
    pattern: /^(\s*"version":\s*")[^"]+"/m,
    replacement: `$1${DEBUGGER_VERSION}"`,
  },
];

const screenshotFiles = [
  {
    package: "screenshot",
    path: path.join(SCREENSHOT_DIR, "src", "server.ts"),
    pattern: /version: "[^"]+"/,
    replacement: `version: "${SCREENSHOT_VERSION}"`,
  },
  {
    package: "screenshot",
    path: path.join(SCREENSHOT_DIR, "mcp-registry.json"),
    pattern: /"version": "[^"]+"/,
    replacement: `"version": "${SCREENSHOT_VERSION}"`,
  },
  {
    package: "screenshot",
    path: path.join(SCREENSHOT_DIR, "docker-build-push.sh"),
    pattern: /VERSION="[^"]+"/,
    replacement: `VERSION="${SCREENSHOT_VERSION}"`,
  },
  {
    package: "screenshot",
    path: path.join(SCREENSHOT_DIR, "docker-mcp-registry", "server.yaml"),
    pattern: /version: [0-9]+\.[0-9]+\.[0-9]+/,
    replacement: `version: ${SCREENSHOT_VERSION}`,
  },
  {
    package: "screenshot",
    path: path.join(
      __dirname,
      "..",
      "packages",
      "vscode-mcp-screenshot",
      "package.json"
    ),
    pattern: /"@ai-capabilities-suite\/mcp-screenshot": "\^[^"]+"/,
    replacement: `"@ai-capabilities-suite/mcp-screenshot": "^${SCREENSHOT_VERSION}"`,
  },
  {
    package: "screenshot",
    path: path.join(
      __dirname,
      "..",
      "packages",
      "vscode-mcp-screenshot",
      "package.json"
    ),
    pattern: /^(\s*"version":\s*")[^"]+"/m,
    replacement: `$1${SCREENSHOT_VERSION}"`,
  },
];

// Combine all files based on filter
let filesToUpdate = [];
if (!packageFilter || packageFilter === "debugger") {
  filesToUpdate = filesToUpdate.concat(debuggerFiles);
}
if (!packageFilter || packageFilter === "screenshot") {
  filesToUpdate = filesToUpdate.concat(screenshotFiles);
}

let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

if (packageFilter) {
  console.log(`🔍 Syncing ${packageFilter} package only\n`);
} else {
  console.log(`🔍 Syncing all packages\n`);
}

filesToUpdate.forEach(
  ({ package: pkg, path: filePath, pattern, replacement, optional }) => {
    try {
      if (!fs.existsSync(filePath)) {
        if (optional) {
          console.log(
            `⏭️  Optional file not found: ${path.relative(
              process.cwd(),
              filePath
            )}`
          );
          skippedCount++;
        } else {
          console.warn(
            `⚠️  File not found: ${path.relative(process.cwd(), filePath)}`
          );
          errorCount++;
        }
        return;
      }

      const content = fs.readFileSync(filePath, "utf8");
      const newContent = content.replace(pattern, replacement);

      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, "utf8");
        console.log(
          `✅ [${pkg}] Updated: ${path.relative(process.cwd(), filePath)}`
        );
        updatedCount++;
      } else {
        console.log(
          `⏭️  [${pkg}] No change needed: ${path.relative(
            process.cwd(),
            filePath
          )}`
        );
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ [${pkg}] Error updating ${filePath}:`, error.message);
      errorCount++;
    }
  }
);

console.log(`\n📊 Summary:`);
console.log(`   Updated: ${updatedCount} files`);
console.log(`   Skipped: ${skippedCount} files`);
console.log(`   Errors: ${errorCount} files`);
if (!packageFilter || packageFilter === "debugger") {
  console.log(`   Debugger Version: ${DEBUGGER_VERSION}`);
}
if (!packageFilter || packageFilter === "screenshot") {
  console.log(`   Screenshot Version: ${SCREENSHOT_VERSION}`);
}

if (errorCount > 0) {
  console.error(`\n❌ ${errorCount} error(s) occurred during sync`);
  process.exit(1);
}

console.log(`\n✅ Version sync completed successfully!`);
