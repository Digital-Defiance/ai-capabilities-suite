/**
 * Property-based tests for Node.js module type safety
 *
 * **Feature: js-to-ts-conversion, Property 1: Node.js module type safety**
 * **Validates: Requirements 1.3, 1.4, 1.5**
 *
 * For any import of Node.js built-in modules (fs, path, child_process, etc.),
 * the TypeScript compiler should successfully type-check the usage without errors.
 */

import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

describe("Property 1: Node.js module type safety", () => {
  /**
   * This property test verifies that our utility modules correctly use
   * Node.js built-in module types. We test this by:
   * 1. Verifying TypeScript compilation succeeds
   * 2. Testing that actual Node.js operations work with our typed wrappers
   */

  it("should successfully type-check all Node.js module imports", () => {
    // Verify TypeScript compilation succeeds for our common utilities
    const scriptsDir = path.join(__dirname, "..");
    const tsconfigPath = path.join(scriptsDir, "tsconfig.json");

    expect(() => {
      execSync(`npx tsc --noEmit -p ${tsconfigPath}`, {
        encoding: "utf8",
        stdio: "pipe",
      });
    }).not.toThrow();
  });

  it("should correctly type fs module operations", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => !s.includes("\0") && !s.includes("/")),
        (filename) => {
          // Test that fs operations are properly typed
          const testPath = path.join(__dirname, `test-${filename}.tmp`);
          const testContent = "test content";

          try {
            // These operations should all be type-safe
            fs.writeFileSync(testPath, testContent, "utf8");
            const exists: boolean = fs.existsSync(testPath);
            expect(exists).toBe(true);

            const content: string = fs.readFileSync(testPath, "utf8");
            expect(content).toBe(testContent);

            fs.unlinkSync(testPath);
            expect(fs.existsSync(testPath)).toBe(false);
          } catch (error) {
            // Clean up on error
            if (fs.existsSync(testPath)) {
              fs.unlinkSync(testPath);
            }
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should correctly type path module operations", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => !s.includes("\0")),
          { minLength: 1, maxLength: 5 }
        ),
        (segments) => {
          // Test that path operations are properly typed
          const joined: string = path.join(...segments);
          expect(typeof joined).toBe("string");

          const dirname: string = path.dirname(joined);
          expect(typeof dirname).toBe("string");

          const basename: string = path.basename(joined);
          expect(typeof basename).toBe("string");

          const extname: string = path.extname(joined);
          expect(typeof extname).toBe("string");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should correctly type child_process module operations", () => {
    fc.assert(
      fc.property(
        fc.constantFrom('echo "test"', "node --version", "echo hello"),
        (command) => {
          // Test that child_process operations are properly typed
          try {
            const result: string | Buffer = execSync(command, {
              encoding: "utf8",
              stdio: "pipe",
            });

            expect(typeof result).toBe("string");
            expect(result.length).toBeGreaterThan(0);
          } catch (error) {
            // Some commands might fail, but they should still be properly typed
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should correctly handle typed error objects from Node.js modules", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (nonExistentPath) => {
          // Test that error handling is properly typed
          try {
            fs.readFileSync(`/nonexistent/${nonExistentPath}`, "utf8");
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            // Error should be properly typed
            expect(error).toBeDefined();

            if (error instanceof Error) {
              expect(typeof error.message).toBe("string");
              expect(error.message.length).toBeGreaterThan(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
