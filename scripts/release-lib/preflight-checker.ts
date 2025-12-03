/**
 * @fileoverview Pre-flight checker for release automation
 * Validates environment before starting a release
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import {
  PreflightChecker,
  PreflightResult,
  CheckResult,
  SubmoduleConfig,
  ReleaseOptions,
} from "./types";

/**
 * Executes a shell command and returns the output
 * @param command - Command to execute
 * @param options - Execution options
 * @returns Command output
 * @throws Error if command fails
 */
function execCommand(command: string, options: { cwd?: string } = {}): string {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      ...options,
    }).trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${(error as Error).message}`);
  }
}

/**
 * Checks if Git working directory is clean in submodule
 * @param submodulePath - Path to submodule directory
 * @returns Check result
 */
async function checkGitStatus(submodulePath: string): Promise<CheckResult> {
  try {
    const status = execCommand("git status --porcelain", {
      cwd: submodulePath,
    });

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
      message: `Failed to check Git status: ${(error as Error).message}`,
    };
  }
}

/**
 * Checks if current branch is main in submodule
 * @param submodulePath - Path to submodule directory
 * @returns Check result
 */
async function checkBranch(submodulePath: string): Promise<CheckResult> {
  try {
    const branch = execCommand("git rev-parse --abbrev-ref HEAD", {
      cwd: submodulePath,
    });

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
      message: `Failed to check current branch: ${(error as Error).message}`,
    };
  }
}

/**
 * Checks if tests pass for the submodule
 * @param _submodulePath - Path to submodule directory (unused, tests run from monorepo root)
 * @param config - Submodule configuration
 * @returns Check result
 */
async function checkTests(
  _submodulePath: string,
  config: SubmoduleConfig
): Promise<CheckResult> {
  try {
    // Get monorepo root (two levels up from release-lib)
    const monorepoRoot = path.join(__dirname, "..", "..");
    execCommand(config.build.testCommand, { cwd: monorepoRoot });

    return {
      name: "Tests",
      passed: true,
      message: "All tests passed",
    };
  } catch (error) {
    return {
      name: "Tests",
      passed: false,
      message: `Tests failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Checks if build succeeds for the submodule
 * @param _submodulePath - Path to submodule directory (unused, builds run from monorepo root)
 * @param config - Submodule configuration
 * @returns Check result
 */
async function checkBuild(
  _submodulePath: string,
  config: SubmoduleConfig
): Promise<CheckResult> {
  try {
    // Get monorepo root (two levels up from release-lib)
    const monorepoRoot = path.join(__dirname, "..", "..");
    execCommand(config.build.command, { cwd: monorepoRoot });

    return {
      name: "Build",
      passed: true,
      message: "Build completed successfully",
    };
  } catch (error) {
    return {
      name: "Build",
      passed: false,
      message: `Build failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Checks if NPM authentication is configured
 * @returns Check result
 */
async function checkNpmAuth(): Promise<CheckResult> {
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
 * @returns Check result
 */
async function checkVscodeToken(): Promise<CheckResult> {
  const token =
    process.env["VSCE_PAT"] || process.env["VSCODE_MARKETPLACE_TOKEN"];

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
 * @returns Check result
 */
async function checkDockerAuth(): Promise<CheckResult> {
  try {
    // Check if docker is installed and running
    execCommand("docker info");

    // Try to verify authentication by checking config
    const homeDir = process.env["HOME"] || process.env["USERPROFILE"];
    if (!homeDir) {
      return {
        name: "Docker Authentication",
        passed: false,
        message: "Could not determine home directory",
      };
    }

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
      message: `Docker check failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Checks if GitHub token is available
 * @returns Check result
 */
async function checkGithubToken(): Promise<CheckResult> {
  const token = process.env["GITHUB_TOKEN"] || process.env["GH_TOKEN"];

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
 * Pre-flight checker implementation
 */
export class PreflightCheckerImpl implements PreflightChecker {
  /**
   * Runs all pre-flight checks for a submodule
   * @param submodulePath - Path to submodule directory
   * @param config - Submodule configuration
   * @param options - Release options
   * @returns Pre-flight check results
   */
  async runChecks(
    submodulePath: string,
    config: SubmoduleConfig,
    options?: Partial<ReleaseOptions>
  ): Promise<PreflightResult> {
    const checks: CheckResult[] = [];

    // Always run Git checks in submodule
    checks.push(await checkGitStatus(submodulePath));
    checks.push(await checkBranch(submodulePath));

    // Run tests unless skipped
    if (!options?.skipTests) {
      checks.push(await checkTests(submodulePath, config));
    }

    // Run build unless skipped
    if (!options?.skipBuild) {
      checks.push(await checkBuild(submodulePath, config));
    }

    // Check credentials for local mode (skip in dry-run mode)
    if (!options?.dryRun) {
      // Check NPM auth if NPM artifact is enabled
      if (config.artifacts.npm) {
        checks.push(await checkNpmAuth());
      }

      // Check VSCode token if VSCode artifact is enabled
      if (config.artifacts.vscode) {
        checks.push(await checkVscodeToken());
      }

      // Check GitHub token (always needed for releases)
      checks.push(await checkGithubToken());

      // Check Docker auth only if Docker publishing is enabled
      if (options?.includeDocker || config.artifacts.docker) {
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
}

/**
 * Create a pre-flight checker instance
 */
export function createPreflightChecker(): PreflightChecker {
  return new PreflightCheckerImpl();
}

// Export individual check functions for testing
export {
  checkGitStatus,
  checkBranch,
  checkTests,
  checkBuild,
  checkNpmAuth,
  checkVscodeToken,
  checkDockerAuth,
  checkGithubToken,
};
