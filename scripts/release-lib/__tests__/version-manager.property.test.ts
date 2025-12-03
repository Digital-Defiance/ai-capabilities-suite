/**
 * Property-based tests for version manager
 *
 * **Feature: release-automation, Property 3: Version consistency after sync**
 * **Validates: Requirements 4.5**
 *
 * For any submodule and target version, after version synchronization completes,
 * all configured files in that submodule should contain the target version string.
 */

import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { VersionManagerImpl } from "../version-manager";
import { SubmoduleConfig, VersionSyncFile } from "../types";

describe("Property 3: Version consistency after sync", () => {
  /**
   * Generator for valid semantic versions
   * Ensures version is not "0.0.0" to avoid conflicts with initial content
   */
  const semverArbitrary = fc
    .tuple(
      fc.nat({ max: 20 }), // major
      fc.nat({ max: 50 }), // minor
      fc.nat({ max: 100 }) // patch
    )
    .map(([major, minor, patch]) => `${major}.${minor}.${patch}`)
    .filter((v) => v !== "0.0.0"); // Avoid the initial version

  /**
   * Generator for file patterns and replacements
   * Each file gets a unique name to avoid conflicts
   */
  const fileConfigArbitrary = fc
    .tuple(
      fc.constantFrom("ts", "js", "json", "md", "txt", "sh", "yml", "yaml"),
      fc.constantFrom(
        "VERSION",
        "version",
        "Version",
        "APP_VERSION",
        "PACKAGE_VERSION"
      ),
      fc.nat({ max: 1000 }) // Add a unique ID to avoid file name collisions
    )
    .map(([ext, varName, id]) => {
      const filename = `test-file-${id}.${ext}`;
      let pattern: string;
      let replacement: string;
      let initialContent: string;

      switch (ext) {
        case "ts":
        case "js":
          pattern = `const ${varName} = "[^"]+"`;
          replacement = `const ${varName} = "$VERSION"`;
          initialContent = `const ${varName} = "0.0.0";`;
          break;
        case "json":
          pattern = `"${varName}": "[^"]+"`;
          replacement = `"${varName}": "$VERSION"`;
          initialContent = `{"${varName}": "0.0.0"}`;
          break;
        case "sh":
          pattern = `${varName}="[^"]+"`;
          replacement = `${varName}="$VERSION"`;
          initialContent = `${varName}="0.0.0"`;
          break;
        case "yml":
        case "yaml":
          pattern = `${varName}: [^\\n]+`;
          replacement = `${varName}: $VERSION`;
          initialContent = `${varName}: 0.0.0`;
          break;
        default:
          pattern = `${varName}: [^\\n]+`;
          replacement = `${varName}: $VERSION`;
          initialContent = `${varName}: 0.0.0`;
      }

      return {
        filename,
        pattern,
        replacement,
        initialContent,
        varName,
      };
    });

  /**
   * Generator for submodule configurations with version sync files
   * Ensures each file has a unique name by adding an index
   */
  const configArbitrary = fc
    .array(fileConfigArbitrary, { minLength: 1, maxLength: 5 })
    .map((fileConfigs) => {
      // Ensure unique filenames by adding an index
      const uniqueFileConfigs = fileConfigs.map((fc, index) => ({
        ...fc,
        filename: `test-file-${index}.${fc.filename.split(".").pop()}`,
      }));

      const files: VersionSyncFile[] = uniqueFileConfigs.map((fc) => ({
        path: fc.filename,
        pattern: fc.pattern,
        replacement: fc.replacement,
      }));

      const config: SubmoduleConfig = {
        name: "test-submodule",
        displayName: "Test Submodule",
        path: "test-submodule",
        repository: {
          owner: "test",
          name: "test-submodule",
          url: "https://github.com/test/test-submodule",
        },
        artifacts: {
          npm: true,
          docker: false,
          vscode: false,
          binaries: false,
        },
        build: {
          command: "npm run build",
          testCommand: "npm test",
        },
        publish: {},
        versionSync: {
          files,
        },
      };

      return { config, fileConfigs: uniqueFileConfigs };
    });

  it("should ensure all configured files contain the target version after sync", async () => {
    await fc.assert(
      fc.asyncProperty(
        configArbitrary,
        semverArbitrary,
        async ({ config, fileConfigs }, targetVersion) => {
          // Create temporary directory for this test run
          const tempDir = fs.mkdtempSync(
            path.join(os.tmpdir(), "version-sync-property-")
          );

          try {
            // Create test files with initial content
            for (const fileConfig of fileConfigs) {
              const filePath = path.join(tempDir, fileConfig.filename);
              fs.writeFileSync(filePath, fileConfig.initialContent, "utf8");
            }

            // Create version manager with temp directory as root
            const versionManager = new VersionManagerImpl(tempDir);

            // Perform version sync
            const syncResult = await versionManager.syncVersions(
              "test-submodule",
              config,
              targetVersion
            );

            // Property: No errors should occur
            expect(syncResult.errors).toHaveLength(0);

            // Property: All files should be updated
            expect(syncResult.filesUpdated.length).toBeGreaterThan(0);

            // Property: Verification should pass
            const verifyResult = await versionManager.verifyVersions(
              "test-submodule",
              config,
              targetVersion
            );
            expect(verifyResult).toBe(true);

            // Property: Each file should contain the target version
            for (const fileConfig of fileConfigs) {
              const filePath = path.join(tempDir, fileConfig.filename);
              const content = fs.readFileSync(filePath, "utf8");
              expect(content).toContain(targetVersion);
            }
          } finally {
            // Cleanup
            if (fs.existsSync(tempDir)) {
              fs.rmSync(tempDir, { recursive: true, force: true });
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should maintain version consistency across multiple sync operations", async () => {
    await fc.assert(
      fc.asyncProperty(
        configArbitrary,
        fc.array(semverArbitrary, { minLength: 2, maxLength: 5 }),
        async ({ config, fileConfigs }, versions) => {
          const tempDir = fs.mkdtempSync(
            path.join(os.tmpdir(), "version-multi-sync-")
          );

          try {
            // Create test files
            for (const fileConfig of fileConfigs) {
              const filePath = path.join(tempDir, fileConfig.filename);
              fs.writeFileSync(filePath, fileConfig.initialContent, "utf8");
            }

            const versionManager = new VersionManagerImpl(tempDir);

            // Apply each version in sequence
            for (const version of versions) {
              await versionManager.syncVersions(
                "test-submodule",
                config,
                version
              );

              // Property: After each sync, verification should pass
              const verifyResult = await versionManager.verifyVersions(
                "test-submodule",
                config,
                version
              );
              expect(verifyResult).toBe(true);

              // Property: All files should contain the current version
              for (const fileConfig of fileConfigs) {
                const filePath = path.join(tempDir, fileConfig.filename);
                const content = fs.readFileSync(filePath, "utf8");
                expect(content).toContain(version);
              }
            }

            // Property: Final verification with last version should pass
            const finalVersion = versions[versions.length - 1];
            const finalVerify = await versionManager.verifyVersions(
              "test-submodule",
              config,
              finalVersion
            );
            expect(finalVerify).toBe(true);
          } finally {
            if (fs.existsSync(tempDir)) {
              fs.rmSync(tempDir, { recursive: true, force: true });
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it("should handle edge case: empty file list", async () => {
    await fc.assert(
      fc.asyncProperty(semverArbitrary, async (version) => {
        const tempDir = fs.mkdtempSync(
          path.join(os.tmpdir(), "version-empty-")
        );

        try {
          const config: SubmoduleConfig = {
            name: "test",
            displayName: "Test",
            path: "test",
            repository: {
              owner: "test",
              name: "test",
              url: "https://github.com/test/test",
            },
            artifacts: {
              npm: true,
              docker: false,
              vscode: false,
              binaries: false,
            },
            build: {
              command: "npm run build",
              testCommand: "npm test",
            },
            publish: {},
            versionSync: {
              files: [], // Empty file list
            },
          };

          const versionManager = new VersionManagerImpl(tempDir);

          // Property: Sync should succeed with no files
          const syncResult = await versionManager.syncVersions(
            "test",
            config,
            version
          );
          expect(syncResult.errors).toHaveLength(0);
          expect(syncResult.filesUpdated).toHaveLength(0);

          // Property: Verification should pass (vacuously true)
          const verifyResult = await versionManager.verifyVersions(
            "test",
            config,
            version
          );
          expect(verifyResult).toBe(true);
        } finally {
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        }
      }),
      { numRuns: 20 }
    );
  });

  it("should handle special characters in version strings", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.nat({ max: 10 }),
          fc.nat({ max: 10 }),
          fc.nat({ max: 10 }),
          fc.option(
            fc
              .array(fc.constantFrom("alpha", "beta", "rc", "1", "2", "3"), {
                minLength: 1,
                maxLength: 3,
              })
              .map((arr) => arr.join(".")),
            { nil: undefined }
          )
        ),
        async ([major, minor, patch, prerelease]) => {
          const tempDir = fs.mkdtempSync(
            path.join(os.tmpdir(), "version-special-")
          );

          try {
            // Build version string
            let version = `${major}.${minor}.${patch}`;
            if (prerelease) {
              version += `-${prerelease}`;
            }

            // Create a simple test file
            const testFile = "test.json";
            const filePath = path.join(tempDir, testFile);
            fs.writeFileSync(filePath, '{"version": "0.0.0"}', "utf8");

            const config: SubmoduleConfig = {
              name: "test",
              displayName: "Test",
              path: "test",
              repository: {
                owner: "test",
                name: "test",
                url: "https://github.com/test/test",
              },
              artifacts: {
                npm: true,
                docker: false,
                vscode: false,
                binaries: false,
              },
              build: {
                command: "npm run build",
                testCommand: "npm test",
              },
              publish: {},
              versionSync: {
                files: [
                  {
                    path: testFile,
                    pattern: '"version": "[^"]+"',
                    replacement: '"version": "$VERSION"',
                  },
                ],
              },
            };

            const versionManager = new VersionManagerImpl(tempDir);

            // Property: Sync should handle the version
            const syncResult = await versionManager.syncVersions(
              "test",
              config,
              version
            );
            expect(syncResult.errors).toHaveLength(0);

            // Property: File should contain the exact version
            const content = fs.readFileSync(filePath, "utf8");
            expect(content).toContain(version);

            // Property: Verification should pass
            const verifyResult = await versionManager.verifyVersions(
              "test",
              config,
              version
            );
            expect(verifyResult).toBe(true);
          } finally {
            if (fs.existsSync(tempDir)) {
              fs.rmSync(tempDir, { recursive: true, force: true });
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it("should be idempotent: syncing the same version twice produces the same result", async () => {
    await fc.assert(
      fc.asyncProperty(
        configArbitrary,
        semverArbitrary,
        async ({ config, fileConfigs }, version) => {
          const tempDir = fs.mkdtempSync(
            path.join(os.tmpdir(), "version-idempotent-")
          );

          try {
            // Create test files
            for (const fileConfig of fileConfigs) {
              const filePath = path.join(tempDir, fileConfig.filename);
              fs.writeFileSync(filePath, fileConfig.initialContent, "utf8");
            }

            const versionManager = new VersionManagerImpl(tempDir);

            // First sync
            await versionManager.syncVersions(
              "test-submodule",
              config,
              version
            );

            // Read file contents after first sync
            const contentsAfterFirst = fileConfigs.map((fc) => {
              const filePath = path.join(tempDir, fc.filename);
              return fs.readFileSync(filePath, "utf8");
            });

            // Second sync with same version
            const syncResult2 = await versionManager.syncVersions(
              "test-submodule",
              config,
              version
            );

            // Read file contents after second sync
            const contentsAfterSecond = fileConfigs.map((fc) => {
              const filePath = path.join(tempDir, fc.filename);
              return fs.readFileSync(filePath, "utf8");
            });

            // Property: Second sync should report no files updated (idempotent)
            expect(syncResult2.filesUpdated).toHaveLength(0);

            // Property: File contents should be identical
            for (let i = 0; i < contentsAfterFirst.length; i++) {
              expect(contentsAfterSecond[i]).toBe(contentsAfterFirst[i]);
            }

            // Property: Verification should still pass
            const verifyResult = await versionManager.verifyVersions(
              "test-submodule",
              config,
              version
            );
            expect(verifyResult).toBe(true);
          } finally {
            if (fs.existsSync(tempDir)) {
              fs.rmSync(tempDir, { recursive: true, force: true });
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
