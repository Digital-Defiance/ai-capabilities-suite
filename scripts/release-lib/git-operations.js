/**
 * @fileoverview Git operations for release automation
 * Handles Git commits, tags, and GitHub releases
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * @typedef {import('./types').GithubReleaseData} GithubReleaseData
 */

/**
 * Executes a command and returns the output
 * @param {string} command - Command to execute
 * @param {object} [options] - Options for execSync
 * @returns {string} Command output
 * @throws {Error} If command fails
 */
function execCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      ...options,
    });
    return output.trim();
  } catch (error) {
    const execError = new Error(`Command failed: ${command}`);
    execError.exitCode = error.status || 1;
    execError.output = `${error.stdout || ""}\n${error.stderr || ""}`.trim();
    throw execError;
  }
}

/**
 * Checks if Git is available
 * @returns {boolean} True if Git is available
 */
function isGitAvailable() {
  try {
    execCommand("git --version");
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the project root directory (where .git is located)
 * @returns {string} Project root path
 * @throws {Error} If not in a Git repository
 */
function getProjectRoot() {
  try {
    const root = execCommand("git rev-parse --show-toplevel");
    return root;
  } catch (error) {
    throw new Error("Not in a Git repository");
  }
}

/**
 * Commits all staged and unstaged changes with a descriptive message
 * @param {string} message - Commit message
 * @returns {Promise<string>} Commit hash
 * @throws {Error} If commit fails
 */
async function commitChanges(message) {
  if (!message || typeof message !== "string" || message.trim() === "") {
    throw new Error("Commit message must be a non-empty string");
  }

  if (!isGitAvailable()) {
    throw new Error("Git is not available");
  }

  try {
    // Stage all changes
    execCommand("git add -A");

    // Check if there are changes to commit
    try {
      execCommand("git diff --cached --quiet");
      // If we get here, there are no changes
      throw new Error("No changes to commit");
    } catch (error) {
      // If diff --quiet fails, there are changes (this is expected)
      if (!error.message.includes("Command failed")) {
        throw error;
      }
    }

    // Commit changes
    execCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`);

    // Get the commit hash
    const hash = execCommand("git rev-parse HEAD");
    return hash;
  } catch (error) {
    if (error.message === "No changes to commit") {
      throw error;
    }
    throw new Error(`Failed to commit changes: ${error.message}`);
  }
}

/**
 * Creates a Git tag with the proper format
 * @param {string} tag - Tag name (e.g., 'debugger-v1.0.0')
 * @param {string} [message] - Optional tag message
 * @returns {Promise<void>}
 * @throws {Error} If tag creation fails
 */
async function createTag(tag, message) {
  if (!tag || typeof tag !== "string" || tag.trim() === "") {
    throw new Error("Tag name must be a non-empty string");
  }

  if (!isGitAvailable()) {
    throw new Error("Git is not available");
  }

  try {
    // Check if tag already exists
    try {
      execCommand(`git rev-parse ${tag}`);
      throw new Error(`Tag ${tag} already exists`);
    } catch (error) {
      // If rev-parse fails, tag doesn't exist (this is expected)
      if (!error.message.includes("Command failed")) {
        throw error;
      }
    }

    // Create tag
    if (message) {
      execCommand(`git tag -a ${tag} -m "${message.replace(/"/g, '\\"')}"`);
    } else {
      execCommand(`git tag ${tag}`);
    }
  } catch (error) {
    if (error.message.includes("already exists")) {
      throw error;
    }
    throw new Error(`Failed to create tag ${tag}: ${error.message}`);
  }
}

/**
 * Pushes commits and optionally tags to remote
 * @param {boolean} includeTags - Whether to push tags
 * @param {string} [remote] - Remote name (defaults to 'origin')
 * @param {string} [branch] - Branch name (defaults to current branch)
 * @returns {Promise<void>}
 * @throws {Error} If push fails
 */
async function pushToRemote(includeTags = false, remote = "origin", branch) {
  if (!isGitAvailable()) {
    throw new Error("Git is not available");
  }

  try {
    // Get current branch if not specified
    const currentBranch =
      branch || execCommand("git rev-parse --abbrev-ref HEAD");

    // Push commits
    execCommand(`git push ${remote} ${currentBranch}`);

    // Push tags if requested
    if (includeTags) {
      execCommand(`git push ${remote} --tags`);
    }
  } catch (error) {
    throw new Error(`Failed to push to remote: ${error.message}`);
  }
}

/**
 * Checks if GitHub CLI is available
 * @returns {boolean} True if gh CLI is available
 */
