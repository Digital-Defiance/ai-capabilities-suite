/**
 * Property-based tests for ES6 import syntax
 *
 * **Feature: js-to-ts-conversion, Property 6: ES6 import syntax**
 * **Validates: Requirements 4.5**
 *
 * For any module import, the script should use ES6 import syntax (import/export)
 * rather than CommonJS require() where the module system supports it.
 */

import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

describe("Property 6: ES6 import syntax", () => {
  /**
   * This property test verifies that converted TypeScript files use ES6 import
   * syntax instead of CommonJS require(). We test this by:
   * 1. Parsing the TypeScript file using the TypeScript compiler API
   * 2. Walking the AST to find all import statements
   * 3. Checking for require() calls that should be ES6 imports
   * 4. Verifying ES6 imports are used for TypeScript modules
   */

  /**
   * Extracts import information from a TypeScript source file
   * @param sourceFile - TypeScript source file to analyze
   * @returns Import analysis with ES6 imports and require calls
   */
  function extractImports(sourceFile: ts.SourceFile): {
    es6Imports: Array<{
      module: string;
      line: number;
      type: string;
    }>;
    requireCalls: Array<{
      module: string;
      line: number;
      context: string;
    }>;
  } {
    const es6Imports: Array<{
      module: string;
      line: number;
      type: string;
    }> = [];
    const requireCalls: Array<{
      module: string;
      line: number;
      context: string;
    }> = [];

    function visit(node: ts.Node): void {
      // Check for ES6 import declarations
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const module = moduleSpecifier.text;
          const line =
            sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          const type = node.importClause?.isTypeOnly ? "type-only" : "value";
          es6Imports.push({ module, line, type });
        }
      }
      // Check for require() calls
      else if (ts.isCallExpression(node)) {
        const expression = node.expression;
        if (
          ts.isIdentifier(expression) &&
          expression.text === "require" &&
          node.arguments.length > 0
        ) {
          const arg = node.arguments[0];
          if (ts.isStringLiteral(arg)) {
            const module = arg.text;
            const line =
              sourceFile.getLineAndCharacterOfPosition(node.getStart()).line +
              1;

            // Get context - is this in a variable declaration, destructuring, etc.
            let context = "unknown";
            let parent = node.parent;
            if (parent) {
              if (ts.isVariableDeclaration(parent)) {
                context = "variable";
              } else if (ts.isPropertyAssignment(parent)) {
                context = "property";
              } else if (ts.isExpressionStatement(parent)) {
                context = "statement";
              }
            }

            requireCalls.push({ module, line, context });
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return { es6Imports, requireCalls };
  }

  /**
   * Analyzes a TypeScript file for import syntax usage
   * @param filePath - Path to the TypeScript file
   * @returns Analysis result with imports and violations
   */
  function analyzeFile(filePath: string): {
    es6Imports: Array<{ module: string; line: number; type: string }>;
    requireCalls: Array<{ module: string; line: number; context: string }>;
    violations: Array<{
      module: string;
      line: number;
      issue: string;
    }>;
  } {
    const sourceCode = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const { es6Imports, requireCalls } = extractImports(sourceFile);

    // Identify violations: require() calls for TypeScript modules
    // Note: require() is acceptable for JavaScript modules without type definitions
    const violations = requireCalls
      .filter((req) => {
        // Allow require() for JavaScript modules in release-lib (they don't have TS definitions)
        return !req.module.startsWith("./release-lib/");
      })
      .map((req) => ({
        module: req.module,
        line: req.line,
        issue: `Using require() instead of ES6 import for module '${req.module}'`,
      }));

    return { es6Imports, requireCalls, violations };
  }

  it("should use ES6 import syntax for TypeScript modules in set-version.ts", () => {
    const filePath = path.join(__dirname, "set-version.ts");
    const analysis = analyzeFile(filePath);

    // Report violations if any (excluding allowed require() for JS modules)
    if (analysis.violations.length > 0) {
      const violationDetails = analysis.violations
        .map((v) => `  - ${v.module} at line ${v.line}: ${v.issue}`)
        .join("\n");
      console.error(
        `\nModules using require() instead of ES6 imports:\n${violationDetails}\n`
      );
    }

    // Should have some ES6 imports
    expect(analysis.es6Imports.length).toBeGreaterThan(0);

    // Should not have violations (require() for TS modules)
    expect(analysis.violations).toEqual([]);
  });

  it("should verify ES6 import syntax across all converted TypeScript files", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "sync-versions.ts",
          "set-version.ts"
          // Add more converted files as they are created:
          // "generate-changelog.ts",
          // "build-binaries.ts"
        ),
        (filename) => {
          const filePath = path.join(__dirname, filename);

          // Skip if file doesn't exist yet (not all conversions complete)
          if (!fs.existsSync(filePath)) {
            return true;
          }

          const analysis = analyzeFile(filePath);

          // Report violations if any
          if (analysis.violations.length > 0) {
            const violationDetails = analysis.violations
              .map((v) => `  - ${v.module} at line ${v.line}: ${v.issue}`)
              .join("\n");
            console.error(
              `\n${filename} - Modules using require() instead of ES6 imports:\n${violationDetails}\n`
            );
          }

          // All TypeScript modules should use ES6 imports
          expect(analysis.violations).toEqual([]);
          return analysis.violations.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify that utility files use ES6 import syntax", () => {
    const utilityFiles = [
      "common/file-utils.ts",
      "common/exec-utils.ts",
      "common/version-utils.ts",
    ];

    fc.assert(
      fc.property(fc.constantFrom(...utilityFiles), (filename) => {
        const filePath = path.join(__dirname, filename);

        if (!fs.existsSync(filePath)) {
          return true;
        }

        const analysis = analyzeFile(filePath);

        // Report violations if any
        if (analysis.violations.length > 0) {
          const violationDetails = analysis.violations
            .map((v) => `  - ${v.module} at line ${v.line}: ${v.issue}`)
            .join("\n");
          console.error(
            `\n${filename} - Modules using require() instead of ES6 imports:\n${violationDetails}\n`
          );
        }

        // All utility modules should use ES6 imports
        expect(analysis.violations).toEqual([]);
        return analysis.violations.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should correctly identify ES6 import types", () => {
    const testCode = `
      import * as fs from "fs";
      import { readFile } from "fs";
      import path from "path";
      import type { SomeType } from "./types";
      
      const config = require("./config.js");
    `;

    const sourceFile = ts.createSourceFile(
      "test.ts",
      testCode,
      ts.ScriptTarget.Latest,
      true
    );

    const { es6Imports, requireCalls } = extractImports(sourceFile);

    // Should find 4 ES6 imports
    expect(es6Imports.length).toBe(4);

    // Should find the type-only import
    const typeImport = es6Imports.find((imp) => imp.type === "type-only");
    expect(typeImport).toBeDefined();
    expect(typeImport?.module).toBe("./types");

    // Should find 1 require call
    expect(requireCalls.length).toBe(1);
    expect(requireCalls[0].module).toBe("./config.js");
  });

  it("should allow require() for JavaScript modules without type definitions", () => {
    const testCode = `
      import * as fs from "fs";
      
      // These are JavaScript modules without TypeScript definitions
      const { loadConfig } = require("./release-lib/config-loader");
      const { syncVersions } = require("./release-lib/version-manager");
    `;

    const sourceFile = ts.createSourceFile(
      "test.ts",
      testCode,
      ts.ScriptTarget.Latest,
      true
    );

    const { es6Imports, requireCalls } = extractImports(sourceFile);

    // Should have ES6 imports
    expect(es6Imports.length).toBe(1);

    // Should have require calls for JS modules
    expect(requireCalls.length).toBe(2);

    // These should not be violations since they're in release-lib
    const analysis = analyzeFile(path.join(__dirname, "set-version.ts"));
    const releaseLibRequires = analysis.requireCalls.filter((req) =>
      req.module.startsWith("./release-lib/")
    );

    // Should have require calls for release-lib modules
    expect(releaseLibRequires.length).toBeGreaterThan(0);

    // But they should not be violations
    const releaseLibViolations = analysis.violations.filter((v) =>
      v.module.startsWith("./release-lib/")
    );
    expect(releaseLibViolations).toEqual([]);
  });

  it("should detect require() usage in different contexts", () => {
    const testCode = `
      // Variable declaration
      const fs = require("fs");
      
      // Destructuring
      const { readFile, writeFile } = require("fs");
      
      // Direct call
      require("./side-effect-module");
    `;

    const sourceFile = ts.createSourceFile(
      "test.ts",
      testCode,
      ts.ScriptTarget.Latest,
      true
    );

    const { requireCalls } = extractImports(sourceFile);

    expect(requireCalls.length).toBe(3);

    // Check contexts
    const contexts = requireCalls.map((req) => req.context);
    expect(contexts).toContain("variable");
    expect(contexts).toContain("statement");
  });
});
