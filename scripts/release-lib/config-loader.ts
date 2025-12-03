/**
 * @fileoverview Configuration loader for release automation
 * Loads submodule-specific configuration files with validation and defaults
 */

import * as fs from "fs";
import * as path from "path";
import { SubmoduleConfig } from "./types";

/**
 * Raw configuration format from JSON files
 * This matches the actual structure in the config files
 */
interface RawSubmoduleConfig {
  packageName: string;
  npmPackageName?: string;
  vscodeExtensionName?: string;
  dockerImageName?: string;
  packageDir: string;
  vscodeExtensionDir?: string;
  buildBinaries: boolean;
  binaryPlatforms?: string[];
  testCommand: string;
  buildCommand: string;
  filesToSync: Array<{
    path: string;
    pattern: string;
    replacement: string;
  }>;
  githubReleaseTemplate?: string;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<RawSubmoduleConfig> = {
  buildBinaries: false,
  testCommand: "npm test",
  buildCommand: "npm run build",
  filesToSync: [],
};

/**
 * Environment variable prefix for configuration overrides
 */
const ENV_PREFIX = "RELEASE_CONFIG_";

/**
 * Configuration loader class
 */
export class ConfigLoader {
  private configDir: string;

  constructor(monorepoRoot: string, configDir?: string) {
    this.configDir =
      configDir || path.join(monorepoRoot, "scripts", "release-config");
  }

  /**
   * Load configuration for a specific submodule
   * @param submoduleName Name of the submodule (e.g., 'debugger', 'screenshot')
   * @returns Validated SubmoduleConfig
   */
  async loadConfig(submoduleName: string): Promise<SubmoduleConfig> {
    const configPath = path.join(this.configDir, `${submoduleName}.json`);

    // Load raw configuration
    let rawConfig: RawSubmoduleConfig;
    try {
      rawConfig = await this.loadRawConfig(configPath);
    } catch (error) {
      // If config file doesn't exist, use defaults
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        rawConfig = this.createDefaultRawConfig(submoduleName);
      } else {
        throw error;
      }
    }

    // Apply defaults
    rawConfig = { ...DEFAULT_CONFIG, ...rawConfig } as RawSubmoduleConfig;

    // Apply environment variable overrides
    rawConfig = this.applyEnvironmentOverrides(rawConfig, submoduleName);

    // Validate configuration
    this.validateConfig(rawConfig, submoduleName);

    // Transform to SubmoduleConfig format
    return this.transformConfig(rawConfig, submoduleName);
  }