function isGhCliAvailable() {
  try {
    execCommand("gh --version");
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if GitHub token is available
 * @returns {boolean} True if token is available
 */
function hasGithubToken() {
  // Check for GITHUB_TOKEN or GH_TOKEN environment variable
  return !!(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
}

/**
 * Creates a GitHub release using the GitHub API
 * @param {GithubReleaseData} releaseData - Release data
 * @returns {Promise<string>} Release URL
 * @throws {Error} If release creation fails
 */
async function createGithubRelease(releaseData) {
  if (!releaseData || typeof releaseData !== "object") {
    throw new Error("Release data must be an object");
  }

  const { tag, name, body, draft = false, prerelease = false } = releaseData;

  if (!tag || typeof tag !== "string" || tag.trim() === "") {
    throw new Error("Release tag must be a non-empty string");
  }

  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new Error("Release name must be a non-empty string");
  }

  if (!body || typeof body !== "string") {
    throw new Error("Release body must be a string");
  }

  // Check if gh CLI is available
  if (!isGhCliAvailable()) {
    throw new Error(
      "GitHub CLI (gh) is not available. Install it from https://cli.github.com/"
    );
  }

  // Check if authenticated
  if (!hasGithubToken()) {
    try {
      execCommand("gh auth status");
    } catch (error) {
      throw new Error(
        "GitHub authentication required. Run 'gh auth login' or set GITHUB_TOKEN environment variable"
      );
    }
  }

  try {
    // Create a temporary file for the release notes
    const tempDir = path.join(__dirname, "..", "..", "tmp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const notesFile = path.join(tempDir, `release-notes-${Date.now()}.md`);
    fs.writeFileSync(notesFile, body, "utf8");

    try {
      // Build gh release create command
      let command = `gh release create ${tag} --title "${name.replace(
        /"/g,
        '\\"'
      )}" --notes-file "${notesFile}"`;

      if (draft) {
        command += " --draft";
      }

      if (prerelease) {
        command += " --prerelease";
      }

      // Create release
      const output = execCommand(command);

      // Extract URL from output (gh CLI returns the release URL)
      const urlMatch = output.match(/https:\/\/github\.com\/[^\s]+/);
      const releaseUrl = urlMatch ? urlMatch[0] : output;

      return releaseUrl;
    } finally {
      // Clean up temp file
      if (fs.existsSync(notesFile)) {
        fs.unlinkSync(notesFile);
      }
    }
  } catch (error) {
    throw new Error(`Failed to create GitHub release: ${error.message}`);
  }
}

/**
 * Attaches assets to a GitHub release
 * @param {string} tag - Release tag
 * @param {string[]} assetPaths - Paths to assets to attach
 * @returns {Promise<void>}
 * @throws {Error} If asset attachment fails
 */
async function attachAssets(tag, assetPaths) {
  if (!tag || typeof tag !== "string" || tag.trim() === "") {
    throw new Error("Release tag must be a non-empty string");
  }

  if (!Array.isArray(assetPaths) || assetPaths.length === 0) {
    throw new Error("Asset paths must be a non-empty array");
  }

  if (!isGhCliAvailable()) {
    throw new Error(
      "GitHub CLI (gh) is not available. Install it from https://cli.github.com/"
    );
  }

  try {
    // Verify all assets exist
    for (const assetPath of assetPaths) {
      if (!fs.existsSync(assetPath)) {
        throw new Error(`Asset file not found: ${assetPath}`);
      }
    }

    // Upload each asset
    for (const assetPath of assetPaths) {
      execCommand(`gh release upload ${tag} "${assetPath}"`);
    }
  } catch (error) {
    throw new Error(`Failed to attach assets: ${error.message}`);
  }
}

/**
 * Formats a Git tag name from package name and version
 * @param {string} packageName - Package name (e.g., 'debugger', 'screenshot')
 * @param {string} version - Version (e.g., '1.0.0')
 * @returns {string} Formatted tag (e.g., 'debugger-v1.0.0')
 */
function formatTag(packageName, version) {
  if (!packageName || typeof packageName !== "string") {
    throw new Error("Package name must be a non-empty string");
  }

  if (!version || typeof version !== "string") {
    throw new Error("Version must be a non-empty string");
  }

  return `${packageName}-v${version}`;
}

/**
 * Deletes a Git tag locally and remotely
 * @param {string} tag - Tag name to delete
 * @param {string} [remote] - Remote name (defaults to 'origin')
 * @returns {Promise<void>}
 */
async function deleteTag(tag, remote = "origin") {
  if (!tag || typeof tag !== "string" || tag.trim() === "") {
    throw new Error("Tag name must be a non-empty string");
  }

  if (!isGitAvailable()) {
    throw new Error("Git is not available");
  }

  try {
    // Delete local tag
    try {
      execCommand(`git tag -d ${tag}`);
    } catch (error) {
      // Tag might not exist locally, continue
    }

    // Delete remote tag
    try {
      execCommand(`git push ${remote} :refs/tags/${tag}`);
    } catch (error) {
      // Tag might not exist remotely, continue
    }
  } catch (error) {
    throw new Error(`Failed to delete tag ${tag}: ${error.message}`);
  }
}

/**
 * Deletes a GitHub release
 * @param {string} tag - Release tag
 * @returns {Promise<void>}
 */
async function deleteGithubRelease(tag) {
  if (!tag || typeof tag !== "string" || tag.trim() === "") {
    throw new Error("Release tag must be a non-empty string");
  }

  if (!isGhCliAvailable()) {
    throw new Error("GitHub CLI (gh) is not available");
  }

  try {
    execCommand(`gh release delete ${tag} --yes`);
  } catch (error) {
    throw new Error(`Failed to delete GitHub release: ${error.message}`);
  }
}

module.exports = {
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
  getProjectRoot,
  execCommand,
};
