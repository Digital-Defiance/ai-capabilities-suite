/**
 * @fileoverview Integration tests for set-version command
 * Tests the full version setting workflow
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { loadConfig } = require("../config-loader");
const { syncVersions, validateVersion } = require("../version-manager");

describe("set-version integration", () => {
  const projectRoot = path.join(__dirname, "..", "..", "..");

  describe("version validation", () => {
    it("should validate correct semver versions", () => {
      expect(() => validateVersion("1.0.0")).not.toThrow();
      expect(() => validateVersion("2.3.4-beta.1")).not.toThrow();
      expect(() => validateVersion("1.0.0+build.123")).not.toThrow();
    });

    it("should reject invalid versions", () => {
      expect(() => validateVersion("invalid")).toThrow(
        /Invalid version format/
      );
      expect(() => validateVersion("1.0")).toThrow(/Invalid version format/);
      expect(() => validateVersion("v1.0.0")).toThrow(/Invalid version format/);
    });
  });

  describe("configuration loading", () => {
    it("should load debugger configuration", () => {
      const config = loadConfig("debugger");

      expect(config.packageName).toBe("debugger");
      expect(config.npmPackageName).toBe(
        "@ai-capabilities-suite/mcp-debugger-server"
      );
      expect(config.packageDir).toBe("packages/mcp-debugger-server");
      expect(config.buildBinaries).toBe(true);
      expect(Array.isArray(config.filesToSync)).toBe(true);
      expect(config.filesToSync.length).toBeGreaterThan(0);
    });

    it("should load screenshot configuration", () => {
      const config = loadConfig("screenshot");

      expect(config.packageName).toBe("screenshot");
      expect(config.npmPackageName).toBe(
        "@ai-capabilities-suite/mcp-screenshot"
      );
      expect(config.packageDir).toBe("packages/mcp-screenshot");
      expect(config.buildBinaries).toBe(false);
      expect(Array.isArray(config.filesToSync)).toBe(true);
      expect(config.filesToSync.length).toBeGreaterThan(0);
    });

    it("should fail for invalid package name", () => {
      expect(() => loadConfig("nonexistent")).toThrow(
        /Configuration file not found/
      );
    });
  });

  describe("version sync workflow", () => {
    it("should sync versions for debugger package", async () => {
      const config = loadConfig("debugger");
      const testVersion = "99.99.99";

      const packageJsonPath = path.join(
        projectRoot,
        config.packageDir,
        "package.json"
      );
      const originalContent = fs.readFileSync(packageJsonPath, "utf8");
      const originalPackageJson = JSON.parse(originalContent);
      const originalVersion = originalPackageJson.version;

      try {
        const syncResult = await syncVersions(config, testVersion);

        expect(syncResult.filesUpdated.length).toBeGreaterThan(0);
        expect(syncResult.errors).toHaveLength(0);
      } finally {
        await syncVersions(config, originalVersion);
      }
    });

    it("should handle version sync errors gracefully", async () => {
      const config = {
        filesToSync: [
          {
            path: "nonexistent/file.json",
            pattern: '"version":\\s*"[^"]+"',
            replacement: '"version": "$VERSION"',
          },
        ],
      };

      const syncResult = await syncVersions(config, "1.0.0");

      expect(syncResult.filesUpdated).toHaveLength(0);
      expect(syncResult.errors.length).toBeGreaterThan(0);
      expect(syncResult.errors[0]).toContain("File not found");
    });
  });

  describe("end-to-end workflow simulation", () => {
    it("should complete full workflow without committing", async () => {
      const packageName = "debugger";
      const testVersion = "66.66.66";

      expect(() => validateVersion(testVersion)).not.toThrow();

      const config = loadConfig(packageName);
      expect(config).toBeDefined();
      expect(config.packageName).toBe(packageName);

      const packageJsonPath = path.join(
        projectRoot,
        config.packageDir,
        "package.json"
      );
      expect(fs.existsSync(packageJsonPath)).toBe(true);

      const originalContent = fs.readFileSync(packageJsonPath, "utf8");
      const originalPackageJson = JSON.parse(originalContent);
      const originalVersion = originalPackageJson.version;

      try {
        originalPackageJson.version = testVersion;
        fs.writeFileSync(
          packageJsonPath,
          JSON.stringify(originalPackageJson, null, 2) + "\n",
          "utf8"
        );

        const syncResult = await syncVersions(config, testVersion);
        expect(syncResult.errors).toHaveLength(0);
        expect(syncResult.filesUpdated.length).toBeGreaterThan(0);

        const status = execSync("git status --porcelain", {
          cwd: projectRoot,
          encoding: "utf8",
        });
        expect(status.trim().length).toBeGreaterThan(0);
      } finally {
        fs.writeFileSync(packageJsonPath, originalContent, "utf8");
        await syncVersions(config, originalVersion);
        execSync("git checkout .", { cwd: projectRoot, stdio: "ignore" });
      }
    });
  });
});
