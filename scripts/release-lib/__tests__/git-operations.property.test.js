/**
 * @fileoverview Property-based tests for Git operations
 * **Feature: release-automation, Property 9: Git tag format consistency**
 * **Validates: Requirements 8.2**
 */

const fc = require("fast-check");
const { formatTag } = require("../git-operations");

describe("git-operations Property-Based Tests", () => {
  /**
   * Property 9: Git tag format consistency
   * For any package and version, the Git tag should follow the format {package}-v{version}.
   */
  it("Property 9: Git tag format consistency - tag should follow {package}-v{version} format", () => {
    fc.assert(
      fc.property(
        // Generate package names (alphanumeric with hyphens)
        fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
        // Generate valid semver versions
        fc.record({
          major: fc.nat(99),
          minor: fc.nat(99),
          patch: fc.nat(99),
          prerelease: fc.option(
            fc.oneof(
              fc.constant("alpha"),
              fc.constant("beta"),
              fc.constant("rc")
            ),
            { nil: null }
          ),
          prereleaseVersion: fc.option(fc.nat(99), { nil: null }),
        }),
        (packageName, versionParts) => {
          // Build semver version string
          let version = `${versionParts.major}.${versionParts.minor}.${versionParts.patch}`;
          if (
            versionParts.prerelease &&
            versionParts.prereleaseVersion !== null
          ) {
            version += `-${versionParts.prerelease}.${versionParts.prereleaseVersion}`;
          }

          // Format the tag
          const tag = formatTag(packageName, version);

          // Property: Tag should follow the format {package}-v{version}
          const expectedTag = `${packageName}-v${version}`;
          expect(tag).toBe(expectedTag);

          // Property: Tag should start with package name
          expect(tag.startsWith(packageName)).toBe(true);

          // Property: Tag should contain '-v' separator
          expect(tag).toContain("-v");

          // Property: Tag should end with version
          expect(tag.endsWith(version)).toBe(true);

          // Property: Tag should be parseable back to package and version
          // Note: We need to find the last occurrence of "-v" since package names can contain "-v"
          const lastVIndex = tag.lastIndexOf("-v");
          expect(lastVIndex).toBeGreaterThan(-1);
          const extractedPackage = tag.substring(0, lastVIndex);
          const extractedVersion = tag.substring(lastVIndex + 2);
          expect(extractedPackage).toBe(packageName);
          expect(extractedVersion).toBe(version);
        }
      ),
      {
        numRuns: 100, // Run 100 iterations as specified in design
      }
    );
  });

  /**
   * Additional property: Tag format is consistent across multiple calls
   * Calling formatTag with the same inputs should always produce the same output
   */
  it("Property: Tag format is deterministic - same inputs produce same output", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
        fc.record({
          major: fc.nat(99),
          minor: fc.nat(99),
          patch: fc.nat(99),
        }),
        (packageName, versionParts) => {
          const version = `${versionParts.major}.${versionParts.minor}.${versionParts.patch}`;

          // Call formatTag multiple times
          const tag1 = formatTag(packageName, version);
          const tag2 = formatTag(packageName, version);
          const tag3 = formatTag(packageName, version);

          // Property: All calls should produce identical results
          expect(tag1).toBe(tag2);
          expect(tag2).toBe(tag3);
        }
      ),
      {
        numRuns: 100,
      }
    );
  });

  /**
   * Additional property: Tag format handles special version formats
   * Tags should work with prerelease versions and build metadata
   */
  it("Property: Tag format handles prerelease and build metadata correctly", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
        fc.record({
          major: fc.nat(99),
          minor: fc.nat(99),
          patch: fc.nat(99),
        }),
        fc.option(fc.stringMatching(/^[a-z0-9-]+$/), { nil: null }),
        fc.option(fc.stringMatching(/^[a-z0-9-]+$/), { nil: null }),
        (packageName, versionParts, prerelease, buildMetadata) => {
          let version = `${versionParts.major}.${versionParts.minor}.${versionParts.patch}`;

          if (prerelease) {
            version += `-${prerelease}`;
          }

          if (buildMetadata) {
            version += `+${buildMetadata}`;
          }

          const tag = formatTag(packageName, version);

          // Property: Tag should contain the full version including prerelease and build metadata
          expect(tag).toBe(`${packageName}-v${version}`);

          // Property: Tag should preserve all version components
          if (prerelease) {
            expect(tag).toContain(prerelease);
          }

          if (buildMetadata) {
            expect(tag).toContain(buildMetadata);
          }
        }
      ),
      {
        numRuns: 100,
      }
    );
  });

  /**
   * Additional property: Different packages with same version produce different tags
   * Tags should be unique per package
   */
  it("Property: Different packages produce different tags even with same version", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
        fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
        fc.record({
          major: fc.nat(99),
          minor: fc.nat(99),
          patch: fc.nat(99),
        }),
        (package1, package2, versionParts) => {
          // Skip if packages are the same
          fc.pre(package1 !== package2);

          const version = `${versionParts.major}.${versionParts.minor}.${versionParts.patch}`;

          const tag1 = formatTag(package1, version);
          const tag2 = formatTag(package2, version);

          // Property: Different packages should produce different tags
          expect(tag1).not.toBe(tag2);

          // Property: Both tags should contain the same version
          expect(tag1).toContain(version);
          expect(tag2).toContain(version);
        }
      ),
      {
        numRuns: 100,
      }
    );
  });

  /**
   * Additional property: Same package with different versions produce different tags
   * Tags should be unique per version
   */
  it("Property: Same package with different versions produces different tags", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,19}$/),
        fc.record({
          major: fc.nat(99),
          minor: fc.nat(99),
          patch: fc.nat(99),
        }),
        fc.record({
          major: fc.nat(99),
          minor: fc.nat(99),
          patch: fc.nat(99),
        }),
        (packageName, version1Parts, version2Parts) => {
          const version1 = `${version1Parts.major}.${version1Parts.minor}.${version1Parts.patch}`;
          const version2 = `${version2Parts.major}.${version2Parts.minor}.${version2Parts.patch}`;

          // Skip if versions are the same
          fc.pre(version1 !== version2);

          const tag1 = formatTag(packageName, version1);
          const tag2 = formatTag(packageName, version2);

          // Property: Different versions should produce different tags
          expect(tag1).not.toBe(tag2);

          // Property: Both tags should contain the same package name
          expect(tag1.startsWith(packageName)).toBe(true);
          expect(tag2.startsWith(packageName)).toBe(true);
        }
      ),
      {
        numRuns: 100,
      }
    );
  });
});
