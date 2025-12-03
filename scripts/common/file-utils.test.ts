/**
 * Unit tests for file operation utilities
 */

import * as fs from "fs";
import * as path from "path";
import {
  readJsonFile,
  writeJsonFile,
  updateFile,
  fileExists,
  ensureDirectory,
  getRelativePath,
  readTextFile,
  writeTextFile,
} from "./file-utils";
import { FileUpdate } from "./types";

describe("file-utils", () => {
  const testDir = path.join(__dirname, "test-temp");

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe("readJsonFile", () => {
    it("should read and parse valid JSON file", () => {
      const testFile = path.join(testDir, "test.json");
      const testData = { name: "test", version: "1.0.0" };
      fs.writeFileSync(testFile, JSON.stringify(testData), "utf8");

      const result = readJsonFile<typeof testData>(testFile);

      expect(result).toEqual(testData);
    });

    it("should throw error for non-existent file", () => {
      const testFile = path.join(testDir, "nonexistent.json");

      expect(() => readJsonFile(testFile)).toThrow();
    });

    it("should throw error for invalid JSON", () => {
      const testFile = path.join(testDir, "invalid.json");
      fs.writeFileSync(testFile, "not valid json", "utf8");

      expect(() => readJsonFile(testFile)).toThrow();
    });
  });

  describe("writeJsonFile", () => {
    it("should write JSON file with formatting", () => {
      const testFile = path.join(testDir, "output.json");
      const testData = { name: "test", version: "1.0.0" };

      writeJsonFile(testFile, testData);

      expect(fs.existsSync(testFile)).toBe(true);
      const content = fs.readFileSync(testFile, "utf8");
      expect(JSON.parse(content)).toEqual(testData);
      expect(content).toContain("\n"); // Should have formatting
    });

    it("should write JSON with custom indentation", () => {
      const testFile = path.join(testDir, "output.json");
      const testData = { name: "test" };

      writeJsonFile(testFile, testData, 4);

      const content = fs.readFileSync(testFile, "utf8");
      expect(content).toContain("    "); // 4 spaces
    });
  });

  describe("updateFile", () => {
    it("should update file content with pattern replacement", () => {
      const testFile = path.join(testDir, "update.txt");
      fs.writeFileSync(testFile, 'version: "1.0.0"', "utf8");

      const update: FileUpdate = {
        path: testFile,
        pattern: /version: "[^"]+"/,
        replacement: 'version: "2.0.0"',
      };

      const result = updateFile(update);

      expect(result).toBe(true);
      const content = fs.readFileSync(testFile, "utf8");
      expect(content).toBe('version: "2.0.0"');
    });

    it("should return false when no changes needed", () => {
      const testFile = path.join(testDir, "update.txt");
      fs.writeFileSync(testFile, 'version: "1.0.0"', "utf8");

      const update: FileUpdate = {
        path: testFile,
        pattern: /version: "2\.0\.0"/,
        replacement: 'version: "2.0.0"',
      };

      const result = updateFile(update);

      expect(result).toBe(false);
    });

    it("should throw error for non-existent required file", () => {
      const update: FileUpdate = {
        path: path.join(testDir, "nonexistent.txt"),
        pattern: /test/,
        replacement: "replacement",
      };

      expect(() => updateFile(update)).toThrow();
    });

    it("should return false for non-existent optional file", () => {
      const update: FileUpdate = {
        path: path.join(testDir, "nonexistent.txt"),
        pattern: /test/,
        replacement: "replacement",
        optional: true,
      };

      const result = updateFile(update);

      expect(result).toBe(false);
    });
  });

  describe("fileExists", () => {
    it("should return true for existing file", () => {
      const testFile = path.join(testDir, "exists.txt");
      fs.writeFileSync(testFile, "content", "utf8");

      expect(fileExists(testFile)).toBe(true);
    });

    it("should return false for non-existent file", () => {
      expect(fileExists(path.join(testDir, "nonexistent.txt"))).toBe(false);
    });
  });

  describe("ensureDirectory", () => {
    it("should create directory if it does not exist", () => {
      const newDir = path.join(testDir, "new-dir");

      ensureDirectory(newDir);

      expect(fs.existsSync(newDir)).toBe(true);
      expect(fs.statSync(newDir).isDirectory()).toBe(true);
    });

    it("should not throw if directory already exists", () => {
      ensureDirectory(testDir);

      expect(() => ensureDirectory(testDir)).not.toThrow();
    });

    it("should create nested directories", () => {
      const nestedDir = path.join(testDir, "a", "b", "c");

      ensureDirectory(nestedDir);

      expect(fs.existsSync(nestedDir)).toBe(true);
    });
  });

  describe("getRelativePath", () => {
    it("should return relative path from cwd", () => {
      const absolutePath = path.join(process.cwd(), "test", "file.txt");

      const result = getRelativePath(absolutePath);

      expect(result).toBe(path.join("test", "file.txt"));
    });
  });

  describe("readTextFile", () => {
    it("should read text file content", () => {
      const testFile = path.join(testDir, "text.txt");
      const content = "Hello, World!";
      fs.writeFileSync(testFile, content, "utf8");

      const result = readTextFile(testFile);

      expect(result).toBe(content);
    });

    it("should throw error for non-existent file", () => {
      expect(() =>
        readTextFile(path.join(testDir, "nonexistent.txt"))
      ).toThrow();
    });
  });

  describe("writeTextFile", () => {
    it("should write text content to file", () => {
      const testFile = path.join(testDir, "output.txt");
      const content = "Test content";

      writeTextFile(testFile, content);

      expect(fs.existsSync(testFile)).toBe(true);
      expect(fs.readFileSync(testFile, "utf8")).toBe(content);
    });
  });
});
