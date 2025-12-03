/**
 * @fileoverview Verification pipeline for release automation
 * Verifies that published artifacts are accessible
 */

const { execSync } = require("child_process");
const https = require("https");
const http = require("http");

/**
 * @typedef {import('./types').ReleaseManifest} ReleaseManifest
 * @typedef {import('./types').VerificationResult} VerificationResult
 * @typedef {import('./types').VerificationCheck} VerificationCheck
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
 * Makes an HTTP/HTTPS request
 * @param {string} url - URL to request
 * @param {object} options - Request options
 * @returns {Promise<{statusCode: number, body: string}>}
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === "https:" ? https : http;

    const req = protocol.get(
      url,
      {
        timeout: options.timeout || 10000,
        ...options,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            body,
          });
        });
      }
    );

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

/**
 * Verifies that an NPM package is installable
 * @param {string} packageName - NPM package name
 * @param {string} version - Package version
 * @returns {Promise<VerificationCheck>}
 */
async function verifyNpm(packageName, version) {
  const url = `https://www.npmjs.com/package/${packageName}`;

  try {
    // Use npm view to check if the package version exists
    const output = execCommand(`npm view ${packageName}@${version} version`);

    // If the command succeeds and returns the version, the package exists
    if (output.trim() === version) {
      return {
        passed: true,
        url,
      };
    } else {
      return {
        passed: fals