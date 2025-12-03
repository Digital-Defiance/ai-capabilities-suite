/**
 * @fileoverview Version manager for release automation
 * Handles version bumping and synchronization across all files in submodules
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { SubmoduleConfig, VersionManager, SyncResult } from "./types";

/**
 * Validates that a version string follows semantic versioning format
 * @param version - Version string to validate
 * @returns True if version is valid semver
 */
export function isValidSemver(version: string): boolean {
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
 * @param version - Version string to validate
 * @throws Error if version is not valid semver
 */
export function validateVersion(version: string): void {
  if (!isValidSemver(version)) {
    throw new Error(
      `Invalid version format: "${version}". Must be valid semantic version (e.g., 1.0.0, 2.1.3-beta.1)`
    );
  }
}

/**
 * Replaces $VERSION placeholder in replacement string with actual version
 * @param replacement - Replacement string with $VERSION placeholder
 * @param version - Version to substitute
 * @returns Replacement string with version substituted
 */
export function substituteVersion(
  replacement: string,
  version: string
): string {
  return replacement.replace(/\$VERSION/g, version);
}

/**
 * Converts pattern string to RegExp if it's not already
 * @param pattern - Pattern to convert
 * @returns Regular expression
 */
export function toRegExp(pattern: string | RegExp): RegExp {
  if (pattern instanceof RegExp) {
    return pattern;
  }

  // If pattern is a string, convert it to RegExp
  if (typeof pattern === "string") {
    return new RegExp(pattern);
  }

  throw new Error(`Invalid pattern type: ${typeof pattern}`);
}

/**
 * Updates a single file with version replacement
 * @param filePath - Path to file to update
 * @param pattern - Pattern to match
 * @param replacement - Replacement string (with $VERSION placeholder)
 * @param version - Version to use
 * @returns Result of update
 */
export function updateFile(
  filePath: string,
  pattern: string | RegExp,
  replacement: string,
  version: string
): { updated: boolean; error?: string } {
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
      error: (error as Error).message,
    };
  }
}

/**
 * Version manager implementation
 */
export class VersionManagerImpl implements VersionManager {
  private monorepoRoot: string;

  constructor(monorepoRoot?: string) {
    this.monorepoRoot = monorepoRoot || process.cwd();
  }

  /**
   * Bump version in package.json using npm version command
   * @param submodulePath - Path to submodule directory (relative to monorepo root)
   * @param bumpType - Type of version bump
   * @returns New version string
   */
  async bumpVersion(
    submodulePath: string,
    bumpType: "patch" | "minor" | "major"
  ): Promise<string> {
    const fullPath = path.join(this.monorepoRoot, submodulePath);

    // Verify package.json exists
    const packageJsonPath = path.join(fullPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(
        `package.json not found in ${submodulePath}. Cannot bump version.`
      );
    }

    try {
      // Execute npm version command in submodule directory
      // --no-git-tag-version prevents npm from creating a git tag
      const output = execSync(`npm version ${bumpType} --no-git-tag-version`, {
        cwd: fullPath,
        encoding: "utf8",
      });

      // npm version returns the new version with a 'v' prefix (e.g., 'v1.2.3')
      // Strip the 'v' prefix and any whitespace
      const newVersion = output.trim().replace(/^v/, "");

      // Validate the new version
      validateVersion(newVersion);

      return newVersion;
    } catch (error) {
      throw new Error(
        `Failed to bump version in ${submodulePath}: ${
          (error as Error).message
        }`
      );
    }
  }

  /**
   * Sync version across all configured files
   * @param submodulePath - Path to submodule directory (relative to monorepo root) - currently unused but kept for interface compatibility
   * @param config - Submodule configuration
   * @param version - Target version
   * @returns Result of synchronization
   */
  async syncVersions(
    submodulePath: string,
    config: SubmoduleConfig,
    version: string
  ): Promise<SyncResult> {
    // Note: submodulePath is kept for interface compatibility but not currently used
    // File paths in config are already relative to monorepo root
    void submodulePath;

    // Validate version format
    validateVersion(version);

    const filesUpdated: string[] = [];
    const errors: string[] = [];

    // Process each file in the sync list
    for (const fileConfig of config.versionSync.files) {
      // File paths in config are relative to monorepo root
      const filePath = path.join(this.monorepoRoot, fileConfig.path);
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
   * Verify that all configured files contain the target version
   * @param submodulePath - Path to submodule directory (relative to monorepo root) - currently unused but kept for interface compatibility
   * @param config - Submodule configuration
   * @param version - Version to verify
   * @returns True if all files contain the version
   */
  async verifyVersions(
    submodulePath: string,
    config: SubmoduleConfig,
    version: string
  ): Promise<boolean> {
    // Note: submodulePath is kept for interface compatibility but not currently used
    // File paths in config are already relative to monorepo root
    void submodulePath;

    // Validate version format
    validateVersion(version);

    // Check each file
    for (const fileConfig of config.versionSync.files) {
      const filePath = path.join(this.monorepoRoot, fileConfig.path);

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
}

/**
 * Create a version manager instance
 * @param monorepoRoot - Root directory of the monorepo
 * @returns VersionManager instance
 */
export function createVersionManager(monorepoRoot?: string): VersionManager {
  return new VersionManagerImpl(monorepoRoot);
}