  /**
   * Load raw configuration from JSON file
   */
  private async loadRawConfig(configPath: string): Promise<RawSubmoduleConfig> {
    const content = await fs.promises.readFile(configPath, "utf-8");
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Invalid JSON in ${configPath}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Create default configuration for a submodule
   */
  private createDefaultRawConfig(submoduleName: string): RawSubmoduleConfig {
    return {
      packageName: submoduleName,
      npmPackageName: `@ai-capabilities-suite/mcp-${submoduleName}`,
      packageDir: `packages/mcp-${submoduleName}`,
      buildBinaries: false,
      testCommand: `nx test mcp-${submoduleName}`,
      buildCommand: `nx build mcp-${submoduleName}`,
      filesToSync: [
        {
          path: `packages/mcp-${submoduleName}/package.json`,
          pattern: '"version":\\s*"[^"]+"',
          replacement: '"version": "$VERSION"',
        },
      ],
    };
  }

  /**
   * Apply environment variable overrides
   * Environment variables follow the pattern: RELEASE_CONFIG_<SUBMODULE>_<FIELD>
   * Example: RELEASE_CONFIG_DEBUGGER_BUILD_COMMAND
   */
  private applyEnvironmentOverrides(
    config: RawSubmoduleConfig,
    submoduleName: string
  ): RawSubmoduleConfig {
    const prefix = `${ENV_PREFIX}${submoduleName.toUpperCase()}_`;

    // Check for environment variable overrides
    const envBuildCommand = process.env[`${prefix}BUILD_COMMAND`];
    if (envBuildCommand) {
      config.buildCommand = envBuildCommand;
    }

    const envTestCommand = process.env[`${prefix}TEST_COMMAND`];
    if (envTestCommand) {
      config.testCommand = envTestCommand;
    }

    const envPackageDir = process.env[`${prefix}PACKAGE_DIR`];
    if (envPackageDir) {
      config.packageDir = envPackageDir;
    }

    const envNpmPackageName = process.env[`${prefix}NPM_PACKAGE_NAME`];
    if (envNpmPackageName) {
      config.npmPackageName = envNpmPackageName;
    }

    const envDockerImageName = process.env[`${prefix}DOCKER_IMAGE_NAME`];
    if (envDockerImageName) {
      config.dockerImageName = envDockerImageName;
    }

    const envBuildBinaries = process.env[`${prefix}BUILD_BINARIES`];
    if (envBuildBinaries !== undefined) {
      config.buildBinaries = envBuildBinaries === "true";
    }

    return config;
  }

  /**
   * Validate configuration has all required fields
   */
  private validateConfig(
    config: RawSubmoduleConfig,
    submoduleName: string
  ): void {
    const errors: string[] = [];

    // Required fields
    if (!config.packageName) {
      errors.push("packageName is required");
    }
    if (!config.packageDir) {
      errors.push("packageDir is required");
    }
    if (!config.testCommand) {
      errors.push("testCommand is required");
    }
    if (!config.buildCommand) {
      errors.push("buildCommand is required");
    }

    // Validate filesToSync structure
    if (config.filesToSync) {
      if (!Array.isArray(config.filesToSync)) {
        errors.push("filesToSync must be an array");
      } else {
        config.filesToSync.forEach((file, index) => {
          if (!file.path) {
            errors.push(`filesToSync[${index}].path is required`);
          }
          if (!file.pattern) {
            errors.push(`filesToSync[${index}].pattern is required`);
          }
          if (!file.replacement) {
            errors.push(`filesToSync[${index}].replacement is required`);
          }
        });
      }
    }

    // Validate binary platforms if buildBinaries is true
    if (
      config.buildBinaries &&
      (!config.binaryPlatforms || config.binaryPlatforms.length === 0)
    ) {
      errors.push("binaryPlatforms is required when buildBinaries is true");
    }

    if (errors.length > 0) {
      throw new Error(
        `Invalid configuration for ${submoduleName}:\n${errors
          .map((e) => `  - ${e}`)
          .join("\n")}`
      );
    }
  }

  /**
   * Transform raw configuration to SubmoduleConfig format
   */
  private transformConfig(
    rawConfig: RawSubmoduleConfig,
    submoduleName: string
  ): SubmoduleConfig {
    // Extract repository info from package directory
    const repoName = `mcp-${submoduleName}`;
    const repoOwner = "digital-defiance"; // Default, could be configurable

    return {
      name: submoduleName,
      displayName: rawConfig.packageName,
      path: rawConfig.packageDir,
      repository: {
        owner: repoOwner,
        name: repoName,
        url: `https://github.com/${repoOwner}/${repoName}`,
      },
      artifacts: {
        npm: !!rawConfig.npmPackageName,
        docker: !!rawConfig.dockerImageName,
        vscode: !!rawConfig.vscodeExtensionName,
        binaries: rawConfig.buildBinaries,
      },
      build: {
        command: rawConfig.buildCommand,
        testCommand: rawConfig.testCommand,
      },
      publish: {
        npmPackageName: rawConfig.npmPackageName,
        dockerImageName: rawConfig.dockerImageName,
        vscodeExtensionId: rawConfig.vscodeExtensionName,
      },
      versionSync: {
        files: rawConfig.filesToSync.map((file) => ({
          path: file.path,
          pattern: file.pattern,
          replacement: file.replacement,
        })),
      },
    };
  }

  /**
   * List all available submodule configurations
   */
  async listAvailableConfigs(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.configDir);
      return files
        .filter((file) => file.endsWith(".json"))
        .map((file) => path.basename(file, ".json"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
}

/**
 * Create a configuration loader instance
 */
export function createConfigLoader(
  monorepoRoot?: string,
  configDir?: string
): ConfigLoader {
  const root = monorepoRoot || process.cwd();
  return new ConfigLoader(root, configDir);
}
