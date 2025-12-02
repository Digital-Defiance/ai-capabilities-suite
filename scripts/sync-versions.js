#!/usr/bin/env node
/**
 * Sync version numbers across all files in mcp-debugger-server and vscode-mcp-debugger
 * This ensures version consistency across package.json, CLI, server, docs, etc.
 */

const fs = require("fs");
const path = require("path");

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

// Read version from mcp-debugger-server package.json (source of truth)
const packageJsonPath = path.join(DEBUGGER_SERVER_DIR, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const VERSION = packageJson.version;

console.log(`Syncing version to: ${VERSION}`);

// Files to update with their update patterns
const filesToUpdate = [
  // MCP Debugger Server files
  {
    path: path.join(DEBUGGER_SERVER_DIR, "src", "cli.ts"),
    pattern: /const VERSION = "[^"]+"/,
    replacement: `const VERSION = "${VERSION}"`,
  },
  {
    path: path.join(DEBUGGER_SERVER_DIR, "src", "lib", "mcp-server.ts"),
    pattern: /version: "[^"]+"/,
    replacement: `version: "${VERSION}"`,
  },
  {
    path: path.join(DEBUGGER_SERVER_DIR, "server.json"),
    pattern: /"version": "[^"]+"/g,
    replacement: `"version": "${VERSION}"`,
  },
  {
    path: path.join(DEBUGGER_SERVER_DIR, "docker-build-push.sh"),
    pattern: /VERSION="[^"]+"/,
    replacement: `VERSION="${VERSION}"`,
  },
  {
    path: path.join(DEBUGGER_SERVER_DIR, "Dockerfile"),
    pattern: /org\.opencontainers\.image\.version="[^"]+"/,
    replacement: `org.opencontainers.image.version="${VERSION}"`,
  },
  {
    path: path.join(DEBUGGER_SERVER_DIR, "Dockerfile.local"),
    pattern: /org\.opencontainers\.image\.version="[^"]+"/,
    replacement: `org.opencontainers.image.version="${VERSION}"`,
  },
  // VS Code Extension - update dependency version
  {
    path: path.join(VSCODE_EXTENSION_DIR, "package.json"),
    pattern: /"@ai-capabilities-suite\/mcp-debugger-server": "\^[^"]+"/,
    replacement: `"@ai-capabilities-suite/mcp-debugger-server": "^${VERSION}"`,
  },
];

let updatedCount = 0;
let errorCount = 0;

filesToUpdate.forEach(({ path: filePath, pattern, replacement }) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const newContent = content.replace(pattern, replacement);

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, "utf8");
      console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
      updatedCount++;
    } else {
      console.log(
        `⏭️  No change needed: ${path.relative(process.cwd(), filePath)}`
      );
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Updated: ${updatedCount} files`);
console.log(`   Errors: ${errorCount} files`);
console.log(`   Version: ${VERSION}`);

if (errorCount > 0) {
  process.exit(1);
}
