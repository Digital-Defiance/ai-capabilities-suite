/**
 * @fileoverview VSCode marketplace publisher for release automation
 * Handles publishing VSCode extensions to the marketplace
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
 * Checks if VSCode marketplace credentials are configured
 * @returns {boolean} True if credentials are available
 */
function checkCredentials() {
  // Check if VSCE_PAT environment variable is set
  if (process.env.VSCE_PAT) {
    return true;
  }

  // Try to check if vsce is configured with a token
  try {
    // vsce doesn't have a direct way to check auth, but we can check if the token env var exists
    // or if the user has previously authenticated
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Publishes the VSCode extension to the marketplace
 * @param {string} vsixPath - Path to the VSIX file
 * @param {boolean} dryRun - If true, skip actual publishing
 * @returns {Promise<PublishResult>} Publish result
 */
async function publish(vsixPath, dryRun = false) {
  try {
    // Verify VSIX file exists
    if (!fs.existsSync(vsixPath)) {
      return {
        success: false,
        error: `VSIX file not found: ${vsixPath}`,
      };
    }

    // Check credentials (skip in dry-run mode)
    if (!dryRun && !checkCredentials()) {
      return {
        success: false,
        error:
          "VSCode marketplace authentication required. Please set VSCE_PAT environment variable with your Personal Access Token.",
      };
    }

    let output;
    if (dryRun) {
      // In dry-run mode, just verify the VSIX file exists
      output = `Dry-run: Would publish ${path.basename(vsixPath)}`;
    } else {
      // Get the directory containing the VSIX file
      const vsixDir = path.dirname(vsixPath);

      // Publish using vsce
      // The -p flag uses the VSCE_PAT environment variable
      output = execCommand(`npx vsce publish -p ${process.env.VSCE_PAT}`, {
        cwd: vsixDir,
      });
    }

    // Extract extension name and version from VSIX filename
    // Format: extensionName-version.vsix
    const vsixFileName = path.basename(vsixPath, ".vsix");
    const lastDashIndex = vsixFileName.lastIndexOf("-");
    const extensionName = vsixFileName.substring(0, lastDashIndex);

    // Construct the marketplace URL
    const url = `https://marketplace.visualstudio.com/items?itemName=${extensionName}`;

    return {
      success: true,
      url,
      output,
    };
  } catch (error) {
    // Check if error is due to authentication
    const isAuthError =
      error.output &&
      (error.output.includes("ENOTFOUND") ||
        error.output.includes("authentication") ||
        error.output.includes("401") ||
        error.output.includes("403") ||
        error.output.includes("Personal Access Token") ||
        error.output.includes("PAT"));

    return {
      success: false,
      output: error.output,
      error: isAuthError
        ? "VSCode marketplace authentication failed. Please verify your VSCE_PAT token is valid."
        : error.message,
    };
  }
}

/**
 * Verifies that the extension exists on the VSCode marketplace
 * @param {string} extensionName - Extension name (format: publisher.extension)
 * @param {string} version - Extension version
 * @returns {Promise<boolean>} True if extension exists with the specified version
 */
async function verify(extensionName, version) {
  try {
    // Use vsce show to check if the extension version exists
    const output = execCommand(`npx vsce show ${extensionName} --json`);

    // Parse the JSON output
    const extensionInfo = JSON.parse(output);

    // Check if the version matches
    if (!extensionInfo.versions || !Array.isArray(extensionInfo.versions)) {
      return false;
    }

    return extensionInfo.versions.some((v) => v.version === version);
  } catch (error) {
    // If vsce show fails, the extension doesn't exist or is not accessible
    return false;
  }
}

module.exports = {
  publish,
  verify,
  checkCredentials,
  execCommand,
};
