/**
 * @fileoverview Version manager for release automation
 * Handles version synchronization across all files in the codebase
 */

const fs = require("fs");
const path = require("path");

/**
 * @typedef {import('./types').ReleaseConfig} ReleaseConfig
 * @typedef {import('./types').SyncResult} SyncResult
 */

/**
 * Validates that a version string follows semantic versioning format
 * @param {string} version - Version string to validate
 * @returns {boolean} True if version is valid semver
 */
function isValidSemver(version) {
  if (!version || typeof version !== "string") {
    return false;
  }

  // Semver regex: major.minor.patch with optional prerelease and build metadata
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  return semverRegex.test(version);
}

/**
 * Validates version format and throws if invalid
 * @param {string} version - Version string to validate
 * @throws {Error} If version is not valid semver
 */
function validateVersion(version) {
  if (!isValidSemver(version)) {
    throw new Error(
      `Invalid version format: "${version}". Must be valid semantic version (e.g., 1.0.0, 2.1.3-beta.1)`
    );
  }
}

/**
 * Replaces $VERSION placeholder in replacement string with actual version
 * @param {string} replacement - Replacement string with $VERSION placeholder
 * @param {string} version - Version to substitute
 * @returns {string} Replacement string with version substituted
 */
function substituteVersion(replacement, version) {
  return replacement.replace(/\$VERSION/g, version);
}

/**
 * Converts pattern string to RegExp if it's not already
 * @param {string|RegExp} pattern - Pattern to convert
 * @returns {RegExp} Regular expression
 */
function toRegExp(pattern) {
  if (pattern instanceof RegExp) {
    return pattern;
  }

  // If pattern is a string, convert it to RegExp
  // Handle both plain strings and regex-like strings
  if (typeof pattern === "string") {
    return new RegExp(pattern);
  }

  throw new Error(`Invalid pattern type: ${typeof pattern}`);
}

/**
 * Updates a single file with version replacement
 * @param {string} filePath - Path to file to update
 * @param {string|RegExp} pattern - Pattern to match
 * @param {string} replacement - Replacement string (with $VERSION placeholder)
 * @param {string} version - Version to use
 * @returns {{updated: boolean, error?: string}} Result of update
 */
function updateFile(filePath, pattern, replacement, version) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        updated: false,
        error: `File not found: ${filePath}`,
      };
    }

    // Read file content
    const content = fs.readFileSync(filePath, "utf8");

    // Convert pattern to RegExp and substitute version in replacement
    const regex = toRegExp(pattern);
    const actualReplacement = substituteVersion(replacement, version);

    // Perform replacement
    const newContent = content.replace(regex, actualReplacement);

    // Check if content changed
    if (content === newContent) {
      return {
        updated: false,
      };
    }

    // Write updated content
    fs.writeFileSync(filePath, newContent, "utf8");

    return {
      updated: true,
    };
  } catch (error) {
    return {
      updated: false,
      error: error.message,
    };
  }
}

/**
 * Synchronizes version across all configured files
 * @param {ReleaseConfig} config - Package configuration
 * @param {string} version - Target version
 * @returns {Promise<SyncResult>} Result of synchronization
 */
async function syncVersions(config, version) {
  // Validate version format
  validateVersion(version);

  const filesUpdated = [];
  const errors = [];

  // Get project root (assuming scripts/release-lib is two levels deep)
  const projectRoot = path.join(__dirname, "..", "..");

  // Process each file in the sync list
  for (const fileConfig of config.filesToSync) {
    const filePath = path.join(projectRoot, fileConfig.path);
    const result = updateFile(
      filePath,
      fileConfig.pattern,
      fileConfig.replacement,
      version
    );

    if (result.error) {
      errors.push(`${fileConfig.path}: ${result.error}`);
    } else if (result.updated) {
      filesUpdated.push(fileConfig.path);
    }
  }

  return {
    filesUpdated,
    errors,
  };
}

/**
 * Verifies that all configured files contain the target version
 * @param {ReleaseConfig} config - Package configuration
 * @param {string} version - Version to verify
 * @returns {Promise<boolean>} True if all files contain the version
 */
async function verifyVersions(config, version) {
  // Validate version format
  validateVersion(version);

  const projectRoot = path.join(__dirname, "..", "..");

  // Check each file
  for (const fileConfig of config.filesToSync) {
    const filePath = path.join(projectRoot, fileConfig.path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return false;
    }

    // Read file content
    const content = fs.readFileSync(filePath, "utf8");

    // Create the expected replacement with actual version
    const expectedReplacement = substituteVersion(
      fileConfig.replacement,
      version
    );

    // Check if the expected replacement exists in the file
    if (!content.includes(expectedReplacement)) {
      return false;
    }
  }

  return true;
}

module.exports = {
  syncVersions,
  verifyVersions,
  validateVersion,
  isValidSemver,
  substituteVersion,
  toRegExp,
  updateFile,
};
