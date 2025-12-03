/**
 * @fileoverview Unit tests for NPM publisher
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  publish,
  verify,
  checkCredentials,
  execCommand,
} = require("../publishers/npm-publisher");

// Mock child_process
jest.mock("child_process");

describe("npm-publisher", () => {
  // Store original fs functions
  const originalExistsSync = fs.existsSync;

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original fs functions
    fs.existsSync = originalExistsSync;
  });

  describe("execCommand", () => {
    it("should execute command successfully and return output", () => {
      execSync.mockReturnValue("Command output\n");

      const result = execCommand("npm whoami");

      expect(result).toBe("Command output");
      expect(execSync).toHaveBeenCalledWith("npm whoami", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    });

    it("should pass custom options to execSync", () => {
      execSync.mockReturnValue("Success\n");

      const result = execCommand("npm publish", { cwd: "/custom/path" });

      expect(result).toBe("Success");
      expect(execSync).toHaveBeenCalledWith("npm publish", {
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

      expect(() => execCommand("npm publish")).toThrow(
        "Command failed: npm publish"
      );

      try {
        execCommand("npm publish");
      } catch (error) {
        expect(error.output).toContain("Some output");
        expect(error.output).toContain("Error message");
        expect(error.exitCode).toBe(1);
      }
    });
  });

  describe("checkCredentials", () => {
    it("should return true when npm whoami succeeds", () => {
      execSync.mockReturnValue("username\n");

      const result = checkCredentials();

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith("npm whoami", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    });

    it("should return false when npm whoami fails", () => {
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "";
      mockError.stderr = "npm ERR! need auth";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      const result = checkCredentials();

      expect(result).toBe(false);
    });
  });

  describe("publish", () => {
    const mockConfig = {
      packageName: "test-package",
      npmPackageName: "@test/test-package",
      packageDir: "packages/test-package",
    };

    beforeEach(() => {
      fs.existsSync = jest.fn().mockReturnValue(true);
    });

    it("should publish package successfully", async () => {
      execSync.mockReturnValue("+ @test/test-package@1.0.0\n");

      const result = await publish(mockConfig, false);

      expect(result.success).toBe(true);
      expect(result.url).toBe(
        "https://www.npmjs.com/package/@test/test-package"
      );
      expect(result.output).toBe("+ @test/test-package@1.0.0");
      expect(result.error).toBeUndefined();

      // Should check credentials
      expect(execSync).toHaveBeenCalledWith("npm whoami", expect.any(Object));

      // Should publish with public access
      expect(execSync).toHaveBeenCalledWith(
        "npm publish --access public",
        expect.objectContaining({
          cwd: expect.stringContaining("packages/test-package"),
        })
      );
    });

    it("should use npm pack in dry-run mode", async () => {
      execSync.mockReturnValue("test-package-1.0.0.tgz\n");

      const result = await publish(mockConfig, true);

      expect(result.success).toBe(true);
      expect(result.url).toBe(
        "https://www.npmjs.com/package/@test/test-package"
      );
      expect(result.output).toBe("test-package-1.0.0.tgz");

      // Should NOT check credentials in dry-run mode
      expect(execSync).not.toHaveBeenCalledWith(
        "npm whoami",
        expect.any(Object)
      );

      // Should use npm pack instead of publish
      expect(execSync).toHaveBeenCalledWith(
        "npm pack",
        expect.objectContaining({
          cwd: expect.stringContaining("packages/test-package"),
        })
      );
    });

    it("should fail when package directory does not exist", async () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = await publish(mockConfig, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Package directory not found");
      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining("npm publish"),
        expect.any(Object)
      );
    });

    it("should fail when credentials are not configured", async () => {
      // First call to npm whoami fails (credential check)
      execSync.mockImplementation((cmd) => {
        if (cmd === "npm whoami") {
          const error = new Error("Command failed");
          error.status = 1;
          error.stdout = "";
          error.stderr = "npm ERR! need auth";
          throw error;
        }
        return "output";
      });

      const result = await publish(mockConfig, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("NPM authentication required");
      expect(result.error).toContain("npm login");
    });

    it("should handle authentication errors during publish", async () => {
      // npm whoami succeeds, but publish fails with auth error
      execSync.mockImplementation((cmd) => {
        if (cmd === "npm whoami") {
          return "username\n";
        }
        if (cmd.includes("npm publish")) {
          const error = new Error("Command failed");
          error.status = 1;
          error.stdout = "";
          error.stderr = "npm ERR! code ENEEDAUTH\nnpm ERR! need auth";
          throw error;
        }
        return "output";
      });

      const result = await publish(mockConfig, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("NPM authentication failed");
      expect(result.error).toContain("npm login");
    });

    it("should handle generic publish errors", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "npm whoami") {
          return "username\n";
        }
        if (cmd.includes("npm publish")) {
          const error = new Error("Command failed");
          error.status = 1;
          error.stdout = "";
          error.stderr = "npm ERR! 404 Not Found";
          throw error;
        }
        return "output";
      });

      const result = await publish(mockConfig, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Command failed");
      expect(result.output).toContain("404 Not Found");
    });

    it("should handle publish with authentication keyword in error", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "npm whoami") {
          return "username\n";
        }
        if (cmd.includes("npm publish")) {
          const error = new Error("Command failed");
          error.status = 1;
          error.stdout = "";
          error.stderr = "npm ERR! authentication token is invalid";
          throw error;
        }
        return "output";
      });

      const result = await publish(mockConfig, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("NPM authentication failed");
    });

    it("should handle publish with not logged in error", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "npm whoami") {
          return "username\n";
        }
        if (cmd.includes("npm publish")) {
          const error = new Error("Command failed");
          error.status = 1;
          error.stdout = "";
          error.stderr = "npm ERR! You are not logged in";
          throw error;
        }
        return "output";
      });

      const result = await publish(mockConfig, false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("NPM authentication failed");
    });
  });

  describe("verify", () => {
    it("should return true when package version exists", async () => {
      execSync.mockReturnValue("1.0.0\n");

      const result = await verify("@test/test-package", "1.0.0");

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        "npm view @test/test-package@1.0.0 version",
        expect.any(Object)
      );
    });

    it("should return false when package version does not exist", async () => {
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "";
      mockError.stderr = "npm ERR! 404 Not Found";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      const result = await verify("@test/test-package", "1.0.0");

      expect(result).toBe(false);
    });

    it("should return false when version mismatch", async () => {
      execSync.mockReturnValue("1.0.1\n");

      const result = await verify("@test/test-package", "1.0.0");

      expect(result).toBe(false);
    });

    it("should handle package names without scope", async () => {
      execSync.mockReturnValue("2.5.0\n");

      const result = await verify("test-package", "2.5.0");

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        "npm view test-package@2.5.0 version",
        expect.any(Object)
      );
    });
  });
});
