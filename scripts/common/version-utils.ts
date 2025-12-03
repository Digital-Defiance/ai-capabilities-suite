/**
 * Version management utilities with TypeScript type safety
 */

import { VersionInfo } from "./types";

/**
 * Regular expression for semantic versioning
 * Matches: major.minor.patch[-prerelease][+build]
 */
const SEMVER_REGEX =
  /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;

/**
 * Parses a semantic version string into components
 * @param versionString - Version string (e.g., "1.2.3", "1.0.0-alpha.1")
 * @returns Parsed version information
 * @throws Error if version string is invalid
 */
export function parseVersion(versionString: string): VersionInfo {
  const match = versionString.match(SEMVER_REGEX);

  if (!match) {
    throw new Error(`Invalid semantic version: ${versionString}`);
  }

  const [, major, minor, patch, prerelease, build] = match;

  return {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease: prerelease || undefined,
    build: build || undefined,
  };
}

/**
 * Converts a VersionInfo object to a string
 * @param version - Version information
 * @returns Semantic version string
 */
export function versionToString(version: VersionInfo): string {
  let versionString = `${version.major}.${version.minor}.${version.patch}`;

  if (version.prerelease) {
    versionString += `-${version.prerelease}`;
  }

  if (version.build) {
    versionString += `+${version.build}`;
  }

  return versionString;
}

/**
 * Compares two version objects
 * @param v1 - First version
 * @param v2 - Second version
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: VersionInfo, v2: VersionInfo): number {
  // Compare major version
  if (v1.major !== v2.major) {
    return v1.major < v2.major ? -1 : 1;
  }

  // Compare minor version
  if (v1.minor !== v2.minor) {
    return v1.minor < v2.minor ? -1 : 1;
  }

  // Compare patch version
  if (v1.patch !== v2.patch) {
    return v1.patch < v2.patch ? -1 : 1;
  }

  // Compare prerelease (versions without prerelease are greater)
  if (v1.prerelease && !v2.prerelease) {
    return -1;
  }
  if (!v1.prerelease && v2.prerelease) {
    return 1;
  }
  if (v1.prerelease && v2.prerelease) {
    if (v1.prerelease < v2.prerelease) {
      return -1;
    }
    if (v1.prerelease > v2.prerelease) {
      return 1;
    }
  }

  // Versions are equal (build metadata is ignored in comparison per semver spec)
  return 0;
}

/**
 * Validates a version string format
 * @param versionString - Version string to validate
 * @returns true if valid, false otherwise
 */
export function isValidVersion(versionString: string): boolean {
  return SEMVER_REGEX.test(versionString);
}

/**
 * Validates a version string and throws if invalid
 * @param versionString - Version string to validate
 * @throws Error if version is invalid
 */
export function validateVersion(versionString: string): void {
  if (!isValidVersion(versionString)) {
    throw new Error(
      `Invalid semantic version format: ${versionString}. Expected format: major.minor.patch[-prerelease][+build]`
    );
  }
}

/**
 * Increments a version component
 * @param version - Version to increment
 * @param component - Component to increment ('major', 'minor', or 'patch')
 * @returns New version with incremented component
 */
export function incrementVersion(
  version: VersionInfo,
  component: "major" | "minor" | "patch"
): VersionInfo {
  const newVersion = { ...version };

  switch (component) {
    case "major":
      newVersion.major += 1;
      newVersion.minor = 0;
      newVersion.patch = 0;
      break;
    case "minor":
      newVersion.minor += 1;
      newVersion.patch = 0;
      break;
    case "patch":
      newVersion.patch += 1;
      break;
  }

  // Clear prerelease and build on increment
  newVersion.prerelease = undefined;
  newVersion.build = undefined;

  return newVersion;
}
