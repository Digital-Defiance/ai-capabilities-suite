/**
 * @fileoverview Property-based tests for pre-flight checker
 * Feature: release-automation, Property 2: Pre-flight checks prevent invalid releases
 * Validates: Requirements 3.6
 */

const fc = require("fast-check");
const { runChecks } = require("../preflight-checker");

// Mock child_process
jest.mock("child_process");
const { execSync } = require("child_process");

// Mock fs
jest.mock("fs");
const fs = require("fs");

describe("preflight-checker property tests", () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  /**
   * Property 2: Pre-flight checks prevent invalid releases
   * For any release configuration, if any pre-flight check fails,
   * then the overall result should indicate failure (passed=false)
   */
  describe("Property 2: Pre-flight checks prevent invalid releases", () => {
    it("should fail overall when any individual check fails", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random check failure scenarios
          fc.record({
            gitStatusDirty: fc.boolean(),
            wrongBranch: fc.boolean(),
            outOfSync: fc.boolean(),
            testsFail: fc.boolean(),
            buildFails: fc.boolean(),
            noNpmAuth: fc.boolean(),
            noVscodeToken: fc.boolean(),
            noGithubToken: fc.boolean(),
          }),
          async (failureScenario) => {
            // Set up mocks based on failure scenario
            execSync.mockImplementation((cmd) => {
              if (cmd === "git status --porcelain") {
                return failureScenario.gitStatusDirty ? "M file.js" : "";
              }
              if (cmd === "git rev-parse --abbrev-ref HEAD") {
                return failureScenario.wrongBranch ? "feature/test" : "main";
              }
              if (cmd === "git fetch origin") return "";
              if (cmd === "git rev-parse HEAD") {
                return failureScenario.outOfSync ? "abc123" : "def456";
              }
              if (cmd === "git rev-parse @{u}") return "def456";
              if (cmd.includes("test")) {
                if (failureScenario.testsFail) {
                  throw new Error("Tests failed");
                }
                return "Tests passed";
              }
              if (cmd.includes("build")) {
                if (failureScenario.buildFails) {
                  throw new Error("Build failed");
                }
                return "Build complete";
              }
              if (cmd === "npm whoami") {
                if (failureScenario.noNpmAuth) {
                  throw new Error("Not logged in");
                }
                return "testuser";
              }
              return "";
            });

            fs.existsSync.mockReturnValue(true);

            // Set up environment variables
            if (failureScenario.noVscodeToken) {
              delete process.env.VSCE_PAT;
              delete process.env.VSCODE_MARKETPLACE_TOKEN;
            } else {
              process.env.VSCE_PAT = "test-token";
            }

            if (failureScenario.noGithubToken) {
              delete process.env.GITHUB_TOKEN;
              delete process.env.GH_TOKEN;
            } else {
              process.env.GITHUB_TOKEN = "test-token";
            }

            const config = {
              testCommand: "npm test",
              buildCommand: "npm run build",
            };

            const options = {
              dryRun: false,
              skipTests: false,
              skipBuild: false,
              includeDocker: false,
            };

            const result = await runChecks(config, options);

            // Determine if any check should have failed
            const shouldFail =
              failureScenario.gitStatusDirty ||
              failureScenario.wrongBranch ||
              failureScenario.outOfSync ||
              failureScenario.testsFail ||
              failureScenario.buildFails ||
              failureScenario.noNpmAuth ||
              failureScenario.noVscodeToken ||
              failureScenario.noGithubToken;

            if (shouldFail) {
              // If any check should fail, overall result should be failed
              expect(result.passed).toBe(false);
              // At least one check should have failed
              expect(result.checks.some((c) => !c.passed)).toBe(true);
            } else {
              // If no checks should fail, overall result should pass
              expect(result.passed).toBe(true);
              // All checks should have passed
              expect(result.checks.every((c) => c.passed)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should always pass all checks when environment is valid", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random valid configurations
          fc.record({
            branch: fc.constantFrom("main", "master"),
            testCommand: fc.constantFrom("npm test", "yarn test", "pnpm test"),
            buildCommand: fc.constantFrom(
              "npm run build",
              "yarn build",
              "pnpm build"
            ),
          }),
          async (config) => {
            // Mock all checks to pass
            execSync.mockImplementation((cmd) => {
              if (cmd === "git status --porcelain") return "";
              if (cmd === "git rev-parse --abbrev-ref HEAD")
                return config.branch;
              if (cmd === "git fetch origin") return "";
              if (cmd === "git rev-parse HEAD") return "abc123";
              if (cmd === "git rev-parse @{u}") return "abc123";
              if (cmd === config.testCommand) return "Tests passed";
              if (cmd === config.buildCommand) return "Build complete";
              if (cmd === "npm whoami") return "testuser";
              return "";
            });

            fs.existsSync.mockReturnValue(true);
            process.env.VSCE_PAT = "test-token";
            process.env.GITHUB_TOKEN = "test-token";

            const releaseConfig = {
              testCommand: config.testCommand,
              buildCommand: config.buildCommand,
            };

            const options = {
              dryRun: false,
              skipTests: false,
              skipBuild: false,
              includeDocker: false,
            };

            const result = await runChecks(releaseConfig, options);

            // All checks should pass
            expect(result.passed).toBe(true);
            expect(result.checks.every((c) => c.passed)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should skip credential checks in dry-run mode regardless of credentials", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random credential states
          fc.record({
            hasNpmAuth: fc.boolean(),
            hasVscodeToken: fc.boolean(),
            hasGithubToken: fc.boolean(),
            hasDockerAuth: fc.boolean(),
          }),
          async (credentialState) => {
            // Mock git checks to pass
            execSync.mockImplementation((cmd) => {
              if (cmd === "git status --porcelain") return "";
              if (cmd === "git rev-parse --abbrev-ref HEAD") return "main";
              if (cmd === "git fetch origin") return "";
              if (cmd === "git rev-parse HEAD") return "abc123";
              if (cmd === "git rev-parse @{u}") return "abc123";
              if (cmd === "npm whoami") {
                if (!credentialState.hasNpmAuth) {
                  throw new Error("Not logged in");
                }
                return "testuser";
              }
              return "";
            });

            fs.existsSync.mockReturnValue(credentialState.hasDockerAuth);

            if (credentialState.hasVscodeToken) {
              process.env.VSCE_PAT = "test-token";
            } else {
              delete process.env.VSCE_PAT;
              delete process.env.VSCODE_MARKETPLACE_TOKEN;
            }

            if (credentialState.hasGithubToken) {
              process.env.GITHUB_TOKEN = "test-token";
            } else {
              delete process.env.GITHUB_TOKEN;
              delete process.env.GH_TOKEN;
            }

            const config = {
              testCommand: "npm test",
              buildCommand: "npm run build",
            };

            const options = {
              dryRun: true,
              skipTests: true,
              skipBuild: true,
              includeDocker: false,
            };

            const result = await runChecks(config, options);

            // In dry-run mode, credential checks should not be performed
            expect(
              result.checks.some((c) => c.name === "NPM Authentication")
            ).toBe(false);
            expect(
              result.checks.some((c) => c.name === "VSCode Marketplace Token")
            ).toBe(false);
            expect(result.checks.some((c) => c.name === "GitHub Token")).toBe(
              false
            );
            expect(
              result.checks.some((c) => c.name === "Docker Authentication")
            ).toBe(false);

            // Only git checks should be performed, and they should pass
            expect(result.passed).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should include Docker check only when includeDocker is true", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // includeDocker flag
          fc.boolean(), // hasDockerAuth
          async (includeDocker, hasDockerAuth) => {
            // Mock all checks to pass except potentially Docker
            execSync.mockImplementation((cmd) => {
              if (cmd === "git status --porcelain") return "";
              if (cmd === "git rev-parse --abbrev-ref HEAD") return "main";
              if (cmd === "git fetch origin") return "";
              if (cmd === "git rev-parse HEAD") return "abc123";
              if (cmd === "git rev-parse @{u}") return "abc123";
              if (cmd === "npm whoami") return "testuser";
              if (cmd === "docker info") {
                if (!hasDockerAuth) {
                  throw new Error("Docker not running");
                }
                return "Docker info";
              }
              return "";
            });

            fs.existsSync.mockReturnValue(hasDockerAuth);
            process.env.VSCE_PAT = "test-token";
            process.env.GITHUB_TOKEN = "test-token";

            const config = {
              testCommand: "npm test",
              buildCommand: "npm run build",
            };

            const options = {
              dryRun: false,
              skipTests: true,
              skipBuild: true,
              includeDocker,
            };

            const result = await runChecks(config, options);

            const hasDockerCheck = result.checks.some(
              (c) => c.name === "Docker Authentication"
            );

            // Docker check should only be present when includeDocker is true
            expect(hasDockerCheck).toBe(includeDocker);

            // If Docker check is present and Docker auth is missing, overall should fail
            if (includeDocker && !hasDockerAuth) {
              expect(result.passed).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
