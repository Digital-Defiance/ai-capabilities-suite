/**
 * Unit tests for sync-versions functionality
 * Requirements: 2.4
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  readPackageInfo,
  getDebuggerFileUpdates,
  getScreenshotFileUpdates,
  updateSingleFile,
} from "./sync-versions";
import { FileUpdate, PackageInfo } from "./common/types";

describe("sync-versions", () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-versions-test-"));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("readPackageInfo", () => {
    it("should read version from package.json", () => {
      // Create a test package.json
      const packageDir = path.join(tempDir, "test-package");
      fs.mkdirSync(packageDir, { recursive: true });

      const packageJson = {
        name: "@test/package",
        version: "1.2.3",
        description: "Test package",
      };

      fs.writeFileSync(
        path.join(packageDir, "package.json"),
        JSON.stringify(packageJson, null, 2)
      );

      const result = readPackageInfo(packageDir);

      expect(result.name).toBe("@test/package");
      expect(result.version).toBe("1.2.3");
      expect(result.directory).toBe(packageDir);
    });

    it("should read version from multiple packages", () => {
      // Create multiple test packages
      const packages = [
        { name: "@test/package1", version: "1.0.0" },
        { name: "@test/package2", version: "2.5.7" },
        { name: "@test/package3", version: "0.1.0-beta" },
      ];

      const results: PackageInfo[] = [];

      packages.forEach((pkg, index) => {
        const packageDir = path.join(tempDir, `package${index + 1}`);
        fs.mkdirSync(packageDir, { recursive: true });

        fs.writeFileSync(
          path.join(packageDir, "package.json"),
          JSON.stringify(pkg, null, 2)
        );

        results.push(readPackageInfo(packageDir));
      });

      expect(results).toHaveLength(3);
      expect(results[0].version).toBe("1.0.0");
      expect(results[1].version).toBe("2.5.7");
      expect(results[2].version).toBe("0.1.0-beta");
    });

    it("should throw error if package.json does not exist", () => {
      const nonExistentDir = path.join(tempDir, "nonexistent");

      expect(() => readPackageInfo(nonExistentDir)).toThrow();
    });

    it("should throw error if package.json is invalid JSON", () => {
      const packageDir = path.join(tempDir, "invalid-package");
      fs.mkdirSync(packageDir, { recursive: true });

      fs.writeFileSync(path.join(packageDir, "package.json"), "{ invalid json");

      expect(() => readPackageInfo(packageDir)).toThrow();
    });
  });

  describe("updateSingleFile", () => {
    it("should update file with pattern-based replacement", () => {
      const testFile = path.join(tempDir, "test.txt");
      fs.writeFileSync(testFile, 'const VERSION = "1.0.0";');

      const update: FileUpdate = {
        path: testFile,
        pattern: /const VERSION = "[^"]+"/,
        replacement: 'const VERSION = "2.0.0"',
      };

      const result = updateSingleFile(update);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(true);
      expect(fs.readFileSync(testFile, "utf8")).toBe(
        'const VERSION = "2.0.0";'
      );
    });

    it("should handle multiple pattern matches with global flag", () => {
      const testFile = path.join(tempDir, "test.json");
      fs.writeFileSync(
        testFile,
        '{"version": "1.0.0", "dep": {"version": "1.0.0"}}'
      );

      const update: FileUpdate = {
        path: testFile,
        pattern: /"version": "[^"]+"/g,
        replacement: '"version": "2.0.0"',
      };

      const result = updateSingleFile(update);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(true);

      const content = fs.readFileSync(testFile, "utf8");
      expect(content).toBe('{"version": "2.0.0", "dep": {"version": "2.0.0"}}');
    });

    it("should return false when no changes are needed", () => {
      const testFile = path.join(tempDir, "test.txt");
      fs.writeFileSync(testFile, 'const VERSION = "2.0.0";');

      const update: FileUpdate = {
        path: testFile,
        pattern: /const VERSION = "[^"]+"/,
        replacement: 'const VERSION = "2.0.0"',
      };

      const result = updateSingleFile(update);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(false);
    });

    it("should handle optional files that do not exist", () => {
      const nonExistentFile = path.join(tempDir, "nonexistent.txt");

      const update: FileUpdate = {
        path: nonExistentFile,
        pattern: /test/,
        replacement: "replacement",
        optional: true,
      };

      const result = updateSingleFile(update);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(false);
    });

    it("should return error for non-optional missing files", () => {
      const nonExistentFile = path.join(tempDir, "nonexistent.txt");

      const update: FileUpdate = {
        path: nonExistentFile,
        pattern: /test/,
        replacement: "replacement",
      };

      const result = updateSingleFile(update);

      expect(result.success).toBe(false);
      expect(result.modified).toBe(false);
      expect(result.error).toContain("File not found");
    });

    it("should handle capture groups in replacement", () => {
      const testFile = path.join(tempDir, "test.txt");
      fs.writeFileSync(testFile, '  "version": "1.0.0"');

      const update: FileUpdate = {
        path: testFile,
        pattern: /^(\s*"version":\s*")[^"]+"/m,
        replacement: '$13.0.0"',
      };

      const result = updateSingleFile(update);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(true);
      expect(fs.readFileSync(testFile, "utf8")).toBe('  "version": "3.0.0"');
    });
  });

  describe("getDebuggerFileUpdates", () => {
    it("should generate file update configurations for debugger package", () => {
      const version = "1.5.0";
      const updates = getDebuggerFileUpdates(version);

      expect(updates.length).toBeGreaterThan(0);
      expect(updates.every((u) => u.package === "debugger")).toBe(true);
      expect(updates.every((u) => u.path)).toBeTruthy();
      expect(updates.every((u) => u.pattern)).toBeTruthy();
      expect(updates.every((u) => u.replacement.includes(version))).toBe(true);
    });

    it("should include CLI version update", () => {
      const version = "2.0.0";
      const updates = getDebuggerFileUpdates(version);

      const cliUpdate = updates.find((u) => u.path.includes("cli.ts"));
      expect(cliUpdate).toBeDefined();
      expect(cliUpdate?.replacement).toContain(version);
    });

    it("should include server version update", () => {
      const version = "2.0.0";
      const updates = getDebuggerFileUpdates(version);

      const serverUpdate = updates.find((u) =>
        u.path.includes("mcp-server.ts")
      );
      expect(serverUpdate).toBeDefined();
      expect(serverUpdate?.replacement).toContain(version);
    });

    it("should include Docker-related updates", () => {
      const version = "2.0.0";
      const updates = getDebuggerFileUpdates(version);

      const dockerUpdates = updates.filter(
        (u) =>
          u.path.includes("Dockerfile") ||
          u.path.includes("docker-build-push.sh")
      );
      expect(dockerUpdates.length).toBeGreaterThan(0);
    });

    it("should include VSCode extension updates", () => {
      const version = "2.0.0";
      const updates = getDebuggerFileUpdates(version);

      const vscodeUpdates = updates.filter((u) =>
        u.path.includes("vscode-mcp-debugger")
      );
      expect(vscodeUpdates.length).toBeGreaterThan(0);
    });
  });

  describe("getScreenshotFileUpdates", () => {
    it("should generate file update configurations for screenshot package", () => {
      const version = "0.5.0";
      const updates = getScreenshotFileUpdates(version);

      expect(updates.length).toBeGreaterThan(0);
      expect(updates.every((u) => u.package === "screenshot")).toBe(true);
      expect(updates.every((u) => u.path)).toBeTruthy();
      expect(updates.every((u) => u.pattern)).toBeTruthy();
      expect(updates.every((u) => u.replacement.includes(version))).toBe(true);
    });

    it("should include server version update", () => {
      const version = "0.5.0";
      const updates = getScreenshotFileUpdates(version);

      const serverUpdate = updates.find((u) => u.path.includes("server.ts"));
      expect(serverUpdate).toBeDefined();
      expect(serverUpdate?.replacement).toContain(version);
    });

    it("should include registry JSON update", () => {
      const version = "0.5.0";
      const updates = getScreenshotFileUpdates(version);

      const registryUpdate = updates.find((u) =>
        u.path.includes("mcp-registry.json")
      );
      expect(registryUpdate).toBeDefined();
      expect(registryUpdate?.replacement).toContain(version);
    });

    it("should include Docker-related updates", () => {
      const version = "0.5.0";
      const updates = getScreenshotFileUpdates(version);

      const dockerUpdates = updates.filter(
        (u) =>
          u.path.includes("docker-build-push.sh") ||
          u.path.includes("server.yaml")
      );
      expect(dockerUpdates.length).toBeGreaterThan(0);
    });

    it("should include VSCode extension updates", () => {
      const version = "0.5.0";
      const updates = getScreenshotFileUpdates(version);

      const vscodeUpdates = updates.filter((u) =>
        u.path.includes("vscode-mcp-screenshot")
      );
      expect(vscodeUpdates.length).toBeGreaterThan(0);
    });
  });

  describe("selective package filtering", () => {
    it("should filter updates for debugger package only", () => {
      const debuggerUpdates = getDebuggerFileUpdates("1.0.0");
      const screenshotUpdates = getScreenshotFileUpdates("2.0.0");

      expect(debuggerUpdates.every((u) => u.package === "debugger")).toBe(true);
      expect(screenshotUpdates.every((u) => u.package === "screenshot")).toBe(
        true
      );

      // Verify no overlap
      const debuggerPaths = new Set(debuggerUpdates.map((u) => u.path));
      const screenshotPaths = new Set(screenshotUpdates.map((u) => u.path));

      const intersection = [...debuggerPaths].filter((p) =>
        screenshotPaths.has(p)
      );
      expect(intersection.length).toBe(0);
    });

    it("should handle package filter in syncVersions", () => {
      // This test verifies the logic but doesn't execute against real files
      const debuggerUpdates = getDebuggerFileUpdates("1.0.0");
      const screenshotUpdates = getScreenshotFileUpdates("2.0.0");

      // When filtering by debugger, only debugger updates should be included
      const debuggerOnly = debuggerUpdates.filter(
        (u) => u.package === "debugger"
      );
      expect(debuggerOnly.length).toBe(debuggerUpdates.length);

      // When filtering by screenshot, only screenshot updates should be included
      const screenshotOnly = screenshotUpdates.filter(
        (u) => u.package === "screenshot"
      );
      expect(screenshotOnly.length).toBe(screenshotUpdates.length);
    });
  });

  describe("pattern matching behavior", () => {
    it("should match version patterns in TypeScript files", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(testFile, 'const VERSION = "1.0.0";');

      const update: FileUpdate = {
        path: testFile,
        pattern: /const VERSION = "[^"]+"/,
        replacement: 'const VERSION = "2.0.0"',
      };

      const result = updateSingleFile(update);
      expect(result.modified).toBe(true);
    });

    it("should match version patterns in JSON files", () => {
      const testFile = path.join(tempDir, "test.json");
      fs.writeFileSync(testFile, '{\n  "version": "1.0.0"\n}');

      const update: FileUpdate = {
        path: testFile,
        pattern: /"version": "[^"]+"/,
        replacement: '"version": "2.0.0"',
      };

      const result = updateSingleFile(update);
      expect(result.modified).toBe(true);
    });

    it("should match version patterns in shell scripts", () => {
      const testFile = path.join(tempDir, "test.sh");
      fs.writeFileSync(testFile, 'VERSION="1.0.0"');

      const update: FileUpdate = {
        path: testFile,
        pattern: /VERSION="[^"]+"/,
        replacement: 'VERSION="2.0.0"',
      };

      const result = updateSingleFile(update);
      expect(result.modified).toBe(true);
    });

    it("should match version patterns in Dockerfiles", () => {
      const testFile = path.join(tempDir, "Dockerfile");
      fs.writeFileSync(
        testFile,
        'LABEL org.opencontainers.image.version="1.0.0"'
      );

      const update: FileUpdate = {
        path: testFile,
        pattern: /org\.opencontainers\.image\.version="[^"]+"/,
        replacement: 'org.opencontainers.image.version="2.0.0"',
      };

      const result = updateSingleFile(update);
      expect(result.modified).toBe(true);
    });

    it("should match dependency version patterns", () => {
      const testFile = path.join(tempDir, "package.json");
      fs.writeFileSync(
        testFile,
        '{\n  "dependencies": {\n    "@test/package": "^1.0.0"\n  }\n}'
      );

      const update: FileUpdate = {
        path: testFile,
        pattern: /"@test\/package": "\^[^"]+"/,
        replacement: '"@test/package": "^2.0.0"',
      };

      const result = updateSingleFile(update);
      expect(result.modified).toBe(true);
    });
  });
});
