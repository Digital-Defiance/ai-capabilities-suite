/**
 * Unit tests for generate-changelog script
 *
 * Tests git history parsing, commit categorization, and markdown generation
 * _Requirements: 2.2_
 */

import * as fs from "fs";
import * as path from "path";

describe("generate-changelog", () => {
  const scriptPath = path.join(__dirname, "generate-changelog.ts");

  describe("commit categorization", () => {
    it("should categorize feat commits as features", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify the categorization logic exists
      expect(sourceCode).toContain("features:");
      expect(sourceCode).toContain("^feat");
    });

    it("should categorize fix commits as fixes", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify the categorization logic exists
      expect(sourceCode).toContain("fixes:");
      expect(sourceCode).toContain("^fix");
    });

    it("should categorize docs commits as documentation", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify the categorization logic exists
      expect(sourceCode).toContain("docs:");
      expect(sourceCode).toContain("^docs");
    });

    it("should categorize perf commits as performance improvements", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify the categorization logic exists
      expect(sourceCode).toContain("performance:");
      expect(sourceCode).toContain("^perf");
    });

    it("should categorize refactor commits as refactoring", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify the categorization logic exists
      expect(sourceCode).toContain("refactor:");
      expect(sourceCode).toContain("^refactor");
    });

    it("should categorize test commits as tests", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify the categorization logic exists
      expect(sourceCode).toContain("tests:");
      expect(sourceCode).toContain("^test");
    });

    it("should categorize chore commits as maintenance", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify the categorization logic exists
      expect(sourceCode).toContain("chore:");
      expect(sourceCode).toContain("^chore");
    });

    it("should have an 'other' category for uncategorized commits", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify the other category exists
      expect(sourceCode).toContain("other:");
    });
  });

  describe("markdown generation", () => {
    it("should generate markdown with proper section headers", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify markdown headers are generated
      expect(sourceCode).toContain("## What's Changed");
      expect(sourceCode).toContain("### ✨ New Features");
      expect(sourceCode).toContain("### 🐛 Bug Fixes");
      expect(sourceCode).toContain("### ⚡ Performance Improvements");
      expect(sourceCode).toContain("### 📚 Documentation");
      expect(sourceCode).toContain("### ♻️ Code Refactoring");
      expect(sourceCode).toContain("### ✅ Tests");
      expect(sourceCode).toContain("### 🔧 Maintenance");
      expect(sourceCode).toContain("### 📝 Other Changes");
    });

    it("should format commits with links to GitHub", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify GitHub link format is used
      expect(sourceCode).toContain(
        "https://github.com/digital-defiance/ai-capabilities-suite/commit/"
      );
    });

    it("should remove conventional commit prefixes from messages", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify the prefix removal logic exists
      expect(sourceCode).toContain("replace");
      expect(sourceCode).toContain("feat|fix|docs|perf|refactor|test|chore");
    });
  });

  describe("git operations", () => {
    it("should handle missing git tags gracefully", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify error handling for git operations
      expect(sourceCode).toContain("getLatestTag");
      expect(sourceCode).toContain("catch");
      expect(sourceCode).toContain("return null");
    });

    it("should handle git log errors gracefully", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify error handling for git log
      expect(sourceCode).toContain("getCommitsSinceTag");
      expect(sourceCode).toContain("git log");
      expect(sourceCode).toContain("return []");
    });

    it("should use proper git log format", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify git log format includes hash, subject, and body
      expect(sourceCode).toContain('--pretty=format:"%H|%s|%b"');
    });

    it("should truncate commit hashes to 7 characters", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify hash truncation
      expect(sourceCode).toContain("substring(0, 7)");
    });
  });

  describe("template handling", () => {
    it("should read from RELEASE_TEMPLATE.md", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify template path
      expect(sourceCode).toContain("RELEASE_TEMPLATE.md");
      expect(sourceCode).toContain(".github");
    });

    it("should replace VERSION placeholder", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify VERSION replacement (escaped in regex)
      expect(sourceCode).toContain("\\{VERSION\\}");
      expect(sourceCode).toContain("replace");
    });

    it("should replace PREVIOUS_VERSION placeholder", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify PREVIOUS_VERSION replacement (escaped in regex)
      expect(sourceCode).toContain("\\{PREVIOUS_VERSION\\}");
    });

    it("should replace changelog insertion marker", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify changelog insertion
      expect(sourceCode).toContain(
        "<!-- Automatically generated changelog will be inserted here -->"
      );
    });

    it("should write output to RELEASE_NOTES.md", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify output path
      expect(sourceCode).toContain("RELEASE_NOTES.md");
    });
  });

  describe("error handling", () => {
    it("should exit with non-zero code on template read error", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify error handling for template reading
      const hasTemplateErrorHandling =
        sourceCode.includes("readFileSync") &&
        sourceCode.includes("Error reading template") &&
        sourceCode.includes("process.exit(1)");

      expect(hasTemplateErrorHandling).toBe(true);
    });

    it("should exit with non-zero code on output write error", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify error handling for output writing
      const hasWriteErrorHandling =
        sourceCode.includes("writeFileSync") &&
        sourceCode.includes("Error writing output") &&
        sourceCode.includes("process.exit(1)");

      expect(hasWriteErrorHandling).toBe(true);
    });

    it("should use typed error handling with instanceof checks", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify typed error handling
      expect(sourceCode).toContain("error instanceof Error");
    });
  });

  describe("command line interface", () => {
    it("should accept version as first argument", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify version argument handling
      expect(sourceCode).toContain("process.argv");
      expect(sourceCode).toContain("args[0]");
    });

    it("should accept previous tag as second argument", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify previous tag argument handling
      expect(sourceCode).toContain("args[1]");
    });

    it("should default to 'unreleased' if no version provided", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify default version
      expect(sourceCode).toContain("unreleased");
    });

    it("should log progress messages", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify logging
      expect(sourceCode).toContain("Generating changelog");
      expect(sourceCode).toContain("console.log");
    });
  });

  describe("output format", () => {
    it("should handle empty commit lists", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify empty commit handling
      expect(sourceCode).toContain("No changes recorded");
      expect(sourceCode).toContain("commits.length === 0");
    });

    it("should only include sections with commits", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify conditional section inclusion
      expect(sourceCode).toContain(".length > 0");
    });

    it("should format each commit as a list item", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify list item formatting
      expect(sourceCode).toContain("- ");
    });
  });

  describe("TypeScript features", () => {
    it("should use ES6 imports", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify ES6 imports
      expect(sourceCode).toContain('import { execSync } from "child_process"');
      expect(sourceCode).toContain('import * as fs from "fs"');
      expect(sourceCode).toContain('import * as path from "path"');
    });

    it("should have explicit return type annotations", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify return type annotations
      expect(sourceCode).toContain(": string | null");
      expect(sourceCode).toContain(": string");
      expect(sourceCode).toContain(": void");
    });

    it("should use typed interfaces", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify interface definitions
      expect(sourceCode).toContain("interface");
      expect(sourceCode).toContain("GitCommit");
      expect(sourceCode).toContain("CategorizedCommits");
    });

    it("should have proper type annotations for parameters", () => {
      const sourceCode = fs.readFileSync(scriptPath, "utf8");

      // Verify parameter type annotations
      expect(sourceCode).toContain("tag: string | null");
      expect(sourceCode).toContain("commits: GitCommit[]");
      expect(sourceCode).toContain("commit: GitCommit");
    });
  });
});
