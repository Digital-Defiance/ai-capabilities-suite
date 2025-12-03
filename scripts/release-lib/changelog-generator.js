/**
 * @fileoverview Changelog generator for release automation
 * Generates release notes from Git commit history
 */

const { execCommand } = require("./git-operations");
const fs = require("fs");
const path = require("path");

/**
 * @typedef {Object} CommitInfo
 * @property {string} hash - Commit hash
 * @property {string} message - Commit message
 * @property {string} author - Commit author
 * @property {Date} date - Commit date
 * @property {number} [pr] - Pull request number (if available)
 */

/**
 * @typedef {Object} Changelog
 * @property {CommitInfo[]} features - Feature commits
 * @property {CommitInfo[]} fixes - Fix commits
 * @property {CommitInfo[]} breaking - Breaking change commits
 * @property {CommitInfo[]} other - Other commits
 */

/**
 * Extracts commits from Git history between two tags
 * @param {string} fromTag - Starting tag (exclusive)
 * @param {string} toTag - Ending tag (inclusive)
 * @returns {Promise<CommitInfo[]>} Array of commit information
 * @throws {Error} If commit extraction fails
 */
async function extractCommits(fromTag, toTag) {
  if (!fromTag || typeof fromTag !== "string" || fromTag.trim() === "") {
    throw new Error("fromTag must be a non-empty string");
  }

  if (!toTag || typeof toTag !== "string" || toTag.trim() === "") {
    throw new Error("toTag must be a non-empty string");
  }

  try {
    // Format: hash|author|date|message
    const format = "%H|%an|%aI|%s";
    const command = `git log ${fromTag}..${toTag} --pretty=format:"${format}"`;

    const output = execCommand(command);

    if (!output || output.trim() === "") {
      return [];
    }

    const lines = output.split("\n");
    const commits = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split("|");
      if (parts.length < 4) continue;

      const [hash, author, dateStr, ...messageParts] = parts;
      const message = messageParts.join("|"); // Rejoin in case message contains |

      // Extract PR number from message if present (e.g., "(#123)" or "#123")
      const prMatch = message.match(/#(\d+)/);
      const pr = prMatch ? parseInt(prMatch[1], 10) : undefined;

      commits.push({
        hash: hash.trim(),
        author: author.trim(),
        date: new Date(dateStr.trim()),
        message: message.trim(),
        pr,
      });
    }

    return commits;
  } catch (error) {
    throw new Error(`Failed to extract commits: ${error.message}`);
  }
}

/**
 * Categorizes commits by type (features, fixes, breaking changes, other)
 * @param {CommitInfo[]} commits - Array of commits to categorize
 * @returns {Changelog} Categorized commits
 */
function categorizeCommits(commits) {
  if (!Array.isArray(commits)) {
    throw new Error("commits must be an array");
  }

  const changelog = {
    features: [],
    fixes: [],
    breaking: [],
    other: [],
  };

  for (const commit of commits) {
    const message = commit.message.toLowerCase();

    // Check for breaking changes first (highest priority)
    if (
      message.includes("breaking change") ||
      message.includes("breaking:") ||
      message.match(/^[a-z]+!:/)
    ) {
      changelog.breaking.push(commit);
    }
    // Check for features
    else if (
      message.startsWith("feat:") ||
      message.startsWith("feature:") ||
      message.includes("add ") ||
      message.includes("implement ")
    ) {
      changelog.features.push(commit);
    }
    // Check for fixes
    else if (
      message.startsWith("fix:") ||
      message.startsWith("bugfix:") ||
      message.includes("fix ") ||
      message.includes("resolve ")
    ) {
      changelog.fixes.push(commit);
    }
    // Everything else
    else {
      changelog.other.push(commit);
    }
  }

  return changelog;
}

/**
 * Generates a GitHub commit URL
 * @param {string} hash - Commit hash
 * @param {string} [repoUrl] - Repository URL (defaults to current repo)
 * @returns {string} Commit URL
 */
