/**
 * Property-based tests for typed error handling
 *
 * **Feature: js-to-ts-conversion, Property 4: Typed error handling**
 * **Validates: Requirements 4.3**
 *
 * For any error handling block (try-catch), the caught error should have a type
 * annotation or type guard.
 */

import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

describe("Property 4: Typed error handling", () => {
  /**
   * This property test verifies that all try-catch blocks in converted TypeScript
   * files have proper type handling for caught errors. We test this by:
   * 1. Parsing the TypeScript file using the TypeScript compiler API
   * 2. Walking the AST to find all try-catch statements
   * 3. Verifying each catch clause has either:
   *    - A type annotation on the error parameter
   *    - A type guard (instanceof Error check) in the catch block
   */

  interface CatchClauseInfo {
    parameterName: string;
    hasTypeAnnotation: boolean;
    hasTypeGuard: boolean;
    line: number;
    text: string;
  }

  /**
   * Checks if a catch block contains a type guard (instanceof Error check)
   * @param catchClause - The catch clause node to analyze
   * @param sourceFile - The source file for text extraction
   * @returns True if the catch block contains an instanceof Error check
   */
  function hasTypeGuardInCatchBlock(
    catchClause: ts.CatchClause,
    sourceFile: ts.SourceFile
  ): boolean {
    let foundTypeGuard = false;

    function visit(node: ts.Node): void {
      // Check for instanceof expressions
      if (ts.isBinaryExpression(node)) {
        const operatorToken = node.operatorToken;
        if (operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword) {
          // Check if the right side is "Error" or an Error subclass
          const rightText = node.right.getText(sourceFile);
          if (
            rightText === "Error" ||
            rightText.endsWith("Error") ||
            rightText === "TypeError" ||
            rightText === "RangeError" ||
            rightText === "SyntaxError"
          ) {
            foundTypeGuard = true;
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    if (catchClause.block) {
      visit(catchClause.block);
    }

    return foundTypeGuard;
  }

  /**
   * Extracts all catch clauses from a TypeScript source file
   * @param sourceFile - TypeScript source file to analyze
   * @returns Array of catch clause information
   */
  function extractCatchClauses(sourceFile: ts.SourceFile): CatchClauseInfo[] {
    const catchClauses: CatchClauseInfo[] = [];

    function visit(node: ts.Node): void {
      // Check for try-catch statements
      if (ts.isTryStatement(node) && node.catchClause) {
        const catchClause = node.catchClause;
        const variableDeclaration = catchClause.variableDeclaration;

        if (variableDeclaration) {
          const parameterName = variableDeclaration.name.getText(sourceFile);
          const hasTypeAnnotation = variableDeclaration.type !== undefined;
          const hasTypeGuard = hasTypeGuardInCatchBlock(
            catchClause,
            sourceFile
          );
          const line =
            sourceFile.getLineAndCharacterOfPosition(catchClause.getStart())
              .line + 1;
          const text = catchClause
            .getText(sourceFile)
            .split("\n")
            .slice(0, 3)
            .join("\n"); // First 3 lines

          catchClauses.push({
            parameterName,
            hasTypeAnnotation,
            hasTypeGuard,
            line,
            text,
          });
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return catchClauses;
  }

  /**
   * Analyzes a TypeScript file for typed error handling
   * @param filePath - Path to the TypeScript file
   * @returns Analysis result with catch clauses found and violations
   */
  function analyzeFile(filePath: string): {
    catchClauses: CatchClauseInfo[];
    violations: Array<{
      parameterName: string;
      line: number;
      text: string;
      reason: string;
    }>;
  } {
    const sourceCode = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const catchClauses = extractCatchClauses(sourceFile);
    const violations = catchClauses
      .filter((c) => !c.hasTypeAnnotation && !c.hasTypeGuard)
      .map((c) => ({
        parameterName: c.parameterName,
        line: c.line,
        text: c.text,
        reason: "No type annotation or type guard found",
      }));

    return { catchClauses, violations };
  }

  it("should have typed error handling in sync-versions.ts", () => {
    const filePath = path.join(__dirname, "sync-versions.ts");
    const analysis = analyzeFile(filePath);

    // Report violations if any
    if (analysis.violations.length > 0) {
      const violationDetails = analysis.violations
        .map(
          (v) =>
            `  - ${v.parameterName} at line ${v.line}: ${v.reason}\n    ${
              v.text.split("\n")[0]
            }`
        )
        .join("\n");
      console.error(
        `\nCatch clauses without type annotation or type guard:\n${violationDetails}\n`
      );
    }

    expect(analysis.violations).toEqual([]);
    // We expect at least one catch clause in the file
    expect(analysis.catchClauses.length).toBeGreaterThan(0);
  });

  it("should verify typed error handling across all converted TypeScript files", () => {
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

          // All catch clauses should have type annotation or type guard
          if (analysis.violations.length > 0) {
            const violationDetails = analysis.violations
              .map(
                (v) =>
                  `  - ${v.parameterName} at line ${v.line}: ${v.reason}\n    ${
                    v.text.split("\n")[0]
                  }`
              )
              .join("\n");
            console.error(
              `\n${filename} - Catch clauses without type annotation or type guard:\n${violationDetails}\n`
            );
          }

          expect(analysis.violations).toEqual([]);
          return analysis.violations.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should verify that utility files have typed error handling", () => {
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

        // All utility catch clauses should have type annotation or type guard
        if (analysis.violations.length > 0) {
          const violationDetails = analysis.violations
            .map(
              (v) =>
                `  - ${v.parameterName} at line ${v.line}: ${v.reason}\n    ${
                  v.text.split("\n")[0]
                }`
            )
            .join("\n");
          console.error(
            `\n${filename} - Catch clauses without type annotation or type guard:\n${violationDetails}\n`
          );
        }

        expect(analysis.violations).toEqual([]);
        return analysis.violations.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it("should correctly identify type annotations on catch parameters", () => {
    const testCode = `
      try {
        throw new Error("test");
      } catch (error: Error) {
        console.error(error.message);
      }
      
      try {
        throw new Error("test");
      } catch (err: unknown) {
        console.error(err);
      }
    `;

    const sourceFile = ts.createSourceFile(
      "test.ts",
      testCode,
      ts.ScriptTarget.Latest,
      true
    );

    const catchClauses = extractCatchClauses(sourceFile);

    // Should find 2 catch clauses
    expect(catchClauses.length).toBe(2);

    // Both should have type annotations
    expect(catchClauses[0].hasTypeAnnotation).toBe(true);
    expect(catchClauses[1].hasTypeAnnotation).toBe(true);

    // No violations
    const violations = catchClauses.filter(
      (c) => !c.hasTypeAnnotation && !c.hasTypeGuard
    );
    expect(violations.length).toBe(0);
  });

  it("should correctly identify type guards in catch blocks", () => {
    const testCode = `
      try {
        throw new Error("test");
      } catch (error) {
        if (error instanceof Error) {
          console.error(error.message);
        }
      }
      
      try {
        throw new Error("test");
      } catch (err) {
        if (err instanceof TypeError) {
          console.error("Type error");
        }
      }
    `;

    const sourceFile = ts.createSourceFile(
      "test.ts",
      testCode,
      ts.ScriptTarget.Latest,
      true
    );

    const catchClauses = extractCatchClauses(sourceFile);

    // Should find 2 catch clauses
    expect(catchClauses.length).toBe(2);

    // Neither has type annotation
    expect(catchClauses[0].hasTypeAnnotation).toBe(false);
    expect(catchClauses[1].hasTypeAnnotation).toBe(false);

    // Both should have type guards
    expect(catchClauses[0].hasTypeGuard).toBe(true);
    expect(catchClauses[1].hasTypeGuard).toBe(true);

    // No violations (type guards are acceptable)
    const violations = catchClauses.filter(
      (c) => !c.hasTypeAnnotation && !c.hasTypeGuard
    );
    expect(violations.length).toBe(0);
  });

  it("should detect violations when neither type annotation nor type guard is present", () => {
    const testCode = `
      try {
        throw new Error("test");
      } catch (error) {
        console.error("An error occurred");
      }
      
      try {
        throw new Error("test");
      } catch (err) {
        console.log(err);
      }
    `;

    const sourceFile = ts.createSourceFile(
      "test.ts",
      testCode,
      ts.ScriptTarget.Latest,
      true
    );

    const catchClauses = extractCatchClauses(sourceFile);

    // Should find 2 catch clauses
    expect(catchClauses.length).toBe(2);

    // Neither has type annotation
    expect(catchClauses[0].hasTypeAnnotation).toBe(false);
    expect(catchClauses[1].hasTypeAnnotation).toBe(false);

    // Neither has type guard
    expect(catchClauses[0].hasTypeGuard).toBe(false);
    expect(catchClauses[1].hasTypeGuard).toBe(false);

    // Both should be violations
    const violations = catchClauses.filter(
      (c) => !c.hasTypeAnnotation && !c.hasTypeGuard
    );
    expect(violations.length).toBe(2);
  });

  it("should handle mixed scenarios", () => {
    const testCode = `
      // Good: type annotation
      try {
        throw new Error("test");
      } catch (error: Error) {
        console.error(error.message);
      }
      
      // Good: type guard
      try {
        throw new Error("test");
      } catch (error) {
        if (error instanceof Error) {
          console.error(error.message);
        }
      }
      
      // Bad: no type annotation or guard
      try {
        throw new Error("test");
      } catch (error) {
        console.error("Error occurred");
      }
    `;

    const sourceFile = ts.createSourceFile(
      "test.ts",
      testCode,
      ts.ScriptTarget.Latest,
      true
    );

    const catchClauses = extractCatchClauses(sourceFile);

    // Should find 3 catch clauses
    expect(catchClauses.length).toBe(3);

    // Only the third one should be a violation
    const violations = catchClauses.filter(
      (c) => !c.hasTypeAnnotation && !c.hasTypeGuard
    );
    expect(violations.length).toBe(1);
    expect(violations[0].parameterName).toBe("error");
  });

  it("should handle catch clauses without variable declarations", () => {
    // In TypeScript, you can have catch clauses without binding the error
    const testCode = `
      try {
        throw new Error("test");
      } catch {
        console.error("An error occurred");
      }
    `;

    const sourceFile = ts.createSourceFile(
      "test.ts",
      testCode,
      ts.ScriptTarget.Latest,
      true
    );

    const catchClauses = extractCatchClauses(sourceFile);

    // Should find 0 catch clauses with variable declarations
    // (catch without binding is not captured by our analysis)
    expect(catchClauses.length).toBe(0);
  });
});
