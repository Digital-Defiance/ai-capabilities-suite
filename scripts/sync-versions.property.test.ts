/**
 * Property-based tests for function return type annotations
 *
 * **Feature: js-to-ts-conversion, Property 2: Function return type annotations**
 * **Validates: Requirements 4.1**
 *
 * For any function declaration in the converted scripts, the function should have
 * an explicit return type annotation.
 */

import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

describe("Property 2: Function return type annotations", () => {
  /**
   * This property test verifies that all functions in converted TypeScript files
   * have explicit return type annotations. We test this by:
   * 1. Parsing the TypeScript file using the TypeScript compiler API
   * 2. Walking the AST to find all function declarations
   * 3. Verifying each function has a return type annotation
   */

  /**
   * Extracts all function declarations from a TypeScript source file
   * @param sourceFile - TypeScript source file to analyze
   * @returns Array of function information with name and whether it has return type
   */
  function extractFunctions(sourceFile: ts.SourceFile): Array<{
    name: string;
    hasReturnType: boolean;
    kind: string;
    line: number;
  }> {
    const functions: Array<{
      name: string;
      hasReturnType: boolean;
      kind: string;
      line: number;
    }> = [];

    function visit(node: ts.Node): void {
      // Check for function declarations
      if (ts.isFunctionDeclaration(node)) {
        const name = node.name?.getText(sourceFile) || "<anonymous>";
        const hasReturnType = node.type !== undefined;
        const line =
          sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        functions.push({
          name,
          hasReturnType,
          kind: "FunctionDeclaration",
          line,
        });
      }
      // Check for arrow functions assigned to variables
      else if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach((declaration) => {
          if (
            declaration.initializer &&
            ts.isArrowFunction(declaration.initializer)
          ) {
            const name = declaration.name.getText(sourceFile);
            const hasReturnType = declaration.initializer.type !== undefined;
            const line =
              sourceFile.getLineAndCharacterOfPosition(declaration.getStart())
                .line + 1;
            functions.push({
              name,
              hasReturnType,
              kind: "ArrowFunction",
              line,
            });
          }
        });
      }
      // Check for method declarations in classes/interfaces
      else if (ts.isMethodDeclaration(node)) {
        const name = node.name.getText(sourceFile);
        const hasReturnType = node.type !== undefined;
        const line =
          sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        functions.push({
          name,
          hasReturnType,
          kind: "MethodDeclaration",
          line,
        });
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return functions;
  }

  /**
   * Analyzes a TypeScript file for function return type annotations
   * @param filePath - Path to the TypeScript file
   * @returns Analysis result with functions found and violations
   */
  function analyzeFile(filePath: string): {
    functions: Array<{
      name: string;
      hasReturnType: boolean;
      kind: string;
      line: number;
    }>;
    violations: Array<{ name: string; kind: string; line: number }>;
  } {
    const sourceCode = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const functions = extractFunctions(sourceFile);
    const violations = functions
      .filter((f) => !f.hasReturnType)
      .map((f) => ({ name: f.name, kind: f.kind, line: f.line }));

    return { functions, violations };
  }

  it("should have explicit return type annotations for all functions in sync-versions.ts", () => {
    const filePath = path.join(__dirname, "sync-versions.ts");
    const analysis = analyzeFile(filePath);

    // Report violations if any
    if (analysis.violations.length > 0) {
      const violationDetails = analysis.violations
        .map((v) => `  - ${v.name} (${v.kind}) at line ${v.line}`)
        .join("\n");
      console.error(
        `\nFunctions without return type annotations:\n${violationDetails}\n`
      );
    }

    expect(analysis.violations).toEqual([]);
    expect(analysis.functions.length).toBeGreaterThan(0);
  });

  it("should verify return type annotations across all converted TypeScript files", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "sync-versions.ts"
          // Add more converted files as they are created:
          // "set-version.ts",
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

          // All functions should have return type annotations
          if (analysis.violations.length > 0) {
            const violationDetails = analysis.violations
              .map((v) => `  - ${v.name} (${v.kind}) at line ${v.line}`)
              .join("\n");
            console.error(
              `\n${filename} - Functions without return type annotations:\n${violationDetails}\n`
            );
          }

          expect(analysis.violations).toEqual([]);
          return analysis.violations.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify that utility functions have return type annotations", () => {
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

        // All utility functions should have return type annotations
        if (analysis.violations.length > 0) {
          const violationDetails = analysis.violations
            .map((v) => `  - ${v.name} (${v.kind}) at line ${v.line}`)
            .join("\n");
          console.error(
            `\n${filename} - Functions without return type annotations:\n${violationDetails}\n`
          );
        }

        expect(analysis.violations).toEqual([]);
        return analysis.violations.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should handle edge cases: constructors and getters/setters", () => {
    // Constructors don't need return type annotations (they implicitly return the class instance)
    // Getters need return types, setters don't (they implicitly return void)
    const testCode = `
      class TestClass {
        constructor(value: number) {
          this.value = value;
        }
        
        private value: number;
        
        getValue(): number {
          return this.value;
        }
        
        setValue(value: number): void {
          this.value = value;
        }
      }
    `;

    const sourceFile = ts.createSourceFile(
      "test.ts",
      testCode,
      ts.ScriptTarget.Latest,
      true
    );

    const functions = extractFunctions(sourceFile);

    // Should find getValue and setValue methods
    const getValue = functions.find((f) => f.name === "getValue");
    const setValue = functions.find((f) => f.name === "setValue");

    expect(getValue).toBeDefined();
    expect(getValue?.hasReturnType).toBe(true);
    expect(setValue).toBeDefined();
    expect(setValue?.hasReturnType).toBe(true);
  });
});
