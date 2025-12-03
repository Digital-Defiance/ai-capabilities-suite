/**
 * @fileoverview Unit tests for binary builder
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  buildBinaries,
  buildSingleBinary,
  generateChecksum,
  generateChecksums,
  compressBinary,
  compressTarGz,
  compressZip,
  getPkgTarget,
  getBinaryFileName,
  execCommand,
} = require("../builders/binary-builder");

// Mock child_process
jest.mock("child_process");

// Mock archiver
jest.mock("archiver", () => {
  return jest.fn(() => {
    const EventEmitter = require("events");
    const mockArchive = new EventEmitter();
    mockArchive.pipe = jest.fn().mockReturnThis();
    mockArchive.file = jest.fn().mockReturnThis();
    mockArchive.finalize = jest.fn(() => {
      // Simulate successful archiving
      setImmediate(() => mockArchive.emit("close"));
    });
    return mockArchive;
  });
});

describe("binary-builder", () => {
  const originalExistsSync = fs.existsSync;
  const originalStatSync = fs.statSync;
  const originalMkdirSync = fs.mkdirSync;
  const originalWriteFileSync = fs.writeFileSync;
  const originalCreateReadStream = fs.createReadStream;
  const originalCreateWriteStream = fs.createWriteStream;

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original fs functions
    fs.existsSync = originalExistsSync;
    fs.statSync = originalStatSync;
    fs.mkdirSync = originalMkdirSync;
    fs.writeFileSync = originalWriteFileSync;
    fs.createReadStream = originalCreateReadStream;
    fs.createWriteStream = originalCreateWriteStream;
  });

  describe("execCommand", () => {
    it("should execute command successfully and return output", () => {
      execSync.mockReturnValue("Binary built successfully\n");

      const result = execCommand("npx pkg build");

      expect(result).toBe("Binary built successfully");
      expect(execSync).toHaveBeenCalledWith("npx pkg build", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    });

    it("should throw error with output when command fails", () => {
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "Build output";
      mockError.stderr = "Build error";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      expect(() => execCommand("npx pkg build")).toThrow(
        "Command failed: npx pkg build"
      );

      try {
        execCommand("npx pkg build");
      } catch (error) {
        expect(error.output).toContain("Build output");
        expect(error.output).toContain("Build error");
        expect(error.exitCode).toBe(1);
      }
    });
  });

  describe("getPkgTarget", () => {
    it("should return correct target for linux-x64", () => {
      expect(getPkgTarget("linux-x64")).toBe("node18-linux-x64");
    });

    it("should return correct target for macos-x64", () => {
      expect(getPkgTarget("macos-x64")).toBe("node18-macos-x64");
    });

    it("should return correct target for win-x64", () => {
      expect(getPkgTarget("win-x64")).toBe("node18-win-x64");
    });

    it("should throw error for unknown platform", () => {
      expect(() => getPkgTarget("unknown-platform")).toThrow(
        "Unknown platform: unknown-platform"
      );
    });
  });

  describe("getBinaryFileName", () => {
    it("should generate correct filename for Linux", () => {
      const result = getBinaryFileName("mcp-debugger", "linux-x64", "1.0.0");
      expect(result).toBe("mcp-debugger-linux-x64-1.0.0");
    });

    it("should generate correct filename for macOS", () => {
      const result = getBinaryFileName("mcp-debugger", "macos-x64", "2.1.3");
      expect(result).toBe("mcp-debugger-macos-x64-2.1.3");
    });

    it("should generate correct filename for Windows with .exe extension", () => {
      const result = getBinaryFileName("mcp-debugger", "win-x64", "1.5.0");
      expect(result).toBe("mcp-debugger-win-x64-1.5.0.exe");
    });
  });

  describe("generateChecksum", () => {
    it("should generate SHA256 checksum for a file", async () => {
      const EventEmitter = require("events");
      const mockStream = new EventEmitter();

      fs.createReadStream = jest.fn(() => mockStream);

      const checksumPromise = generateChecksum("/path/to/file.bin");

      // Simulate reading file data
      setImmediate(() => {
        mockStream.emit("data", Buffer.from("test data"));
        mockStream.emit("end");
      });

      const checksum = await checksumPromise;

      expect(checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(fs.createReadStream).toHaveBeenCalledWith("/path/to/file.bin");
    });

    it("should reject on stream error", async () => {
      const EventEmitter = require("events");
      const mockStream = new EventEmitter();

      fs.createReadStream = jest.fn(() => mockStream);

      const checksumPromise = generateChecksum("/path/to/file.bin");

      setImmediate(() => {
        mockStream.emit("error", new Error("Read error"));
      });

      await expect(checksumPromise).rejects.toThrow("Read error");
    });
  });

  describe("generateChecksums", () => {
    it("should generate checksums for multiple files", async () => {
      const EventEmitter = require("events");

      fs.createReadStream = jest.fn(() => {
        const mockStream = new EventEmitter();
        setImmediate(() => {
          mockStream.emit("data", Buffer.from("test"));
          mockStream.emit("end");
        });
        return mockStream;
      });

      const files = ["/path/file1.bin", "/path/file2.bin"];
      const checksums = await generateChecksums(files);

      expect(checksums.size).toBe(2);
      expect(checksums.has("/path/file1.bin")).toBe(true);
      expect(checksums.has("/path/file2.bin")).toBe(true);
      expect(checksums.get("/path/file1.bin")).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should return empty map for empty array", async () => {
      const checksums = await generateChecksums([]);
      expect(checksums.size).toBe(0);
    });
  });

  describe("compressTarGz", () => {
    it("should compress file using tar.gz", async () => {
      const EventEmitter = require("events");
      const mockWriteStream = new EventEmitter();
      mockWriteStream.on = jest.fn((event, handler) => {
        if (event === "close") {
          setImmediate(handler);
        }
        return mockWriteStream;
      });

      fs.createWriteStream = jest.fn(() => mockWriteStream);

      await compressTarGz("/path/input.bin", "/path/output.tar.gz");

      expect(fs.createWriteStream).toHaveBeenCalledWith("/path/output.tar.gz");
    });
  });

  describe("compressZip", () => {
    it("should compress file using zip", async () => {
      const EventEmitter = require("events");
      const mockWriteStream = new EventEmitter();
      mockWriteStream.on = jest.fn((event, handler) => {
        if (event === "close") {
          setImmediate(handler);
        }
        return mockWriteStream;
      });

      fs.createWriteStream = jest.fn(() => mockWriteStream);

      await compressZip("/path/input.exe", "/path/output.zip");

      expect(fs.createWriteStream).toHaveBeenCalledWith("/path/output.zip");
    });
  });

  describe("compressBinary", () => {
    it("should use tar.gz for Linux binaries", async () => {
      const EventEmitter = require("events");
      const mockWriteStream = new EventEmitter();
      mockWriteStream.on = jest.fn((event, handler) => {
        if (event === "close") {
          setImmediate(handler);
        }
        return mockWriteStream;
      });

      fs.createWriteStream = jest.fn(() => mockWriteStream);

      const result = await compressBinary("/path/binary", "linux-x64");

      expect(result).toBe("/path/binary.tar.gz");
    });

    it("should use tar.gz for macOS binaries", async () => {
      const EventEmitter = require("events");
      const mockWriteStream = new EventEmitter();
      mockWriteStream.on = jest.fn((event, handler) => {
        if (event === "close") {
          setImmediate(handler);
        }
        return mockWriteStream;
      });

      fs.createWriteStream = jest.fn(() => mockWriteStream);

      const result = await compressBinary("/path/binary", "macos-x64");

      expect(result).toBe("/path/binary.tar.gz");
    });

    it("should use zip for Windows binaries", async () => {
      const EventEmitter = require("events");
      const mockWriteStream = new EventEmitter();
      mockWriteStream.on = jest.fn((event, handler) => {
        if (event === "close") {
          setImmediate(handler);
        }
        return mockWriteStream;
      });

      fs.createWriteStream = jest.fn(() => mockWriteStream);

      const result = await compressBinary("/path/binary.exe", "win-x64");

      expect(result).toBe("/path/binary.exe.zip");
    });
  });

  describe("buildSingleBinary", () => {
    const mockConfig = {
      packageName: "mcp-debugger",
      packageDir: "packages/mcp-debugger-server",
      buildBinaries: true,
      binaryPlatforms: ["linux-x64"],
    };

    it("should build binary successfully", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.statSync = jest.fn().mockReturnValue({ size: 50000000 });
      execSync.mockReturnValue("Binary built\n");

      const result = await buildSingleBinary(
        mockConfig,
        "1.0.0",
        "linux-x64",
        "/binaries"
      );

      expect(result.platform).toBe("linux-x64");
      expect(result.path).toContain("mcp-debugger-linux-x64-1.0.0");
      expect(result.size).toBe(50000000);
      expect(execSync).toHaveBeenCalled();
    });

    it("should throw error when package directory does not exist", async () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      await expect(
        buildSingleBinary(mockConfig, "1.0.0", "linux-x64", "/binaries")
      ).rejects.toThrow("Package directory not found");
    });

    it("should throw error when pkg command fails", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "pkg error";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      await expect(
        buildSingleBinary(mockConfig, "1.0.0", "linux-x64", "/binaries")
      ).rejects.toThrow("Failed to build linux-x64 binary");
    });

    it("should throw error when binary is not created", async () => {
      fs.existsSync = jest
        .fn()
        .mockReturnValueOnce(true) // Package dir exists
        .mockReturnValueOnce(false); // Binary not created
      execSync.mockReturnValue("Success\n");

      await expect(
        buildSingleBinary(mockConfig, "1.0.0", "linux-x64", "/binaries")
      ).rejects.toThrow("Binary was not created at expected path");
    });
  });

  describe("buildBinaries", () => {
    const mockConfig = {
      packageName: "mcp-debugger",
      packageDir: "packages/mcp-debugger-server",
      buildBinaries: true,
      binaryPlatforms: ["linux-x64", "macos-x64"],
    };

    it("should build binaries for all platforms", async () => {
      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.mkdirSync = jest.fn();
      fs.statSync = jest.fn().mockReturnValue({ size: 50000000 });
      execSync.mockReturnValue("Binary built\n");

      // Mock compression and checksum generation
      const EventEmitter = require("events");
      const mockWriteStream = new EventEmitter();
      mockWriteStream.on = jest.fn((event, handler) => {
        if (event === "close") {
          setImmediate(handler);
        }
        return mockWriteStream;
      });
      fs.createWriteStream = jest.fn(() => mockWriteStream);

      // Create a new stream for each call to avoid "Digest already called" error
      fs.createReadStream = jest.fn(() => {
        const mockReadStream = new EventEmitter();
        setImmediate(() => {
          mockReadStream.emit("data", Buffer.from("test"));
          mockReadStream.emit("end");
        });
        return mockReadStream;
      });

      const result = await buildBinaries(mockConfig, "1.0.0");

      expect(result.binaries.length).toBe(2);
      expect(result.binaries[0].platform).toBe("linux-x64");
      expect(result.binaries[1].platform).toBe("macos-x64");
      expect(result.checksums.size).toBeGreaterThan(0);
    });

    it("should throw error when buildBinaries is false", async () => {
      const config = { ...mockConfig, buildBinaries: false };

      await expect(buildBinaries(config, "1.0.0")).rejects.toThrow(
        "Binary building is not enabled"
      );
    });

    it("should throw error when binaryPlatforms is empty", async () => {
      const config = { ...mockConfig, binaryPlatforms: [] };

      await expect(buildBinaries(config, "1.0.0")).rejects.toThrow(
        "No binary platforms configured"
      );
    });

    it("should create binaries directory if it does not exist", async () => {
      fs.existsSync = jest
        .fn()
        .mockReturnValueOnce(false) // Binaries dir doesn't exist
        .mockReturnValue(true); // Everything else exists
      fs.mkdirSync = jest.fn();
      fs.statSync = jest.fn().mockReturnValue({ size: 50000000 });
      execSync.mockReturnValue("Binary built\n");

      // Mock compression and checksum
      const EventEmitter = require("events");
      const mockWriteStream = new EventEmitter();
      mockWriteStream.on = jest.fn((event, handler) => {
        if (event === "close") {
          setImmediate(handler);
        }
        return mockWriteStream;
      });
      fs.createWriteStream = jest.fn(() => mockWriteStream);

      // Create a new stream for each call to avoid "Digest already called" error
      fs.createReadStream = jest.fn(() => {
        const mockReadStream = new EventEmitter();
        setImmediate(() => {
          mockReadStream.emit("data", Buffer.from("test"));
          mockReadStream.emit("end");
        });
        return mockReadStream;
      });

      await buildBinaries(mockConfig, "1.0.0");

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining("binaries"),
        { recursive: true }
      );
    });
  });
});
