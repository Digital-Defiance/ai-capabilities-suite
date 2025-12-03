/**
 * @fileoverview Unit tests for version manager
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  VersionManagerImpl,
  createVersionManager,
  isValidSemver,
  validateVersion,
  substituteVersion,
  toRegExp,
  updateFile,
} from "../version-manager";
import { SubmoduleConfig } from "../types";

describe("VersionManager", () => {
  let tempDir: string;
  let versionManager: VersionManagerImpl;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "version-manager-test-"));
    versionManager = new VersionManagerImpl(tempDir);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("isValidSemver", () => {
    it("should validate correct semantic versions", () => {
      expect(isValidSemver("1.0.0")).toBe(true);
      expect(isValidSemver("0.0.1")).toBe(true);
      expect(isValidSemver("10.20.30")).toBe(true);
      expect(isValidSemver("1.2.3-alpha")).toBe(true);
      expect(isValidSemver("1.2.3-alpha.1")).toBe(true);
      expect(isValidSemver("1.2.3+build.123")).toBe(true);
      expect(isValidSemver("1.2.3-beta.1+build.456")).toBe(true);
    });

    it("should reject invalid semantic versions", () => {
      expect(isValidSemver("1.0")).toBe(false);
      expect(isValidSemver("1")).toBe(false);
      expect(isValidSemver("v1.0.0")).toBe(false);
      expect(isValidSemver("1.0.0.0")).toBe(false);
      expect(isValidSemver("")).toBe(false);
      expect(isValidSemver("abc")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isValidSemver(null as any)).toBe(false);
      expect(isValidSemver(undefined as any)).toBe(false);
      expect(isValidSemver(123 as any)).toBe(false);
    });
  });

  describe("validateVersion", () => {
    it("should not throw for valid versions", () => {
      expect(() => validateVersion("1.0.0")).not.toThrow();
      expect(() => validateVersion("2.5.7")).not.toThrow();
      expect(() => validateVersion("0.1.0-beta")).not.toThrow();
    });

    it("should throw for invalid versions", () => {
      expect(() => validateVersion("1.0")).toThrow(/Invalid version format/);
      expect(() => validateVersion("v1.0.0")).toThrow(/Invalid version format/);
      expect(() => validateVersion("")).toThrow(/Invalid version format/);
    });
  });

  describe("substituteVersion", () => {
    it("should replace $VERSION placeholder", () => {
      expect(substituteVersion('"version": "$VERSION"', "1.2.3")).toBe(
        '"version": "1.2.3"'
      );
      expect(substituteVersion("VERSION=$VERSION", "2.0.0")).toBe(
        "VERSION=2.0.0"
      );
    });

    it("should replace multiple occurrences", () => {
      expect(substituteVersion("$VERSION and $VERSION", "1.0.0")).toBe(
        "1.0.0 and 1.0.0"
      );
    });

    it("should handle no placeholder", () => {
      expect(substituteVersion("no placeholder", "1.0.0")).toBe(
        "no placeholder"
      );
    });
  });

  describe("toRegExp", () => {
    it("should convert string to RegExp", () => {
      const regex = toRegExp("test");
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex.test("test")).toBe(true);
    });

    it("should return RegExp as-is", () => {
      const original = /test/;
      const result = toRegExp(original);
      expect(result).toBe(original);
    });

    it("should throw for invalid types", () => {
      expect(() => toRegExp(123 as any)).toThrow(/Invalid pattern type/);
    });
  });

  describe("updateFile", () => {
    it("should update file with pattern replacement", () => {
      const testFile = path.join(tempDir, "test.txt");
      fs.writeFileSync(testFile, 'const VERSION = "1.0.0";');

      const result = updateFile(
        testFile,
        /const VERSION = "[^"]+"/,
        'const VERSION = "$VERSION"',
        "2.0.0"
      );

      expect(result.updated).toBe(true);
      expect(result.error).toBeUndefined();
      expect(fs.readFileSync(testFile, "utf8")).toBe(
        'const VERSION = "2.0.0";'
      );
    });

    it("should return false when no changes needed", () => {
      const testFile = path.join(tempDir, "test.txt");
      fs.writeFileSync(testFile, 'const VERSION = "2.0.0";');

      const result = updateFile(
        testFile,
        /const VERSION = "[^"]+"/,
        'const VERSION = "$VERSION"',
        "2.0.0"
      );

      expect(result.updated).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it("should return error for non-existent file", () => {
      const nonExistentFile = path.join(tempDir, "nonexistent.txt");

      const result = updateFile(
        nonExistentFile,
        /test/,
        "replacement",
        "1.0.0"
      );

      expect(result.updated).toBe(false);
      expect(result.error).toContain("File not found");
    });

    it("should handle string patterns", () => {
      const testFile = path.join(tempDir, "test.json");
      fs.writeFileSync(testFile, '{"version": "1.0.0"}');

      const result = updateFile(
        testFile,
        '"version": "[^"]+"',
        '"version": "$VERSION"',
        "2.0.0"
      );

      expect(result.updated).toBe(true);
      expect(fs.readFileSync(testFile, "utf8")).toBe('{"version": "2.0.0"}');
    });
  });

  describe("bumpVersion", () => {
    it("should bump patch version", async () => {
      // Create a test package
      const packageDir = path.join(tempDir, "test-package");
      fs.mkdirSync(packageDir, { recursive: true });

      const packageJson = {
        name: "test-package",
        version: "1.0.0",
      };

      fs.writeFileSync(
        path.join(packageDir, "package.json"),
        JSON.stringify(packageJson, null, 2)
      );

      const newVersion = await versionManager.bumpVersion(
        "test-package",
        "patch"
      );

      expect(newVersion).toBe("1.0.1");

      // Verify package.json was updated
      const updatedPackageJson = JSON.parse(
        fs.readFileSync(path.join(packageDir, "package.json"), "utf8")
      );
      expect(updatedPackageJson.version).toBe("1.0.1");
    });

    it("should bump minor version", async () => {
      const packageDir = path.join(tempDir, "test-package");
      fs.mkdirSync(packageDir, { recursive: true });

      const packageJson = {
        name: "test-package",
        version: "1.2.3",
      };

      fs.writeFileSync(
        path.join(packageDir, "package.json"),
        JSON.stringify(packageJson, null, 2)
      );

      const newVersion = await versionManager.bumpVersion(
        "test-package",
        "minor"
      );

      expect(newVersion).toBe("1.3.0");

      const updatedPackageJson = JSON.parse(
        fs.readFileSync(path.join(packageDir, "package.json"), "utf8")
      );
      expect(updatedPackageJson.version).toBe("1.3.0");
    });

    it("should bump major version", async () => {
      const packageDir = path.join(tempDir, "test-package");
      fs.mkdirSync(packageDir, { recursive: true });

      const packageJson = {
        name: "test-package",
        version: "1.2.3",
      };

      fs.writeFileSync(
        path.join(packageDir, "package.json"),
        JSON.stringify(packageJson, null, 2)
      );

      const newVersion = await versionManager.bumpVersion(
        "test-package",
        "major"
      );

      expect(newVersion).toBe("2.0.0");

      const updatedPackageJson = JSON.parse(
        fs.readFileSync(path.join(packageDir, "package.json"), "utf8")
      );
      expect(updatedPackageJson.version).toBe("2.0.0");
    });

    it("should throw error if package.json does not exist", async () => {
      await expect(
        versionManager.bumpVersion("nonexistent", "patch")
      ).rejects.toThrow(/package\.json not found/);
    });
  });

  describe("syncVersions", () => {
    it("should sync versions across multiple files", async () => {
      // Create test files
      const file1 = path.join(tempDir, "file1.ts");
      const file2 = path.join(tempDir, "file2.json");

      fs.writeFileSync(file1, 'const VERSION = "1.0.0";');
      fs.writeFileSync(file2, '{"version": "1.0.0"}');

      const config: SubmoduleConfig = {
        name: "test",
        displayName: "Test Package",
        path: "test-package",
        repository: {
          owner: "test",
          name: "test",
          url: "https://github.com/test/test",
        },
        artifacts: {
          npm: true,
          docker: false,
          vscode: false,
          binaries: false,
        },
        build: {
          command: "npm run build",
          testCommand: "npm test",
        },
        publish: {},
        versionSync: {
          files: [
            {
              path: "file1.ts",
              pattern: 'const VERSION = "[^"]+"',
              replacement: 'const VERSION = "$VERSION"',
            },
            {
              path: "file2.json",
              pattern: '"version": "[^"]+"',
              replacement: '"version": "$VERSION"',
            },
          ],
        },
      };

      const result = await versionManager.syncVersions(
        "test-package",
        config,
        "2.0.0"
      );

      expect(result.filesUpdated).toHaveLength(2);
      expect(result.filesUpdated).toContain("file1.ts");
      expect(result.filesUpdated).toContain("file2.json");
      expect(result.errors).toHaveLength(0);

      expect(fs.readFileSync(file1, "utf8")).toBe('const VERSION = "2.0.0";');
      expect(fs.readFileSync(file2, "utf8")).toBe('{"version": "2.0.0"}');
    });

    it("should report errors for missing files", async () => {
      const config: SubmoduleConfig = {
        name: "test",
        displayName: "Test Package",
        path: "test-package",
        repository: {
          owner: "test",
          name: "test",
          url: "https://github.com/test/test",
        },
        artifacts: {
          npm: true,
          docker: false,
          vscode: false,
          binaries: false,
        },
        build: {
          command: "npm run build",
          testCommand: "npm test",
        },
        publish: {},
        versionSync: {
          files: [
            {
              path: "nonexistent.ts",
              pattern: "test",
              replacement: "test",
            },
          ],
        },
      };

      const result = await versionManager.syncVersions(
        "test-package",
        config,
        "2.0.0"
      );

      expect(result.filesUpdated).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("File not found");
    });

    it("should validate version format", async () => {
      const config: SubmoduleConfig = {
        name: "test",
        displayName: "Test Package",
        path: "test-package",
        repository: {
          owner: "test",
          name: "test",
          url: "https://github.com/test/test",
        },
        artifacts: {
          npm: true,
          docker: false,
          vscode: false,
          binaries: false,
        },
        build: {
          command: "npm run build",
          testCommand: "npm test",
        },
        publish: {},
        versionSync: {
          files: [],
        },
      };

      await expect(
        versionManager.syncVersions("test-package", config, "invalid")
      ).rejects.toThrow(/Invalid version format/);
    });
  });

  describe("verifyVersions", () => {
    it("should return true when all files have correct version", async () => {
      const file1 = path.join(tempDir, "file1.ts");
      const file2 = path.join(tempDir, "file2.json");

      fs.writeFileSync(file1, 'const VERSION = "2.0.0";');
      fs.writeFileSync(file2, '{"version": "2.0.0"}');

      const config: SubmoduleConfig = {
        name: "test",
        displayName: "Test Package",
        path: "test-package",
        repository: {
          owner: "test",
          name: "test",
          url: "https://github.com/test/test",
        },
        artifacts: {
          npm: true,
          docker: false,
          vscode: false,
          binaries: false,
        },
        build: {
          command: "npm run build",
          testCommand: "npm test",
        },
        publish: {},
        versionSync: {
          files: [
            {
              path: "file1.ts",
              pattern: 'const VERSION = "[^"]+"',
              replacement: 'const VERSION = "$VERSION"',
            },
            {
              path: "file2.json",
              pattern: '"version": "[^"]+"',
              replacement: '"version": "$VERSION"',
            },
          ],
        },
      };

      const result = await versionManager.verifyVersions(
        "test-package",
        config,
        "2.0.0"
      );

      expect(result).toBe(true);
    });

    it("should return false when a file has incorrect version", async () => {
      const file1 = path.join(tempDir, "file1.ts");
      const file2 = path.join(tempDir, "file2.json");

      fs.writeFileSync(file1, 'const VERSION = "2.0.0";');
      fs.writeFileSync(file2, '{"version": "1.0.0"}'); // Wrong version

      const config: SubmoduleConfig = {
        name: "test",
        displayName: "Test Package",
        path: "test-package",
        repository: {
          owner: "test",
          name: "test",
          url: "https://github.com/test/test",
        },
        artifacts: {
          npm: true,
          docker: false,
          vscode: false,
          binaries: false,
        },
        build: {
          command: "npm run build",
          testCommand: "npm test",
        },
        publish: {},
        versionSync: {
          files: [
            {
              path: "file1.ts",
              pattern: 'const VERSION = "[^"]+"',
              replacement: 'const VERSION = "$VERSION"',
            },
            {
              path: "file2.json",
              pattern: '"version": "[^"]+"',
              replacement: '"version": "$VERSION"',
            },
          ],
        },
      };

      const result = await versionManager.verifyVersions(
        "test-package",
        config,
        "2.0.0"
      );

      expect(result).toBe(false);
    });

    it("should return false when a file does not exist", async () => {
      const config: SubmoduleConfig = {
        name: "test",
        displayName: "Test Package",
        path: "test-package",
        repository: {
          owner: "test",
          name: "test",
          url: "https://github.com/test/test",
        },
        artifacts: {
          npm: true,
          docker: false,
          vscode: false,
          binaries: false,
        },
        build: {
          command: "npm run build",
          testCommand: "npm test",
        },
        publish: {},
        versionSync: {
          files: [
            {
              path: "nonexistent.ts",
              pattern: "test",
              replacement: "test",
            },
          ],
        },
      };

      const result = await versionManager.verifyVersions(
        "test-package",
        config,
        "2.0.0"
      );

      expect(result).toBe(false);
    });
  });

  describe("createVersionManager", () => {
    it("should create a VersionManager instance", () => {
      const manager = createVersionManager();
      expect(manager).toBeDefined();
      expect(manager.bumpVersion).toBeDefined();
      expect(manager.syncVersions).toBeDefined();
      expect(manager.verifyVersions).toBeDefined();
    });

    it("should create a VersionManager with custom monorepo root", () => {
      const manager = createVersionManager("/custom/root");
      expect(manager).toBeDefined();
    });
  });

  describe("pattern matching behavior", () => {
    it("should match version patterns in TypeScript files", async () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(testFile, 'export const VERSION = "1.0.0";');

      const result = updateFile(
        testFile,
        /export const VERSION = "[^"]+"/,
        'export const VERSION = "$VERSION"',
        "2.0.0"
      );

      expect(result.updated).toBe(true);
      expect(fs.readFileSync(testFile, "utf8")).toBe(
        'export const VERSION = "2.0.0";'
      );
    });

    it("should match version patterns in JSON files", async () => {
      const testFile = path.join(tempDir, "package.json");
      fs.writeFileSync(testFile, '{\n  "version": "1.0.0"\n}');

      const result = updateFile(
        testFile,
        /"version": "[^"]+"/,
        '"version": "$VERSION"',
        "2.0.0"
      );

      expect(result.updated).toBe(true);
      expect(fs.readFileSync(testFile, "utf8")).toBe(
        '{\n  "version": "2.0.0"\n}'
      );
    });

    it("should match version patterns in Dockerfiles", async () => {
      const testFile = path.join(tempDir, "Dockerfile");
      fs.writeFileSync(
        testFile,
        'LABEL org.opencontainers.image.version="1.0.0"'
      );

      const result = updateFile(
        testFile,
        /org\.opencontainers\.image\.version="[^"]+"/,
        'org.opencontainers.image.version="$VERSION"',
        "2.0.0"
      );

      expect(result.updated).toBe(true);
      expect(fs.readFileSync(testFile, "utf8")).toBe(
        'LABEL org.opencontainers.image.version="2.0.0"'
      );
    });
  });
});
