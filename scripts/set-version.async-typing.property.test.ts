/**
 * Property-based tests for async operation typing
 *
 * **Feature: js-to-ts-conversion, Property 5: Async operation typing**
 * **Validates: Requirements 4.4**
 *
 * For any async function, the return type should be explicitly annotated as Promise<T>
 * where T is the resolved type.
 */

import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

describe("Property 5: Async operation typing", () => {
  /**
   * This property test verifies that all async functions in converted TypeScript files
   * have explicit Promise<T> return type annotations. We test this by:
   * 1. Parsing the TypeScript file using the TypeScript compiler API
   * 2. Walking the AST to find all async function declarations
   * 3. Verifying each async function has a Promise<T> return type annotation
   */

  /**
   * Extracts all async function declarations from a TypeScript source file
   * @param sourceFile - TypeScript source file to analyze
   * @returns Array of async function information
   */
  function extractAsyncFunctions(sourceFile: ts.SourceFile): Array<{
    name: string;
    hasReturnType: boolean;
    returnTypeText: string | null;
    isPromiseType: boolean;
    kind: string;
    line: number;
  }> {
    const asyncFunctions: Array<{
      name: string;
      hasReturnType: boolean;
      returnTypeText: string | null;
      isPromiseType: boolean;
      kind: string;
      line: number;
    }> = [];

    function isPromiseReturnType(typeNode: ts.TypeNode | undefined): boolean {
      if (!typeNode) {
        return false;
      }

      const typeText = typeNode.getText(sourceFile);
      // Check if the return type starts with Promise<
      return typeText.startsWith("Promise<");
    }

    function visit(node: ts.Node): void {
      // Check for async function declarations
      if (ts.isFunctionDeclaration(node)) {
        const modifiers = node.modifiers;
        const isAsync = modifiers?.some(
          (m) => m.kind === ts.SyntaxKind.AsyncKeyword
        );

        if (isAsync) {
          const name = node.name?.getText(sourceFile) || "<anonymous>";
          const hasReturnType = node.type !== undefined;
          const returnTypeText = node.type?.getText(sourceFile) || null;
          const isPromiseType = isPromiseReturnType(node.type);
          const line =
            sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

          asyncFunctions.push({
            name,
            hasReturnType,
            returnTypeText,
            isPromiseType,
            kind: "AsyncFunctionDeclaration",
            line,
          });
        }
      }
      // Check for async arrow functions assigned to variables
      else if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach((declaration) => {
          if (
            declaration.initializer &&
            ts.isArrowFunction(declaration.initializer)
          ) {
            const modifiers = declaration.initializer.modifiers;
            const isAsync = modifiers?.some(
              (m) => m.kind === ts.SyntaxKind.AsyncKeyword
            );

            if (isAsync) {
              const name = declaration.name.getText(sourceFile);
              const hasReturnType = declaration.initializer.type !== undefined;
              const returnTypeText =
                declaration.initializer.type?.getText(sourceFile) || null;
              const isPromiseType = isPromiseReturnType(
                declaration.initializer.type
              );
              const line =
                sourceFile.getLineAndCharacterOfPosition(declaration.getStart())
                  .line + 1;

              asyncFunctions.push({
                name,
                hasReturnType,
                returnTypeText,
                isPromiseType,
                kind: "AsyncArrowFunction",
                line,
              });
            }
          }
        });
      }
      // Check for async method declarations in classes/interfaces
      else if (ts.isMethodDeclaration(node)) {
        const modifiers = node.modifiers;
        const isAsync = modifiers?.some(
          (m) => m.kind === ts.SyntaxKind.AsyncKeyword
        );

        if (isAsync) {
          const name = node.name.getText(sourceFile);
          const hasReturnType = node.type !== undefined;
          const returnTypeText = node.type?.getText(sourceFile) || null;
          const isPromiseType = isPromiseReturnType(node.type);
          const line =
            sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

          asyncFunctions.push({
            name,
            hasReturnType,
            returnTypeText,
            isPromiseType,
            kind: "AsyncMethodDeclaration",
            line,
          });
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return asyncFunctions;
  }

  /**
   * Analyzes a TypeScript file for async function return type annotations
   * @param filePath - Path to the TypeScript file
   * @returns Analysis result with async functions found and violations
   */
  function analyzeFile(filePath: string): {
    asyncFunctions: Array<{
      name: string;
      hasReturnType: boolean;
      returnTypeText: string | null;
      isPromiseType: boolean;
      kind: string;
      line: number;
    }>;
    violations: Array<{
      name: string;
      kind: string;
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

    const asyncFunctions = extractAsyncFunctions(sourceFile);
    const violations = asyncFunctions
      .filter((f) => !f.hasReturnType || !f.isPromiseType)
      .map((f) => ({
        name: f.name,
        kind: f.kind,
        line: f.line,
        issue: !f.hasReturnType
          ? "Missing return type annotation"
          : `Return type is '${f.returnTypeText}' instead of Promise<T>`,
      }));

    return { asyncFunctions, violations };
  }

  it("should have Promise<T> return type annotations for all async functions in set-version.ts", () => {
    const filePath = path.join(__dirname, "set-version.ts");
    const analysis = analyzeFile(filePath);

    // Report violations if any
    if (analysis.violations.length > 0) {
      const violationDetails = analysis.violations
        .map((v) => `  - ${v.name} (${v.kind}) at line ${v.line}: ${v.issue}`)
        .join("\n");
      console.error(
        `\nAsync functions without proper Promise<T> return type:\n${violationDetails}\n`
      );
    }

    expect(analysis.violations).toEqual([]);
    expect(analysis.asyncFunctions.length).toBeGreaterThan(0);
  });

  it("should verify Promise<T> return type annotations across all converted TypeScript files", () => {
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

          // All async functions should have Promise<T> return type annotations
          if (analysis.violations.length > 0) {
            const violationDetails = analysis.violations
              .map(
                (v) => `  - ${v.name} (${v.kind}) at line ${v.line}: ${v.issue}`
              )
              .join("\n");
            console.error(
              `\n${filename} - Async functions without proper Promise<T> return type:\n${violationDetails}\n`
            );
          }

          expect(analysis.violations).toEqual([]);
          return analysis.violations.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify that utility async functions have Promise<T> return type annotations", () => {
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

        // All async utility functions should have Promise<T> return type annotations
        if (analysis.violations.length > 0) {
          const violationDetails = analysis.violations
            .map(
              (v) => `  - ${v.name} (${v.kind}) at line ${v.line}: ${v.issue}`
            )
            .join("\n");
          console.error(
            `\n${filename} - Async functions without proper Promise<T> return type:\n${violationDetails}\n`
          );
        }

        expect(analysis.violations).toEqual([]);
        return analysis.violations.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should correctly identify Promise<void> as a valid async return type", () => {
    const testCode = `
      async function testFunction(): Promise<void> {
        await Promise.resolve();
      }
      
      const testArrow = async (): Promise<string> => {
        return "test";
      };
    `;

    const sourceFile = ts.createSourceFile(
      "test.ts",
      testCode,
      ts.ScriptTarget.Latest,
      true
    );

    const asyncFunctions = extractAsyncFunctions(sourceFile);

    expect(asyncFunctions.length).toBe(2);
    expect(asyncFunctions[0].isPromiseType).toBe(true);
    expect(asyncFunctions[0].returnTypeText).toBe("Promise<void>");
    expect(asyncFunctions[1].isPromiseType).toBe(true);
    expect(asyncFunctions[1].returnTypeText).toBe("Promise<string>");
  });

  it("should detect missing return types on async functions", () => {
    const testCode = `
      async function missingReturnType() {
        return "test";
      }
    `;

    const sourceFile = ts.createSourceFile(
      "test.ts",
      testCode,
      ts.ScriptTarget.Latest,
      true
    );

    const asyncFunctions = extractAsyncFunctions(sourceFile);

    expect(asyncFunctions.length).toBe(1);
    expect(asyncFunctions[0].hasReturnType).toBe(false);
    expect(asyncFunctions[0].isPromiseType).toBe(false);
  });
});
