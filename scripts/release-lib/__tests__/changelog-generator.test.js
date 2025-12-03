/**
 * @fileoverview Unit tests for changelog generator
 */

const fs = require("fs");
const path = require("path");
const {
  extractCommits,
  categorizeCommits,
  generateCommitUrl,
  generatePrUrl,
  formatCommit,
  formatChangelog,
  generate,
  format,
  updateChangelogFile,
} = require("../changelog-generator");

// Mock execCommand for testing
jest.mock("../git-operations", () => {
  const actual = jest.requireActual("../git-operations");
  return {
    ...actual,
    execCommand: jest.fn(),
  };
});

const { execCommand } = require("../git-operations");

describe("changelog-generator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("extractCommits", () => {
    it("should extract commits from Git history", async () => {
      const gitOutput = `abc123|John Doe|2024-01-15T10:00:00Z|feat: add new feature
def456|Jane Smith|2024-01-14T09:00:00Z|fix: resolve bug (#123)
ghi789|Bob Johnson|2024-01-13T08:00:00Z|docs: update README`;

      execCommand.mockReturnValue(gitOutput);

      const commits = await extractCommits("v1.0.0", "v1.1.0");

      expect(commits).toHaveLength(3);
      expect(commits[0]).toMatchObject({
        hash: "abc123",
        author: "John Doe",
        message: "feat: add new feature",
      });
      expect(commits[1]).toMatchObject({
        hash: "def456",
        author: "Jane Smith",
        message: "fix: resolve bug (#123)",
        pr: 123,
      });
      expect(commits[2]).toMatchObject({
        hash: "ghi789",
        author: "Bob Johnson",
        message: "docs: update README",
      });
    });

    it("should return empty array when no commits found", async () => {
      execCommand.mockReturnValue("");

      const commits = await extractCommits("v1.0.0", "v1.1.0");

      expect(commits).toEqual([]);
    });

    it("should throw error for invalid fromTag", async () => {
      await expect(extractCommits("", "v1.1.0")).rejects.toThrow(
        "fromTag must be a non-empty string"
      );
      await expect(extractCommits(null, "v1.1.0")).rejects.toThrow(
        "fromTag must be a non-empty string"
      );
    });

    it("should throw error for invalid toTag", async () => {
      await expect(extractCommits("v1.0.0", "")).rejects.toThrow(
        "toTag must be a non-empty string"
      );
      await expect(extractCommits("v1.0.0", null)).rejects.toThrow(
        "toTag must be a non-empty string"
      );
    });

    it("should handle commits with pipe characters in message", async () => {
      const gitOutput = `abc123|John Doe|2024-01-15T10:00:00Z|feat: add feature | with pipe`;

      execCommand.mockReturnValue(gitOutput);

      const commits = await extractCommits("v1.0.0", "v1.1.0");

      expect(commits).toHaveLength(1);
      expect(commits[0].message).toBe("feat: add feature | with pipe");
    });

    it("should extract PR numbers from various formats", async () => {
      const gitOutput = `abc123|John Doe|2024-01-15T10:00:00Z|feat: add feature (#123)
def456|Jane Smith|2024-01-14T09:00:00Z|fix: bug #456
ghi789|Bob Johnson|2024-01-13T08:00:00Z|chore: update`;

      execCommand.mockReturnValue(gitOutput);

      const commits = await extractCommits("v1.0.0", "v1.1.0");

      expect(commits[0].pr).toBe(123);
      expect(commits[1].pr).toBe(456);
      expect(commits[2].pr).toBeUndefined();
    });
  });

  describe("categorizeCommits", () => {
    it("should categorize feature commits", () => {
      const commits = [
        {
          hash: "abc123",
          author: "John",
          date: new Date(),
          message: "feat: add feature",
        },
        {
          hash: "def456",
          author: "Jane",
          date: new Date(),
          message: "feature: implement something",
        },
        {
          hash: "ghi789",
          author: "Bob",
          date: new Date(),
          message: "Add new functionality",
        },
      ];

      const changelog = categorizeCommits(commits);

      expect(changelog.features).toHaveLength(3);
      expect(changelog.fixes).toHaveLength(0);
      expect(changelog.breaking).toHaveLength(0);
      expect(changelog.other).toHaveLength(0);
    });

    it("should categorize fix commits", () => {
      const commits = [
        {
          hash: "abc123",
          author: "John",
          date: new Date(),
          message: "fix: resolve bug",
        },
        {
          hash: "def456",
          author: "Jane",
          date: new Date(),
          message: "bugfix: correct issue",
        },
        {
          hash: "ghi789",
          author: "Bob",
          date: new Date(),
          message: "Fix memory leak",
        },
      ];

      const changelog = categorizeCommits(commits);

      expect(changelog.features).toHaveLength(0);
      expect(changelog.fixes).toHaveLength(3);
      expect(changelog.breaking).toHaveLength(0);
      expect(changelog.other).toHaveLength(0);
    });

    it("should categorize breaking change commits", () => {
      const commits = [
        {
          hash: "abc123",
          author: "John",
          date: new Date(),
          message: "feat!: breaking change",
        },
        {
          hash: "def456",
          author: "Jane",
          date: new Date(),
          message: "BREAKING CHANGE: remove API",
        },
        {
          hash: "ghi789",
          author: "Bob",
          date: new Date(),
          message: "breaking: update interface",
        },
      ];

      const changelog = categorizeCommits(commits);

      expect(changelog.features).toHaveLength(0);
      expect(changelog.fixes).toHaveLength(0);
      expect(changelog.breaking).toHaveLength(3);
      expect(changelog.other).toHaveLength(0);
    });

    it("should categorize other commits", () => {
      const commits = [
        {
          hash: "abc123",
          author: "John",
          date: new Date(),
          message: "chore: update deps",
        },
        {
          hash: "def456",
          author: "Jane",
          date: new Date(),
          message: "docs: update README",
        },
        {
          hash: "ghi789",
          author: "Bob",
          date: new Date(),
          message: "refactor: clean code",
        },
      ];

      const changelog = categorizeCommits(commits);

      expect(changelog.features).toHaveLength(0);
      expect(changelog.fixes).toHaveLength(0);
      expect(changelog.breaking).toHaveLength(0);
      expect(changelog.other).toHaveLength(3);
    });

    it("should prioritize breaking changes over other categories", () => {
      const commits = [
        {
          hash: "abc123",
          author: "John",
          date: new Date(),
          message: "feat!: breaking feature",
        },
      ];

      const changelog = categorizeCommits(commits);

      expect(changelog.breaking).toHaveLength(1);
      expect(changelog.features).toHaveLength(0);
    });

    it("should handle empty array", () => {
      const changelog = categorizeCommits([]);

      expect(changelog.features).toEqual([]);
      expect(changelog.fixes).toEqual([]);
      expect(changelog.breaking).toEqual([]);
      expect(changelog.other).toEqual([]);
    });

    it("should throw error for invalid input", () => {
      expect(() => categorizeCommits(null)).toThrow("commits must be an array");
      expect(() => categorizeCommits("not an array")).toThrow(
        "commits must be an array"
      );
    });
  });

  describe("generateCommitUrl", () => {
    it("should generate commit URL with provided repo URL", () => {
      const url = generateCommitUrl(
        "abc123def456",
        "https://github.com/user/repo"
      );

      expect(url).toBe("https://github.com/user/repo/commit/abc123def456");
    });

    it("should generate commit URL from git remote", () => {
      execCommand.mockReturnValue("https://github.com/user/repo.git");

      const url = generateCommitUrl("abc123def456");

      expect(url).toBe("https://github.com/user/repo/commit/abc123def456");
    });

    it("should handle SSH remote URLs", () => {
      execCommand.mockReturnValue("git@github.com:user/repo.git");

      const url = generateCommitUrl("abc123def456");

      expect(url).toBe("https://github.com/user/repo/commit/abc123def456");
    });

    it("should return short hash when remote URL unavailable", () => {
      execCommand.mockImplementation(() => {
        throw new Error("No remote");
      });

      const url = generateCommitUrl("abc123def456");

      expect(url).toBe("[abc123d]");
    });

    it("should throw error for invalid hash", () => {
      expect(() => generateCommitUrl("")).toThrow(
        "hash must be a non-empty string"
      );
      expect(() => generateCommitUrl(null)).toThrow(
        "hash must be a non-empty string"
      );
    });
  });

  describe("generatePrUrl", () => {
    it("should generate PR URL with provided repo URL", () => {
      const url = generatePrUrl(123, "https://github.com/user/repo");

      expect(url).toBe("https://github.com/user/repo/pull/123");
    });

    it("should generate PR URL from git remote", () => {
      execCommand.mockReturnValue("https://github.com/user/repo.git");

      const url = generatePrUrl(456);

      expect(url).toBe("https://github.com/user/repo/pull/456");
    });

    it("should return PR number when remote URL unavailable", () => {
      execCommand.mockImplementation(() => {
        throw new Error("No remote");
      });

      const url = generatePrUrl(789);

      expect(url).toBe("#789");
    });

    it("should throw error for invalid PR number", () => {
      expect(() => generatePrUrl(0)).toThrow(
        "prNumber must be a positive number"
      );
      expect(() => generatePrUrl(-1)).toThrow(
        "prNumber must be a positive number"
      );
      expect(() => generatePrUrl("123")).toThrow(
        "prNumber must be a positive number"
      );
    });
  });

  describe("formatCommit", () => {
    it("should format commit with PR and commit links", () => {
      execCommand.mockReturnValue("https://github.com/user/repo.git");

      const commit = {
        hash: "abc123def456",
        author: "John Doe",
        date: new Date(),
        message: "feat: add feature",
        pr: 123,
      };

      const formatted = formatCommit(commit);

      expect(formatted).toContain("feat: add feature");
      expect(formatted).toContain("[#123]");
      expect(formatted).toContain("[abc123d]");
      expect(formatted).toContain("https://github.com/user/repo/pull/123");
      expect(formatted).toContain(
        "https://github.com/user/repo/commit/abc123def456"
      );
    });

    it("should format commit without PR", () => {
      execCommand.mockReturnValue("https://github.com/user/repo.git");

      const commit = {
        hash: "abc123def456",
        author: "John Doe",
        date: new Date(),
        message: "fix: resolve bug",
      };

      const formatted = formatCommit(commit);

      expect(formatted).toContain("fix: resolve bug");
      expect(formatted).not.toContain("[#");
      expect(formatted).toContain("[abc123d]");
    });

    it("should throw error for invalid commit", () => {
      expect(() => formatCommit(null)).toThrow("commit must be an object");
      expect(() => formatCommit("not an object")).toThrow(
        "commit must be an object"
      );
    });
  });

  describe("formatChangelog", () => {
    beforeEach(() => {
      execCommand.mockReturnValue("https://github.com/user/repo.git");
    });

    it("should format changelog with all sections", () => {
      const changelog = {
        breaking: [
          {
            hash: "abc123",
            author: "John",
            date: new Date(),
            message: "breaking: change API",
          },
        ],
        features: [
          {
            hash: "def456",
            author: "Jane",
            date: new Date(),
            message: "feat: add feature",
          },
        ],
        fixes: [
          {
            hash: "ghi789",
            author: "Bob",
            date: new Date(),
            message: "fix: resolve bug",
          },
        ],
        other: [
          {
            hash: "jkl012",
            author: "Alice",
            date: new Date(),
            message: "chore: update deps",
          },
        ],
      };

      const formatted = formatChangelog(changelog);

      expect(formatted).toContain("### ⚠️ Breaking Changes");
      expect(formatted).toContain("### ✨ Features");
      expect(formatted).toContain("### 🐛 Bug Fixes");
      expect(formatted).toContain("### 📝 Other Changes");
      expect(formatted).toContain("breaking: change API");
      expect(formatted).toContain("feat: add feature");
      expect(formatted).toContain("fix: resolve bug");
      expect(formatted).toContain("chore: update deps");
    });

    it("should format changelog with only some sections", () => {
      const changelog = {
        breaking: [],
        features: [
          {
            hash: "def456",
            author: "Jane",
            date: new Date(),
            message: "feat: add feature",
          },
        ],
        fixes: [],
        other: [],
      };

      const formatted = formatChangelog(changelog);

      expect(formatted).not.toContain("### ⚠️ Breaking Changes");
      expect(formatted).toContain("### ✨ Features");
      expect(formatted).not.toContain("### 🐛 Bug Fixes");
      expect(formatted).not.toContain("### 📝 Other Changes");
    });

    it("should return empty string for empty changelog", () => {
      const changelog = {
        breaking: [],
        features: [],
        fixes: [],
        other: [],
      };

      const formatted = formatChangelog(changelog);

      expect(formatted).toBe("");
    });

    it("should throw error for invalid changelog", () => {
      expect(() => formatChangelog(null)).toThrow(
        "changelog must be an object"
      );
      expect(() => formatChangelog("not an object")).toThrow(
        "changelog must be an object"
      );
    });
  });

  describe("generate", () => {
    it("should generate categorized changelog from Git history", async () => {
      const gitOutput = `abc123|John Doe|2024-01-15T10:00:00Z|feat: add feature
def456|Jane Smith|2024-01-14T09:00:00Z|fix: resolve bug
ghi789|Bob Johnson|2024-01-13T08:00:00Z|chore: update deps`;

      execCommand.mockReturnValue(gitOutput);

      const changelog = await generate("v1.0.0", "v1.1.0");

      expect(changelog.features).toHaveLength(1);
      expect(changelog.fixes).toHaveLength(1);
      expect(changelog.other).toHaveLength(1);
    });
  });

  describe("format", () => {
    beforeEach(() => {
      execCommand.mockReturnValue("https://github.com/user/repo.git");
    });

    it("should format changelog using default format", () => {
      const changelog = {
        breaking: [],
        features: [
          {
            hash: "def456",
            author: "Jane",
            date: new Date(),
            message: "feat: add feature",
          },
        ],
        fixes: [],
        other: [],
      };

      const formatted = format(changelog, "template");

      expect(formatted).toContain("### ✨ Features");
      expect(formatted).toContain("feat: add feature");
    });
  });

  describe("updateChangelogFile", () => {
    const tempDir = path.join(__dirname, "temp-changelog-test");

    beforeEach(() => {
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Mock git root
      execCommand.mockReturnValue(tempDir);
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

    it("should create new CHANGELOG.md if it does not exist", async () => {
      const changelogPath = path.join(tempDir, "CHANGELOG.md");
      const content = "### ✨ Features\n\n- feat: add feature";

      await updateChangelogFile("1.0.0", content, changelogPath);

      expect(fs.existsSync(changelogPath)).toBe(true);

      const fileContent = fs.readFileSync(changelogPath, "utf8");
      expect(fileContent).toContain("# Changelog");
      expect(fileContent).toContain("## [1.0.0]");
      expect(fileContent).toContain("feat: add feature");
    });

    it("should prepend to existing CHANGELOG.md", async () => {
      const changelogPath = path.join(tempDir, "CHANGELOG.md");
      const existingContent = `# Changelog

All notable changes to this project will be documented in this file.

## [0.9.0] - 2024-01-01

### Features

- Old feature
`;

      fs.writeFileSync(changelogPath, existingContent, "utf8");

      const newContent = "### ✨ Features\n\n- feat: new feature";

      await updateChangelogFile("1.0.0", newContent, changelogPath);

      const fileContent = fs.readFileSync(changelogPath, "utf8");
      expect(fileContent).toContain("## [1.0.0]");
      expect(fileContent).toContain("feat: new feature");
      expect(fileContent).toContain("## [0.9.0]");
      expect(fileContent).toContain("Old feature");

      // New version should come before old version
      const newVersionIndex = fileContent.indexOf("## [1.0.0]");
      const oldVersionIndex = fileContent.indexOf("## [0.9.0]");
      expect(newVersionIndex).toBeLessThan(oldVersionIndex);
    });

    it("should include date in version header", async () => {
      const changelogPath = path.join(tempDir, "CHANGELOG.md");
      const content = "### ✨ Features\n\n- feat: add feature";

      await updateChangelogFile("1.0.0", content, changelogPath);

      const fileContent = fs.readFileSync(changelogPath, "utf8");
      const date = new Date().toISOString().split("T")[0];
      expect(fileContent).toContain(`## [1.0.0] - ${date}`);
    });

    it("should throw error for invalid version", async () => {
      await expect(updateChangelogFile("", "content")).rejects.toThrow(
        "version must be a non-empty string"
      );
    });

    it("should throw error for invalid content", async () => {
      await expect(updateChangelogFile("1.0.0", "")).rejects.toThrow(
        "changelogContent must be a non-empty string"
      );
    });
  });
});
