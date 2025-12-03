/**
 * @fileoverview Property-based tests for configuration loader
 *
 * Feature: release-automation, Property 12: Configuration defaults
 * Validates: Requirements 17.5
 */

import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";
import { ConfigLoader } from "../config-loader";

describe("ConfigLoader Property Tests", () => {
  const testMonorepoRoot = path.join(__dirname, "..", "..", "..");

  /**
   * Property 12: Configuration defaults
   *
   * For any submodule without a configuration file, the system should apply
   * sensible defaults and complete the release successfully.
   *
   * This property tests that:
   * 1. Any arbitrary submodule name can be loaded (even if config doesn't exist)
   * 2. The returned configuration has all required fields
   * 3. The configuration is valid and usable
   * 4. Default values are sensible and follow expected patterns
   */
  it("Property 12: should apply sensible defaults for any non-existent submodule", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary submodule names (alphanumeric, lowercase, 3-20 chars)
        fc.stringMatching(/^[a-z][a-z0-9-]{2,19}$/),
        async (submoduleName) => {
          // Skip if this is an actual config file that exists
          const configPath = path.join(
            testMonorepoRoot,
            "scripts",
            "release-config",
            `${submoduleName}.json`
          );

          if (fs.existsSync(configPath)) {
            // Skip this test case - we want to test non-existent configs
            return true;
          }

          const loader = new ConfigLoader(testMonorepoRoot);
          const config = await loader.loadConfig(submoduleName);

          // Verify all required fields are present
          expect(config).toBeDefined();
          expect(config.name).toBe(submoduleName);
          expect(config.displayName).toBe(submoduleName);

          // Verify repository structure
          expect(config.repository).toBeDefined();
          expect(config.repository.owner).toBe("digital-defiance");
          expect(config.repository.name).toBe(`mcp-${submoduleName}`);
          expect(config.repository.url).toBe(
            `https://github.com/digital-defiance/mcp-${submoduleName}`
          );

          // Verify path follows expected pattern
          expect(config.path).toBe(`packages/mcp-${submoduleName}`);

          // Verify build commands follow expected pattern
          expect(config.build.command).toBe(`nx build mcp-${submoduleName}`);
          expect(config.build.testCommand).toBe(`nx test mcp-${submoduleName}`);

          // Verify artifacts structure
          expect(config.artifacts).toBeDefined();
          expect(config.artifacts.npm).toBe(true); // Default should have npm
          expect(config.artifacts.binaries).toBe(false); // Default should not build binaries

          // Verify publish configuration
          expect(config.publish).toBeDefined();
          expect(config.publish.npmPackageName).toBe(
            `@ai-capabilities-suite/mcp-${submoduleName}`
          );

          // Verify versionSync has at least one file (package.json)
          expect(config.versionSync).toBeDefined();
          expect(config.versionSync.files).toBeDefined();
          expect(Array.isArray(config.versionSync.files)).toBe(true);
          expect(config.versionSync.files.length).toBeGreaterThan(0);

          // Verify the default version sync file
          const packageJsonSync = config.versionSync.files[0];
          expect(packageJsonSync.path).toBe(
            `packages/mcp-${submoduleName}/package.json`
          );
          expect(packageJsonSync.pattern).toBe('"version":\\s*"[^"]+"');
          expect(packageJsonSync.replacement).toBe('"version": "$VERSION"');

          return true;
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property: Default configuration should be consistent
   *
   * For any two non-existent submodules with the same name, loading them
   * multiple times should produce identical configurations.
   */
  it("should produce consistent defaults for the same submodule name", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z][a-z0-9-]{2,19}$/),
        async (submoduleName) => {
          // Skip if this is an actual config file that exists
          const configPath = path.join(
            testMonorepoRoot,
            "scripts",
            "release-config",
            `${submoduleName}.json`
          );

          if (fs.existsSync(configPath)) {
            return true;
          }

          const loader = new ConfigLoader(testMonorepoRoot);

          // Load the same config twice
          const config1 = await loader.loadConfig(submoduleName);
          const config2 = await loader.loadConfig(submoduleName);

          // Configurations should be identical
          expect(config1).toEqual(config2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default configurations should be valid
   *
   * For any non-existent submodule, the default configuration should pass
   * all validation checks (no exceptions thrown).
   */
  it("should produce valid configurations that pass validation", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z][a-z0-9-]{2,19}$/),
        async (submoduleName) => {
          // Skip if this is an actual config file that exists
          const configPath = path.join(
            testMonorepoRoot,
            "scripts",
            "release-config",
            `${submoduleName}.json`
          );

          if (fs.existsSync(configPath)) {
            return true;
          }

          const loader = new ConfigLoader(testMonorepoRoot);

          // This should not throw - validation happens inside loadConfig
          const config = await loader.loadConfig(submoduleName);

          // If we got here, validation passed
          expect(config).toBeDefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default artifact flags should be safe
   *
   * For any non-existent submodule, the default configuration should have
   * safe artifact flags (binaries=false, docker=false, vscode=false, npm=true).
   */
  it("should set safe default artifact flags", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z][a-z0-9-]{2,19}$/),
        async (submoduleName) => {
          // Skip if this is an actual config file that exists
          const configPath = path.join(
            testMonorepoRoot,
            "scripts",
            "release-config",
            `${submoduleName}.json`
          );

          if (fs.existsSync(configPath)) {
            return true;
          }

          const loader = new ConfigLoader(testMonorepoRoot);
          const config = await loader.loadConfig(submoduleName);

          // Default should be safe: only npm publishing, no binaries/docker/vscode
          expect(config.artifacts.npm).toBe(true);
          expect(config.artifacts.binaries).toBe(false);
          expect(config.artifacts.docker).toBe(false);
          expect(config.artifacts.vscode).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default configuration should follow naming conventions
   *
   * For any non-existent submodule, all generated names and paths should
   * follow the project's naming conventions.
   */
  it("should follow naming conventions in default configuration", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-z][a-z0-9-]{2,19}$/),
        async (submoduleName) => {
          // Skip if this is an actual config file that exists
          const configPath = path.join(
            testMonorepoRoot,
            "scripts",
            "release-config",
            `${submoduleName}.json`
          );

          if (fs.existsSync(configPath)) {
            return true;
          }

          const loader = new ConfigLoader(testMonorepoRoot);
          const config = await loader.loadConfig(submoduleName);

          // Check naming conventions
          // Package name should be @ai-capabilities-suite/mcp-{name}
          expect(config.publish.npmPackageName).toMatch(
            /^@ai-capabilities-suite\/mcp-[a-z][a-z0-9-]+$/
          );

          // Repository name should be mcp-{name}
          expect(config.repository.name).toMatch(/^mcp-[a-z][a-z0-9-]+$/);

          // Path should be packages/mcp-{name}
          expect(config.path).toMatch(/^packages\/mcp-[a-z][a-z0-9-]+$/);

          // Build commands should use nx
          expect(config.build.command).toContain("nx build");
          expect(config.build.testCommand).toContain("nx test");

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
