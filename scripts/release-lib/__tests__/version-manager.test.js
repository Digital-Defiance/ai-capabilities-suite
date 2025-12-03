/**
 * @fileoverview Unit tests for version manager
 */

const fs = require("fs");
const path = require("path");
const {
  syncVersions,
  verifyVersions,
  validateVersion,
  isValidSemver,
  substituteVersion,
  toRegExp,
  updateFile,
} = require("../version-manager");

describe("version-manager", () => {
  describe("isValidSemver", () => {
    it("should validate correct semver versions", () => {
      expect(isValidSemver("1.0.0")).toBe(true);
      expect(isValidSemver("0.0.1")).toBe(true);
      expect(isValidSemver("10.20.30")).toBe(true);
      expect(isValidSemver("1.2.3-alpha")).toBe(true);
      expect(isValidSemver("1.2.3-alpha.1")).toBe(true);
      expect(isValidSemver("1.2.3-beta.2")).toBe(true);
      expect(isValidSemver("1.2.3+build.123")).toBe(true);
      expect(isValidSemver("1.2.3-alpha.1+build.123")).toBe(true);
    });

    it("should reject invalid semver versions", () => {
      expect(isValidSemver("")).toBe(false);
      expect(isValidSemver("1")).toBe(false);
      expect(isValidSemver("1.0")).toBe(false);
      expect(isValidSemver("v1.0.0")).toBe(false);
      expect(isValidSemver("1.0.0.0")).toBe(false);
      expect(isValidSemver("a.b.c")).toBe(false);
      expect(isValidSemver("1.0.0-")).toBe(false);
      expect(isValidSemver("1.0.0+")).toBe(false);
      expect(isValidSemver(null)).toBe(false);
      expect(isValidSemver(undefined)).toBe(false);
      expect(isValidSemver(123)).toBe(false);
    });
  });

  describe("validateVersion", () => {
    it("should not throw for valid versions", () => {
      expect(() => validateVersion("1.0.0")).not.toThrow();
      expect(() => validateVersion("2.3.4-beta.1")).not.toThrow();
    });

    it("should throw for invalid versions", () => {
      expect(() => validateVersion("")).toThrow(/Invalid version format/);
      expect(() => validateVersion("1.0")).toThrow(/Invalid version format/);
      expect(() => validateVersion("v1.0.0")).toThrow(/Invalid version format/);
      expect(() => validateVersion("invalid")).toThrow(
        /Invalid version format/
      );
    });
  });

  describe("substituteVersion", () => {
    it("should replace $VERSION placeholder with actual version", () => {
      expect(substituteVersion('"version": "$VERSION"', "1.0.0")).toBe(
        '"version": "1.0.0"'
      );
      expect(substituteVersion("v$VERSION", "2.3.4")).toBe("v2.3.4");
      expect(substituteVersion("Release $VERSION", "1.2.3-beta")).toBe(
        "Release 1.2.3-beta"
      );
    });

    it("should replace multiple $VERSION placeholders", () => {
      expect(
        substituteVersion("$VERSION is the version $VERSION", "1.0.0")
      ).toBe("1.0.0 is the version 1.0.0");
    });

    it("should handle strings without $VERSION placeholder", () => {
      expect(substituteVersion("no placeholder", "1.0.0")).toBe(
        "no placeholder"
      );
    });
  });

  describe("toRegExp", () => {
    it("should return RegExp unchanged", () => {
      const regex = /test/;
      expect(toRegExp(regex)).toBe(regex);
    });

    it("should convert string to RegExp", () => {
      const result = toRegExp("test");
      expect(result).toBeInstanceOf(RegExp);
      expect(result.test("test")).toBe(true);
    });

    it("should convert regex string to RegExp", () => {
      const result = toRegExp('"version":\\s*"[^"]+"');
      expect(result).toBeInstanceOf(RegExp);
      expect(result.test('"version": "1.0.0"')).toBe(true);
    });

    it("should throw for invalid pattern types", () => {
      expect(() => toRegExp(123)).toThrow(/Invalid pattern type/);
      expect(() => toRegExp(null)).toThrow(/Invalid pattern type/);
      expect(() => toRegExp(undefined)).toThrow(/Invalid pattern type/);
    });
  });

  describe("updateFile", () => {
    const tempDir = path.join(__dirname, "temp-version-test");

    beforeEach(() => {
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        files.forEach((file) => {
          fs.unlinkSync(path.join(tempDir, file));
        });
        fs.rmdirSync(tempDir);
      }
    });

    it("should update file with version replacement", () => {
      const filePath = path.join(tempDir, "test.json");
      const content = '{"version": "0.0.0"}';
      fs.writeFileSync(filePath, content, "utf8");

      const result = updateFile(
        filePath,
        '"version":\\s*"[^"]+"',
        '"version": "$VERSION"',
        "1.0.0"
      );

      expect(result.updated).toBe(true);
      expect(result.error).toBeUndefined();

      const newContent = fs.readFileSync(filePath, "utf8");
      expect(newContent).toBe('{"version": "1.0.0"}');
    });

    it("should return false when file does not exist", () => {
      const filePath = path.join(tempDir, "nonexistent.json");

      const result = updateFile(
        filePath,
        '"version":\\s*"[^"]+"',
        '"version": "$VERSION"',
        "1.0.0"
      );

      expect(result.updated).toBe(false);
      expect(result.error).toContain("File not found");
    });

    it("should return false when no changes are needed", () => {
      const filePath = path.join(tempDir, "test.json");
      const content = '{"version": "1.0.0"}';
      fs.writeFileSync(filePath, content, "utf8");

      const result = updateFile(
        filePath,
        '"version":\\s*"[^"]+"',
        '"version": "$VERSION"',
        "1.0.0"
      );

      expect(result.updated).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it("should handle RegExp patterns", () => {
      const filePath = path.join(tempDir, "test.txt");
      const content = "VERSION=0.0.0";
      fs.writeFileSync(filePath, content, "utf8");

      const result = updateFile(
        filePath,
        /VERSION=[0-9]+\.[0-9]+\.[0-9]+/,
        "VERSION=$VERSION",
        "2.3.4"
      );

      expect(result.updated).toBe(true);

      const newContent = fs.readFileSync(filePath, "utf8");
      expect(newContent).toBe("VERSION=2.3.4");
    });

    it("should handle multiple replacements with global flag", () => {
      const filePath = path.join(tempDir, "test.txt");
      const content = "v1.0.0 and v1.0.0";
      fs.writeFileSync(filePath, content, "utf8");

      const result = updateFile(
        filePath,
        /v[0-9]+\.[0-9]+\.[0-9]+/g,
        "v$VERSION",
        "2.0.0"
      );

      expect(result.updated).toBe(true);

      const newContent = fs.readFileSync(filePath, "utf8");
      expect(newContent).toBe("v2.0.0 and v2.0.0");
    });
  });

  describe("syncVersions", () => {
    const tempDir = path.join(__dirname, "temp-sync-test");
    const projectRoot = path.join(__dirname, "..", "..");

    beforeEach(() => {
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        files.forEach((file) => {
          fs.unlinkSync(path.join(tempDir, file));
        });
        fs.rmdirSync(tempDir);
      }
    });

    it("should throw for invalid version", async () => {
      const config = {
        filesToSync: [],
      };

      await expect(syncVersions(config, "invalid")).rejects.toThrow(
        /Invalid version format/
      );
    });

    it("should sync versions across multiple files", async () => {
      // Create test files
      const file1 = path.join(tempDir, "file1.json");
      const file2 = path.join(tempDir, "file2.txt");

      fs.writeFileSync(file1, '{"version": "0.0.0"}', "utf8");
      fs.writeFileSync(file2, "VERSION=0.0.0", "utf8");

      // The version-manager calculates project root as two levels up from its location
      // which is scripts/release-lib, so project root is the actual repo root
      // We need to use paths relative to that
      const versionManagerProjectRoot = path.join(__dirname, "..", "..", "..");
      const relPath1 = path.relative(versionManagerProjectRoot, file1);
      const relPath2 = path.relative(versionManagerProjectRoot, file2);

      const config = {
        filesToSync: [
          {
            path: relPath1,
            pattern: '"version":\\s*"[^"]+"',
            replacement: '"version": "$VERSION"',
          },
          {
            path: relPath2,
            pattern: "VERSION=[0-9]+\\.[0-9]+\\.[0-9]+",
            replacement: "VERSION=$VERSION",
          },
        ],
      };

      const result = await syncVersions(config, "1.2.3");

      expect(result.filesUpdated).toHaveLength(2);
      expect(result.filesUpdated).toContain(relPath1);
      expect(result.filesUpdated).toContain(relPath2);
      expect(result.errors).toHaveLength(0);

      // Verify file contents
      const content1 = fs.readFileSync(file1, "utf8");
      const content2 = fs.readFileSync(file2, "utf8");

      expect(content1).toBe('{"version": "1.2.3"}');
      expect(content2).toBe("VERSION=1.2.3");
    });

    it("should report errors for missing files", async () => {
      const config = {
        filesToSync: [
          {
            path: "nonexistent/file.json",
            pattern: '"version":\\s*"[^"]+"',
            replacement: '"version": "$VERSION"',
          },
        ],
      };

      const result = await syncVersions(config, "1.0.0");

      expect(result.filesUpdated).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("File not found");
    });

    it("should not report files that did not need updates", async () => {
      const file = path.join(tempDir, "file.json");
      fs.writeFileSync(file, '{"version": "1.0.0"}', "utf8");

      const versionManagerProjectRoot = path.join(__dirname, "..", "..", "..");
      const relPath = path.relative(versionManagerProjectRoot, file);

      const config = {
        filesToSync: [
          {
            path: relPath,
            pattern: '"version":\\s*"[^"]+"',
            replacement: '"version": "$VERSION"',
          },
        ],
      };

      const result = await syncVersions(config, "1.0.0");

      expect(result.filesUpdated).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("verifyVersions", () => {
    const tempDir = path.join(__dirname, "temp-verify-test");
    const projectRoot = path.join(__dirname, "..", "..");

    beforeEach(() => {
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        files.forEach((file) => {
          fs.unlinkSync(path.join(tempDir, file));
        });
        fs.rmdirSync(tempDir);
      }
    });

    it("should throw for invalid version", async () => {
      const config = {
        filesToSync: [],
      };

      await expect(verifyVersions(config, "invalid")).rejects.toThrow(
        /Invalid version format/
      );
    });

    it("should return true when all files contain the version", async () => {
      const file1 = path.join(tempDir, "file1.json");
      const file2 = path.join(tempDir, "file2.txt");

      fs.writeFileSync(file1, '{"version": "1.2.3"}', "utf8");
      fs.writeFileSync(file2, "VERSION=1.2.3", "utf8");

      const versionManagerProjectRoot = path.join(__dirname, "..", "..", "..");
      const relPath1 = path.relative(versionManagerProjectRoot, file1);
      const relPath2 = path.relative(versionManagerProjectRoot, file2);

      const config = {
        filesToSync: [
          {
            path: relPath1,
            pattern: '"version":\\s*"[^"]+"',
            replacement: '"version": "$VERSION"',
          },
          {
            path: relPath2,
            pattern: "VERSION=[0-9]+\\.[0-9]+\\.[0-9]+",
            replacement: "VERSION=$VERSION",
          },
        ],
      };

      const result = await verifyVersions(config, "1.2.3");

      expect(result).toBe(true);
    });

    it("should return false when a file is missing", async () => {
      const config = {
        filesToSync: [
          {
            path: "nonexistent/file.json",
            pattern: '"version":\\s*"[^"]+"',
            replacement: '"version": "$VERSION"',
          },
        ],
      };

      const result = await verifyVersions(config, "1.0.0");

      expect(result).toBe(false);
    });

    it("should return false when a file does not contain the version", async () => {
      const file = path.join(tempDir, "file.json");
      fs.writeFileSync(file, '{"version": "0.0.0"}', "utf8");

      const versionManagerProjectRoot = path.join(__dirname, "..", "..", "..");
      const relPath = path.relative(versionManagerProjectRoot, file);

      const config = {
        filesToSync: [
          {
            path: relPath,
            pattern: '"version":\\s*"[^"]+"',
            replacement: '"version": "$VERSION"',
          },
        ],
      };

      const result = await verifyVersions(config, "1.0.0");

      expect(result).toBe(false);
    });

    it("should return false when one of multiple files does not contain the version", async () => {
      const file1 = path.join(tempDir, "file1.json");
      const file2 = path.join(tempDir, "file2.txt");

      fs.writeFileSync(file1, '{"version": "1.2.3"}', "utf8");
      fs.writeFileSync(file2, "VERSION=0.0.0", "utf8");

      const versionManagerProjectRoot = path.join(__dirname, "..", "..", "..");
      const relPath1 = path.relative(versionManagerProjectRoot, file1);
      const relPath2 = path.relative(versionManagerProjectRoot, file2);

      const config = {
        filesToSync: [
          {
            path: relPath1,
            pattern: '"version":\\s*"[^"]+"',
            replacement: '"version": "$VERSION"',
          },
          {
            path: relPath2,
            pattern: "VERSION=[0-9]+\\.[0-9]+\\.[0-9]+",
            replacement: "VERSION=$VERSION",
          },
        ],
      };

      const result = await verifyVersions(config, "1.2.3");

      expect(result).toBe(false);
    });
  });
});
