#!/usr/bin/env node
/**
 * @fileoverview Set version command for release automation
 * Updates package.json version and syncs across all files
 *
 * Usage:
 *   node scripts/set-version.ts <package> <version>
 *   yarn set-version <package> <version>
 *
 * Examples:
 *   node scripts/set-version.ts debugger 1.2.0
 *   yarn set-version screenshot 0.5.1
 */

import * as fs from "fs";
import * as path from "path";

// Use require for JavaScript modules that don't have TypeScript definitions
const { loadConfig } = require("./release-lib/config-loader");
const {
  syncVersions,
  validateVersion,
} = require("./release-lib/version-manager");

// Type imports for JSDoc types
type ReleaseConfig = any;
type SyncResult = {
  filesUpdated: string[];
  errors: string[];
};

/**
 * Package.json structure
 */
interface PackageJson {
  name?: string;
  version: string;
  [key: string]: unknown;
}

/**
 * Prints usage information
 */
function printUsage(): void {
  console.log(`
Usage: node scripts/set-version.ts <package> <version>

Arguments:
  package    Package to update: 'debugger' or 'screenshot'
  version    Version to set (semver format, e.g., 1.2.3)

Examples:
  node scripts/set-version.ts debugger 1.2.0
  node scripts/set-version.ts screenshot 0.5.1
  yarn set-version debugger 1.2.0
`);
}

/**
 * Updates package.json with new version
 * @param packageJsonPath - Path to package.json
 * @param version - New version
 */
function updatePackageJson(packageJsonPath: string, version: string): void {
  const packageJson: PackageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf8")
  );
  packageJson.version = version;
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf8"
  );
}

/**
 * Main function
 */
async function main(): Promise<void> {
  // Parse command-line arguments
  const args: string[] = process.argv.slice(2);

  if (args.length !== 2) {
    console.error("❌ Error: Invalid number of arguments\n");
    printUsage();
    process.exit(1);
  }

  const [packageName, version] = args;

  console.log(`🚀 Setting version for ${packageName} to ${version}\n`);

  try {
    // Validate version format
    validateVersion(version);
    console.log("✅ Version format is valid\n");

    // Load package configuration
    console.log("📦 Loading package configuration...");
    const config: ReleaseConfig = loadConfig(packageName);
    console.log(`✅ Loaded configuration for ${config.packageName}\n`);

    // Get project root
    const projectRoot: string = path.join(__dirname, "..");

    // Update main package.json
    const packageJsonPath: string = path.join(
      projectRoot,
      config.packageDir,
      "package.json"
    );
    console.log("📝 Updating package.json...");
    updatePackageJson(packageJsonPath, version);
    console.log(`✅ Updated ${config.packageDir}/package.json\n`);

    // Sync versions across all files
    console.log("🔄 Syncing versions across all files...");
    const syncResult: SyncResult = await syncVersions(config, version);

    if (syncResult.errors.length > 0) {
      console.error("\n❌ Errors occurred during version sync:");
      syncResult.errors.forEach((error: string) =>
        console.error(`   - ${error}`)
      );
      process.exit(1);
    }

    console.log(`✅ Updated ${syncResult.filesUpdated.length} file(s):`);
    syncResult.filesUpdated.forEach((file: string) =>
      console.log(`   - ${file}`)
    );
    console.log();

    // Success summary
    console.log("✅ Version update completed successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   Package: ${packageName}`);
    console.log(`   Version: ${version}`);
    console.log(`   Files updated: ${syncResult.filesUpdated.length + 1}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   - Review the changes: git diff`);
    console.log(
      `   - Commit the changes: git add -A && git commit -m "chore(${packageName}): bump version to ${version}"`
    );
    console.log(`   - Push to remote: git push`);
    console.log(
      `   - Create a release: node scripts/release.js ${packageName} ${version}`
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("\n❌ Error:", error.message);
    } else {
      console.error("\n❌ Error:", String(error));
    }
    process.exit(1);
  }
}

// Run main function
main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error("❌ Unexpected error:", error);
  } else {
    console.error("❌ Unexpected error:", String(error));
  }
  process.exit(1);
});
