/**
 * @fileoverview NPM builder for release automation
 * Handles building and testing NPM packages
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * @typedef {import('../types').ReleaseConfig} ReleaseConfig
 * @typedef {import('../types').BuildResult} BuildResult
 * @typedef {import('../types').TestResult} TestResult
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
 * Validates that the build output is correct
 * @param {string} packageDir - Package directory path
 * @returns {boolean} True if build output is valid
 */
function validateBuildOutput(packageDir) {
  // Check if dist directory exists
  const distPath = path.join(packageDir, "dist");

  if (!fs.existsSync(distPath)) {
    return false;
  }

  // Check if dist directory has files
  const distFiles = fs.readdirSync(distPath);

  if (distFiles.length === 0) {
    return false;
  }

  return true;
}

/**
 * Builds the NPM package
 * @param {ReleaseConfig} config - Package configuration
 * @returns {Promise<BuildResult>} Build result
 */
async function build(config) {
  try {
    // Get project root (assuming scripts/release-lib/builders is three levels deep)
    const projectRoot = path.join(__dirname, "..", "..", "..");
    const packagePath = path.join(projectRoot, config.packageDir);

    // Verify package directory exists
    if (!fs.existsSync(packagePath)) {
      return {
        success: false,
        error: `Package directory not found: ${config.packageDir}`,
      };
    }

    // Execute build command
    const output = execCommand(config.buildCommand, { cwd: projectRoot });

    // Validate build output
    const isValid = validateBuildOutput(packagePath);

    if (!isValid) {
      return {
        success: false,
        output,
        error:
          "Build completed but output validation failed: dist directory is missing or empty",
      };
    }

    return {
      success: true,
      output,
    };
  } catch (error) {
    return {
      success: false,
      output: error.output,
      error: error.message,
    };
  }
}

/**
 * Runs tests for the NPM package
 * @param {ReleaseConfig} config - Package configuration
 * @returns {Promise<TestResult>} Test result
 */
async function test(config) {
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

    // Execute test command
    const output = execCommand(config.testCommand, { cwd: projectRoot });

    return {
      success: true,
      output,
    };
  } catch (error) {
    return {
      success: false,
      output: error.output,
      error: error.message,
    };
  }
}

module.exports = {
  build,
  test,
  validateBuildOutput,
  execCommand,
};
