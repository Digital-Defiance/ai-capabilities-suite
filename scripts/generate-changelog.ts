#!/usr/bin/env node

/**
 * Generate changelog for releases
 *
 * This script generates a changelog based on git commits between tags.
 * It categorizes commits by type (feat, fix, docs, etc.) and formats them
 * for release notes.
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Commit information from git log
 */
interface GitCommit {
  hash: string;
  subject: string;
  body: string;
}

/**
 * Categorized commits by type
 */
interface CategorizedCommits {
  features: GitCommit[];
  fixes: GitCommit[];
  docs: GitCommit[];
  performance: GitCommit[];
  refactor: GitCommit[];
  tests: GitCommit[];
  chore: GitCommit[];
  other: GitCommit[];
}

/**
 * Pattern mapping for commit categorization
 */
interface CategoryPatterns {
  features: RegExp;
  fixes: RegExp;
  docs: RegExp;
  performance: RegExp;
  refactor: RegExp;
  tests: RegExp;
  chore: RegExp;
}

/**
 * Gets the latest git tag
 * @returns Latest tag or null if no tags exist
 */
function getLatestTag(): string | null {
  try {
    return execSync("git describe --tags --abbrev=0", {
      encoding: "utf-8",
    }).trim();
  } catch (error) {
    return null;
  }
}

/**
 * Gets commits since a specific tag
 * @param tag - Git tag to compare from (or null for all commits)
 * @returns Array of git commits
 */
function getCommitsSinceTag(tag: string | null): GitCommit[] {
  const range = tag ? `${tag}..HEAD` : "HEAD";
  try {
    const commits = execSync(`git log ${range} --pretty=format:"%H|%s|%b"`, {
      encoding: "utf-8",
    })
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);

    return commits.map((commit) => {
      const [hash, subject, body] = commit.split("|");
      return { hash: hash.substring(0, 7), subject, body: body || "" };
    });
  } catch (error) {
    return [];
  }
}

/**
 * Categorizes commits by their conventional commit type
 * @param commits - Array of git commits
 * @returns Categorized commits object
 */
function categorizeCommits(commits: GitCommit[]): CategorizedCommits {
  const categories: CategorizedCommits = {
    features: [],
    fixes: [],
    docs: [],
    performance: [],
    refactor: [],
    tests: [],
    chore: [],
    other: [],
  };

  const patterns: CategoryPatterns = {
    features: /^feat(\(.+\))?:/i,
    fixes: /^fix(\(.+\))?:/i,
    docs: /^docs(\(.+\))?:/i,
    performance: /^perf(\(.+\))?:/i,
    refactor: /^refactor(\(.+\))?:/i,
    tests: /^test(\(.+\))?:/i,
    chore: /^chore(\(.+\))?:/i,
  };

  for (const commit of commits) {
    let categorized = false;

    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(commit.subject)) {
        categories[category as keyof CategorizedCommits].push(commit);
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      categories.other.push(commit);
    }
  }

  return categories;
}

/**
 * Formats a commit for markdown output
 * @param commit - Git commit to format
 * @returns Formatted markdown string
 */
function formatCommit(commit: GitCommit): string {
  // Remove conventional commit prefix
  const subject = commit.subject.replace(
    /^(feat|fix|docs|perf|refactor|test|chore)(\(.+\))?:\s*/i,
    ""
  );
  return `- ${subject} ([${commit.hash}](https://github.com/digital-defiance/ai-capabilities-suite/commit/${commit.hash}))`;
}

/**
 * Generates changelog markdown from commits
 * @param _version - Version string for the changelog (unused but kept for API compatibility)
 * @param previousTag - Previous git tag to compare from
 * @returns Formatted changelog markdown
 */
function generateChangelog(
  _version: string,
  previousTag: string | null
): string {
  const commits = getCommitsSinceTag(previousTag);

  if (commits.length === 0) {
    return "## What's Changed\n\nNo changes recorded.\n";
  }

  const categories = categorizeCommits(commits);
  let changelog = "## What's Changed\n\n";

  if (categories.features.length > 0) {
    changelog += "### ✨ New Features\n\n";
    categories.features.forEach((commit) => {
      changelog += formatCommit(commit) + "\n";
    });
    changelog += "\n";
  }

  if (categories.fixes.length > 0) {
    changelog += "### 🐛 Bug Fixes\n\n";
    categories.fixes.forEach((commit) => {
      changelog += formatCommit(commit) + "\n";
    });
    changelog += "\n";
  }

  if (categories.performance.length > 0) {
    changelog += "### ⚡ Performance Improvements\n\n";
    categories.performance.forEach((commit) => {
      changelog += formatCommit(commit) + "\n";
    });
    changelog += "\n";
  }

  if (categories.docs.length > 0) {
    changelog += "### 📚 Documentation\n\n";
    categories.docs.forEach((commit) => {
      changelog += formatCommit(commit) + "\n";
    });
    changelog += "\n";
  }

  if (categories.refactor.length > 0) {
    changelog += "### ♻️ Code Refactoring\n\n";
    categories.refactor.forEach((commit) => {
      changelog += formatCommit(commit) + "\n";
    });
    changelog += "\n";
  }

  if (categories.tests.length > 0) {
    changelog += "### ✅ Tests\n\n";
    categories.tests.forEach((commit) => {
      changelog += formatCommit(commit) + "\n";
    });
    changelog += "\n";
  }

  if (categories.chore.length > 0) {
    changelog += "### 🔧 Maintenance\n\n";
    categories.chore.forEach((commit) => {
      changelog += formatCommit(commit) + "\n";
    });
    changelog += "\n";
  }

  if (categories.other.length > 0) {
    changelog += "### 📝 Other Changes\n\n";
    categories.other.forEach((commit) => {
      changelog += formatCommit(commit) + "\n";
    });
    changelog += "\n";
  }

  return changelog;
}

/**
 * Main execution function
 */
function main(): void {
  const args = process.argv.slice(2);
  const version = args[0] || "unreleased";
  const previousTag = args[1] || getLatestTag();

  console.log(`Generating changelog for version ${version}...`);
  if (previousTag) {
    console.log(`Comparing against previous tag: ${previousTag}`);
  } else {
    console.log("No previous tag found, including all commits.");
  }

  const changelog = generateChangelog(version, previousTag);

  // Read template
  const templatePath = path.join(
    __dirname,
    "..",
    ".github",
    "RELEASE_TEMPLATE.md"
  );

  let template: string;
  try {
    template = fs.readFileSync(templatePath, "utf-8");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error reading template: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }

  // Replace placeholders
  template = template.replace(/\{VERSION\}/g, version);
  template = template.replace(
    /\{PREVIOUS_VERSION\}/g,
    previousTag || "initial"
  );
  template = template.replace(
    "<!-- Automatically generated changelog will be inserted here -->",
    changelog
  );

  // Write to output
  const outputPath = path.join(__dirname, "..", "RELEASE_NOTES.md");
  try {
    fs.writeFileSync(outputPath, template);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error writing output: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }

  console.log(`\nChangelog generated successfully!`);
  console.log(`Output: ${outputPath}`);
  console.log(`\nPreview:\n`);
  console.log(changelog);
}

main();
