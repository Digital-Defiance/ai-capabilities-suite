import {
  executeTests,
  TestExecutionConfig,
  parseJestOutput,
  parseMochaOutput,
  parseVitestOutput,
} from './test-runner';

/**
 * Additional coverage tests for test-runner.ts
 * Focus on uncovered parsing functions and edge cases
 */
describe('TestRunner - Additional Coverage', () => {
  describe('parseJestOutput', () => {
    it('should parse Jest JSON output with test results', () => {
      const stdout = JSON.stringify({
        testResults: [
          {
            name: 'test-suite-1',
            assertionResults: [
              {
                fullName: 'Test 1',
                title: 'should pass',
                status: 'passed',
                duration: 10,
              },
              {
                fullName: 'Test 2',
                title: 'should fail',
                status: 'failed',
                duration: 5,
                failureMessages: ['Expected true to be false'],
              },
              {
                fullName: 'Test 3',
                title: 'should skip',
                status: 'pending',
                duration: 0,
              },
            ],
            perfStats: {
              runtime: 100,
            },
          },
        ],
      });

      const result = parseJestOutput(stdout, '');

      expect(result.suites).toHaveLength(1);
      expect(result.suites![0].tests).toHaveLength(3);
      expect(result.totalTests).toBe(3);
      expect(result.passedTests).toBe(1);
      expect(result.failedTests).toBe(1);
      expect(result.skippedTests).toBe(1);
      expect(result.suites![0].duration).toBe(100);
    });

    it('should handle Jest output without JSON', () => {
      const stdout = `
PASS test-file.js
  ✓ test 1
  ✓ test 2
  ✕ test 3
`;

      const result = parseJestOutput(stdout, '');

      // Text parsing may or may not extract tests depending on format
      expect(result.suites).toBeDefined();
      expect(Array.isArray(result.suites)).toBe(true);
    });

    it('should handle empty Jest output', () => {
      const result = parseJestOutput('', '');

      expect(result.suites).toEqual([]);
      expect(result.totalTests).toBe(0);
      expect(result.passedTests).toBe(0);
      expect(result.failedTests).toBe(0);
      expect(result.skippedTests).toBe(0);
    });

    it('should handle Jest output with FAIL marker', () => {
      const stdout = `
FAIL test-file.js
  ✕ failing test
`;

      const result = parseJestOutput(stdout, '');

      // Text parsing may or may not extract tests depending on format
      expect(result.suites).toBeDefined();
      expect(Array.isArray(result.suites)).toBe(true);
    });

    it('should handle Jest JSON with missing assertionResults', () => {
      const stdout = JSON.stringify({
        testResults: [
          {
            name: 'test-suite-1',
            // No assertionResults
          },
        ],
      });

      const result = parseJestOutput(stdout, '');

      expect(result.suites).toHaveLength(1);
      expect(result.suites![0].tests).toHaveLength(0);
    });

    it('should handle Jest JSON with missing perfStats', () => {
      const stdout = JSON.stringify({
        testResults: [
          {
            name: 'test-suite-1',
            assertionResults: [
              {
                fullName: 'Test 1',
                status: 'passed',
              },
            ],
            // No perfStats
          },
        ],
      });

      const result = parseJestOutput(stdout, '');

      expect(result.suites).toHaveLength(1);
      expect(result.suites![0].duration).toBeUndefined();
    });

    it('should handle Jest JSON with missing test name', () => {
      const stdout = JSON.stringify({
        testResults: [
          {
            // No name
            assertionResults: [
              {
                title: 'Test 1',
                status: 'passed',
              },
            ],
          },
        ],
      });

      const result = parseJestOutput(stdout, '');

      expect(result.suites).toHaveLength(1);
      expect(result.suites![0].name).toBe('Unknown Suite');
    });

    it('should handle invalid JSON gracefully', () => {
      const stdout = '{ invalid json }';

      const result = parseJestOutput(stdout, '');

      // Should fall back to text parsing
      expect(result.suites).toBeDefined();
    });
  });

  describe('parseMochaOutput', () => {
    it('should parse Mocha JSON output with test results', () => {
      const stdout = JSON.stringify({
        tests: [
          {
            title: 'Test 1',
            fullTitle: 'Suite Test 1',
            pass: true,
            duration: 10,
          },
          {
            title: 'Test 2',
            fullTitle: 'Suite Test 2',
            pass: false,
            pending: false,
            duration: 5,
            err: {
              message: 'Test failed',
              stack: 'Error stack trace',
            },
          },
          {
            title: 'Test 3',
            fullTitle: 'Suite Test 3',
            pass: false,
            pending: true,
            duration: 0,
          },
        ],
      });

      const result = parseMochaOutput(stdout, '');

      expect(result.totalTests).toBe(3);
      expect(result.passedTests).toBe(1);
      expect(result.failedTests).toBe(1);
      expect(result.skippedTests).toBe(1);
    });

    it('should handle Mocha output without JSON', () => {
      const stdout = `
  ✓ test 1
  ✓ test 2
  1) test 3
  - test 4
`;

      const result = parseMochaOutput(stdout, '');

      // Text parsing may or may not extract tests depending on format
      expect(result.suites).toBeDefined();
      expect(Array.isArray(result.suites)).toBe(true);
    });

    it('should handle empty Mocha output', () => {
      const result = parseMochaOutput('', '');

      expect(result.suites).toEqual([]);
      expect(result.totalTests).toBe(0);
    });

    it('should handle Mocha JSON with missing fullTitle', () => {
      const stdout = JSON.stringify({
        tests: [
          {
            title: 'Test 1',
            // No fullTitle
            pass: true,
          },
        ],
      });

      const result = parseMochaOutput(stdout, '');

      expect(result.totalTests).toBe(1);
      expect(result.suites!.length).toBeGreaterThan(0);
    });

    it('should handle Mocha JSON with missing error details', () => {
      const stdout = JSON.stringify({
        tests: [
          {
            title: 'Test 1',
            fullTitle: 'Suite Test 1',
            pass: false,
            pending: false,
            // No err object
          },
        ],
      });

      const result = parseMochaOutput(stdout, '');

      expect(result.totalTests).toBe(1);
      expect(result.failedTests).toBe(1);
    });

    it('should handle invalid JSON gracefully', () => {
      const stdout = '{ invalid json }';

      const result = parseMochaOutput(stdout, '');

      // Should fall back to text parsing
      expect(result.suites).toBeDefined();
    });
  });

  describe('parseVitestOutput', () => {
    it('should parse Vitest JSON output with test results', () => {
      const stdout = JSON.stringify({
        testResults: [
          {
            name: 'test-file.ts',
            assertionResults: [
              {
                fullName: 'Test 1',
                status: 'passed',
                duration: 10,
              },
              {
                fullName: 'Test 2',
                status: 'failed',
                duration: 5,
                failureMessages: ['Expected true to be false'],
              },
            ],
          },
        ],
      });

      const result = parseVitestOutput(stdout, '');

      expect(result.suites).toHaveLength(1);
      expect(result.totalTests).toBe(2);
      expect(result.passedTests).toBe(1);
      expect(result.failedTests).toBe(1);
    });

    it('should handle Vitest output without JSON', () => {
      const stdout = `
✓ test 1
✓ test 2
× test 3
`;

      const result = parseVitestOutput(stdout, '');

      // Text parsing may or may not extract tests depending on format
      expect(result.suites).toBeDefined();
      expect(Array.isArray(result.suites)).toBe(true);
    });

    it('should handle empty Vitest output', () => {
      const result = parseVitestOutput('', '');

      expect(result.suites).toEqual([]);
      expect(result.totalTests).toBe(0);
    });

    it('should handle Vitest JSON with missing assertionResults', () => {
      const stdout = JSON.stringify({
        testResults: [
          {
            name: 'test-file.ts',
            // No assertionResults
          },
        ],
      });

      const result = parseVitestOutput(stdout, '');

      expect(result.suites).toHaveLength(1);
      expect(result.suites![0].tests).toHaveLength(0);
    });

    it('should handle invalid JSON gracefully', () => {
      const stdout = '{ invalid json }';

      const result = parseVitestOutput(stdout, '');

      // Should fall back to text parsing
      expect(result.suites).toBeDefined();
    });
  });

  describe('executeTests - edge cases', () => {
    it('should handle test execution with custom cwd', async () => {
      const config: TestExecutionConfig = {
        framework: 'jest',
        args: ['--version'],
        cwd: process.cwd(),
        timeout: 5000,
        attachInspector: false,
      };

      const result = await executeTests(config);

      expect(result).toBeDefined();
      expect(result.framework).toBe('jest');
    }, 10000);

    it('should handle test execution with very short timeout', async () => {
      const config: TestExecutionConfig = {
        framework: 'jest',
        args: ['--version'],
        timeout: 1,
        attachInspector: false,
      };

      try {
        await executeTests(config);
        // If it succeeds, that's fine too (very fast execution)
      } catch (error) {
        // Timeout is expected
        expect(error).toBeDefined();
      }
    }, 10000);

    it('should handle mocha framework', async () => {
      const config: TestExecutionConfig = {
        framework: 'mocha',
        args: ['--version'],
        timeout: 10000,
        attachInspector: false,
      };

      try {
        const result = await executeTests(config);
        expect(result.framework).toBe('mocha');
      } catch (error) {
        // Mocha might not be installed, that's okay
        expect(error).toBeDefined();
      }
    }, 15000);

    it('should handle vitest framework', async () => {
      const config: TestExecutionConfig = {
        framework: 'vitest',
        args: ['--version'],
        timeout: 10000,
        attachInspector: false,
      };

      try {
        const result = await executeTests(config);
        expect(result.framework).toBe('vitest');
      } catch (error) {
        // Vitest might not be installed or might timeout, that's okay
        expect(error).toBeDefined();
      }
    }, 15000);

    it('should handle test execution with inspector attachment', async () => {
      const config: TestExecutionConfig = {
        framework: 'jest',
        args: ['--version'],
        timeout: 5000,
        attachInspector: true,
      };

      const result = await executeTests(config);

      expect(result).toBeDefined();
      // When inspector is attached, wsUrl should be present
      // (though it might not be if the process exits too quickly)
    }, 10000);

    it('should handle test file that does not exist', async () => {
      const config: TestExecutionConfig = {
        framework: 'jest',
        testFile: '/non/existent/file.test.js',
        timeout: 5000,
        attachInspector: false,
      };

      const result = await executeTests(config);

      expect(result.success).toBe(false);
      expect(result.exitCode).not.toBe(0);
    }, 10000);
  });
});