function generateCommitUrl(hash, repoUrl) {
  if (!hash || typeof hash !== "string") {
    throw new Error("hash must be a non-empty string");
  }

  // If no repo URL provided, try to get it from git remote
  if (!repoUrl) {
    try {
      const remoteUrl = execCommand("git config --get remote.origin.url");
      repoUrl = remoteUrl
        .replace(/\.git$/, "")
        .replace(/^git@github\.com:/, "https://github.com/")
        .replace(/^https:\/\/github\.com\//, "https://github.com/");
    } catch (error) {
      // If we can't get the remote URL, return a placeholder
      return `[${hash.substring(0, 7)}]`;
    }
  }

  // Ensure repo URL doesn't end with .git
  repoUrl = repoUrl.replace(/\.git$/, "");

  return `${repoUrl}/commit/${hash}`;
}

/**
 * Generates a GitHub PR URL
 * @param {number} prNumber - Pull request number
 * @param {string} [repoUrl] - Repository URL (defaults to current repo)
 * @returns {string} PR URL
 */
function generatePrUrl(prNumber, repoUrl) {
  if (typeof prNumber !== "number" || prNumber <= 0) {
    throw new Error("prNumber must be a positive number");
  }

  // If no repo URL provided, try to get it from git remote
  if (!repoUrl) {
    try {
      const remoteUrl = execCommand("git config --get remote.origin.url");
      repoUrl = remoteUrl
        .replace(/\.git$/, "")
        .replace(/^git@github\.com:/, "https://github.com/")
        .replace(/^https:\/\/github\.com\//, "https://github.com/");
    } catch (error) {
      // If we can't get the remote URL, return a placeholder
      return `#${prNumber}`;
    }
  }

  // Ensure repo URL doesn't end with .git
  repoUrl = repoUrl.replace(/\.git$/, "");

  return `${repoUrl}/pull/${prNumber}`;
}

/**
 * Formats a single commit as markdown
 * @param {CommitInfo} commit - Commit to format
 * @param {string} [repoUrl] - Repository URL
 * @returns {string} Formatted commit line
 */
function formatCommit(commit, repoUrl) {
  if (!commit || typeof commit !== "object") {
    throw new Error("commit must be an object");
  }

  const shortHash = commit.hash.substring(0, 7);
  const commitUrl = generateCommitUrl(commit.hash, repoUrl);

  let line = `- ${commit.message}`;

  // Add PR link if available
  if (commit.pr) {
    const prUrl = generatePrUrl(commit.pr, repoUrl);
    line += ` ([#${commit.pr}](${prUrl}))`;
  }

  // Add commit link
  line += ` ([${shortHash}](${commitUrl}))`;

  return line;
}

/**
 * Formats a changelog as markdown
 * @param {Changelog} changelog - Categorized commits
 * @param {string} template - Template string (optional, for future use)
 * @param {string} [repoUrl] - Repository URL
 * @returns {string} Formatted markdown changelog
 */
function formatChangelog(changelog, template, repoUrl) {
  if (!changelog || typeof changelog !== "object") {
    throw new Error("changelog must be an object");
  }

  const sections = [];

  // Breaking changes section
  if (changelog.breaking.length > 0) {
    sections.push("### ⚠️ Breaking Changes\n");
    for (const commit of changelog.breaking) {
      sections.push(formatCommit(commit, repoUrl));
    }
    sections.push("");
  }

  // Features section
  if (changelog.features.length > 0) {
    sections.push("### ✨ Features\n");
    for (const commit of changelog.features) {
      sections.push(formatCommit(commit, repoUrl));
    }
    sections.push("");
  }

  // Fixes section
  if (changelog.fixes.length > 0) {
    sections.push("### 🐛 Bug Fixes\n");
    for (const commit of changelog.fixes) {
      sections.push(formatCommit(commit, repoUrl));
    }
    sections.push("");
  }

  // Other changes section
  if (changelog.other.length > 0) {
    sections.push("### 📝 Other Changes\n");
    for (const commit of changelog.other) {
      sections.push(formatCommit(commit, repoUrl));
    }
    sections.push("");
  }

  return sections.join("\n").trim();
}

/**
 * Generates a complete changelog from Git history
 * @param {string} fromTag - Starting tag (exclusive)
 * @param {string} toTag - Ending tag (inclusive)
 * @param {string} [repoUrl] - Repository URL
 * @returns {Promise<Changelog>} Categorized changelog
 */
async function generate(fromTag, toTag, repoUrl) {
  const commits = await extractCommits(fromTag, toTag);
  const changelog = categorizeCommits(commits);
  return changelog;
}

/**
 * Formats a changelog using a template
 * @param {Changelog} changelog - Categorized commits
 * @param {string} template - Template string
 * @param {string} [repoUrl] - Repository URL
 * @returns {string} Formatted changelog
 */
function format(changelog, template, repoUrl) {
  // For now, we ignore the template and use our default format
  // In the future, we could support custom templates
  return formatChangelog(changelog, template, repoUrl);
}

/**
 * Updates the CHANGELOG.md file with new release notes
 * @param {string} version - Version being released
 * @param {string} changelogContent - Formatted changelog content
 * @param {string} [changelogPath] - Path to CHANGELOG.md (defaults to project root)
 * @returns {Promise<void>}
 * @throws {Error} If update fails
 */
async function updateChangelogFile(version, changelogContent, changelogPath) {
  if (!version || typeof version !== "string" || version.trim() === "") {
    throw new Error("version must be a non-empty string");
  }

  if (
    !changelogContent ||
    typeof changelogContent !== "string" ||
    changelogContent.trim() === ""
  ) {
    throw new Error("changelogContent must be a non-empty string");
  }

  // Default to CHANGELOG.md in project root
  if (!changelogPath) {
    try {
      const projectRoot = execCommand("git rev-parse --show-toplevel");
      changelogPath = path.join(projectRoot, "CHANGELOG.md");
    } catch (error) {
      throw new Error("Could not determine project root");
    }
  }

  try {
    let existingContent = "";

    // Read existing changelog if it exists
    if (fs.existsSync(changelogPath)) {
      existingContent = fs.readFileSync(changelogPath, "utf8");
    } else {
      // Create a new changelog with header
      existingContent =
        "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n";
    }

    // Create new release section
    const date = new Date().toISOString().split("T")[0];
    const newSection = `## [${version}] - ${date}\n\n${changelogContent}\n\n`;

    // Insert new section after the header
    let updatedContent;
    if (existingContent.includes("# Changelog")) {
      // Find the end of the header section
      const lines = existingContent.split("\n");
      let headerEndIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("# Changelog")) {
          // Skip header and any following blank lines or description
          headerEndIndex = i + 1;
          while (
            headerEndIndex < lines.length &&
            (lines[headerEndIndex].trim() === "" ||
              !lines[headerEndIndex].startsWith("##"))
          ) {
            headerEndIndex++;
          }
          break;
        }
      }

      const beforeSection = lines.slice(0, headerEndIndex).join("\n");
      const afterSection = lines.slice(headerEndIndex).join("\n");

      updatedContent = `${beforeSection}\n${newSection}${afterSection}`;
    } else {
      // No existing changelog structure, just prepend
      updatedContent = `# Changelog\n\n${newSection}${existingContent}`;
    }

    // Write updated changelog
    fs.writeFileSync(changelogPath, updatedContent, "utf8");
  } catch (error) {
    throw new Error(`Failed to update CHANGELOG.md: ${error.message}`);
  }
}

module.exports = {
  extractCommits,
  categorizeCommits,
  generateCommitUrl,
  generatePrUrl,
  formatCommit,
  formatChangelog,
  generate,
  format,
  updateChangelogFile,
};
