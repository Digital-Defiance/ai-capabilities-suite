/**
 * @fileoverview Unit tests for configuration loader
 */

const fs = require("fs");
const path = require("path");
const {
  loadConfig,
  validateConfig,
  applyEnvironmentOverrides,
  getAvailablePackages,
  REQUIRED_FIELDS,
  ENV_OVERRIDES,
} = require("../config-loader");

describe("config-loader", () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original env vars
    process.env = { ...originalEnv };
  });

  describe("validateConfig", () => {
    it("should pass validation for valid configuration", () => {
      const validConfig = {
        packageName: "test-package",
        npmPackageName: "@test/package",
        vscodeExtensionName: "test-extension",
        dockerImageName: "test/image",
        packageDir: "packages/test",
        vscodeExtensionDir: "packages/vscode-test",
        buildBinaries: false,
        testCommand: "npm test",
        buildCommand: "npm run build",
        filesToSync: [
          {
            path: "package.json",
            pattern: '"version":\\s*"[^"]+"',
            replacement: '"version": "$VERSION"',
          },
        ],
        githubReleaseTemplate: "Release $VERSION",
      };

      expect(() => validateConfig(validConfig, "test.json")).not.toThrow();
    });

    it("should fail validation for non-object config", () => {
      expect(() => validateConfig(null, "test.json")).toThrow(
        "Configuration at test.json is not a valid object"
      );
      expect(() => validateConfig("string", "test.json")).toThrow(
        "Configuration at test.json is not a valid object"
      );
      expect(() => validateConfig(123, "test.json")).toThrow(
        "Configuration at test.json is not a valid object"
      );
    });

    it("should fail validation for missing required fields", () => {
      const incompleteConfig = {
        packageName: "test-package",
        npmPackageName: "@test/package",
        // Missing other required fields
      };

      expect(() => validateConfig(incompleteConfig, "test.json")).toThrow(
        /missing required fields/
      );
    });

    it("should fail validation for empty packageName", () => {
      const config = {
        packageName: "",
        npmPackageName: "@test/package",
        vscodeExtensionName: "test-extension",
        dockerImageName: "test/image",
        packageDir: "packages/test",
        vscodeExtensionDir: "packages/vscode-test",
        buildBinaries: false,
        testCommand: "npm test",
        buildCommand: "npm run build",
        filesToSync: [],
        githubReleaseTemplate: "Release $VERSION",
      };

      expect(() => validateConfig(config, "test.json")).toThrow(
        "packageName must be a non-empty string"
      );
    });

    it("should fail validation for non-boolean buildBinaries", () => {
      const config = {
        packageName: "test-package",
        npmPackageName: "@test/package",
        vscodeExtensionName: "test-extension",
        dockerImageName: "test/image",
        packageDir: "packages/test",
        vscodeExtensionDir: "packages/vscode-test",
        buildBinaries: "true", // Should be boolean
        testCommand: "npm test",
        buildCommand: "npm run build",
        filesToSync: [],
        githubReleaseTemplate: "Release $VERSION",
      };

      expect(() => validateConfig(config, "test.json")).toThrow(
        "buildBinaries must be a boolean"
      );
    });

    it("should fail validation when buildBinaries is true but binaryPlatforms is missing", () => {
      const config = {
        packageName: "test-package",
        npmPackageName: "@test/package",
        vscodeExtensionName: "test-extension",
        dockerImageName: "test/image",
        packageDir: "packages/test",
        vscodeExtensionDir: "packages/vscode-test",
        buildBinaries: true,
        // Missing binaryPlatforms
        testCommand: "npm test",
        buildCommand: "npm run build",
        filesToSync: [],
        githubReleaseTemplate: "Release $VERSION",
      };

      expect(() => validateConfig(config, "test.json")).toThrow(
        "binaryPlatforms must be a non-empty array when buildBinaries is true"
      );
    });

    it("should fail validation when buildBinaries is true but binaryPlatforms is empty", () => {
      const config = {
        packageName: "test-package",
        npmPackageName: "@test/package",
        vscodeExtensionName: "test-extension",
        dockerImageName: "test/image",
        packageDir: "packages/test",
        vscodeExtensionDir: "packages/vscode-test",
        buildBinaries: true,
        binaryPlatforms: [],
        testCommand: "npm test",
        buildCommand: "npm run build",
        filesToSync: [],
        githubReleaseTemplate: "Release $VERSION",
      };

      expect(() => validateConfig(config, "test.json")).toThrow(
        "binaryPlatforms must be a non-empty array when buildBinaries is true"
      );
    });

    it("should fail validation for non-array filesToSync", () => {
      const config = {
        packageName: "test-package",
        npmPackageName: "@test/package",
        vscodeExtensionName: "test-extension",
        dockerImageName: "test/image",
        packageDir: "packages/test",
        vscodeExtensionDir: "packages/vscode-test",
        buildBinaries: false,
        testCommand: "npm test",
        buildCommand: "npm run build",
        filesToSync: "not-an-array",
        githubReleaseTemplate: "Release $VERSION",
      };

      expect(() => validateConfig(config, "test.json")).toThrow(
        "filesToSync must be an array"
      );
    });

    it("should fail validation for invalid filesToSync entries", () => {
      const config = {
        packageName: "test-package",
        npmPackageName: "@test/package",
        vscodeExtensionName: "test-extension",
        dockerImageName: "test/image",
        packageDir: "packages/test",
        vscodeExtensionDir: "packages/vscode-test",
        buildBinaries: false,
        testCommand: "npm test",
        buildCommand: "npm run build",
        filesToSync: [
          {
            // Missing path
            pattern: "test",
            replacement: "test",
          },
        ],
        githubReleaseTemplate: "Release $VERSION",
      };

      expect(() => validateConfig(config, "test.json")).toThrow(
        "filesToSync[0].path must be a non-empty string"
      );
    });

    it("should fail validation for empty string fields", () => {
      const config = {
        packageName: "test-package",
        npmPackageName: "",
        vscodeExtensionName: "test-extension",
        dockerImageName: "test/image",
        packageDir: "packages/test",
        vscodeExtensionDir: "packages/vscode-test",
        buildBinaries: false,
        testCommand: "npm test",
        buildCommand: "npm run build",
        filesToSync: [],
        githubReleaseTemplate: "Release $VERSION",
      };

      expect(() => validateConfig(config, "test.json")).toThrow(
        "npmPackageName must be a non-empty string"
      );
    });
  });

  describe("applyEnvironmentOverrides", () => {
    it("should return config unchanged when no env vars are set", () => {
      const config = {
        npmPackageName: "@test/package",
        dockerImageName: "test/image",
        testCommand: "npm test",
        buildCommand: "npm run build",
      };

      const result = applyEnvironmentOverrides(config);

      expect(result).toEqual(config);
      expect(result).not.toBe(config); // Should be a new object
    });

    it("should override npmPackageName from environment variable", () => {
      const config = {
        npmPackageName: "@test/package",
        dockerImageName: "test/image",
        testCommand: "npm test",
        buildCommand: "npm run build",
      };

      process.env.RELEASE_NPM_PACKAGE_NAME = "@override/package";

      const result = applyEnvironmentOverrides(config);

      expect(result.npmPackageName).toBe("@override/package");
      expect(result.dockerImageName).toBe("test/image");
    });

    it("should override dockerImageName from environment variable", () => {
      const config = {
        npmPackageName: "@test/package",
        dockerImageName: "test/image",
        testCommand: "npm test",
        buildCommand: "npm run build",
      };

      process.env.RELEASE_DOCKER_IMAGE_NAME = "override/image";

      const result = applyEnvironmentOverrides(config);

      expect(result.dockerImageName).toBe("override/image");
      expect(result.npmPackageName).toBe("@test/package");
    });

    it("should override testCommand from environment variable", () => {
      const config = {
        npmPackageName: "@test/package",
        dockerImageName: "test/image",
        testCommand: "npm test",
        buildCommand: "npm run build",
      };

      process.env.RELEASE_TEST_COMMAND = "yarn test";

      const result = applyEnvironmentOverrides(config);

      expect(result.testCommand).toBe("yarn test");
    });

    it("should override buildCommand from environment variable", () => {
      const config = {
        npmPackageName: "@test/package",
        dockerImageName: "test/image",
        testCommand: "npm test",
        buildCommand: "npm run build",
      };

      process.env.RELEASE_BUILD_COMMAND = "yarn build";

      const result = applyEnvironmentOverrides(config);

      expect(result.buildCommand).toBe("yarn build");
    });

    it("should override multiple fields from environment variables", () => {
      const config = {
        npmPackageName: "@test/package",
        dockerImageName: "test/image",
        testCommand: "npm test",
        buildCommand: "npm run build",
      };

      process.env.RELEASE_NPM_PACKAGE_NAME = "@override/package";
      process.env.RELEASE_DOCKER_IMAGE_NAME = "override/image";
      process.env.RELEASE_TEST_COMMAND = "yarn test";
      process.env.RELEASE_BUILD_COMMAND = "yarn build";

      const result = applyEnvironmentOverrides(config);

      expect(result.npmPackageName).toBe("@override/package");
      expect(result.dockerImageName).toBe("override/image");
      expect(result.testCommand).toBe("yarn test");
      expect(result.buildCommand).toBe("yarn build");
    });
  });

  describe("loadConfig", () => {
    it("should load valid debugger configuration", () => {
      const config = loadConfig("debugger");

      expect(config).toBeDefined();
      expect(config.packageName).toBe("debugger");
      expect(config.npmPackageName).toBe(
        "@ai-capabilities-suite/mcp-debugger-server"
      );
      expect(config.buildBinaries).toBe(true);
      expect(Array.isArray(config.binaryPlatforms)).toBe(true);
      expect(config.binaryPlatforms.length).toBeGreaterThan(0);
    });

    it("should load valid screenshot configuration", () => {
      const config = loadConfig("screenshot");

      expect(config).toBeDefined();
      expect(config.packageName).toBe("screenshot");
      expect(config.npmPackageName).toBe(
        "@ai-capabilities-suite/mcp-screenshot"
      );
      expect(config.buildBinaries).toBe(false);
    });

    it("should throw error for invalid package name", () => {
      expect(() => loadConfig("")).toThrow(
        "Package name must be a non-empty string"
      );
      expect(() => loadConfig(null)).toThrow(
        "Package name must be a non-empty string"
      );
      expect(() => loadConfig(undefined)).toThrow(
        "Package name must be a non-empty string"
      );
    });

    it("should throw error for non-existent package", () => {
      expect(() => loadConfig("nonexistent")).toThrow(
        /Configuration file not found/
      );
    });

    it("should apply environment overrides when loading config", () => {
      process.env.RELEASE_NPM_PACKAGE_NAME = "@override/debugger";

      const config = loadConfig("debugger");

      expect(config.npmPackageName).toBe("@override/debugger");
    });

    it("should use custom config directory when provided", () => {
      // Create a temporary config directory
      const tempDir = path.join(__dirname, "temp-config");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const testConfig = {
        packageName: "custom",
        npmPackageName: "@custom/package",
        vscodeExtensionName: "custom-extension",
        dockerImageName: "custom/image",
        packageDir: "packages/custom",
        vscodeExtensionDir: "packages/vscode-custom",
        buildBinaries: false,
        testCommand: "npm test",
        buildCommand: "npm run build",
        filesToSync: [],
        githubReleaseTemplate: "Release $VERSION",
      };

      fs.writeFileSync(
        path.join(tempDir, "custom.json"),
        JSON.stringify(testConfig, null, 2)
      );

      try {
        const config = loadConfig("custom", tempDir);
        expect(config.packageName).toBe("custom");
        expect(config.npmPackageName).toBe("@custom/package");
      } finally {
        // Cleanup
        fs.unlinkSync(path.join(tempDir, "custom.json"));
        fs.rmdirSync(tempDir);
      }
    });
  });

  describe("getAvailablePackages", () => {
    it("should return list of available packages", () => {
      const packages = getAvailablePackages();

      expect(Array.isArray(packages)).toBe(true);
      expect(packages).toContain("debugger");
      expect(packages).toContain("screenshot");
    });

    it("should return empty array for non-existent directory", () => {
      const packages = getAvailablePackages("/nonexistent/path");

      expect(packages).toEqual([]);
    });

    it("should only return .json files", () => {
      const tempDir = path.join(__dirname, "temp-config-2");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Create test files
      fs.writeFileSync(path.join(tempDir, "test1.json"), "{}");
      fs.writeFileSync(path.join(tempDir, "test2.json"), "{}");
      fs.writeFileSync(path.join(tempDir, "readme.md"), "# README");
      fs.writeFileSync(path.join(tempDir, "script.js"), 'console.log("test")');

      try {
        const packages = getAvailablePackages(tempDir);

        expect(packages).toEqual(["test1", "test2"]);
        expect(packages).not.toContain("readme");
        expect(packages).not.toContain("script");
      } finally {
        // Cleanup
        fs.unlinkSync(path.join(tempDir, "test1.json"));
        fs.unlinkSync(path.join(tempDir, "test2.json"));
        fs.unlinkSync(path.join(tempDir, "readme.md"));
        fs.unlinkSync(path.join(tempDir, "script.js"));
        fs.rmdirSync(tempDir);
      }
    });
  });

  describe("REQUIRED_FIELDS constant", () => {
    it("should contain all expected required fields", () => {
      const expectedFields = [
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

      expect(REQUIRED_FIELDS).toEqual(expectedFields);
    });
  });

  describe("ENV_OVERRIDES constant", () => {
    it("should contain all expected environment variable mappings", () => {
      const expectedOverrides = {
        npmPackageName: "RELEASE_NPM_PACKAGE_NAME",
        dockerImageName: "RELEASE_DOCKER_IMAGE_NAME",
        testCommand: "RELEASE_TEST_COMMAND",
        buildCommand: "RELEASE_BUILD_COMMAND",
      };

      expect(ENV_OVERRIDES).toEqual(expectedOverrides);
    });
  });
});
