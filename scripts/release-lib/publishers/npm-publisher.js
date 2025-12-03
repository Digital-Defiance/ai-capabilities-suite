/**
 * @fileoverview NPM publisher for release automation
 * Handles publishing NPM packages to the registry
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * @typedef {import('../types').ReleaseConfig} ReleaseConfig
 * @typedef {import('../types').PublishResult} PublishResult
 */

/**
 * Executes a shell command and returns the output
 * @param {string} command - Command to execute
 * @param {object} options - Execution options
 * @returns {string} Command output
 * @throws {Error} If command fails
 */
function execCommand(command, options = {}) {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      ...options,
    }).trim();
  } catch (error) {
    // Include both stdout and stderr in error
    const output = error.stdout || "";
    const errorOutput = error.stderr || "";
    const fullOutput = output + "\n" + errorOutput;

    const err = new Error(`Command failed: ${command}`);
    err.output = fullOutput.trim();
    err.exitCode = error.status;
    throw err;
  }
}

/**
 * Checks if NPM credentials are configured
 * @returns {boolean} True if credentials are available
 */
function checkCredentials() {
  try {
    // Check if user is logged in to npm
    execCommand("npm whoami");
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Publishes the NPM package
 * @param {ReleaseConfig} config - Package configuration
 * @param {boolean} dryRun - If true, use npm pack instead of publish
 * @returns {Promise<PublishResult>} Publish result
 */
async function publish(config, dryRun = false) {
  try {
    // Get project root
    const projectRoot = path.join(__dirname, "..", "..", "..");
    const packagePath = path.join(projectRoot, config.packageDir);

    // Verify package directory exists
    if (!fs.existsSync(packagePath)) {
      return {
        success: false,
        error: `Package directory not found: ${config.packageDir}`,
      };
    }

    // Check credentials (skip in dry-run mode)
    if (!dryRun && !checkCredentials()) {
      return {
        success: false,
        error: "NPM authentication required. Please run 'npm login' first.",
      };
    }

    let output;
    if (dryRun) {
      // In dry-run mode, use npm pack to create a tarball without publishing
      output = execCommand("npm pack", { cwd: packagePath });
    } else {
      // Publish with public access
      output = execCommand("npm publish --access public", { cwd: packagePath });
    }

    // Construct the NPM package URL
    const url = `https://www.npmjs.com/package/${config.npmPackageName}`;

    return {
      success: true,
      url,
      output,
    };
  } catch (error) {
    // Check if error is due to authentication
    const isAuthError =
      error.output &&
      (error.output.includes("ENEEDAUTH") ||
        error.output.includes("authentication") ||
        error.output.includes("not logged in"));

    return {
      success: false,
      output: error.output,
      error: isAuthError
        ? "NPM authentication failed. Please run 'npm login' and try again."
        : error.message,
    };
  }
}

/**
 * Verifies that the package exists on the NPM registry
 * @param {string} packageName - NPM package name
 * @param {string} version - Package version
 * @returns {Promise<boolean>} True if package exists with the specified version
 */
async function verify(packageName, version) {
  try {
    // Use npm view to check if the package version exists
    const output = execCommand(`npm view ${packageName}@${version} version`);

    // If the command succeeds and returns the version, the package exists
    return output.trim() === version;
  } catch (error) {
    // If npm view fails, the package doesn't exist
    return false;
  }
}

module.exports = {
  publish,
  verify,
  checkCredentials,
  execCommand,
};
