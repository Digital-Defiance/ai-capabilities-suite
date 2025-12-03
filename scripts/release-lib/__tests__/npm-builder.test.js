/**
 * @fileoverview Unit tests for NPM builder
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  build,
  test,
  validateBuildOutput,
  execCommand,
} = require("../builders/npm-builder");

// Mock child_process
jest.mock("child_process");

describe("npm-builder", () => {
  // Store original fs functions
  const originalExistsSync = fs.existsSync;
  const originalReaddirSync = fs.readdirSync;

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original fs functions
    fs.existsSync = originalExistsSync;
    fs.readdirSync = originalReaddirSync;
  });

  describe("execCommand", () => {
    it("should execute command successfully and return output", () => {
      execSync.mockReturnValue("Build successful\n");

      const result = execCommand("npm run build");

      expect(result).toBe("Build successful");
      expect(execSync).toHaveBeenCalledWith("npm run build", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    });

    it("should pass custom options to execSync", () => {
      execSync.mockReturnValue("Success\n");

      const result = execCommand("npm test", { cwd: "/custom/path" });

      expect(result).toBe("Success");
      expect(execSync).toHaveBeenCalledWith("npm test", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
        cwd: "/custom/path",
      });
    });

    it("should throw error with output when command fails", () => {
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "Some output";
      mockError.stderr = "Error message";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      expect(() => execCommand("npm run build")).toThrow(
        "Command failed: npm run build"
      );

      try {
        execCommand("npm run build");
      } catch (error) {
        expect(error.output).toContain("Some output");
        expect(error.output).toContain("Error message");
        expect(error.exitCode).toBe(1);
      }
    });

    it("should handle command failure with no output", () => {
      const mockError = new Error("Command failed");
      mockError.status = 1;
      execSync.mockImplementation(() => {
        throw mockError;
      });

      expect(() => execCommand("npm run build")).toThrow();
    });
  });

  describe("validateBuildOutput", () => {
    it("should return true when dist directory exists with files", () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readdirSync = jest.fn().mockReturnValue(["index.js", "types.d.ts"]);

      const result = validateBuildOutput("/path/to/package");

      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(
        path.join("/path/to/package", "dist")
      );
      expect(fs.readdirSync).toHaveBeenCalledWith(
        path.join("/path/to/package", "dist")
      );
    });

    it("should return false when dist directory does not exist", () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = validateBuildOutput("/path/to/package");

      expect(result).toBe(false);
      expect(fs.existsSync).toHaveBeenCalledWith(
        path.join("/path/to/package", "dist")
      );
    });

    it("should return false when dist directory is empty", () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readdirSync = jest.fn().mockReturnValue([]);

      const result = validateBuildOutput("/path/to/package");

      expect(result).toBe(false);
    });
  });

  describe("build", () => {
    const mockConfig = {
      packageName: "test-package",
      packageDir: "packages/test-package",
      buildCommand: "npm run build",
    };

    it("should build package successfully", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readdirSync = jest.fn().mockReturnValue(["index.js"]);
      execSync.mockReturnValue("Build completed successfully\n");

      const result = await build(mockConfig);

      expect(result.success).toBe(true);
      expect(result.output).toBe("Build completed successfully");
      expect(result.error).toBeUndefined();
      expect(execSync).toHaveBeenCalledWith(
        "npm run build",
        expect.objectContaining({
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        })
      );
    });

    it("should fail when package directory does not exist", async () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = await build(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Package directory not found");
      expect(execSync).not.toHaveBeenCalled();
    });

    it("should fail when build command fails", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "Build error output";
      mockError.stderr = "";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      const result = await build(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Command failed");
      expect(result.output).toContain("Build error output");
    });

    it("should fail when build output validation fails", async () => {
      // Package directory exists
      fs.existsSync = jest.fn((filePath) => {
        // Return true for package directory, false for dist
        return !filePath.includes("dist");
      });
      execSync.mockReturnValue("Build completed\n");

      const result = await build(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain("output validation failed");
      expect(result.output).toBe("Build completed");
    });

    it("should fail when dist directory is empty", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readdirSync = jest.fn().mockReturnValue([]);
      execSync.mockReturnValue("Build completed\n");

      const result = await build(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain("output validation failed");
    });
  });

  describe("test", () => {
    const mockConfig = {
      packageName: "test-package",
      packageDir: "packages/test-package",
      testCommand: "npm test",
    };

    it("should run tests successfully", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      execSync.mockReturnValue("All tests passed\n");

      const result = await test(mockConfig);

      expect(result.success).toBe(true);
      expect(result.output).toBe("All tests passed");
      expect(result.error).toBeUndefined();
      expect(execSync).toHaveBeenCalledWith(
        "npm test",
        expect.objectContaining({
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        })
      );
    });

    it("should fail when package directory does not exist", async () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = await test(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Package directory not found");
      expect(execSync).not.toHaveBeenCalled();
    });

    it("should fail when test command fails", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "Test failures:\n  - test1 failed\n  - test2 failed";
      mockError.stderr = "";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      const result = await test(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Command failed");
      expect(result.output).toContain("Test failures");
    });

    it("should handle test command with custom working directory", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      execSync.mockReturnValue("Tests passed\n");

      await test(mockConfig);

      expect(execSync).toHaveBeenCalledWith(
        "npm test",
        expect.objectContaining({
          cwd: expect.stringContaining(""),
        })
      );
    });
  });
});
