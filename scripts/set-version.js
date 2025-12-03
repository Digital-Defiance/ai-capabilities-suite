#!/usr/bin/env node
/**
 * @fileoverview Set version command for release automation
 * Updates package.json version and syncs across all files
 *
 * Usage:
 *   node scripts/set-version.js <package> <version>
 *   yarn set-version <package> <version>
 *
 * Examples:
 *   node scripts/set-version.js debugger 1.2.0
 *   yarn set-version screenshot 0.5.1
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { loadConfig } = require("./release-lib/config-loader");
const {
  syncVersions,
  validateVersion,
} = require("./release-lib/version-manager");

/**
 * Prints usage information
 */
function printUsage() {
  console.log(`
Usage: node scripts/set-version.js <package> <version>

Arguments:
  package    Package to update: 'debugger' or 'screenshot'
  version    Version to set (semver format, e.g., 1.2.3)

Examples:
  node scripts/set-version.js debugger 1.2.0
  node scripts/set-version.js screenshot 0.5.1
  yarn set-version debugger 1.2.0
`);
}

/**
 * Updates package.json with new version
 * @param {string} packageJsonPath - Path to package.json
 * @param {string} version - New version
 */
function updatePackageJson(packageJsonPath, version) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
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
async function main() {
  // Parse command-line arguments
  const args = process.argv.slice(2);

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
    const config = loadConfig(packageName);
    console.log(`✅ Loaded configuration for ${config.packageName}\n`);

    // Get project root
    const projectRoot = path.join(__dirname, "..");

    // Update main package.json
    const packageJsonPath = path.join(
      projectRoot,
      config.packageDir,
      "package.json"
    );
    console.log("📝 Updating package.json...");
    updatePackageJson(packageJsonPath, version);
    console.log(`✅ Updated ${config.packageDir}/package.json\n`);

    // Sync versions across all files
    console.log("🔄 Syncing versions across all files...");
    const syncResult = await syncVersions(config, version);

    if (syncResult.errors.length > 0) {
      console.error("\n❌ Errors occurred during version sync:");
      syncResult.errors.forEach((error) => console.error(`   - ${error}`));
      process.exit(1);
    }

    console.log(`✅ Updated ${syncResult.filesUpdated.length} file(s):`);
    syncResult.filesUpdated.forEach((file) => console.log(`   - ${file}`));
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
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
