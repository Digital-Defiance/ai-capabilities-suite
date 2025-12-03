/**
 * Process execution utilities with TypeScript type safety
 */

import { execSync, ExecSyncOptions } from "child_process";
import { ExecResult } from "./types";

/**
 * Executes a shell command synchronously with typed result
 * @param command - Command to execute
 * @param cwd - Working directory (optional)
 * @returns Execution result with stdout, stderr, and exit code
 */
export function executeCommand(command: string, cwd?: string): ExecResult {
  const options: ExecSyncOptions = {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    cwd: cwd,
  };

  try {
    const stdout = execSync(command, options) as string;
    return {
      stdout: stdout.trim(),
      stderr: "",
      exitCode: 0,
    };
  } catch (error) {
    // execSync throws on non-zero exit codes
    if (error && typeof error === "object" && "status" in error) {
      const execError = error as {
        status: number | null;
        stdout: Buffer | string;
        stderr: Buffer | string;
      };

      return {
        stdout: execError.stdout.toString().trim(),
        stderr: execError.stderr.toString().trim(),
        exitCode: execError.status ?? 1,
      };
    }

    // Unexpected error type
    if (error instanceof Error) {
      return {
        stdout: "",
        stderr: error.message,
        exitCode: 1,
      };
    }

    return {
      stdout: "",
      stderr: "Unknown error",
      exitCode: 1,
    };
  }
}

/**
 * Executes a command and returns only stdout, throwing on error
 * @param command - Command to execute
 * @param cwd - Working directory (optional)
 * @returns Command stdout
 * @throws Error if command fails
 */
export function executeCommandOrThrow(command: string, cwd?: string): string {
  const result = executeCommand(command, cwd);

  if (result.exitCode !== 0) {
    throw new Error(
      `Command failed with exit code ${result.exitCode}: ${
        result.stderr || result.stdout
      }`
    );
  }

  return result.stdout;
}

/**
 * Executes a command with inherited stdio (output goes directly to console)
 * @param command - Command to execute
 * @param cwd - Working directory (optional)
 * @throws Error if command fails
 */
export function executeCommandInherit(command: string, cwd?: string): void {
  const options: ExecSyncOptions = {
    encoding: "utf8",
    stdio: "inherit",
    cwd: cwd,
  };

  try {
    execSync(command, options);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Command failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Checks if a command exists in the system PATH
 * @param command - Command name to check
 * @returns true if command exists
 */
export function commandExists(command: string): boolean {
  try {
    const checkCommand =
      process.platform === "win32" ? `where ${command}` : `which ${command}`;

    executeCommandOrThrow(checkCommand);
    return true;
  } catch {
    return false;
  }
}
