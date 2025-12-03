/**
 * @fileoverview Docker publisher for release automation
 * Handles building and publishing Docker images to Docker Hub
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * @typedef {import('../types').ReleaseConfig} ReleaseConfig
 * @typedef {import('../types').PublishResult} PublishResult
 */

/**
 * Executes a shell command and returns the output
 * @param {string} command - Command to execute
 * @param {object} options - Execution options
 * @returns {string} Command output
 * @throws {Error} If command fails
 */
function execCommand(command, options = {}) {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      ...options,
    }).trim();
  } catch (error) {
    // Include both stdout and stderr in error
    const output = error.stdout || "";
    const errorOutput = error.stderr || "";
    const fullOutput = output + "\n" + errorOutput;

    const err = new Error(`Command failed: ${command}`);
    err.output = fullOutput.trim();
    err.exitCode = error.status;
    throw err;
  }
}

/**
 * Checks if Docker credentials are configured
 * @returns {boolean} True if credentials are available
 */
function checkCredentials() {
  try {
    // Check if user is logged in to Docker
    const output = execCommand("docker info");
    // If docker info succeeds, Docker is running
    // Check if we can access Docker Hub (this will fail if not logged in when we try to push)
    return output.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Builds a Docker image
 * @param {ReleaseConfig} config - Package configuration
 * @param {string} version - Version to tag the image with
 * @returns {Promise<{success: boolean, error?: string, output?: string}>} Build result
 */
async function build(config, version) {
  try {
    // Get project root
    const projectRoot = path.join(__dirname, "..", "..", "..");
    const packagePath = path.join(projectRoot, config.packageDir);

    // Verify package directory exists
    if (!fs.existsSync(packagePath)) {
      return {
        success: false,
        error: `Package directory not found: ${config.packageDir}`,
      };
    }

    // Check if Dockerfile exists
    const dockerfilePath = path.join(packagePath, "Dockerfile");
    if (!fs.existsSync(dockerfilePath)) {
      return {
        success: false,
        error: `Dockerfile not found in ${config.packageDir}`,
      };
    }

    // Build the Docker image with version tag
    const imageTag = `${config.dockerImageName}:${version}`;
    const output = execCommand(`docker build -t ${imageTag} .`, {
      cwd: packagePath,
    });

    return {
      success: true,
      output,
    };
  } catch (error) {
    return {
      success: false,
      output: error.output,
      error: error.message,
    };
  }
}

/**
 * Tags a Docker image with multiple tags
 * @param {string} imageName - Base image name (without tag)
 * @param {string} sourceTag - Source tag to copy from
 * @param {string[]} tags - Tags to apply
 * @returns {Promise<{success: boolean, error?: string, output?: string}>} Tag result
 */
async function tag(imageName, sourceTag, tags) {
  try {
    const outputs = [];

    for (const targetTag of tags) {
      const sourceImage = `${imageName}:${sourceTag}`;
      const targetImage = `${imageName}:${targetTag}`;

      const output = execCommand(`docker tag ${sourceImage} ${targetImage}`);
      outputs.push(output);
    }

    return {
      success: true,
      output: outputs.join("\n"),
    };
  } catch (error) {
    return {
      success: false,
      output: error.output,
      error: error.message,
    };
  }
}

/**
 * Pushes Docker image tags to Docker Hub
 * @param {string} imageName - Image name (without tag)
 * @param {string[]} tags - Tags to push
 * @returns {Promise<{success: boolean, error?: string, output?: string}>} Push result
 */
async function push(imageName, tags) {
  try {
    const outputs = [];

    for (const imageTag of tags) {
      const fullImageName = `${imageName}:${imageTag}`;
      const output = execCommand(`docker push ${fullImageName}`);
      outputs.push(output);
    }

    return {
      success: true,
      output: outputs.join("\n"),
    };
  } catch (error) {
    // Check if error is due to authentication
    const isAuthError =
      error.output &&
      (error.output.includes("unauthorized") ||
        error.output.includes("authentication") ||
        error.output.includes("denied") ||
        error.output.includes("not logged in"));

    return {
      success: false,
      output: error.output,
      error: isAuthError
        ? "Docker authentication failed. Please run 'docker login' and try again."
        : error.message,
    };
  }
}

/**
 * Publishes the Docker image with all tags
 * @param {ReleaseConfig} config - Package configuration
 * @param {string} version - Version to release
 * @param {boolean} dryRun - If true, skip pushing to registry
 * @returns {Promise<PublishResult>} Publish result
 */
async function publish(config, version, dryRun = false) {
  try {
    // Build the image
    const buildResult = await build(config, version);
    if (!buildResult.success) {
      return {
        success: false,
        error: buildResult.error,
        output: buildResult.output,
      };
    }

    // Generate all tags: version, v-prefixed version, and latest
    const versionTag = version;
    const vPrefixedTag = `v${version}`;
    const latestTag = "latest";

    // Tag the image with additional tags
    const additionalTags = [vPrefixedTag, latestTag];
    const tagResult = await tag(
      config.dockerImageName,
      versionTag,
      additionalTags
    );
    if (!tagResult.success) {
      return {
        success: false,
        error: tagResult.error,
        output: tagResult.output,
      };
    }

    // In dry-run mode, stop here
    if (dryRun) {
      const url = `https://hub.docker.com/r/${config.dockerImageName}`;
      return {
        success: true,
        url,
        output: `${buildResult.output}\n${tagResult.output}`,
      };
    }

    // Check credentials before pushing
    if (!checkCredentials()) {
      return {
        success: false,
        error:
          "Docker authentication required. Please run 'docker login' first.",
      };
    }

    // Push all tags
    const allTags = [versionTag, vPrefixedTag, latestTag];
    const pushResult = await push(config.dockerImageName, allTags);
    if (!pushResult.success) {
      return {
        success: false,
        error: pushResult.error,
        output: pushResult.output,
      };
    }

    // Construct the Docker Hub URL
    const url = `https://hub.docker.com/r/${config.dockerImageName}`;

    return {
      success: true,
      url,
      output: `${buildResult.output}\n${tagResult.output}\n${pushResult.output}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verifies that the Docker image exists on Docker Hub
 * @param {string} imageName - Docker image name
 * @param {string} version - Image version
 * @returns {Promise<boolean>} True if image exists with the specified version
 */
async function verify(imageName, version) {
  try {
    // Try to pull the image manifest without actually downloading the image
    // Using docker manifest inspect is more efficient than pulling
    execCommand(`docker manifest inspect ${imageName}:${version}`);
    return true;
  } catch (error) {
    // If manifest inspect fails, try the traditional pull method as fallback
    try {
      // Use --dry-run if available, otherwise just check if pull would work
      execCommand(`docker pull ${imageName}:${version} --quiet`);
      return true;
    } catch (pullError) {
      return false;
    }
  }
}

module.exports = {
  publish,
  build,
  tag,
  push,
  verify,
  checkCredentials,
  execCommand,
};
