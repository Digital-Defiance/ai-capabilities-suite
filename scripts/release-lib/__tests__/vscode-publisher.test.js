/**
 * @fileoverview Unit tests for VSCode marketplace publisher
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  publish,
  verify,
  checkCredentials,
  execCommand,
} = require("../publishers/vscode-publisher");

// Mock child_process
jest.mock("child_process");

describe("vscode-publisher", () => {
  // Store original fs functions and env
  const originalExistsSync = fs.existsSync;
  const originalEnv = { ...process.env };

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original fs functions
    fs.existsSync = originalExistsSync;
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe("execCommand", () => {
    it("should execute command successfully and return output", () => {
      execSync.mockReturnValue("Published successfully\n");

      const result = execCommand("npx vsce publish");

      expect(result).toBe("Published successfully");
      expect(execSync).toHaveBeenCalledWith("npx vsce publish", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    });

    it("should pass custom options to execSync", () => {
      execSync.mockReturnValue("Success\n");

      const result = execCommand("npx vsce publish", { cwd: "/custom/path" });

      expect(result).toBe("Success");
      expect(execSync).toHaveBeenCalledWith("npx vsce publish", {
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

      expect(() => execCommand("npx vsce publish")).toThrow(
        "Command failed: npx vsce publish"
      );

      try {
        execCommand("npx vsce publish");
      } catch (error) {
        expect(error.output).toContain("Some output");
        expect(error.output).toContain("Error message");
        expect(error.exitCode).toBe(1);
      }
    });
  });

  describe("checkCredentials", () => {
    it("should return true when VSCE_PAT is set", () => {
      process.env.VSCE_PAT = "test-token";

      const result = checkCredentials();

      expect(result).toBe(true);
    });

    it("should return false when VSCE_PAT is not set", () => {
      delete process.env.VSCE_PAT;

      const result = checkCredentials();

      expect(result).toBe(false);
    });
  });

  describe("publish", () => {
    const mockVsixPath = "/path/to/extension-1.0.0.vsix";

    it("should publish extension successfully", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      process.env.VSCE_PAT = "test-token";
      execSync.mockReturnValue("Published successfully\n");

      const result = await publish(mockVsixPath, false);

      expect(result.success).toBe(true);
      expect(result.url).toContain("marketplace.visualstudio.com");
      expect(result.url).toContain("extension");
      expect(result.output).toBe("Published successfully");
      expect(execSync).toHaveBeenCalledWith(
        "npx vsce publish -p test-token",
        expect.objectContaining({
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
          cwd: "/path/to",
        })
      );
    });

    it("should fail when VSIX file does not exist", async () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = await publish(mockVsixPath, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("VSIX file not found");
      expect(execSync).not.toHaveBeenCalled();
    });

    it("should fail when credentials are missing", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      delete process.env.VSCE_PAT;

      const result = await publish(mockVsixPath, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("authentication required");
      expect(result.error).toContain("VSCE_PAT");
      expect(execSync).not.toHaveBeenCalled();
    });

    it("should succeed in dry-run mode without credentials", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      delete process.env.VSCE_PAT;

      const result = await publish(mockVsixPath, true);

      expect(result.success).toBe(true);
      expect(result.url).toContain("marketplace.visualstudio.com");
      expect(result.output).toContain("Dry-run");
      expect(result.output).toContain("extension-1.0.0.vsix");
      expect(execSync).not.toHaveBeenCalled();
    });

    it("should handle authentication errors", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      process.env.VSCE_PAT = "invalid-token";
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "";
      mockError.stderr = "Error: 401 Unauthorized - Personal Access Token";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      const result = await publish(mockVsixPath, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("authentication failed");
      expect(result.error).toContain("VSCE_PAT");
      expect(result.output).toContain("Personal Access Token");
    });

    it("should handle publish command failures", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      process.env.VSCE_PAT = "test-token";
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "Publishing failed";
      mockError.stderr = "Network error";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      const result = await publish(mockVsixPath, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Command failed");
      expect(result.output).toContain("Publishing failed");
      expect(result.output).toContain("Network error");
    });

    it("should extract extension name from VSIX filename", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      process.env.VSCE_PAT = "test-token";
      execSync.mockReturnValue("Published\n");

      const vsixPath = "/path/to/my-awesome-extension-2.5.3.vsix";
      const result = await publish(vsixPath, false);

      expect(result.success).toBe(true);
      expect(result.url).toContain("my-awesome-extension");
    });

    it("should handle VSIX filenames with multiple dashes", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      process.env.VSCE_PAT = "test-token";
      execSync.mockReturnValue("Published\n");

      const vsixPath = "/path/to/vscode-mcp-debugger-1.0.0.vsix";
      const result = await publish(vsixPath, false);

      expect(result.success).toBe(true);
      expect(result.url).toContain("vscode-mcp-debugger");
    });
  });

  describe("verify", () => {
    const mockExtensionName = "publisher.extension";
    const mockVersion = "1.0.0";

    it("should return true when extension exists with correct version", async () => {
      const mockOutput = JSON.stringify({
        versions: [{ version: "1.0.0" }, { version: "0.9.0" }],
      });
      execSync.mockReturnValue(mockOutput);

      const result = await verify(mockExtensionName, mockVersion);

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        `npx vsce show ${mockExtensionName} --json`,
        expect.objectContaining({
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        })
      );
    });

    it("should return false when extension exists but version does not match", async () => {
      const mockOutput = JSON.stringify({
        versions: [{ version: "0.9.0" }, { version: "0.8.0" }],
      });
      execSync.mockReturnValue(mockOutput);

      const result = await verify(mockExtensionName, mockVersion);

      expect(result).toBe(false);
    });

    it("should return false when extension does not exist", async () => {
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "";
      mockError.stderr = "Extension not found";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      const result = await verify(mockExtensionName, mockVersion);

      expect(result).toBe(false);
    });

    it("should return false when vsce show returns invalid JSON", async () => {
      execSync.mockReturnValue("Invalid JSON");

      const result = await verify(mockExtensionName, mockVersion);

      expect(result).toBe(false);
    });

    it("should return false when versions array is missing", async () => {
      const mockOutput = JSON.stringify({
        name: "extension",
      });
      execSync.mockReturnValue(mockOutput);

      const result = await verify(mockExtensionName, mockVersion);

      expect(result).toBe(false);
    });

    it("should return false when versions array is empty", async () => {
      const mockOutput = JSON.stringify({
        versions: [],
      });
      execSync.mockReturnValue(mockOutput);

      const result = await verify(mockExtensionName, mockVersion);

      expect(result).toBe(false);
    });
  });
});
