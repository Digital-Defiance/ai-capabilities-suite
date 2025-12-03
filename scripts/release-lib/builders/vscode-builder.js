/**
 * @fileoverview VSCode extension builder for release automation
 * Handles compiling TypeScript and packaging VSCode extensions
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * @typedef {import('../types').ReleaseConfig} ReleaseConfig
 * @typedef {import('../types').BuildResult} BuildResult
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
 * Validates that the compilation output is correct
 * @param {string} extensionDir - Extension directory path
 * @returns {boolean} True if compilation output is valid
 */
function validateCompilationOutput(extensionDir) {
  // Check if out directory exists
  const outPath = path.join(extensionDir, "out");

  if (!fs.existsSync(outPath)) {
    return false;
  }

  // Check if out directory has files
  const outFiles = fs.readdirSync(outPath);

  if (outFiles.length === 0) {
    return false;
  }

  // Check if extension.js exists (main entry point)
  const extensionJsPath = path.join(outPath, "extension.js");
  if (!fs.existsSync(extensionJsPath)) {
    return false;
  }

  return true;
}

/**
 * Validates that the VSIX package was created correctly
 * @param {string} vsixPath - Path to VSIX file
 * @returns {boolean} True if VSIX is valid
 */
function validateVsixPackage(vsixPath) {
  // Check if VSIX file exists
  if (!fs.existsSync(vsixPath)) {
    return false;
  }

  // Check if VSIX file has content
  const stats = fs.statSync(vsixPath);
  if (stats.size === 0) {
    return false;
  }

  return true;
}

/**
 * Compiles the VSCode extension TypeScript code
 * @param {string} extensionDir - Extension directory path
 * @returns {Promise<BuildResult>} Compilation result
 */
async function compile(extensionDir) {
  try {
    // Get project root (assuming scripts/release-lib/builders is three levels deep)
    const projectRoot = path.join(__dirname, "..", "..", "..");
    const extensionPath = path.join(projectRoot, extensionDir);

    // Verify extension directory exists
    if (!fs.existsSync(extensionPath)) {
      return {
        success: false,
        error: `Extension directory not found: ${extensionDir}`,
      };
    }

    // Verify package.json exists
    const packageJsonPath = path.join(extensionPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      return {
        success: false,
        error: `package.json not found in extension directory: ${extensionDir}`,
      };
    }

    // Execute TypeScript compilation
    const output = execCommand("npm run compile", { cwd: extensionPath });

    // Validate compilation output
    const isValid = validateCompilationOutput(extensionPath);

    if (!isValid) {
      return {
        success: false,
        output,
        error:
          "Compilation completed but output validation failed: out directory is missing, empty, or extension.js not found",
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
 * Packages the VSCode extension as a VSIX file
 * @param {string} extensionDir - Extension directory path
 * @returns {Promise<string>} Path to the created VSIX file
 */
async function packageExtension(extensionDir) {
  try {
    // Get project root
    const projectRoot = path.join(__dirname, "..", "..", "..");
    const extensionPath = path.join(projectRoot, extensionDir);

    // Verify extension directory exists
    if (!fs.existsSync(extensionPath)) {
      throw new Error(`Extension directory not found: ${extensionDir}`);
    }

    // Verify package.json exists
    const packageJsonPath = path.join(extensionPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(
        `package.json not found in extension directory: ${extensionDir}`
      );
    }

    // Read package.json to get extension name and version
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const extensionName = packageJson.name;
    const extensionVersion = packageJson.version;

    if (!extensionName || !extensionVersion) {
      throw new Error("Extension name or version not found in package.json");
    }

    // Execute vsce package command
    const output = execCommand("npm run package", { cwd: extensionPath });

    // Determine VSIX file path
    const vsixFileName = `${extensionName}-${extensionVersion}.vsix`;
    const vsixPath = path.join(extensionPath, vsixFileName);

    // Validate VSIX package
    const isValid = validateVsixPackage(vsixPath);

    if (!isValid) {
      throw new Error(
        `VSIX package validation failed: ${vsixFileName} not found or empty`
      );
    }

    return vsixPath;
  } catch (error) {
    const err = new Error(`Failed to package extension: ${error.message}`);
    err.output = error.output;
    throw err;
  }
}

module.exports = {
  compile,
  packageExtension,
  validateCompilationOutput,
  validateVsixPackage,
  execCommand,
};
