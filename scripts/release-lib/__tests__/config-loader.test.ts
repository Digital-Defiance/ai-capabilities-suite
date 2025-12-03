/**
 * @fileoverview Unit tests for configuration loader
 */

import * as fs from "fs";
import * as path from "path";
import { ConfigLoader, createConfigLoader } from "../config-loader";

describe("ConfigLoader", () => {
  const testMonorepoRoot = path.join(__dirname, "..", "..", "..");

  // Store original env vars
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original env vars
    process.env = { ...originalEnv };
  });

  describe("loadConfig", () => {
    it("should load valid debugger configuration", async () => {
      const loader = new ConfigLoader(testMonorepoRoot);
      const config = await loader.loadConfig("debugger");

      expect(config).toBeDefined();
      expect(config.name).toBe("debugger");
      expect(config.displayName).toBe("debugger");
      expect(config.publish.npmPackageName).toBe(
        "@ai-capabilities-suite/mcp-debugger-server"
      );
      expect(config.artifacts.binaries).toBe(true);
      expect(config.artifacts.npm).toBe(true);
      expect(config.build.testCommand).toBe("nx test mcp-debugger-server");
      expect(config.build.command).toBe("nx build mcp-debugger-server");
    });

    it("should load valid screenshot configuration", async () => {
      const loader = new ConfigLoader(testMonorepoRoot);
      const config = await loader.loadConfig("screenshot");

      expect(config).toBeDefined();
      expect(config.name).toBe("screenshot");
      expect(config.displayName).toBe("screenshot");
      expect(config.publish.npmPackageName).toBe(
        "@ai-capabilities-suite/mcp-screenshot"
      );
      expect(config.artifacts.binaries).toBe(false);
      expect(config.artifacts.npm).toBe(true);
    });

    it("should load valid process configuration", async () => {
      const loader = new ConfigLoader(testMonorepoRoot);
      const config = await loader.loadConfig("process");

      expect(config).toBeDefined();
      expect(config.name).toBe("process");
      expect(config.displayName).toBe("process");
      expect(config.publish.npmPackageName).toBe(
        "@ai-capabilities-suite/mcp-process"
      );
      expect(config.artifacts.binaries).toBe(false);
    });

    it("should use default configuration for non-existent package", async () => {
      const loader = new ConfigLoader(testMonorepoRoot);
      const config = await loader.loadConfig("nonexistent");

      expect(config).toBeDefined();
      expect(config.name).toBe("nonexistent");
      expect(config.displayName).toBe("nonexistent");
      expect(config.publish.npmPackageName).toBe(
        "@ai-capabilities-suite/mcp-nonexistent"
      );
      expect(config.path).toBe("packages/mcp-nonexistent");
      expect(config.build.testCommand).toBe("nx test mcp-nonexistent");
      expect(config.build.command).toBe("nx build mcp-nonexistent");
      expect(config.artifacts.binaries).toBe(false);
      expect(config.versionSync.files).toHaveLength(1);
    });

    it("should apply environment variable overrides", async () => {
      process.env["RELEASE_CONFIG_DEBUGGER_BUILD_COMMAND"] =
        "yarn build:custom";
      process.env["RELEASE_CONFIG_DEBUGGER_TEST_COMMAND"] = "yarn test:custom";
      process.env["RELEASE_CONFIG_DEBUGGER_NPM_PACKAGE_NAME"] =
        "@custom/debugger";

      const loader = new ConfigLoader(testMonorepoRoot);
      const config = await loader.loadConfig("debugger");

      expect(config.build.command).toBe("yarn build:custom");
      expect(config.build.testCommand).toBe("yarn test:custom");
      expect(config.publish.npmPackageName).toBe("@custom/debugger");
    });

    it("should override docker image name from environment", async () => {
      process.env["RELEASE_CONFIG_SCREENSHOT_DOCKER_IMAGE_NAME"] =
        "custom/screenshot";

      const loader = new ConfigLoader(testMonorepoRoot);
      const config = await loader.loadConfig("screenshot");

      expect(config.publish.dockerImageName).toBe("custom/screenshot");
    });

    it("should override buildBinaries from environment", async () => {
      // Note: This test expects validation to fail because process.json doesn't have binaryPlatforms
      // When buildBinaries is set to true via env var, binaryPlatforms is still required
      process.env["RELEASE_CONFIG_PROCESS_BUILD_BINARIES"] = "true";

      const loader = new ConfigLoader(testMonorepoRoot);

      // Should throw because binaryPlatforms is required when buildBinaries is true
      await expect(loader.loadConfig("process")).rejects.toThrow(
        /binaryPlatforms/
      );
    });

    it("should handle buildBinaries=false from environment", async () => {
      process.env["RELEASE_CONFIG_DEBUGGER_BUILD_BINARIES"] = "false";

      const loader = new ConfigLoader(testMonorepoRoot);
      const config = await loader.loadConfig("debugger");

      expect(config.artifacts.binaries).toBe(false);
    });

    it("should throw error for invalid JSON in config file", async () => {
      const tempDir = path.join(__dirname, "temp-config-invalid");
      await fs.promises.mkdir(tempDir, { recursive: true });

      const invalidJsonPath = path.join(tempDir, "invalid.json");
      await fs.promises.writeFile(invalidJsonPath, "{ invalid json }");

      try {
        const loader = new ConfigLoader(testMonorepoRoot, tempDir);
        await expect(loader.loadConfig("invalid")).rejects.toThrow(
          /Invalid JSON/
        );
      } finally {
        await fs.promises.unlink(invalidJsonPath);
        await fs.promises.rmdir(tempDir);
      }
    });
  });

  describe("validation", () => {
    it("should fail validation for missing required fields", async () => {
      const tempDir = path.join(__dirname, "temp-config-validation");
      await fs.promises.mkdir(tempDir, { recursive: true });

      const incompleteConfig = {
        packageName: "test",
        // Missing other required fields
      };

      const configPath = path.join(tempDir, "incomplete.json");
      await fs.promises.writeFile(configPath, JSON.stringify(incompleteConfig));

      try {
        const loader = new ConfigLoader(testMonorepoRoot, tempDir);
        await expect(loader.loadConfig("incomplete")).rejects.toThrow(
          /Invalid configuration/
        );
      } finally {
        await fs.promises.unlink(configPath);
        await fs.promises.rmdir(tempDir);
      }
    });

    it("should fail validation for invalid filesToSync structure", async () => {
      const tempDir = path.join(__dirname, "temp-config-files");
      await fs.promises.mkdir(tempDir, { recursive: true });

      const invalidConfig = {
        packageName: "test",
        packageDir: "packages/test",
        testCommand: "npm test",
        buildCommand: "npm run build",
        buildBinaries: false,
        filesToSync: [
          {
            // Missing path
            pattern: "test",
            replacement: "test",
          },
        ],
      };

      const configPath = path.join(tempDir, "invalid-files.json");
      await fs.promises.writeFile(configPath, JSON.stringify(invalidConfig));

      try {
        const loader = new ConfigLoader(testMonorepoRoot, tempDir);
        await expect(loader.loadConfig("invalid-files")).rejects.toThrow(
          /filesToSync/
        );
      } finally {
        await fs.promises.unlink(configPath);
        await fs.promises.rmdir(tempDir);
      }
    });

    it("should fail validation when buildBinaries is true but binaryPlatforms is missing", async () => {
      const tempDir = path.join(__dirname, "temp-config-binaries");
      await fs.promises.mkdir(tempDir, { recursive: true });

      const invalidConfig = {
        packageName: "test",
        packageDir: "packages/test",
        testCommand: "npm test",
        buildCommand: "npm run build",
        buildBinaries: true,
        // Missing binaryPlatforms
        filesToSync: [],
      };

      const configPath = path.join(tempDir, "no-platforms.json");
      await fs.promises.writeFile(configPath, JSON.stringify(invalidConfig));

      try {
        const loader = new ConfigLoader(testMonorepoRoot, tempDir);
        await expect(loader.loadConfig("no-platforms")).rejects.toThrow(
          /binaryPlatforms/
        );
      } finally {
        await fs.promises.unlink(configPath);
        await fs.promises.rmdir(tempDir);
      }
    });

    it("should fail validation for non-array filesToSync", async () => {
      const tempDir = path.join(__dirname, "temp-config-array");
      await fs.promises.mkdir(tempDir, { recursive: true });

      const invalidConfig = {
        packageName: "test",
        packageDir: "packages/test",
        testCommand: "npm test",
        buildCommand: "npm run build",
        buildBinaries: false,
        filesToSync: "not-an-array",
      };

      const configPath = path.join(tempDir, "not-array.json");
      await fs.promises.writeFile(configPath, JSON.stringify(invalidConfig));

      try {
        const loader = new ConfigLoader(testMonorepoRoot, tempDir);
        await expect(loader.loadConfig("not-array")).rejects.toThrow(
          /filesToSync must be an array/
        );
      } finally {
        await fs.promises.unlink(configPath);
        await fs.promises.rmdir(tempDir);
      }
    });
  });

  describe("listAvailableConfigs", () => {
    it("should return list of available configurations", async () => {
      const loader = new ConfigLoader(testMonorepoRoot);
      const configs = await loader.listAvailableConfigs();

      expect(Array.isArray(configs)).toBe(true);
      expect(configs).toContain("debugger");
      expect(configs).toContain("screenshot");
      expect(configs).toContain("process");
      expect(configs).toContain("defaults");
    });

    it("should return empty array for non-existent directory", async () => {
      const loader = new ConfigLoader(testMonorepoRoot, "/nonexistent/path");
      const configs = await loader.listAvailableConfigs();

      expect(configs).toEqual([]);
    });

    it("should only return .json files", async () => {
      const tempDir = path.join(__dirname, "temp-config-list");
      await fs.promises.mkdir(tempDir, { recursive: true });

      // Create test files
      await fs.promises.writeFile(path.join(tempDir, "test1.json"), "{}");
      await fs.promises.writeFile(path.join(tempDir, "test2.json"), "{}");
      await fs.promises.writeFile(path.join(tempDir, "readme.md"), "# README");
      await fs.promises.writeFile(
        path.join(tempDir, "script.js"),
        'console.log("test")'
      );

      try {
        const loader = new ConfigLoader(testMonorepoRoot, tempDir);
        const configs = await loader.listAvailableConfigs();

        expect(configs).toEqual(["test1", "test2"]);
        expect(configs).not.toContain("readme");
        expect(configs).not.toContain("script");
      } finally {
        // Cleanup
        await fs.promises.unlink(path.join(tempDir, "test1.json"));
        await fs.promises.unlink(path.join(tempDir, "test2.json"));
        await fs.promises.unlink(path.join(tempDir, "readme.md"));
        await fs.promises.unlink(path.join(tempDir, "script.js"));
        await fs.promises.rmdir(tempDir);
      }
    });
  });

  describe("createConfigLoader", () => {
    it("should create a ConfigLoader instance with default monorepo root", () => {
      const loader = createConfigLoader();
      expect(loader).toBeInstanceOf(ConfigLoader);
    });

    it("should create a ConfigLoader instance with custom monorepo root", () => {
      const loader = createConfigLoader("/custom/root");
      expect(loader).toBeInstanceOf(ConfigLoader);
    });

    it("should create a ConfigLoader instance with custom config directory", () => {
      const loader = createConfigLoader("/custom/root", "/custom/config");
      expect(loader).toBeInstanceOf(ConfigLoader);
    });
  });

  describe("configuration transformation", () => {
    it("should correctly transform raw config to SubmoduleConfig format", async () => {
      const loader = new ConfigLoader(testMonorepoRoot);
      const config = await loader.loadConfig("debugger");

      // Check structure matches SubmoduleConfig interface
      expect(config).toHaveProperty("name");
      expect(config).toHaveProperty("displayName");
      expect(config).toHaveProperty("path");
      expect(config).toHaveProperty("repository");
      expect(config).toHaveProperty("artifacts");
      expect(config).toHaveProperty("build");
      expect(config).toHaveProperty("publish");
      expect(config).toHaveProperty("versionSync");

      // Check repository structure
      expect(config.repository).toHaveProperty("owner");
      expect(config.repository).toHaveProperty("name");
      expect(config.repository).toHaveProperty("url");

      // Check artifacts structure
      expect(config.artifacts).toHaveProperty("npm");
      expect(config.artifacts).toHaveProperty("docker");
      expect(config.artifacts).toHaveProperty("vscode");
      expect(config.artifacts).toHaveProperty("binaries");

      // Check build structure
      expect(config.build).toHaveProperty("command");
      expect(config.build).toHaveProperty("testCommand");

      // Check versionSync structure
      expect(config.versionSync).toHaveProperty("files");
      expect(Array.isArray(config.versionSync.files)).toBe(true);
    });

    it("should set artifact flags based on presence of package names", async () => {
      const loader = new ConfigLoader(testMonorepoRoot);
      const config = await loader.loadConfig("debugger");

      // Debugger has npm, docker, and vscode
      expect(config.artifacts.npm).toBe(true);
      expect(config.artifacts.docker).toBe(true);
      expect(config.artifacts.vscode).toBe(true);
      expect(config.artifacts.binaries).toBe(true);
    });

    it("should correctly map filesToSync entries", async () => {
      const loader = new ConfigLoader(testMonorepoRoot);
      const config = await loader.loadConfig("debugger");

      expect(config.versionSync.files.length).toBeGreaterThan(0);
      config.versionSync.files.forEach((file) => {
        expect(file).toHaveProperty("path");
        expect(file).toHaveProperty("pattern");
        expect(file).toHaveProperty("replacement");
        expect(typeof file.path).toBe("string");
        expect(typeof file.pattern).toBe("string");
        expect(typeof file.replacement).toBe("string");
      });
    });
  });
});
