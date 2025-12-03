/**
 * File operation utilities with TypeScript type safety
 */

import * as fs from "fs";
import * as path from "path";
import { FileUpdate } from "./types";

/**
 * Reads and parses a JSON file with type safety
 * @template T - The expected type of the JSON content
 * @param filePath - Path to the JSON file
 * @returns Parsed JSON content
 * @throws Error if file doesn't exist or JSON is invalid
 */
export function readJsonFile<T>(filePath: string): T {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Writes an object to a JSON file with formatting
 * @template T - The type of data to write
 * @param filePath - Path to the JSON file
 * @param data - Data to write
 * @param indent - Number of spaces for indentation (default: 2)
 * @throws Error if write fails
 */
export function writeJsonFile<T>(
  filePath: string,
  data: T,
  indent: number = 2
): void {
  try {
    const content = JSON.stringify(data, null, indent) + "\n";
    fs.writeFileSync(filePath, content, "utf8");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to write JSON file ${filePath}: ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Updates a file by replacing text matching a pattern
 * @param update - File update configuration
 * @returns true if file was modified, false if no changes needed
 * @throws Error if file doesn't exist (unless optional) or update fails
 */
export function updateFile(update: FileUpdate): boolean {
  const { path: filePath, pattern, replacement, optional = false } = update;

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    if (optional) {
      return false;
    }
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    // Read file content
    const content = fs.readFileSync(filePath, "utf8");

    // Apply replacement
    const newContent = content.replace(pattern, replacement);

    // Check if content changed
    if (content === newContent) {
      return false;
    }

    // Write updated content
    fs.writeFileSync(filePath, newContent, "utf8");
    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update file ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Checks if a file exists
 * @param filePath - Path to check
 * @returns true if file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath - Directory path
 */
export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Gets the relative path from the current working directory
 * @param filePath - Absolute or relative file path
 * @returns Relative path from cwd
 */
export function getRelativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

/**
 * Reads a text file
 * @param filePath - Path to the file
 * @returns File content as string
 * @throws Error if file doesn't exist or read fails
 */
export function readTextFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Writes text content to a file
 * @param filePath - Path to the file
 * @param content - Content to write
 * @throws Error if write fails
 */
export function writeTextFile(filePath: string, content: string): void {
  try {
    fs.writeFileSync(filePath, content, "utf8");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
    throw error;
  }
}
