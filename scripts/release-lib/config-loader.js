/**
 * @fileoverview Configuration loader for release automation
 * Loads and validates package-specific configuration from JSON files
 */

const fs = require("fs");
const path = require("path");

/**
 * @typedef {import('./types').ReleaseConfig} ReleaseConfig
 */

/**
 * Required fields in configuration
 */
const REQUIRED_FIELDS = [
  "packageName",
  "npmPackageName",
  "vscodeExtensionName",
  "dockerImageName",
  "packageDir",
  "vscodeExtensionDir",
  "buildBinaries",
  "testCommand",
  "buildCommand",
  "filesToSync",
  "githubReleaseTemplate",
];

/**
 * Fields that can be overridden by environment variables
 * Format: CONFIG_FIELD_NAME -> ENV_VAR_NAME
 */
const ENV_OVERRIDES = {
  npmPackageName: "RELEASE_NPM_PACKAGE_NAME",
  dockerImageName: "RELEASE_DOCKER_IMAGE_NAME",
  testCommand: "RELEASE_TEST_COMMAND",
  buildCommand: "RELEASE_BUILD_COMMAND",
};

/**
 * Validates that a configuration object has all required fields
 * @param {any} config - Configuration object to validate
 * @param {string} configPath - Path to config file (for error messages)
 * @throws {Error} If validation fails
 */
function validateConfig(config, configPath) {
  if (!config || typeof config !== "object") {
    throw new Error(`Configuration at ${configPath} is not a valid object`);
  }

  const missingFields = [];
  for (const field of REQUIRED_FIELDS) {
    if (!(field in config)) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new Error(
      `Configuration at ${configPath} is missing required fields: ${missingFields.join(
        ", "
      )}`
    );
  }

  // Validate packageName
  if (
    typeof config.packageName !== "string" ||
    config.packageName.trim() === ""
  ) {
    throw new Error(
      `Configuration at ${configPath}: packageName must be a non-empty string`
    );
  }

  // Validate buildBinaries is boolean
  if (typeof config.buildBinaries !== "boolean") {
    throw new Error(
      `Configuration at ${configPath}: buildBinaries must be a boolean`
    );
  }

  // Validate binaryPlatforms if buildBinaries is true
  if (config.buildBinaries) {
    if (
      !Array.isArray(config.binaryPlatforms) ||
      config.binaryPlatforms.length === 0
    ) {
      throw new Error(
        `Configuration at ${configPath}: binaryPlatforms must be a non-empty array when buildBinaries is true`
      );
    }
  }

  // Validate filesToSync is an array
  if (!Array.isArray(config.filesToSync)) {
    throw new Error(
      `Configuration at ${configPath}: filesToSync must be an array`
    );
  }

  // Validate each file sync entry
  for (let i = 0; i < config.filesToSync.length; i++) {
    const entry = config.filesToSync[i];
    if (!entry.path || typeof entry.path !== "string") {
      throw new Error(
        `Configuration at ${configPath}: filesToSync[${i}].path must be a non-empty string`
      );
    }
    if (!entry.pattern) {
      throw new Error(
        `Configuration at ${configPath}: filesToSync[${i}].pattern is required`
      );
    }
    if (!entry.replacement || typeof entry.replacement !== "string") {
      throw new Error(
        `Configuration at ${configPath}: filesToSync[${i}].replacement must be a non-empty string`
      );
    }
  }

  // Validate string fields are non-empty
  const stringFields = [
    "npmPackageName",
    "vscodeExtensionName",
    "dockerImageName",
    "packageDir",
    "vscodeExtensionDir",
    "testCommand",
    "buildCommand",
    "githubReleaseTemplate",
  ];

  for (const field of stringFields) {
    if (typeof config[field] !== "string" || config[field].trim() === "") {
      throw new Error(
        `Configuration at ${configPath}: ${field} must be a non-empty string`
      );
    }
  }
}

/**
 * Applies environment variable overrides to configuration
 * @param {ReleaseConfig} config - Configuration object
 * @returns {ReleaseConfig} Configuration with environment overrides applied
 */
function applyEnvironmentOverrides(config) {
  const overriddenConfig = { ...config };

  for (const [configField, envVar] of Object.entries(ENV_OVERRIDES)) {
    if (process.env[envVar]) {
      overriddenConfig[configField] = process.env[envVar];
    }
  }

  return overriddenConfig;
}

/**
 * Loads configuration for a specific package
 * @param {string} packageName - Name of the package ('debugger' or 'screenshot')
 * @param {string} [configDir] - Directory containing config files (defaults to scripts/release-config)
 * @returns {ReleaseConfig} Loaded and validated configuration
 * @throws {Error} If configuration cannot be loaded or is invalid
 */
function loadConfig(packageName, configDir) {
  if (!packageName || typeof packageName !== "string") {
    throw new Error("Package name must be a non-empty string");
  }

  // Default to scripts/release-config relative to project root
  const defaultConfigDir = path.join(__dirname, "..", "release-config");
  const actualConfigDir = configDir || defaultConfigDir;

  const configPath = path.join(actualConfigDir, `${packageName}.json`);

  // Check if config file exists
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Configuration file not found: ${configPath}. ` +
        `Valid package names are: debugger, screenshot`
    );
  }

  // Read and parse config file
  let configContent;
  try {
    configContent = fs.readFileSync(configPath, "utf8");
  } catch (error) {
    throw new Error(
      `Failed to read configuration file ${configPath}: ${error.message}`
    );
  }

  let config;
  try {
    config = JSON.parse(configContent);
  } catch (error) {
    throw new Error(
      `Failed to parse configuration file ${configPath}: ${error.message}`
    );
  }

  // Validate configuration
  validateConfig(config, configPath);

  // Apply environment variable overrides
  const finalConfig = applyEnvironmentOverrides(config);

  return finalConfig;
}

/**
 * Gets list of available package configurations
 * @param {string} [configDir] - Directory containing config files
 * @returns {string[]} List of available package names
 */
function getAvailablePackages(configDir) {
  const defaultConfigDir = path.join(__dirname, "..", "release-config");
  const actualConfigDir = configDir || defaultConfigDir;

  if (!fs.existsSync(actualConfigDir)) {
    return [];
  }

  const files = fs.readdirSync(actualConfigDir);
  return files
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.basename(file, ".json"));
}

module.exports = {
  loadConfig,
  validateConfig,
  applyEnvironmentOverrides,
  getAvailablePackages,
  REQUIRED_FIELDS,
  ENV_OVERRIDES,
};
