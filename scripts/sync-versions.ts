#!/usr/bin/env node
/**
 * Sync version numbers across all files in the monorepo
 * This ensures version consistency across package.json, CLI, server, docs, etc.
 *
 * Usage:
 *   ts-node scripts/sync-versions.ts [package-name]
 *
 * Examples:
 *   ts-node scripts/sync-versions.ts debugger    # Sync debugger versions
 *   ts-node scripts/sync-versions.ts screenshot  # Sync screenshot versions
 *   ts-node scripts/sync-versions.ts             # Sync all packages
 */

import * as fs from "fs";
import * as path from "path";
import { FileUpdate, PackageInfo, SyncVersionsOptions } from "./common/types";
import { readJsonFile, getRelativePath } from "./common/file-utils";

/**
 * Package directories relative to project root
 */
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

/**
 * Reads package information from a package.json file
 * @param packageDir - Directory containing package.json
 * @returns Package information
 */
function readPackageInfo(packageDir: string): PackageInfo {
  const packageJsonPath = path.join(packageDir, "package.json");
  const packageJson = readJsonFile<{ name: string; version: string }>(
    packageJsonPath
  );

  return {
    name: packageJson.name,
    version: packageJson.version,
    directory: packageDir,
  };
}

/**
 * Gets file update configurations for debugger package
 * @param version - Version string to use
 * @returns Array of file update configurations
 */
function getDebuggerFileUpdates(version: string): FileUpdate[] {
  return [
    {
      package: "debugger",
      path: path.join(DEBUGGER_SERVER_DIR, "src", "cli.ts"),
      pattern: /const VERSION = "[^"]+"/,
      replacement: `const VERSION = "${version}"`,
    },
    {
      package: "debugger",
      path: path.join(DEBUGGER_SERVER_DIR, "src", "lib", "mcp-server.ts"),
      pattern: /version: "[^"]+"/,
      replacement: `version: "${version}"`,
    },
    {
      package: "debugger",
      path: path.join(DEBUGGER_SERVER_DIR, "server.json"),
      pattern: /"version": "[^"]+"/g,
      replacement: `"version": "${version}"`,
    },
    {
      package: "debugger",
      path: path.join(DEBUGGER_SERVER_DIR, "docker-build-push.sh"),
      pattern: /VERSION="[^"]+"/,
      replacement: `VERSION="${version}"`,
    },
    {
      package: "debugger",
      path: path.join(DEBUGGER_SERVER_DIR, "Dockerfile"),
      pattern: /org\.opencontainers\.image\.version="[^"]+"/,
      replacement: `org.opencontainers.image.version="${version}"`,
    },
    {
      package: "debugger",
      path: path.join(DEBUGGER_SERVER_DIR, "Dockerfile.local"),
      pattern: /org\.opencontainers\.image\.version="[^"]+"/,
      replacement: `org.opencontainers.image.version="${version}"`,
    },
    {
      package: "debugger",
      path: path.join(DEBUGGER_SERVER_DIR, "Dockerfile"),
      pattern:
        /npm install -g @ai-capabilities-suite\/mcp-debugger-server@[0-9]+\.[0-9]+\.[0-9]+/,
      replacement: `npm install -g @ai-capabilities-suite/mcp-debugger-server@${version}`,
    },
    {
      package: "debugger",
      path: path.join(VSCODE_EXTENSION_DIR, "package.json"),
      pattern: /"@ai-capabilities-suite\/mcp-debugger-server": "\^[^"]+"/,
      replacement: `"@ai-capabilities-suite/mcp-debugger-server": "^${version}"`,
    },
    {
      package: "debugger",
      path: path.join(VSCODE_EXTENSION_DIR, "package.json"),
      pattern: /^(\s*"version":\s*")[^"]+"/m,
      replacement: `$1${version}"`,
    },
  ];
}

/**
 * Gets file update configurations for screenshot package
 * @param version - Version string to use
 * @returns Array of file update configurations
 */
function getScreenshotFileUpdates(version: string): FileUpdate[] {
  return [
    {
      package: "screenshot",
      path: path.join(SCREENSHOT_DIR, "src", "server.ts"),
      pattern: /version: "[^"]+"/,
      replacement: `version: "${version}"`,
    },
    {
      package: "screenshot",
      path: path.join(SCREENSHOT_DIR, "mcp-registry.json"),
      pattern: /"version": "[^"]+"/,
      replacement: `"version": "${version}"`,
    },
    {
      package: "screenshot",
      path: path.join(SCREENSHOT_DIR, "docker-build-push.sh"),
      pattern: /VERSION="[^"]+"/,
      replacement: `VERSION="${version}"`,
    },
    {
      package: "screenshot",
      path: path.join(SCREENSHOT_DIR, "docker-mcp-registry", "server.yaml"),
      pattern: /version: [0-9]+\.[0-9]+\.[0-9]+/,
      replacement: `version: ${version}`,
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
      replacement: `"@ai-capabilities-suite/mcp-screenshot": "^${version}"`,
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
      replacement: `$1${version}"`,
    },
    {
      package: "screenshot",
      path: path.join(SCREENSHOT_DIR, "Dockerfile"),
      pattern: /npm install -g @ai-capabilities-suite\/mcp-screenshot@[0-9]+\.[0-9]+\.[0-9]+/,
      replacement: `npm install -g @ai-capabilities-suite/mcp-screenshot@${version}`,
    },
  ];
}

