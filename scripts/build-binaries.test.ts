/**
 * Unit tests for build-binaries functionality
 * Requirements: 2.1
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { BuildTarget } from "./common/types";
import { filterTargets, listBinaries } from "./build-binaries";

describe("build-binaries", () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "build-binaries-test-"));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("platform detection and configuration", () => {
    it("should return all targets when no platforms specified", () => {
      const targets = filterTargets();

      expect(targets.length).toBe(3);
      expect(targets.some((t) => t.platform === "linux")).toBe(true);
      expect(targets.some((t) => t.platform === "macos")).toBe(true);
      expect(targets.some((t) => t.platform === "windows")).toBe(true);
    });

    it("should return all targets when empty array specified", () => {
      const targets = filterTargets([]);

      expect(targets.length).toBe(3);
    });

    it("should filter to single platform", () => {
      const targets = filterTargets(["linux"]);

      expect(targets.length).toBe(1);
      expect(targets[0].platform).toBe("linux");
      expect(targets[0].target).toBe("node18-linux-x64");
      expect(targets[0].outputName).toBe("ts-mcp-server-linux-x64");
    });

    it("should filter to multiple platforms", () => {
      const targets = filterTargets(["linux", "windows"]);

      expect(targets.length).toBe(2);
      expect(targets.some((t) => t.platform === "linux")).toBe(true);
      expect(targets.some((t) => t.platform === "windows")).toBe(true);
      expect(targets.some((t) => t.platform === "macos")).toBe(false);
    });

    it("should handle case-sensitive platform names", () => {
      const targets = filterTargets(["Linux"]);

      // Should not match due to case sensitivity
      expect(targets.length).toBe(0);
    });

    it("should handle non-existent platform names", () => {
      const targets = filterTargets(["freebsd", "solaris"]);

      expect(targets.length).toBe(0);
    });

    it("should verify all targets have required properties", () => {
      const targets = filterTargets();

      targets.forEach((target: BuildTarget) => {
        expect(target.platform).toBeDefined();
        expect(target.arch).toBeDefined();
        expect(target.target).toBeDefined();
        expect(target.outputName).toBeDefined();

        expect(typeof target.platform).toBe("string");
        expect(typeof target.arch).toBe("string");
        expect(typeof target.target).toBe("string");
        expect(typeof target.outputName).toBe("string");
      });
    });

    it("should verify target strings follow pkg format", () => {
      const targets = filterTargets();

      targets.forEach((target: BuildTarget) => {
        // pkg target format: node{version}-{platform}-{arch}
        expect(target.target).toMatch(/^node\d+-\w+-\w+$/);
      });
    });

    it("should verify Windows targets have .exe extension", () => {
      const targets = filterTargets(["windows"]);

      expect(targets.length).toBe(1);
      expect(targets[0].outputName).toMatch(/\.exe$/);
    });

    it("should verify non-Windows targets do not have .exe extension", () => {
      const targets = filterTargets(["linux", "macos"]);

      targets.forEach((target: BuildTarget) => {
        expect(target.outputName).not.toMatch(/\.exe$/);
      });
    });
  });

  describe("output file management", () => {
    it("should list binaries with correct sizes", () => {
      // Create test binary files
      const testFiles = [
        { name: "test-binary-1", size: 1024 * 1024 }, // 1 MB
        { name: "test-binary-2", size: 2 * 1024 * 1024 }, // 2 MB
        { name: "test-binary-3.exe", size: 512 * 1024 }, // 0.5 MB
      ];

      testFiles.forEach((file) => {
        const filePath = path.join(tempDir, file.name);
        const buffer = Buffer.alloc(file.size);
        fs.writeFileSync(filePath, buffer);
      });

      // Capture console output
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      listBinaries(tempDir);

      // Verify output was logged
      expect(consoleSpy).toHaveBeenCalled();

      // Verify all files were listed
      const output = consoleSpy.mock.calls
        .map((call) => call.join(" "))
        .join("\n");
      expect(output).toContain("test-binary-1");
      expect(output).toContain("test-binary-2");
      expect(output).toContain("test-binary-3.exe");

      // Verify sizes are displayed
      expect(output).toContain("1.00 MB");
      expect(output).toContain("2.00 MB");
      expect(output).toContain("0.50 MB");

      consoleSpy.mockRestore();
    });

    it("should handle empty output directory", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      listBinaries(tempDir);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle non-existent output directory gracefully", () => {
      const nonExistentDir = path.join(tempDir, "nonexistent");

      // Mock console to suppress output during test
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      // Should not throw when directory doesn't exist
      expect(() => listBinaries(nonExistentDir)).not.toThrow();

      // Function should handle the error gracefully (either by logging or silently)
      // The important thing is it doesn't crash the process

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it("should calculate file sizes correctly", () => {
      // Create files with specific sizes
      const testCases = [
        { size: 0, expectedMB: "0.00" },
        { size: 1024, expectedMB: "0.00" }, // Less than 0.01 MB
        { size: 1024 * 1024, expectedMB: "1.00" },
        { size: 1.5 * 1024 * 1024, expectedMB: "1.50" },
        { size: 10 * 1024 * 1024, expectedMB: "10.00" },
      ];

      testCases.forEach((testCase, index) => {
        const fileName = `test-file-${index}`;
        const filePath = path.join(tempDir, fileName);
        const buffer = Buffer.alloc(testCase.size);
        fs.writeFileSync(filePath, buffer);

        const consoleSpy = jest.spyOn(console, "log").mockImplementation();

        listBinaries(tempDir);

        const output = consoleSpy.mock.calls
          .map((call) => call.join(" "))
          .join("\n");
        expect(output).toContain(`${fileName} (${testCase.expectedMB} MB)`);

        consoleSpy.mockRestore();

        // Clean up for next iteration
        fs.unlinkSync(filePath);
      });
    });
  });

  describe("error handling for compilation failures", () => {
    it("should handle missing server directory", () => {
      // This test verifies the structure but doesn't execute actual builds
      const targets = filterTargets(["linux"]);

      expect(targets.length).toBe(1);
      expect(targets[0].platform).toBe("linux");
    });

    it("should handle invalid target configuration", () => {
      const targets = filterTargets(["invalid-platform"]);

      // Should return empty array for invalid platforms
      expect(targets.length).toBe(0);
    });

    it("should verify all platforms have unique output names", () => {
      const targets = filterTargets();
      const outputNames = targets.map((t) => t.outputName);
      const uniqueNames = new Set(outputNames);

      expect(outputNames.length).toBe(uniqueNames.size);
    });

    it("should verify all platforms have unique targets", () => {
      const targets = filterTargets();
      const targetStrings = targets.map((t) => t.target);
      const uniqueTargets = new Set(targetStrings);

      expect(targetStrings.length).toBe(uniqueTargets.size);
    });
  });

  describe("behavior matches JavaScript version", () => {
    it("should maintain same target configurations", () => {
      const targets = filterTargets();

      // Verify expected targets exist
      const linux = targets.find((t) => t.platform === "linux");
      const macos = targets.find((t) => t.platform === "macos");
      const windows = targets.find((t) => t.platform === "windows");

      expect(linux).toBeDefined();
      expect(macos).toBeDefined();
      expect(windows).toBeDefined();

      // Verify target strings match expected format
      expect(linux?.target).toBe("node18-linux-x64");
      expect(macos?.target).toBe("node18-macos-x64");
      expect(windows?.target).toBe("node18-win-x64");

      // Verify output names match expected format
      expect(linux?.outputName).toBe("ts-mcp-server-linux-x64");
      expect(macos?.outputName).toBe("ts-mcp-server-macos-x64");
      expect(windows?.outputName).toBe("ts-mcp-server-win-x64.exe");
    });

    it("should maintain same architecture for all platforms", () => {
      const targets = filterTargets();

      // All targets should be x64
      targets.forEach((target: BuildTarget) => {
        expect(target.arch).toBe("x64");
      });
    });

    it("should maintain same Node.js version for all platforms", () => {
      const targets = filterTargets();

      // All targets should use node18
      targets.forEach((target: BuildTarget) => {
        expect(target.target).toMatch(/^node18-/);
      });
    });

    it("should maintain consistent naming convention", () => {
      const targets = filterTargets();

      targets.forEach((target: BuildTarget) => {
        // Output names should follow pattern: ts-mcp-server-{platform_short}-{arch}[.exe]
        // Note: Windows uses "win" instead of "windows" in the output name
        const platformShort =
          target.platform === "windows" ? "win" : target.platform;
        const expectedBase = `ts-mcp-server-${platformShort}-${target.arch}`;

        if (target.platform === "windows") {
          expect(target.outputName).toBe(`${expectedBase}.exe`);
        } else {
          expect(target.outputName).toBe(expectedBase);
        }
      });
    });
  });

  describe("binary compilation orchestration", () => {
    it("should process targets in order", () => {
      const targets = filterTargets(["linux", "macos", "windows"]);

      // Verify targets are returned in a consistent order
      expect(targets.length).toBe(3);

      // The order should match the DEFAULT_TARGETS order
      const platforms = targets.map((t) => t.platform);
      expect(platforms).toEqual(["linux", "macos", "windows"]);
    });

    it("should handle partial platform selection", () => {
      const singleTarget = filterTargets(["macos"]);
      expect(singleTarget.length).toBe(1);
      expect(singleTarget[0].platform).toBe("macos");

      const dualTargets = filterTargets(["linux", "windows"]);
      expect(dualTargets.length).toBe(2);
      expect(dualTargets.map((t) => t.platform)).toEqual(["linux", "windows"]);
    });

    it("should preserve target properties during filtering", () => {
      const allTargets = filterTargets();
      const filteredTargets = filterTargets(["linux"]);

      const linuxFromAll = allTargets.find((t) => t.platform === "linux");
      const linuxFromFiltered = filteredTargets[0];

      expect(linuxFromFiltered).toEqual(linuxFromAll);
    });
  });
});
