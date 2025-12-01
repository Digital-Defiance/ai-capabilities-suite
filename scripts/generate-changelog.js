#!/usr/bin/env node

/**
 * Generate changelog for releases
 *
 * This script generates a changelog based on git commits between tags.
 * It categorizes commits by type (feat, fix, docs, etc.) and formats them
 * for release notes.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function getLatestTag() {
  try {
    return execSync("git describe --tags --abbrev=0", {
      encoding: "utf-8",
    }).trim();
  } catch (error) {
    return null;
  }
}

function getCommitsSinceTag(tag) {
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

function categorizeCommits(commits) {
  const categories = {
    features: [],
    fixes: [],
    docs: [],
    performance: [],
    refactor: [],
    tests: [],
    chore: [],
    other: [],
  };

  const patterns = {
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
        categories[category].push(commit);
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

function formatCommit(commit) {
  // Remove conventional commit prefix
  const subject = commit.subject.replace(
    /^(feat|fix|docs|perf|refactor|test|chore)(\(.+\))?:\s*/i,
    ""
  );
  return `- ${subject} ([${commit.hash}](https://github.com/digital-defiance/ai-capabilities-suite/commit/${commit.hash}))`;
}

function generateChangelog(version, previousTag) {
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

function main() {
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
  let template = fs.readFileSync(templatePath, "utf-8");

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
  fs.writeFileSync(outputPath, template);

  console.log(`\nChangelog generated successfully!`);
  console.log(`Output: ${outputPath}`);
  console.log(`\nPreview:\n`);
  console.log(changelog);
}

main();
