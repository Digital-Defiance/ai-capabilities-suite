/**
 * @fileoverview Binary builder for release automation
 * Handles building standalone binaries for the debugger package
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { promisify } = require("util");
const { pipeline } = require("stream");
const zlib = require("zlib");
const archiver = require("archiver");

const pipelineAsync = promisify(pipeline);

/**
 * @typedef {import('../types').ReleaseConfig} ReleaseConfig
 * @typedef {import('../types').BinaryResult} BinaryResult
 * @typedef {import('../types').BinaryArtifact} BinaryArtifact
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
 * Generates SHA256 checksum for a file
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} SHA256 checksum (hex)
 */
async function generateChecksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/**
 * Generates checksums for multiple files
 * @param {string[]} filePaths - Array of file paths
 * @returns {Promise<Map<string, string>>} Map of file path to checksum
 */
async function generateChecksums(filePaths) {
  const checksums = new Map();

  for (const filePath of filePaths) {
    const checksum = await generateChecksum(filePath);
    checksums.set(filePath, checksum);
  }

  return checksums;
}

/**
 * Compresses a file using tar.gz (for Unix platforms)
 * @param {string} inputPath - Path to input file
 * @param {string} outputPath - Path to output .tar.gz file
 * @returns {Promise<void>}
 */
async function compressTarGz(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("tar", {
      gzip: true,
      gzipOptions: { level: 9 },
    });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);

    // Add the file to the archive with just its basename
    const fileName = path.basename(inputPath);
    archive.file(inputPath, { name: fileName });

    archive.finalize();
  });
}

/**
 * Compresses a file using zip (for Windows)
 * @param {string} inputPath - Path to input file
 * @param {string} outputPath - Path to output .zip file
 * @returns {Promise<void>}
 */
async function compressZip(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);

    // Add the file to the archive with just its basename
    const fileName = path.basename(inputPath);
    archive.file(inputPath, { name: fileName });

    archive.finalize();
  });
}

/**
 * Compresses a binary file based on platform
 * @param {string} binaryPath - Path to binary file
 * @param {string} platform - Platform name (linux-x64, macos-x64, win-x64)
 * @returns {Promise<string>} Path to compressed file
 */
async function compressBinary(binaryPath, platform) {
  const isWindows = platform.includes("win");
  const extension = isWindows ? ".zip" : ".tar.gz";
  const outputPath = binaryPath + extension;

  if (isWindows) {
    await compressZip(binaryPath, outputPath);
  } else {
    await compressTarGz(binaryPath, outputPath);
  }

  return outputPath;
}

/**
 * Maps platform names to pkg target strings
 * @param {string} platform - Platform name (linux-x64, macos-x64, win-x64)
 * @returns {string} pkg target string
 */
function getPkgTarget(platform) {
  const targetMap = {
    "linux-x64": "node18-linux-x64",
    "macos-x64": "node18-macos-x64",
    "win-x64": "node18-win-x64",
  };

  const target = targetMap[platform];
  if (!target) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  return target;
}

/**
 * Gets the binary file name for a platform
 * @param {string} packageName - Package name
 * @param {string} platform - Platform name
 * @param {string} version - Version string
 * @returns {string} Binary file name
 */
function getBinaryFileName(packageName, platform, version) {
  const isWindows = platform.includes("win");
  const extension = isWindows ? ".exe" : "";
  return `${packageName}-${platform}-${version}${extension}`;
}

/**
 * Builds a single binary for a specific platform
 * @param {ReleaseConfig} config - Package configuration
 * @param {string} version - Version to build
 * @param {string} platform - Platform to build for
 * @param {string} binariesDir - Directory to output binaries
 * @returns {Promise<BinaryArtifact>} Built binary artifact
 */
async function buildSingleBinary(config, version, platform, binariesDir) {
  const projectRoot = path.join(__dirname, "..", "..", "..");
  const packagePath = path.join(projectRoot, config.packageDir);

  // Verify package directory exists
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Package directory not found: ${config.packageDir}`);
  }

  // Get pkg target
  const pkgTarget = getPkgTarget(platform);

  // Generate output file name
  const binaryFileName = getBinaryFileName(
    config.packageName,
    platform,
    version
  );
  const outputPath = path.join(binariesDir, binaryFileName);

  // Build binary using pkg
  const pkgCommand = `npx pkg ${packagePath} --target ${pkgTarget} --output ${outputPath}`;

  try {
    execCommand(pkgCommand, { cwd: projectRoot });
  } catch (error) {
    throw new Error(
      `Failed to build ${platform} binary: ${error.message}\n${
        error.output || ""
      }`
    );
  }

  // Verify binary was created
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Binary was not created at expected path: ${outputPath}`);
  }

  // Get file size
  const stats = fs.statSync(outputPath);

  return {
    platform,
    path: outputPath,
    size: stats.size,
  };
}

/**
 * Builds standalone binaries for all configured platforms
 * @param {ReleaseConfig} config - Package configuration
 * @param {string} version - Version to build
 * @returns {Promise<BinaryResult>} Build result with binaries and checksums
 */
async function buildBinaries(config, version) {
  // Validate that binaries should be built
  if (!config.buildBinaries) {
    throw new Error(
      `Binary building is not enabled for package: ${config.packageName}`
    );
  }

  if (!config.binaryPlatforms || config.binaryPlatforms.length === 0) {
    throw new Error(
      `No binary platforms configured for package: ${config.packageName}`
    );
  }

  // Create binaries directory
  const projectRoot = path.join(__dirname, "..", "..", "..");
  const binariesDir = path.join(projectRoot, "binaries");

  if (!fs.existsSync(binariesDir)) {
    fs.mkdirSync(binariesDir, { recursive: true });
  }

  const binaries = [];
  const binaryPaths = [];

  // Build binaries for each platform
  for (const platform of config.binaryPlatforms) {
    const binary = await buildSingleBinary(
      config,
      version,
      platform,
      binariesDir
    );
    binaries.push(binary);
    binaryPaths.push(binary.path);
  }

  // Generate checksums for all binaries
  const checksums = await generateChecksums(binaryPaths);

  // Compress binaries
  const compressedBinaries = [];
  for (const binary of binaries) {
    const compressedPath = await compressBinary(binary.path, binary.platform);
    const compressedStats = fs.statSync(compressedPath);

    compressedBinaries.push({
      ...binary,
      compressedPath,
      compressedSize: compressedStats.size,
    });

    // Add checksum for compressed file
    const compressedChecksum = await generateChecksum(compressedPath);
    checksums.set(compressedPath, compressedChecksum);
  }

  return {
    binaries: compressedBinaries,
    checksums,
  };
}

module.exports = {
  buildBinaries,
  buildSingleBinary,
  generateChecksum,
  generateChecksums,
  compressBinary,
  compressTarGz,
  compressZip,
  getPkgTarget,
  getBinaryFileName,
  execCommand,
};
