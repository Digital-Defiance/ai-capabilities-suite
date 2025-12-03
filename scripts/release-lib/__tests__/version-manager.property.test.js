/**
 * @fileoverview Property-based tests for version manager
 * **Feature: release-automation, Property 1: Version consistency after sync**
 * **Validates: Requirements 2.5**
 */

const fc = require("fast-check");
const fs = require("fs");
const path = require("path");
const { syncVersions, verifyVersions } = require("../version-manager");

describe("version-manager Property-Based Tests", () => {
  const tempDir = path.join(__dirname, "temp-property-test");
  const projectRoot = path.join(__dirname, "..", "..", "..");

  beforeEach(() => {
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }
  });

  /**
   * Property 1: Version consistency after sync
   * For any package and target version, after version synchronization completes,
   * all configured files should contain the target version string.
   */
  it("Property 1: Version consistency after sync - all files should contain target version after sync", async () => {
    await fc.assert(
      fc.asyncProperty(
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
        // Generate 1-5 files to sync
        fc.integer({ min: 1, max: 5 }),
        async (versionParts, fileCount) => {
          // Build semver version string
          let version = `${versionParts.major}.${versionParts.minor}.${versionParts.patch}`;
          if (
            versionParts.prerelease &&
            versionParts.prereleaseVersion !== null
          ) {
            version += `-${versionParts.prerelease}.${versionParts.prereleaseVersion}`;
          }

          // Create test files with initial version 0.0.0
          const files = [];
          const filesToSync = [];

          for (let i = 0; i < fileCount; i++) {
            const fileName = `test-file-${i}.json`;
            const filePath = path.join(tempDir, fileName);
            const initialContent = `{"version": "0.0.0", "name": "test-${i}"}`;

            fs.writeFileSync(filePath, initialContent, "utf8");

            const relPath = path.relative(projectRoot, filePath);
            files.push({ path: filePath, relPath });

            filesToSync.push({
              path: relPath,
              pattern: '"version":\\s*"[^"]+"',
              replacement: '"version": "$VERSION"',
            });
          }

          const config = { filesToSync };

          // Perform version sync
          const syncResult = await syncVersions(config, version);

          // Property: All files should be updated (since they all start with 0.0.0)
          expect(syncResult.filesUpdated.length).toBe(fileCount);
          expect(syncResult.errors.length).toBe(0);

          // Property: Verification should pass after sync
          const verifyResult = await verifyVersions(config, version);
          expect(verifyResult).toBe(true);

          // Property: Each file should contain the exact version string
          for (const file of files) {
            const content = fs.readFileSync(file.path, "utf8");
            expect(content).toContain(`"version": "${version}"`);
          }
        }
      ),
      {
        numRuns: 100, // Run 100 iterations as specified in design
      }
    );
  });

  /**
   * Additional property: Idempotence
   * Syncing the same version twice should not change files the second time
   */
  it("Property: Version sync is idempotent - syncing same version twice produces no changes on second sync", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid semver versions
        fc.record({
          major: fc.nat(99),
          minor: fc.nat(99),
          patch: fc.nat(99),
        }),
        async (versionParts) => {
          const version = `${versionParts.major}.${versionParts.minor}.${versionParts.patch}`;

          // Create a test file
          const fileName = "test-idempotent.json";
          const filePath = path.join(tempDir, fileName);
          const initialContent = `{"version": "0.0.0"}`;

          fs.writeFileSync(filePath, initialContent, "utf8");

          const relPath = path.relative(projectRoot, filePath);
          const config = {
            filesToSync: [
              {
                path: relPath,
                pattern: '"version":\\s*"[^"]+"',
                replacement: '"version": "$VERSION"',
              },
            ],
          };

          // First sync
          const firstSync = await syncVersions(config, version);
          expect(firstSync.filesUpdated.length).toBe(1);

          // Second sync with same version
          const secondSync = await syncVersions(config, version);

          // Property: Second sync should not update any files (idempotent)
          expect(secondSync.filesUpdated.length).toBe(0);
          expect(secondSync.errors.length).toBe(0);

          // Verification should still pass
          const verifyResult = await verifyVersions(config, version);
          expect(verifyResult).toBe(true);
        }
      ),
      {
        numRuns: 100,
      }
    );
  });

  /**
   * Additional property: Multiple patterns
   * When a file has multiple patterns, all should be updated
   */
  it("Property: Multiple patterns in same file are all updated", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          major: fc.nat(99),
          minor: fc.nat(99),
          patch: fc.nat(99),
        }),
        async (versionParts) => {
          const version = `${versionParts.major}.${versionParts.minor}.${versionParts.patch}`;

          // Create a file with multiple version references
          const fileName = "multi-pattern.txt";
          const filePath = path.join(tempDir, fileName);
          const initialContent = `
Version: 0.0.0
Release: v0.0.0
Package version is 0.0.0
`;

          fs.writeFileSync(filePath, initialContent, "utf8");

          const relPath = path.relative(projectRoot, filePath);
          const config = {
            filesToSync: [
              {
                path: relPath,
                pattern: /Version: [0-9]+\.[0-9]+\.[0-9]+/,
                replacement: "Version: $VERSION",
              },
              {
                path: relPath,
                pattern: /Release: v[0-9]+\.[0-9]+\.[0-9]+/,
                replacement: "Release: v$VERSION",
              },
              {
                path: relPath,
                pattern: /Package version is [0-9]+\.[0-9]+\.[0-9]+/,
                replacement: "Package version is $VERSION",
              },
            ],
          };

          // Sync versions
          await syncVersions(config, version);

          // Property: All patterns should be updated in the file
          const content = fs.readFileSync(filePath, "utf8");
          expect(content).toContain(`Version: ${version}`);
          expect(content).toContain(`Release: v${version}`);
          expect(content).toContain(`Package version is ${version}`);
        }
      ),
      {
        numRuns: 100,
      }
    );
  });
});