/**
 * Updates a single file with version information
 * @param update - File update configuration
 * @returns Object with success status and whether file was modified
 */
function updateSingleFile(update: FileUpdate): {
  success: boolean;
  modified: boolean;
  error?: string;
} {
  const { path: filePath, pattern, replacement, optional = false } = update;

  try {
    if (!fs.existsSync(filePath)) {
      if (optional) {
        return { success: true, modified: false };
      }
      return {
        success: false,
        modified: false,
        error: `File not found: ${filePath}`,
      };
    }

    const content = fs.readFileSync(filePath, "utf8");
    const newContent = content.replace(pattern, replacement);

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, "utf8");
      return { success: true, modified: true };
    }

    return { success: true, modified: false };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        modified: false,
        error: `Error updating ${filePath}: ${error.message}`,
      };
    }
    return {
      success: false,
      modified: false,
      error: `Unknown error updating ${filePath}`,
    };
  }
}

/**
 * Synchronizes version numbers across all configured files
 * @param options - Sync options
 * @returns Exit code (0 for success, 1 for errors)
 */
function syncVersions(options: SyncVersionsOptions): number {
  const packageFilter = options.package;

  // Read versions from package.json files (sources of truth)
  const debuggerPackage = readPackageInfo(DEBUGGER_SERVER_DIR);
  const screenshotPackage = readPackageInfo(SCREENSHOT_DIR);

  const DEBUGGER_VERSION = debuggerPackage.version;
  const SCREENSHOT_VERSION = screenshotPackage.version;

  console.log(`📦 Package Versions:`);
  console.log(`   Debugger: ${DEBUGGER_VERSION}`);
  console.log(`   Screenshot: ${SCREENSHOT_VERSION}`);
  console.log();

  // Combine all files based on filter
  let filesToUpdate: FileUpdate[] = [];
  if (!packageFilter || packageFilter === "debugger") {
    filesToUpdate = filesToUpdate.concat(
      getDebuggerFileUpdates(DEBUGGER_VERSION)
    );
  }
  if (!packageFilter || packageFilter === "screenshot") {
    filesToUpdate = filesToUpdate.concat(
      getScreenshotFileUpdates(SCREENSHOT_VERSION)
    );
  }

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  if (packageFilter) {
    console.log(`🔍 Syncing ${packageFilter} package only\n`);
  } else {
    console.log(`🔍 Syncing all packages\n`);
  }

  // Process each file update
  filesToUpdate.forEach((update) => {
    const result = updateSingleFile(update);
    const relativePath = getRelativePath(update.path);
    const pkg = update.package || "unknown";

    if (!result.success) {
      if (update.optional) {
        console.log(`⏭️  Optional file not found: ${relativePath}`);
        skippedCount++;
      } else {
        console.warn(`⚠️  ${result.error}`);
        errorCount++;
      }
    } else if (result.modified) {
      console.log(`✅ [${pkg}] Updated: ${relativePath}`);
      updatedCount++;
    } else {
      console.log(`⏭️  [${pkg}] No change needed: ${relativePath}`);
      skippedCount++;
    }
  });

  // Print summary
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
    return 1;
  }

  console.log(`\n✅ Version sync completed successfully!`);
  return 0;
}

/**
 * Main entry point
 */
function main(): void {
  // Get package filter from command line
  const packageFilter = process.argv[2] as string | undefined;

  // Validate package filter if provided
  if (
    packageFilter &&
    packageFilter !== "debugger" &&
    packageFilter !== "screenshot"
  ) {
    console.error(
      `❌ Invalid package name: ${packageFilter}. Must be 'debugger' or 'screenshot'`
    );
    process.exit(1);
  }

  const options: SyncVersionsOptions = {
    package: packageFilter,
  };

  const exitCode = syncVersions(options);
  process.exit(exitCode);
}

// Run main function if this is the entry point
if (require.main === module) {
  main();
}

// Export for testing
export {
  syncVersions,
  readPackageInfo,
  getDebuggerFileUpdates,
  getScreenshotFileUpdates,
  updateSingleFile,
};
