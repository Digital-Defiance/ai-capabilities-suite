/**
 * @fileoverview Unit tests for pre-flight checker
 */

const {
  runChecks,
  checkGitStatus,
  checkBranch,
  checkRemoteSync,
  checkTests,
  checkBuild,
  checkNpmAuth,
  checkVscodeToken,
  checkDockerAuth,
  checkGithubToken,
} = require("../preflight-checker");

// Mock child_process
jest.mock("child_process");
const { execSync } = require("child_process");

// Mock fs
jest.mock("fs");
const fs = require("fs");

describe("preflight-checker", () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env vars
    process.env = { ...originalEnv };
  });

  describe("checkGitStatus", () => {
    it("should pass when working directory is clean", async () => {
      execSync.mockReturnValue("");

      const result = await checkGitStatus();

      expect(result.name).toBe("Git Status");
      expect(result.passed).toBe(true);
      expect(result.message).toContain("clean");
      expect(execSync).toHaveBeenCalledWith(
        "git status --porcelain",
        expect.any(Object)
      );
    });

    it("should fail when working directory has uncommitted changes", async () => {
      execSync.mockReturnValue("M file.js\n?? newfile.js");

      const result = await checkGitStatus();

      expect(result.name).toBe("Git Status");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("uncommitted changes");
    });

    it("should fail when git command fails", async () => {
      execSync.mockImplementation(() => {
        throw new Error("Not a git repository");
      });

      const result = await checkGitStatus();

      expect(result.name).toBe("Git Status");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("Failed to check Git status");
    });
  });

  describe("checkBranch", () => {
    it("should pass when on main branch", async () => {
      execSync.mockReturnValue("main");

      const result = await checkBranch();

      expect(result.name).toBe("Branch Check");
      expect(result.passed).toBe(true);
      expect(result.message).toContain("main");
    });

    it("should pass when on master branch", async () => {
      execSync.mockReturnValue("master");

      const result = await checkBranch();

      expect(result.name).toBe("Branch Check");
      expect(result.passed).toBe(true);
      expect(result.message).toContain("master");
    });

    it("should fail when on feature branch", async () => {
      execSync.mockReturnValue("feature/new-feature");

      const result = await checkBranch();

      expect(result.name).toBe("Branch Check");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("feature/new-feature");
      expect(result.message).toContain("main/master");
    });

    it("should fail when git command fails", async () => {
      execSync.mockImplementation(() => {
        throw new Error("Not a git repository");
      });

      const result = await checkBranch();

      expect(result.name).toBe("Branch Check");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("Failed to check current branch");
    });
  });

  describe("checkRemoteSync", () => {
    it("should pass when local and remote are in sync", async () => {
      const commitHash = "abc123def456";
      execSync.mockReturnValue(commitHash);

      const result = await checkRemoteSync();

      expect(result.name).toBe("Remote Sync");
      expect(result.passed).toBe(true);
      expect(result.message).toContain("up-to-date");
      expect(execSync).toHaveBeenCalledWith(
        "git fetch origin",
        expect.any(Object)
      );
    });

    it("should fail when local and remote are out of sync", async () => {
      execSync
        .mockReturnValueOnce("") // git fetch
        .mockReturnValueOnce("abc123") // local commit
        .mockReturnValueOnce("def456"); // remote commit

      const result = await checkRemoteSync();

      expect(result.name).toBe("Remote Sync");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("not in sync");
    });

    it("should fail when git command fails", async () => {
      execSync.mockImplementation(() => {
        throw new Error("No upstream branch");
      });

      const result = await checkRemoteSync();

      expect(result.name).toBe("Remote Sync");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("Failed to check remote sync");
    });
  });

  describe("checkTests", () => {
    it("should pass when tests succeed", async () => {
      execSync.mockReturnValue("All tests passed");

      const config = {
        testCommand: "npm test",
      };

      const result = await checkTests(config);

      expect(result.name).toBe("Tests");
      expect(result.passed).toBe(true);
      expect(result.message).toContain("passed");
      expect(execSync).toHaveBeenCalledWith(
        "npm test",
        expect.objectContaining({
          cwd: expect.stringContaining("ai-capabilities-suite"),
        })
      );
    });

    it("should fail when tests fail", async () => {
      execSync.mockImplementation(() => {
        throw new Error("Test suite failed");
      });

      const config = {
        testCommand: "npm test",
      };

      const result = await checkTests(config);

      expect(result.name).toBe("Tests");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("Tests failed");
    });
  });

  describe("checkBuild", () => {
    it("should pass when build succeeds", async () => {
      execSync.mockReturnValue("Build completed");

      const config = {
        buildCommand: "npm run build",
      };

      const result = await checkBuild(config);

      expect(result.name).toBe("Build");
      expect(result.passed).toBe(true);
      expect(result.message).toContain("completed successfully");
      expect(execSync).toHaveBeenCalledWith(
        "npm run build",
        expect.objectContaining({
          cwd: expect.stringContaining("ai-capabilities-suite"),
        })
      );
    });

    it("should fail when build fails", async () => {
      execSync.mockImplementation(() => {
        throw new Error("Build failed");
      });

      const config = {
        buildCommand: "npm run build",
      };

      const result = await checkBuild(config);

      expect(result.name).toBe("Build");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("Build failed");
    });
  });

  describe("checkNpmAuth", () => {
    it("should pass when npm authentication is configured", async () => {
      execSync.mockReturnValue("username");

      const result = await checkNpmAuth();

      expect(result.name).toBe("NPM Authentication");
      expect(result.passed).toBe(true);
      expect(result.message).toContain("configured");
      expect(execSync).toHaveBeenCalledWith("npm whoami", expect.any(Object));
    });

    it("should fail when npm authentication is not configured", async () => {
      execSync.mockImplementation(() => {
        throw new Error("Not logged in");
      });

      const result = await checkNpmAuth();

      expect(result.name).toBe("NPM Authentication");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("npm login");
    });
  });

  describe("checkVscodeToken", () => {
    it("should pass when VSCE_PAT is set", async () => {
      process.env.VSCE_PAT = "test-token";

      const result = await checkVscodeToken();

      expect(result.name).toBe("VSCode Marketplace Token");
      expect(result.passed).toBe(true);
      expect(result.message).toContain("configured");
    });

    it("should pass when VSCODE_MARKETPLACE_TOKEN is set", async () => {
      process.env.VSCODE_MARKETPLACE_TOKEN = "test-token";

      const result = await checkVscodeToken();

      expect(result.name).toBe("VSCode Marketplace Token");
      expect(result.passed).toBe(true);
      expect(result.message).toContain("configured");
    });

    it("should fail when no token is set", async () => {
      delete process.env.VSCE_PAT;
      delete process.env.VSCODE_MARKETPLACE_TOKEN;

      const result = await checkVscodeToken();

      expect(result.name).toBe("VSCode Marketplace Token");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("VSCE_PAT");
    });
  });

  describe("checkDockerAuth", () => {
    it("should pass when docker is authenticated", async () => {
      execSync.mockReturnValue("Docker info");
      fs.existsSync.mockReturnValue(true);

      const result = await checkDockerAuth();

      expect(result.name).toBe("Docker Authentication");
      expect(result.passed).toBe(true);
      expect(result.message).toContain("configured");
      expect(execSync).toHaveBeenCalledWith("docker info", expect.any(Object));
    });

    it("should fail when docker config does not exist", async () => {
      execSync.mockReturnValue("Docker info");
      fs.existsSync.mockReturnValue(false);

      const result = await checkDockerAuth();

      expect(result.name).toBe("Docker Authentication");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("docker login");
    });

    it("should fail when docker command fails", async () => {
      execSync.mockImplementation(() => {
        throw new Error("Docker not running");
      });

      const result = await checkDockerAuth();

      expect(result.name).toBe("Docker Authentication");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("Docker check failed");
    });
  });

  describe("checkGithubToken", () => {
    it("should pass when GITHUB_TOKEN is set", async () => {
      process.env.GITHUB_TOKEN = "test-token";

      const result = await checkGithubToken();

      expect(result.name).toBe("GitHub Token");
      expect(result.passed).toBe(true);
      expect(result.message).toContain("configured");
    });

    it("should pass when GH_TOKEN is set", async () => {
      process.env.GH_TOKEN = "test-token";

      const result = await checkGithubToken();

      expect(result.name).toBe("GitHub Token");
      expect(result.passed).toBe(true);
      expect(result.message).toContain("configured");
    });

    it("should fail when no token is set", async () => {
      delete process.env.GITHUB_TOKEN;
      delete process.env.GH_TOKEN;

      const result = await checkGithubToken();

      expect(result.name).toBe("GitHub Token");
      expect(result.passed).toBe(false);
      expect(result.message).toContain("GITHUB_TOKEN");
    });
  });

  describe("runChecks", () => {
    const mockConfig = {
      testCommand: "npm test",
      buildCommand: "npm run build",
    };

    beforeEach(() => {
      // Mock all checks to pass by default
      execSync.mockReturnValue("");
      fs.existsSync.mockReturnValue(true);
      process.env.VSCE_PAT = "test-token";
      process.env.GITHUB_TOKEN = "test-token";
    });

    it("should run all checks when not in dry-run mode", async () => {
      // Mock execSync to return appropriate values for different commands
      execSync.mockImplementation((cmd) => {
        if (cmd === "git status --porcelain") return "";
        if (cmd === "git rev-parse --abbrev-ref HEAD") return "main";
        if (cmd === "git fetch origin") return "";
        if (cmd === "git rev-parse HEAD") return "abc123";
        if (cmd === "git rev-parse @{u}") return "abc123";
        if (cmd === "npm test") return "Tests passed";
        if (cmd === "npm run build") return "Build complete";
        if (cmd === "npm whoami") return "testuser";
        return "";
      });

      const options = {
        dryRun: false,
        skipTests: false,
        skipBuild: false,
        includeDocker: false,
      };

      const result = await runChecks(mockConfig, options);

      expect(result.passed).toBe(true);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.checks.some((c) => c.name === "Git Status")).toBe(true);
      expect(result.checks.some((c) => c.name === "Branch Check")).toBe(true);
      expect(result.checks.some((c) => c.name === "Tests")).toBe(true);
      expect(result.checks.some((c) => c.name === "Build")).toBe(true);
      expect(result.checks.some((c) => c.name === "NPM Authentication")).toBe(
        true
      );
    });

    it("should skip tests when skipTests is true", async () => {
      const options = {
        dryRun: false,
        skipTests: true,
        skipBuild: false,
        includeDocker: false,
      };

      const result = await runChecks(mockConfig, options);

      expect(result.checks.some((c) => c.name === "Tests")).toBe(false);
    });

    it("should skip build when skipBuild is true", async () => {
      const options = {
        dryRun: false,
        skipTests: false,
        skipBuild: true,
        includeDocker: false,
      };

      const result = await runChecks(mockConfig, options);

      expect(result.checks.some((c) => c.name === "Build")).toBe(false);
    });

    it("should skip credential checks in dry-run mode", async () => {
      const options = {
        dryRun: true,
        skipTests: false,
        skipBuild: false,
        includeDocker: false,
      };

      const result = await runChecks(mockConfig, options);

      expect(result.checks.some((c) => c.name === "NPM Authentication")).toBe(
        false
      );
      expect(
        result.checks.some((c) => c.name === "VSCode Marketplace Token")
      ).toBe(false);
      expect(result.checks.some((c) => c.name === "GitHub Token")).toBe(false);
    });

    it("should include Docker check when includeDocker is true", async () => {
      const options = {
        dryRun: false,
        skipTests: false,
        skipBuild: false,
        includeDocker: true,
      };

      const result = await runChecks(mockConfig, options);

      expect(
        result.checks.some((c) => c.name === "Docker Authentication")
      ).toBe(true);
    });

    it("should not include Docker check when includeDocker is false", async () => {
      const options = {
        dryRun: false,
        skipTests: false,
        skipBuild: false,
        includeDocker: false,
      };

      const result = await runChecks(mockConfig, options);

      expect(
        result.checks.some((c) => c.name === "Docker Authentication")
      ).toBe(false);
    });

    it("should return passed=false when any check fails", async () => {
      // Make Git status check fail
      execSync.mockReturnValueOnce("M file.js");

      const options = {
        dryRun: true,
        skipTests: true,
        skipBuild: true,
        includeDocker: false,
      };

      const result = await runChecks(mockConfig, options);

      expect(result.passed).toBe(false);
      const gitCheck = result.checks.find((c) => c.name === "Git Status");
      expect(gitCheck.passed).toBe(false);
    });

    it("should return passed=true when all checks pass", async () => {
      // Mock execSync to return appropriate values for git commands
      execSync.mockImplementation((cmd) => {
        if (cmd === "git status --porcelain") return "";
        if (cmd === "git rev-parse --abbrev-ref HEAD") return "main";
        if (cmd === "git fetch origin") return "";
        if (cmd === "git rev-parse HEAD") return "abc123";
        if (cmd === "git rev-parse @{u}") return "abc123";
        return "";
      });

      const options = {
        dryRun: true,
        skipTests: true,
        skipBuild: true,
        includeDocker: false,
      };

      const result = await runChecks(mockConfig, options);

      expect(result.passed).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });
  });
});
