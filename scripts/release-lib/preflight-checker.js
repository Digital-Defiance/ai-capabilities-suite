/**
 * @fileoverview Pre-flight checker for release automation
 * Validates environment before starting a release
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * @typedef {import('./types').ReleaseConfig} ReleaseConfig
 * @typedef {import('./types').ReleaseOptions} ReleaseOptions
 * @typedef {import('./types').PreflightResult} PreflightResult
 * @typedef {import('./types').CheckResult} CheckResult
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
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

/**
 * Checks if Git working directory is clean
 * @returns {Promise<CheckResult>} Check result
 */
async function checkGitStatus() {
  try {
    const status = execCommand("git status --porcelain");

    if (status.length > 0) {
      return {
        name: "Git Status",
        passed: false,
        message:
          "Working directory has uncommitted changes. Please commit or stash changes before releasing.",
      };
    }

    return {
      name: "Git Status",
      passed: true,
      message: "Working directory is clean",
    };
  } catch (error) {
    return {
      name: "Git Status",
      passed: false,
      message: `Failed to check Git status: ${error.message}`,
    };
  }
}

/**
 * Checks if current branch is main
 * @returns {Promise<CheckResult>} Check result
 */
async function checkBranch() {
  try {
    const branch = execCommand("git rev-parse --abbrev-ref HEAD");

    if (branch !== "main" && branch !== "master") {
      return {
        name: "Branch Check",
        passed: false,
        message: `Current branch is "${branch}". Releases must be made from main/master branch.`,
      };
    }

    return {
      name: "Branch Check",
      passed: true,
      message: `On ${branch} branch`,
    };
  } catch (error) {
    return {
      name: "Branch Check",
      passed: false,
      message: `Failed to check current branch: ${error.message}`,
    };
  }
}

/**
 * Checks if local branch is up-to-date with remote
 * @returns {Promise<CheckResult>} Check result
 */
async function checkRemoteSync() {
  try {
    // Fetch latest from remote
    execCommand("git fetch origin");

    const localCommit = execCommand("git rev-parse HEAD");
    const remoteCommit = execCommand("git rev-parse @{u}");

    if (localCommit !== remoteCommit) {
      return {
        name: "Remote Sync",
        passed: false,
        message:
          "Local branch is not in sync with remote. Please pull or push changes.",
      };
    }

    return {
      name: "Remote Sync",
      passed: true,
      message: "Local branch is up-to-date with remote",
    };
  } catch (error) {
    return {
      name: "Remote Sync",
      passed: false,
      message: `Failed to check remote sync: ${error.message}`,
    };
  }
}

/**
 * Checks if tests pass for the package
 * @param {ReleaseConfig} config - Package configuration
 * @returns {Promise<CheckResult>} Check result
 */
async function checkTests(config) {
  try {
    const projectRoot = path.join(__dirname, "..", "..");
    execCommand(config.testCommand, { cwd: projectRoot });

    return {
      name: "Tests",
      passed: true,
      message: "All tests passed",
    };
  } catch (error) {
    return {
      name: "Tests",
      passed: false,
      message: `Tests failed: ${error.message}`,
    };
  }
}

/**
 * Checks if build succeeds for the package
 * @param {ReleaseConfig} config - Package configuration
 * @returns {Promise<CheckResult>} Check result
 */
async function checkBuild(config) {
  try {
    const projectRoot = path.join(__dirname, "..", "..");
    execCommand(config.buildCommand, { cwd: projectRoot });

    return {
      name: "Build",
      passed: true,
      message: "Build completed successfully",
    };
  } catch (error) {
    return {
      name: "Build",
      passed: false,
      message: `Build failed: ${error.message}`,
    };
  }
}

/**
 * Checks if NPM authentication is configured
 * @returns {Promise<CheckResult>} Check result
 */
async function checkNpmAuth() {
  try {
    // Check if user is logged in to npm
    execCommand("npm whoami");

    return {
      name: "NPM Authentication",
      passed: true,
      message: "NPM authentication is configured",
    };
  } catch (error) {
    return {
      name: "NPM Authentication",
      passed: false,
      message:
        "NPM authentication not configured. Run 'npm login' to authenticate.",
    };
  }
}

/**
 * Checks if VSCode marketplace token is available
 * @returns {Promise<CheckResult>} Check result
 */
async function checkVscodeToken() {
  const token = process.env.VSCE_PAT || process.env.VSCODE_MARKETPLACE_TOKEN;

  if (!token) {
    return {
      name: "VSCode Marketplace Token",
      passed: false,
      message:
        "VSCode marketplace token not found. Set VSCE_PAT or VSCODE_MARKETPLACE_TOKEN environment variable.",
    };
  }

  return {
    name: "VSCode Marketplace Token",
    passed: true,
    message: "VSCode marketplace token is configured",
  };
}

/**
 * Checks if Docker authentication is configured
 * @returns {Promise<CheckResult>} Check result
 */
async function checkDockerAuth() {
  try {
    // Check if docker is installed and user is logged in
    execCommand("docker info");

    // Try to verify authentication by checking config
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const dockerConfigPath = path.join(homeDir, ".docker", "config.json");

    if (!fs.existsSync(dockerConfigPath)) {
      return {
        name: "Docker Authentication",
        passed: false,
        message:
          "Docker authentication not configured. Run 'docker login' to authenticate.",
      };
    }

    return {
      name: "Docker Authentication",
      passed: true,
      message: "Docker authentication is configured",
    };
  } catch (error) {
    return {
      name: "Docker Authentication",
      passed: false,
      message: `Docker check failed: ${error.message}`,
    };
  }
}

/**
 * Checks if GitHub token is available
 * @returns {Promise<CheckResult>} Check result
 */
async function checkGithubToken() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

  if (!token) {
    return {
      name: "GitHub Token",
      passed: false,
      message:
        "GitHub token not found. Set GITHUB_TOKEN or GH_TOKEN environment variable.",
    };
  }

  return {
    name: "GitHub Token",
    passed: true,
    message: "GitHub token is configured",
  };
}

/**
 * Runs all pre-flight checks
 * @param {ReleaseConfig} config - Package configuration
 * @param {ReleaseOptions} options - Release options
 * @returns {Promise<PreflightResult>} Pre-flight check results
 */
async function runChecks(config, options) {
  const checks = [];

  // Always run Git checks
  checks.push(await checkGitStatus());
  checks.push(await checkBranch());
  checks.push(await checkRemoteSync());

  // Run tests unless skipped
  if (!options.skipTests) {
    checks.push(await checkTests(config));
  }

  // Run build unless skipped
  if (!options.skipBuild) {
    checks.push(await checkBuild(config));
  }

  // Check credentials (skip in dry-run mode)
  if (!options.dryRun) {
    checks.push(await checkNpmAuth());
    checks.push(await checkVscodeToken());
    checks.push(await checkGithubToken());

    // Check Docker auth only if Docker publishing is enabled
    if (options.includeDocker) {
      checks.push(await checkDockerAuth());
    }
  }

  // Determine if all checks passed
  const passed = checks.every((check) => check.passed);

  return {
    passed,
    checks,
  };
}

module.exports = {
  runChecks,
  checkGitStatus,
  checkBranch,
  checkRemoteSync,
  checkTests,
  checkBuild,
  checkNpmAuth,
  checkVscodeToken,
  checkDockerAuth,
  checkGithubToken,
};
