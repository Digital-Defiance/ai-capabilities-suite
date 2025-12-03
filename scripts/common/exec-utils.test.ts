/**
 * Unit tests for process execution utilities
 */

import {
  executeCommand,
  executeCommandOrThrow,
  commandExists,
} from "./exec-utils";

describe("exec-utils", () => {
  describe("executeCommand", () => {
    it("should execute successful command and return result", () => {
      const result = executeCommand('echo "test"');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("test");
      expect(result.stderr).toBe("");
    });

    it("should handle command with non-zero exit code", () => {
      const result = executeCommand("node --invalid-flag");

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.length).toBeGreaterThan(0);
    });

    it("should execute command in specified working directory", () => {
      const result = executeCommand("pwd", "/tmp");

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("tmp");
    });

    it("should trim stdout and stderr", () => {
      const result = executeCommand('echo "  test  "');

      expect(result.stdout).toBe("test");
    });
  });

  describe("executeCommandOrThrow", () => {
    it("should return stdout for successful command", () => {
      const result = executeCommandOrThrow('echo "success"');

      expect(result).toContain("success");
    });

    it("should throw error for failed command", () => {
      expect(() => executeCommandOrThrow("node --invalid-flag")).toThrow();
    });

    it("should execute in specified working directory", () => {
      const result = executeCommandOrThrow("pwd", "/tmp");

      expect(result).toContain("tmp");
    });
  });

  describe("commandExists", () => {
    it("should return true for existing command", () => {
      expect(commandExists("node")).toBe(true);
      expect(commandExists("npm")).toBe(true);
    });

    it("should return false for non-existent command", () => {
      expect(commandExists("nonexistent-command-xyz")).toBe(false);
    });
  });
});
