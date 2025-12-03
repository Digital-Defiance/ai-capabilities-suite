/**
 * Unit tests for version management utilities
 */

import {
  parseVersion,
  versionToString,
  compareVersions,
  isValidVersion,
  validateVersion,
  incrementVersion,
} from "./version-utils";

describe("version-utils", () => {
  describe("parseVersion", () => {
    it("should parse simple semantic version", () => {
      const result = parseVersion("1.2.3");

      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: undefined,
        build: undefined,
      });
    });

    it("should parse version with prerelease", () => {
      const result = parseVersion("1.2.3-alpha.1");

      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: "alpha.1",
        build: undefined,
      });
    });

    it("should parse version with build metadata", () => {
      const result = parseVersion("1.2.3+build.123");

      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: undefined,
        build: "build.123",
      });
    });

    it("should parse version with prerelease and build", () => {
      const result = parseVersion("1.2.3-beta.2+build.456");

      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: "beta.2",
        build: "build.456",
      });
    });

    it("should throw error for invalid version", () => {
      expect(() => parseVersion("invalid")).toThrow();
      expect(() => parseVersion("1.2")).toThrow();
      expect(() => parseVersion("1.2.3.4")).toThrow();
    });
  });

  describe("versionToString", () => {
    it("should convert simple version to string", () => {
      const result = versionToString({
        major: 1,
        minor: 2,
        patch: 3,
      });

      expect(result).toBe("1.2.3");
    });

    it("should include prerelease in string", () => {
      const result = versionToString({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: "alpha.1",
      });

      expect(result).toBe("1.2.3-alpha.1");
    });

    it("should include build metadata in string", () => {
      const result = versionToString({
        major: 1,
        minor: 2,
        patch: 3,
        build: "build.123",
      });

      expect(result).toBe("1.2.3+build.123");
    });

    it("should include both prerelease and build", () => {
      const result = versionToString({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: "beta.2",
        build: "build.456",
      });

      expect(result).toBe("1.2.3-beta.2+build.456");
    });
  });

  describe("compareVersions", () => {
    it("should return 0 for equal versions", () => {
      const v1 = parseVersion("1.2.3");
      const v2 = parseVersion("1.2.3");

      expect(compareVersions(v1, v2)).toBe(0);
    });

    it("should compare major versions", () => {
      const v1 = parseVersion("2.0.0");
      const v2 = parseVersion("1.9.9");

      expect(compareVersions(v1, v2)).toBe(1);
      expect(compareVersions(v2, v1)).toBe(-1);
    });

    it("should compare minor versions", () => {
      const v1 = parseVersion("1.3.0");
      const v2 = parseVersion("1.2.9");

      expect(compareVersions(v1, v2)).toBe(1);
      expect(compareVersions(v2, v1)).toBe(-1);
    });

    it("should compare patch versions", () => {
      const v1 = parseVersion("1.2.4");
      const v2 = parseVersion("1.2.3");

      expect(compareVersions(v1, v2)).toBe(1);
      expect(compareVersions(v2, v1)).toBe(-1);
    });

    it("should treat version without prerelease as greater", () => {
      const v1 = parseVersion("1.2.3");
      const v2 = parseVersion("1.2.3-alpha");

      expect(compareVersions(v1, v2)).toBe(1);
      expect(compareVersions(v2, v1)).toBe(-1);
    });

    it("should compare prerelease versions", () => {
      const v1 = parseVersion("1.2.3-beta");
      const v2 = parseVersion("1.2.3-alpha");

      expect(compareVersions(v1, v2)).toBe(1);
      expect(compareVersions(v2, v1)).toBe(-1);
    });

    it("should ignore build metadata in comparison", () => {
      const v1 = parseVersion("1.2.3+build.1");
      const v2 = parseVersion("1.2.3+build.2");

      expect(compareVersions(v1, v2)).toBe(0);
    });
  });

  describe("isValidVersion", () => {
    it("should return true for valid versions", () => {
      expect(isValidVersion("1.2.3")).toBe(true);
      expect(isValidVersion("0.0.1")).toBe(true);
      expect(isValidVersion("1.2.3-alpha")).toBe(true);
      expect(isValidVersion("1.2.3+build")).toBe(true);
      expect(isValidVersion("1.2.3-alpha+build")).toBe(true);
    });

    it("should return false for invalid versions", () => {
      expect(isValidVersion("invalid")).toBe(false);
      expect(isValidVersion("1.2")).toBe(false);
      expect(isValidVersion("1.2.3.4")).toBe(false);
      expect(isValidVersion("v1.2.3")).toBe(false);
    });
  });

  describe("validateVersion", () => {
    it("should not throw for valid version", () => {
      expect(() => validateVersion("1.2.3")).not.toThrow();
    });

    it("should throw for invalid version", () => {
      expect(() => validateVersion("invalid")).toThrow();
      expect(() => validateVersion("1.2")).toThrow();
    });
  });

  describe("incrementVersion", () => {
    it("should increment major version", () => {
      const version = parseVersion("1.2.3");
      const result = incrementVersion(version, "major");

      expect(result).toEqual({
        major: 2,
        minor: 0,
        patch: 0,
        prerelease: undefined,
        build: undefined,
      });
    });

    it("should increment minor version", () => {
      const version = parseVersion("1.2.3");
      const result = incrementVersion(version, "minor");

      expect(result).toEqual({
        major: 1,
        minor: 3,
        patch: 0,
        prerelease: undefined,
        build: undefined,
      });
    });

    it("should increment patch version", () => {
      const version = parseVersion("1.2.3");
      const result = incrementVersion(version, "patch");

      expect(result).toEqual({
        major: 1,
        minor: 2,
        patch: 4,
        prerelease: undefined,
        build: undefined,
      });
    });

    it("should clear prerelease and build on increment", () => {
      const version = parseVersion("1.2.3-alpha+build");
      const result = incrementVersion(version, "patch");

      expect(result.prerelease).toBeUndefined();
      expect(result.build).toBeUndefined();
    });
  });
});
