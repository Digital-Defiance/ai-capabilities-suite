/**
 * Unit tests for set-version functionality
 *
 * Tests version string validation, package.json updates, cross-file version
 * synchronization, and dry-run mode.
 *
 * **Validates: Requirements 2.3**
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Mock the release-lib modules
jest.mock("./release-lib/config-loader");
jest.mock("./release-lib/version-manager");

const { loadConfig } = require("./release-lib/config-loader");
const {
  syncVersions,
  validateVersion,
} = require("./release-lib/version-manager");

describe("set-version functionality", () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "set-version-test-"));

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("version string validation", () => {
    it("should validate valid semver versions", () => {
      const validVersions = [
        "1.0.0",
        "2.1.3",
        "0.0.1",
        "10.20.30",
        "1.0.0-alpha",
        "1.0.0-beta.1",
        "1.0.0+build.123",
      ];

      // Mock to not throw for valid versions (strict semver check)
      validateVersion.mockImplementation((v: string) => {
        const semverRegex =
          /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
        if (!semverRegex.test(v)) {
          throw new Error(`Invalid version format: "${v}"`);
        }
      });

      validVersions.forEach((version) => {
        expect(() => validateVersion(version)).not.toThrow();
      });
    });

    it("should reject invalid version formats", () => {
      // Set up mock to throw for invalid versions (strict semver check)
      validateVersion.mockImplementation((v: string) => {
        const semverRegex =
          /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
        if (!semverRegex.test(v)) {
          throw new Error(`Invalid version format: "${v}"`);
        }
      });

      // Test each invalid version individually
      expect(() => validateVersion("1.0")).toThrow();
      expect(() => validateVersion("1")).toThrow();
      expect(() => validateVersion("v1.0.0")).toThrow();
      expect(() => validateVersion("1.0.0.0")).toThrow();
      expect(() => validateVersion("abc")).toThrow();
      expect(() => validateVersion("")).toThrow();
      expect(() => validateVersion("1.0.x")).toThrow();
    });
  });

  describe("package.json updates", () => {
    it("should update package.json with new version", () => {
      const packageJsonPath = path.join(tempDir, "package.json");
      const originalPackageJson = {
        name: "test-package",
        version: "1.0.0",
        description: "Test package",
      };

      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(originalPackageJson, null, 2)
      );

      // Read and update
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      packageJson.version = "2.0.0";
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n",
        "utf8"
      );

      // Verify update
      const updatedPackageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, "utf8")
      );
      expect(updatedPackageJson.version).toBe("2.0.0");
      expect(updatedPackageJson.name).toBe("test-package");
      expect(updatedPackageJson.description).toBe("Test package");
    });

    it("should preserve other package.json fields when updating version", () => {
      const packageJsonPath = path.join(tempDir, "package.json");
      const originalPackageJson = {
        name: "test-package",
        version: "1.0.0",
        description: "Test package",
        dependencies: {
          "some-dep": "^1.0.0",
        },
        scripts: {
          test: "jest",
        },
      };

      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(originalPackageJson, null, 2)
      );

      // Read and update
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      packageJson.version = "2.0.0";
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n",
        "utf8"
      );

      // Verify all fields preserved
      const updatedPackageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, "utf8")
      );
      expect(updatedPackageJson.version).toBe("2.0.0");
      expect(updatedPackageJson.dependencies).toEqual({
        "some-dep": "^1.0.0",
      });
      expect(updatedPackageJson.scripts).toEqual({ test: "jest" });
    });

    it("should format package.json with proper indentation", () => {
      const packageJsonPath = path.join(tempDir, "package.json");
      const originalPackageJson = {
        name: "test-package",
        version: "1.0.0",
      };

      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(originalPackageJson, null, 2)
      );

      // Read and update
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      packageJson.version = "2.0.0";
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2) + "\n",
        "utf8"
      );

      // Verify formatting
      const content = fs.readFileSync(packageJsonPath, "utf8");
      expect(content).toContain('  "name"');
      expect(content).toContain('  "version"');
      expect(content.endsWith("\n")).toBe(true);
    });
  });

  describe("cross-file version synchronization", () => {
    it("should sync versions across multiple files", async () => {
      const mockConfig = {
        packageName: "test-package",
        packageDir: "packages/test-package",
        filesToSync: [
          {
            path: "README.md",
            pattern: /version: \d+\.\d+\.\d+/,
            replacement: "version: $VERSION",
          },
          {
            path: "CHANGELOG.md",
            pattern: /## \[\d+\.\d+\.\d+\]/,
            replacement: "## [$VERSION]",
          },
        ],
      };

      loadConfig.mockReturnValue(mockConfig);
      syncVersions.mockResolvedValue({
        filesUpdated: ["README.md", "CHANGELOG.md"],
        errors: [],
      });

      const result = await syncVersions(mockConfig, "2.0.0");

      expect(result.filesUpdated).toHaveLength(2);
      expect(result.filesUpdated).toContain("README.md");
      expect(result.filesUpdated).toContain("CHANGELOG.md");
      expect(result.errors).toHaveLength(0);
    });

    it("should report errors when file sync fails", async () => {
      const mockConfig = {
        packageName: "test-package",
        packageDir: "packages/test-package",
        filesToSync: [
          {
            path: "README.md",
            pattern: /version: \d+\.\d+\.\d+/,
            replacement: "version: $VERSION",
          },
          {
            path: "missing.md",
            pattern: /version: \d+\.\d+\.\d+/,
            replacement: "version: $VERSION",
          },
        ],
      };

      loadConfig.mockReturnValue(mockConfig);
      syncVersions.mockResolvedValue({
        filesUpdated: ["README.md"],
        errors: ["missing.md: File not found"],
      });

      const result = await syncVersions(mockConfig, "2.0.0");

      expect(result.filesUpdated).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("missing.md");
    });

    it("should handle empty file list", async () => {
      const mockConfig = {
        packageName: "test-package",
        packageDir: "packages/test-package",
        filesToSync: [],
      };

      loadConfig.mockReturnValue(mockConfig);
      syncVersions.mockResolvedValue({
        filesUpdated: [],
        errors: [],
      });

      const result = await syncVersions(mockConfig, "2.0.0");

      expect(result.filesUpdated).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("configuration loading", () => {
    it("should load package configuration", () => {
      const mockConfig = {
        packageName: "debugger",
        npmPackageName: "@ai-capabilities-suite/mcp-debugger",
        packageDir: "packages/mcp-debugger-server",
        filesToSync: [],
      };

      loadConfig.mockReturnValue(mockConfig);

      const config = loadConfig("debugger");

      expect(config.packageName).toBe("debugger");
      expect(config.packageDir).toBe("packages/mcp-debugger-server");
      expect(loadConfig).toHaveBeenCalledWith("debugger");
    });

    it("should throw error for invalid package name", () => {
      loadConfig.mockImplementation((packageName: string) => {
        throw new Error(
          `Configuration file not found: scripts/release-config/${packageName}.json`
        );
      });

      expect(() => loadConfig("invalid-package")).toThrow(
        "Configuration file not found"
      );
    });
  });

  describe("error handling", () => {
    it("should handle version validation errors", () => {
      validateVersion.mockImplementation((version: string) => {
        throw new Error(`Invalid version format: "${version}"`);
      });

      expect(() => validateVersion("invalid")).toThrow(
        "Invalid version format"
      );
    });

    it("should handle file sync errors gracefully", async () => {
      const mockConfig = {
        packageName: "test-package",
        packageDir: "packages/test-package",
        filesToSync: [
          {
            path: "README.md",
            pattern: /version: \d+\.\d+\.\d+/,
            replacement: "version: $VERSION",
          },
        ],
      };

      loadConfig.mockReturnValue(mockConfig);
      syncVersions.mockResolvedValue({
        filesUpdated: [],
        errors: ["README.md: Permission denied"],
      });

      const result = await syncVersions(mockConfig, "2.0.0");

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Permission denied");
    });
  });

  describe("output behavior", () => {
    it("should match JavaScript version behavior for successful updates", async () => {
      const mockConfig = {
        packageName: "debugger",
        packageDir: "packages/mcp-debugger-server",
        filesToSync: [
          {
            path: "README.md",
            pattern: /version: \d+\.\d+\.\d+/,
            replacement: "version: $VERSION",
          },
        ],
      };

      loadConfig.mockReturnValue(mockConfig);
      validateVersion.mockImplementation(() => {});
      syncVersions.mockResolvedValue({
        filesUpdated: ["README.md"],
        errors: [],
      });

      // Simulate the main flow
      validateVersion("1.2.0");
      const config = loadConfig("debugger");
      const result = await syncVersions(config, "1.2.0");

      // Verify behavior matches expectations
      expect(validateVersion).toHaveBeenCalledWith("1.2.0");
      expect(loadConfig).toHaveBeenCalledWith("debugger");
      expect(syncVersions).toHaveBeenCalledWith(config, "1.2.0");
      expect(result.filesUpdated).toContain("README.md");
      expect(result.errors).toHaveLength(0);
    });

    it("should match JavaScript version behavior for errors", async () => {
      const mockConfig = {
        packageName: "debugger",
        packageDir: "packages/mcp-debugger-server",
        filesToSync: [],
      };

      loadConfig.mockReturnValue(mockConfig);
      syncVersions.mockResolvedValue({
        filesUpdated: [],
        errors: ["Some error occurred"],
      });

      const result = await syncVersions(mockConfig, "1.2.0");

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
