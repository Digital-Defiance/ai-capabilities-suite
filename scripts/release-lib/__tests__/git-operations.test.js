/**
 * @fileoverview Unit tests for Git operations
 */

const fs = require("fs");
const { execSync } = require("child_process");
const {
  commitChanges,
  createTag,
  pushToRemote,
  createGithubRelease,
  attachAssets,
  formatTag,
  deleteTag,
  deleteGithubRelease,
  isGitAvailable,
  isGhCliAvailable,
  hasGithubToken,
  execCommand,
} = require("../git-operations");

// Mock child_process
jest.mock("child_process");

// Mock fs
jest.mock("fs");

describe("git-operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
  });

  describe("execCommand", () => {
    it("should execute command successfully and return output", () => {
      execSync.mockReturnValue("Command output\n");

      const result = execCommand("git status");

      expect(result).toBe("Command output");
      expect(execSync).toHaveBeenCalledWith("git status", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    });

    it("should pass custom options to execSync", () => {
      execSync.mockReturnValue("Success\n");

      const result = execCommand("git log", { cwd: "/custom/path" });

      expect(result).toBe("Success");
      expect(execSync).toHaveBeenCalledWith("git log", {
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

      expect(() => execCommand("git push")).toThrow("Command failed: git push");

      try {
        execCommand("git push");
      } catch (error) {
        expect(error.output).toContain("Some output");
        expect(error.output).toContain("Error message");
        expect(error.exitCode).toBe(1);
      }
    });
  });

  describe("isGitAvailable", () => {
    it("should return true when git is available", () => {
      execSync.mockReturnValue("git version 2.30.0\n");

      const result = isGitAvailable();

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        "git --version",
        expect.any(Object)
      );
    });

    it("should return false when git is not available", () => {
      execSync.mockImplementation(() => {
        throw new Error("Command not found");
      });

      const result = isGitAvailable();

      expect(result).toBe(false);
    });
  });

  describe("isGhCliAvailable", () => {
    it("should return true when gh CLI is available", () => {
      execSync.mockReturnValue("gh version 2.0.0\n");

      const result = isGhCliAvailable();

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith("gh --version", expect.any(Object));
    });

    it("should return false when gh CLI is not available", () => {
      execSync.mockImplementation(() => {
        throw new Error("Command not found");
      });

      const result = isGhCliAvailable();

      expect(result).toBe(false);
    });
  });

  describe("hasGithubToken", () => {
    it("should return true when GITHUB_TOKEN is set", () => {
      process.env.GITHUB_TOKEN = "test-token";

      const result = hasGithubToken();

      expect(result).toBe(true);
    });

    it("should return true when GH_TOKEN is set", () => {
      process.env.GH_TOKEN = "test-token";

      const result = hasGithubToken();

      expect(result).toBe(true);
    });

    it("should return false when no token is set", () => {
      const result = hasGithubToken();

      expect(result).toBe(false);
    });
  });

  describe("formatTag", () => {
    it("should format tag correctly", () => {
      const tag = formatTag("debugger", "1.0.0");

      expect(tag).toBe("debugger-v1.0.0");
    });

    it("should format tag with prerelease version", () => {
      const tag = formatTag("screenshot", "2.1.0-beta.1");

      expect(tag).toBe("screenshot-v2.1.0-beta.1");
    });

    it("should throw error for empty package name", () => {
      expect(() => formatTag("", "1.0.0")).toThrow(
        "Package name must be a non-empty string"
      );
    });

    it("should throw error for empty version", () => {
      expect(() => formatTag("debugger", "")).toThrow(
        "Version must be a non-empty string"
      );
    });

    it("should throw error for non-string package name", () => {
      expect(() => formatTag(null, "1.0.0")).toThrow(
        "Package name must be a non-empty string"
      );
    });

    it("should throw error for non-string version", () => {
      expect(() => formatTag("debugger", null)).toThrow(
        "Version must be a non-empty string"
      );
    });
  });

  describe("commitChanges", () => {
    beforeEach(() => {
      // Mock git commands
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          return "git version 2.30.0\n";
        }
        if (cmd === "git add -A") {
          return "";
        }
        if (cmd === "git diff --cached --quiet") {
          // Throw error to indicate there are changes
          const error = new Error("Command failed");
          error.status = 1;
          throw error;
        }
        if (cmd.startsWith("git commit")) {
          return "";
        }
        if (cmd === "git rev-parse HEAD") {
          return "abc123def456\n";
        }
        return "";
      });
    });

    it("should commit changes successfully", async () => {
      const hash = await commitChanges("Release version 1.0.0");

      expect(hash).toBe("abc123def456");
      expect(execSync).toHaveBeenCalledWith("git add -A", expect.any(Object));
      expect(execSync).toHaveBeenCalledWith(
        'git commit -m "Release version 1.0.0"',
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        "git rev-parse HEAD",
        expect.any(Object)
      );
    });

    it("should escape quotes in commit message", async () => {
      await commitChanges('Release "version" 1.0.0');

      expect(execSync).toHaveBeenCalledWith(
        'git commit -m "Release \\"version\\" 1.0.0"',
        expect.any(Object)
      );
    });

    it("should throw error for empty commit message", async () => {
      await expect(commitChanges("")).rejects.toThrow(
        "Commit message must be a non-empty string"
      );
    });

    it("should throw error when git is not available", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          throw new Error("Command not found");
        }
        return "";
      });

      await expect(commitChanges("Test commit")).rejects.toThrow(
        "Git is not available"
      );
    });

    it("should throw error when no changes to commit", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          return "git version 2.30.0\n";
        }
        if (cmd === "git add -A") {
          return "";
        }
        if (cmd === "git diff --cached --quiet") {
          // No error means no changes
          return "";
        }
        return "";
      });

      await expect(commitChanges("Test commit")).rejects.toThrow(
        "No changes to commit"
      );
    });

    it("should handle commit failure", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          return "git version 2.30.0\n";
        }
        if (cmd === "git add -A") {
          return "";
        }
        if (cmd === "git diff --cached --quiet") {
          const error = new Error("Command failed");
          error.status = 1;
          throw error;
        }
        if (cmd.startsWith("git commit")) {
          const error = new Error("Commit failed");
          error.status = 1;
          throw error;
        }
        return "";
      });

      await expect(commitChanges("Test commit")).rejects.toThrow(
        "Failed to commit changes"
      );
    });
  });

  describe("createTag", () => {
    beforeEach(() => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          return "git version 2.30.0\n";
        }
        if (cmd.startsWith("git rev-parse")) {
          // Tag doesn't exist
          const error = new Error("Command failed");
          error.status = 1;
          throw error;
        }
        if (cmd.startsWith("git tag")) {
          return "";
        }
        return "";
      });
    });

    it("should create tag successfully", async () => {
      await createTag("debugger-v1.0.0");

      expect(execSync).toHaveBeenCalledWith(
        "git tag debugger-v1.0.0",
        expect.any(Object)
      );
    });

    it("should create annotated tag with message", async () => {
      await createTag("debugger-v1.0.0", "Release version 1.0.0");

      expect(execSync).toHaveBeenCalledWith(
        'git tag -a debugger-v1.0.0 -m "Release version 1.0.0"',
        expect.any(Object)
      );
    });

    it("should escape quotes in tag message", async () => {
      await createTag("debugger-v1.0.0", 'Release "version" 1.0.0');

      expect(execSync).toHaveBeenCalledWith(
        'git tag -a debugger-v1.0.0 -m "Release \\"version\\" 1.0.0"',
        expect.any(Object)
      );
    });

    it("should throw error for empty tag name", async () => {
      await expect(createTag("")).rejects.toThrow(
        "Tag name must be a non-empty string"
      );
    });

    it("should throw error when git is not available", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          throw new Error("Command not found");
        }
        return "";
      });

      await expect(createTag("test-tag")).rejects.toThrow(
        "Git is not available"
      );
    });

    it("should throw error when tag already exists", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          return "git version 2.30.0\n";
        }
        if (cmd.startsWith("git rev-parse")) {
          // Tag exists
          return "abc123\n";
        }
        return "";
      });

      await expect(createTag("existing-tag")).rejects.toThrow(
        "Tag existing-tag already exists"
      );
    });
  });

  describe("pushToRemote", () => {
    beforeEach(() => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          return "git version 2.30.0\n";
        }
        if (cmd === "git rev-parse --abbrev-ref HEAD") {
          return "main\n";
        }
        if (cmd.startsWith("git push")) {
          return "";
        }
        return "";
      });
    });

    it("should push commits to remote", async () => {
      await pushToRemote(false);

      expect(execSync).toHaveBeenCalledWith(
        "git push origin main",
        expect.any(Object)
      );
      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining("--tags"),
        expect.any(Object)
      );
    });

    it("should push commits and tags to remote", async () => {
      await pushToRemote(true);

      expect(execSync).toHaveBeenCalledWith(
        "git push origin main",
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        "git push origin --tags",
        expect.any(Object)
      );
    });

    it("should use custom remote and branch", async () => {
      await pushToRemote(false, "upstream", "develop");

      expect(execSync).toHaveBeenCalledWith(
        "git push upstream develop",
        expect.any(Object)
      );
    });

    it("should throw error when git is not available", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          throw new Error("Command not found");
        }
        return "";
      });

      await expect(pushToRemote(false)).rejects.toThrow("Git is not available");
    });

    it("should handle push failure", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          return "git version 2.30.0\n";
        }
        if (cmd === "git rev-parse --abbrev-ref HEAD") {
          return "main\n";
        }
        if (cmd.startsWith("git push")) {
          const error = new Error("Push failed");
          error.status = 1;
          throw error;
        }
        return "";
      });

      await expect(pushToRemote(false)).rejects.toThrow(
        "Failed to push to remote"
      );
    });
  });

  describe("createGithubRelease", () => {
    beforeEach(() => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.mkdirSync = jest.fn();
      fs.writeFileSync = jest.fn();
      fs.unlinkSync = jest.fn();

      execSync.mockImplementation((cmd) => {
        if (cmd === "gh --version") {
          return "gh version 2.0.0\n";
        }
        if (cmd === "gh auth status") {
          return "Logged in\n";
        }
        if (cmd.startsWith("gh release create")) {
          return "https://github.com/owner/repo/releases/tag/v1.0.0\n";
        }
        return "";
      });
    });

    it("should create GitHub release successfully", async () => {
      const releaseData = {
        tag: "debugger-v1.0.0",
        name: "Debugger v1.0.0",
        body: "Release notes here",
        draft: false,
        prerelease: false,
      };

      const url = await createGithubRelease(releaseData);

      expect(url).toBe("https://github.com/owner/repo/releases/tag/v1.0.0");
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("gh release create debugger-v1.0.0"),
        expect.any(Object)
      );
    });

    it("should create draft release", async () => {
      const releaseData = {
        tag: "debugger-v1.0.0",
        name: "Debugger v1.0.0",
        body: "Release notes",
        draft: true,
        prerelease: false,
      };

      await createGithubRelease(releaseData);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("--draft"),
        expect.any(Object)
      );
    });

    it("should create prerelease", async () => {
      const releaseData = {
        tag: "debugger-v1.0.0-beta.1",
        name: "Debugger v1.0.0-beta.1",
        body: "Beta release",
        draft: false,
        prerelease: true,
      };

      await createGithubRelease(releaseData);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("--prerelease"),
        expect.any(Object)
      );
    });

    it("should throw error for missing tag", async () => {
      const releaseData = {
        name: "Release",
        body: "Notes",
      };

      await expect(createGithubRelease(releaseData)).rejects.toThrow(
        "Release tag must be a non-empty string"
      );
    });

    it("should throw error for missing name", async () => {
      const releaseData = {
        tag: "v1.0.0",
        body: "Notes",
      };

      await expect(createGithubRelease(releaseData)).rejects.toThrow(
        "Release name must be a non-empty string"
      );
    });

    it("should throw error for missing body", async () => {
      const releaseData = {
        tag: "v1.0.0",
        name: "Release",
      };

      await expect(createGithubRelease(releaseData)).rejects.toThrow(
        "Release body must be a string"
      );
    });

    it("should throw error when gh CLI is not available", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "gh --version") {
          throw new Error("Command not found");
        }
        return "";
      });

      const releaseData = {
        tag: "v1.0.0",
        name: "Release",
        body: "Notes",
      };

      await expect(createGithubRelease(releaseData)).rejects.toThrow(
        "GitHub CLI (gh) is not available"
      );
    });

    it("should throw error when not authenticated", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "gh --version") {
          return "gh version 2.0.0\n";
        }
        if (cmd === "gh auth status") {
          const error = new Error("Not logged in");
          error.status = 1;
          throw error;
        }
        return "";
      });

      const releaseData = {
        tag: "v1.0.0",
        name: "Release",
        body: "Notes",
      };

      await expect(createGithubRelease(releaseData)).rejects.toThrow(
        "GitHub authentication required"
      );
    });

    it("should skip auth check when token is available", async () => {
      process.env.GITHUB_TOKEN = "test-token";

      const releaseData = {
        tag: "v1.0.0",
        name: "Release",
        body: "Notes",
      };

      await createGithubRelease(releaseData);

      expect(execSync).not.toHaveBeenCalledWith(
        "gh auth status",
        expect.any(Object)
      );
    });

    it("should clean up temp file even on error", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "gh --version") {
          return "gh version 2.0.0\n";
        }
        if (cmd.startsWith("gh release create")) {
          throw new Error("Release creation failed");
        }
        return "";
      });

      process.env.GITHUB_TOKEN = "test-token";

      const releaseData = {
        tag: "v1.0.0",
        name: "Release",
        body: "Notes",
      };

      await expect(createGithubRelease(releaseData)).rejects.toThrow(
        "Failed to create GitHub release"
      );

      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe("attachAssets", () => {
    beforeEach(() => {
      fs.existsSync = jest.fn().mockReturnValue(true);

      execSync.mockImplementation((cmd) => {
        if (cmd === "gh --version") {
          return "gh version 2.0.0\n";
        }
        if (cmd.startsWith("gh release upload")) {
          return "";
        }
        return "";
      });
    });

    it("should attach assets successfully", async () => {
      const assetPaths = ["/path/to/binary1", "/path/to/binary2"];

      await attachAssets("debugger-v1.0.0", assetPaths);

      expect(execSync).toHaveBeenCalledWith(
        'gh release upload debugger-v1.0.0 "/path/to/binary1"',
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        'gh release upload debugger-v1.0.0 "/path/to/binary2"',
        expect.any(Object)
      );
    });

    it("should throw error for empty tag", async () => {
      await expect(attachAssets("", ["/path/to/file"])).rejects.toThrow(
        "Release tag must be a non-empty string"
      );
    });

    it("should throw error for empty asset paths", async () => {
      await expect(attachAssets("v1.0.0", [])).rejects.toThrow(
        "Asset paths must be a non-empty array"
      );
    });

    it("should throw error when gh CLI is not available", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "gh --version") {
          throw new Error("Command not found");
        }
        return "";
      });

      await expect(attachAssets("v1.0.0", ["/path/to/file"])).rejects.toThrow(
        "GitHub CLI (gh) is not available"
      );
    });

    it("should throw error when asset file does not exist", async () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      await expect(
        attachAssets("v1.0.0", ["/path/to/missing-file"])
      ).rejects.toThrow("Asset file not found");
    });

    it("should handle upload failure", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "gh --version") {
          return "gh version 2.0.0\n";
        }
        if (cmd.startsWith("gh release upload")) {
          throw new Error("Upload failed");
        }
        return "";
      });

      await expect(attachAssets("v1.0.0", ["/path/to/file"])).rejects.toThrow(
        "Failed to attach assets"
      );
    });
  });

  describe("deleteTag", () => {
    beforeEach(() => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          return "git version 2.30.0\n";
        }
        if (cmd.startsWith("git tag -d") || cmd.startsWith("git push")) {
          return "";
        }
        return "";
      });
    });

    it("should delete tag locally and remotely", async () => {
      await deleteTag("debugger-v1.0.0");

      expect(execSync).toHaveBeenCalledWith(
        "git tag -d debugger-v1.0.0",
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        "git push origin :refs/tags/debugger-v1.0.0",
        expect.any(Object)
      );
    });

    it("should use custom remote", async () => {
      await deleteTag("v1.0.0", "upstream");

      expect(execSync).toHaveBeenCalledWith(
        "git push upstream :refs/tags/v1.0.0",
        expect.any(Object)
      );
    });

    it("should throw error for empty tag name", async () => {
      await expect(deleteTag("")).rejects.toThrow(
        "Tag name must be a non-empty string"
      );
    });

    it("should throw error when git is not available", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          throw new Error("Command not found");
        }
        return "";
      });

      await expect(deleteTag("v1.0.0")).rejects.toThrow("Git is not available");
    });

    it("should continue if local tag does not exist", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          return "git version 2.30.0\n";
        }
        if (cmd.startsWith("git tag -d")) {
          throw new Error("Tag not found");
        }
        if (cmd.startsWith("git push")) {
          return "";
        }
        return "";
      });

      await expect(deleteTag("v1.0.0")).resolves.not.toThrow();
    });

    it("should continue if remote tag does not exist", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "git --version") {
          return "git version 2.30.0\n";
        }
        if (cmd.startsWith("git tag -d")) {
          return "";
        }
        if (cmd.startsWith("git push")) {
          throw new Error("Tag not found");
        }
        return "";
      });

      await expect(deleteTag("v1.0.0")).resolves.not.toThrow();
    });
  });

  describe("deleteGithubRelease", () => {
    beforeEach(() => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "gh --version") {
          return "gh version 2.0.0\n";
        }
        if (cmd.startsWith("gh release delete")) {
          return "";
        }
        return "";
      });
    });

    it("should delete GitHub release", async () => {
      await deleteGithubRelease("debugger-v1.0.0");

      expect(execSync).toHaveBeenCalledWith(
        "gh release delete debugger-v1.0.0 --yes",
        expect.any(Object)
      );
    });

    it("should throw error for empty tag", async () => {
      await expect(deleteGithubRelease("")).rejects.toThrow(
        "Release tag must be a non-empty string"
      );
    });

    it("should throw error when gh CLI is not available", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "gh --version") {
          throw new Error("Command not found");
        }
        return "";
      });

      await expect(deleteGithubRelease("v1.0.0")).rejects.toThrow(
        "GitHub CLI (gh) is not available"
      );
    });

    it("should handle deletion failure", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd === "gh --version") {
          return "gh version 2.0.0\n";
        }
        if (cmd.startsWith("gh release delete")) {
          throw new Error("Release not found");
        }
        return "";
      });

      await expect(deleteGithubRelease("v1.0.0")).rejects.toThrow(
        "Failed to delete GitHub release"
      );
    });
  });
});
