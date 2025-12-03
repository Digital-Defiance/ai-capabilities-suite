/**
 * @fileoverview Unit tests for VSCode extension builder
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  compile,
  packageExtension,
  validateCompilationOutput,
  validateVsixPackage,
  execCommand,
} = require("../builders/vscode-builder");

// Mock child_process
jest.mock("child_process");

describe("vscode-builder", () => {
  // Store original fs functions
  const originalExistsSync = fs.existsSync;
  const originalReaddirSync = fs.readdirSync;
  const originalStatSync = fs.statSync;
  const originalReadFileSync = fs.readFileSync;

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original fs functions
    fs.existsSync = originalExistsSync;
    fs.readdirSync = originalReaddirSync;
    fs.statSync = originalStatSync;
    fs.readFileSync = originalReadFileSync;
  });

  describe("execCommand", () => {
    it("should execute command successfully and return output", () => {
      execSync.mockReturnValue("Compilation successful\n");

      const result = execCommand("npm run compile");

      expect(result).toBe("Compilation successful");
      expect(execSync).toHaveBeenCalledWith("npm run compile", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    });

    it("should pass custom options to execSync", () => {
      execSync.mockReturnValue("Success\n");

      const result = execCommand("npm run package", { cwd: "/custom/path" });

      expect(result).toBe("Success");
      expect(execSync).toHaveBeenCalledWith("npm run package", {
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

      expect(() => execCommand("npm run compile")).toThrow(
        "Command failed: npm run compile"
      );

      try {
        execCommand("npm run compile");
      } catch (error) {
        expect(error.output).toContain("Some output");
        expect(error.output).toContain("Error message");
        expect(error.exitCode).toBe(1);
      }
    });
  });

  describe("validateCompilationOutput", () => {
    it("should return true when out directory exists with extension.js", () => {
      fs.existsSync = jest.fn((filePath) => {
        // Return true for out directory and extension.js
        return filePath.includes("out") || filePath.includes("extension.js");
      });
      fs.readdirSync = jest
        .fn()
        .mockReturnValue(["extension.js", "debugAdapter.js"]);

      const result = validateCompilationOutput("/path/to/extension");

      expect(result).toBe(true);
    });

    it("should return false when out directory does not exist", () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = validateCompilationOutput("/path/to/extension");

      expect(result).toBe(false);
    });

    it("should return false when out directory is empty", () => {
      fs.existsSync = jest.fn((filePath) => {
        // Out directory exists but extension.js doesn't
        return filePath.includes("out") && !filePath.includes("extension.js");
      });
      fs.readdirSync = jest.fn().mockReturnValue([]);

      const result = validateCompilationOutput("/path/to/extension");

      expect(result).toBe(false);
    });

    it("should return false when extension.js does not exist", () => {
      fs.existsSync = jest.fn((filePath) => {
        // Out directory exists but extension.js doesn't
        return filePath.includes("out") && !filePath.includes("extension.js");
      });
      fs.readdirSync = jest.fn().mockReturnValue(["other.js"]);

      const result = validateCompilationOutput("/path/to/extension");

      expect(result).toBe(false);
    });
  });

  describe("validateVsixPackage", () => {
    it("should return true when VSIX file exists with content", () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.statSync = jest.fn().mockReturnValue({ size: 1024000 });

      const result = validateVsixPackage("/path/to/extension.vsix");

      expect(result).toBe(true);
    });

    it("should return false when VSIX file does not exist", () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = validateVsixPackage("/path/to/extension.vsix");

      expect(result).toBe(false);
    });

    it("should return false when VSIX file is empty", () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.statSync = jest.fn().mockReturnValue({ size: 0 });

      const result = validateVsixPackage("/path/to/extension.vsix");

      expect(result).toBe(false);
    });
  });

  describe("compile", () => {
    it("should compile extension successfully", async () => {
      fs.existsSync = jest.fn((filePath) => {
        // Extension dir, package.json, out dir, and extension.js all exist
        return true;
      });
      fs.readdirSync = jest.fn().mockReturnValue(["extension.js"]);
      execSync.mockReturnValue("Compilation completed successfully\n");

      const result = await compile("packages/vscode-mcp-debugger");

      expect(result.success).toBe(true);
      expect(result.output).toBe("Compilation completed successfully");
      expect(result.error).toBeUndefined();
      expect(execSync).toHaveBeenCalledWith(
        "npm run compile",
        expect.objectContaining({
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        })
      );
    });

    it("should fail when extension directory does not exist", async () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = await compile("packages/vscode-mcp-debugger");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Extension directory not found");
      expect(execSync).not.toHaveBeenCalled();
    });

    it("should fail when package.json does not exist", async () => {
      fs.existsSync = jest.fn((filePath) => {
        // Extension dir exists but package.json doesn't
        return !filePath.includes("package.json");
      });

      const result = await compile("packages/vscode-mcp-debugger");

      expect(result.success).toBe(false);
      expect(result.error).toContain("package.json not found");
      expect(execSync).not.toHaveBeenCalled();
    });

    it("should fail when compilation command fails", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "TypeScript compilation error";
      mockError.stderr = "";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      const result = await compile("packages/vscode-mcp-debugger");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Command failed");
      expect(result.output).toContain("TypeScript compilation error");
    });

    it("should fail when compilation output validation fails", async () => {
      // Extension dir and package.json exist
      fs.existsSync = jest.fn((filePath) => {
        if (filePath.includes("package.json")) return true;
        if (
          filePath.includes("vscode-mcp-debugger") &&
          !filePath.includes("out")
        )
          return true;
        // Out directory doesn't exist
        return false;
      });
      execSync.mockReturnValue("Compilation completed\n");

      const result = await compile("packages/vscode-mcp-debugger");

      expect(result.success).toBe(false);
      expect(result.error).toContain("output validation failed");
      expect(result.output).toBe("Compilation completed");
    });

    it("should fail when out directory exists but extension.js is missing", async () => {
      fs.existsSync = jest.fn((filePath) => {
        // Everything exists except extension.js
        return !filePath.includes("extension.js");
      });
      fs.readdirSync = jest.fn().mockReturnValue(["other.js"]);
      execSync.mockReturnValue("Compilation completed\n");

      const result = await compile("packages/vscode-mcp-debugger");

      expect(result.success).toBe(false);
      expect(result.error).toContain("output validation failed");
    });
  });

  describe("packageExtension", () => {
    const mockPackageJson = {
      name: "test-extension",
      version: "1.0.0",
      displayName: "Test Extension",
    };

    it("should package extension successfully", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest
        .fn()
        .mockReturnValue(JSON.stringify(mockPackageJson));
      fs.statSync = jest.fn().mockReturnValue({ size: 1024000 });
      execSync.mockReturnValue("Extension packaged successfully\n");

      const result = await packageExtension("packages/vscode-mcp-debugger");

      expect(result).toContain("test-extension-1.0.0.vsix");
      expect(execSync).toHaveBeenCalledWith(
        "npm run package",
        expect.objectContaining({
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        })
      );
    });

    it("should throw error when extension directory does not exist", async () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      await expect(
        packageExtension("packages/vscode-mcp-debugger")
      ).rejects.toThrow("Extension directory not found");

      expect(execSync).not.toHaveBeenCalled();
    });

    it("should throw error when package.json does not exist", async () => {
      fs.existsSync = jest.fn((filePath) => {
        // Extension dir exists but package.json doesn't
        return !filePath.includes("package.json");
      });

      await expect(
        packageExtension("packages/vscode-mcp-debugger")
      ).rejects.toThrow("package.json not found");

      expect(execSync).not.toHaveBeenCalled();
    });

    it("should throw error when package.json is invalid", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest.fn().mockReturnValue("invalid json");

      await expect(
        packageExtension("packages/vscode-mcp-debugger")
      ).rejects.toThrow();
    });

    it("should throw error when extension name is missing", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest
        .fn()
        .mockReturnValue(JSON.stringify({ version: "1.0.0" }));

      await expect(
        packageExtension("packages/vscode-mcp-debugger")
      ).rejects.toThrow("Extension name or version not found");
    });

    it("should throw error when extension version is missing", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest
        .fn()
        .mockReturnValue(JSON.stringify({ name: "test-extension" }));

      await expect(
        packageExtension("packages/vscode-mcp-debugger")
      ).rejects.toThrow("Extension name or version not found");
    });

    it("should throw error when packaging command fails", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest
        .fn()
        .mockReturnValue(JSON.stringify(mockPackageJson));
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "vsce packaging error";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      await expect(
        packageExtension("packages/vscode-mcp-debugger")
      ).rejects.toThrow("Failed to package extension");
    });

    it("should throw error when VSIX validation fails", async () => {
      fs.existsSync = jest.fn((filePath) => {
        // Everything exists except the VSIX file
        return !filePath.includes(".vsix");
      });
      fs.readFileSync = jest
        .fn()
        .mockReturnValue(JSON.stringify(mockPackageJson));
      execSync.mockReturnValue("Packaging completed\n");

      await expect(
        packageExtension("packages/vscode-mcp-debugger")
      ).rejects.toThrow("VSIX package validation failed");
    });

    it("should throw error when VSIX file is empty", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.readFileSync = jest
        .fn()
        .mockReturnValue(JSON.stringify(mockPackageJson));
      fs.statSync = jest.fn().mockReturnValue({ size: 0 });
      execSync.mockReturnValue("Packaging completed\n");

      await expect(
        packageExtension("packages/vscode-mcp-debugger")
      ).rejects.toThrow("VSIX package validation failed");
    });
  });
});
