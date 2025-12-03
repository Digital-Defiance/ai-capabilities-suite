/**
 * @fileoverview Property-based tests for binary builder
 * **Feature: release-automation, Property 8: Binary checksums are deterministic**
 * **Validates: Requirements 7.4**
 */

const fc = require("fast-check");
const fs = require("fs");
const path = require("path");
const {
  generateChecksum,
  generateChecksums,
} = require("../builders/binary-builder");

describe("binary-builder Property-Based Tests", () => {
  const tempDir = path.join(__dirname, "temp-binary-property-test");

  beforeEach(() => {
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach((file) => {
        const filePath = path.join(tempDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
      fs.rmdirSync(tempDir);
    }
  });

  /**
   * Property 8: Binary checksums are deterministic
   * For any binary artifact, generating the checksum multiple times should produce the same result.
   */
  it("Property 8: Binary checksums are deterministic - same file produces same checksum", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random binary content (array of bytes)
        fc.uint8Array({ minLength: 100, maxLength: 10000 }),
        async (binaryContent) => {
          // Create a temporary file with the binary content
          const fileName = "test-binary.bin";
          const filePath = path.join(tempDir, fileName);

          fs.writeFileSync(filePath, Buffer.from(binaryContent));

          // Generate checksum multiple times
          const checksum1 = await generateChecksum(filePath);
          const checksum2 = await generateChecksum(filePath);
          const checksum3 = await generateChecksum(filePath);

          // Property: All checksums should be identical (deterministic)
          expect(checksum1).toBe(checksum2);
          expect(checksum2).toBe(checksum3);
          expect(checksum1).toBe(checksum3);

          // Property: Checksum should be a valid SHA256 hex string (64 characters)
          expect(checksum1).toMatch(/^[a-f0-9]{64}$/);
          expect(checksum1.length).toBe(64);
        }
      ),
      {
        numRuns: 100, // Run 100 iterations as specified in design
      }
    );
  });

  /**
   * Additional property: Different content produces different checksums
   * For any two different binary contents, their checksums should be different
   */
  it("Property: Different content produces different checksums", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two different binary contents
        fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        async (content1, content2) => {
          // Skip if contents are identical
          if (Buffer.from(content1).equals(Buffer.from(content2))) {
            return;
          }

          // Create two temporary files
          const file1Path = path.join(tempDir, "binary1.bin");
          const file2Path = path.join(tempDir, "binary2.bin");

          fs.writeFileSync(file1Path, Buffer.from(content1));
          fs.writeFileSync(file2Path, Buffer.from(content2));

          // Generate checksums
          const checksum1 = await generateChecksum(file1Path);
          const checksum2 = await generateChecksum(file2Path);

          // Property: Different content should produce different checksums
          expect(checksum1).not.toBe(checksum2);
        }
      ),
      {
        numRuns: 100,
      }
    );
  });

  /**
   * Additional property: Checksum is consistent across multiple files
   * When generating checksums for multiple files, each file's checksum should be deterministic
   */
  it("Property: generateChecksums produces consistent results for multiple files", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 2-5 files with random content
        fc.integer({ min: 2, max: 5 }),
        fc.array(fc.uint8Array({ minLength: 50, maxLength: 500 }), {
          minLength: 2,
          maxLength: 5,
        }),
        async (fileCount, contents) => {
          // Use only the number of contents we need
          const actualContents = contents.slice(0, fileCount);

          // Create temporary files
          const filePaths = [];
          for (let i = 0; i < actualContents.length; i++) {
            const filePath = path.join(tempDir, `file-${i}.bin`);
            fs.writeFileSync(filePath, Buffer.from(actualContents[i]));
            filePaths.push(filePath);
          }

          // Generate checksums twice
          const checksums1 = await generateChecksums(filePaths);
          const checksums2 = await generateChecksums(filePaths);

          // Property: Both runs should produce the same checksums
          expect(checksums1.size).toBe(checksums2.size);
          expect(checksums1.size).toBe(filePaths.length);

          for (const filePath of filePaths) {
            expect(checksums1.get(filePath)).toBe(checksums2.get(filePath));
            expect(checksums1.get(filePath)).toMatch(/^[a-f0-9]{64}$/);
          }
        }
      ),
      {
        numRuns: 100,
      }
    );
  });

  /**
   * Additional property: Empty file produces consistent checksum
   * An empty file should always produce the same checksum
   */
  it("Property: Empty file produces consistent checksum", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        // Create an empty file
        const filePath = path.join(tempDir, "empty.bin");
        fs.writeFileSync(filePath, Buffer.alloc(0));

        // Generate checksum multiple times
        const checksum1 = await generateChecksum(filePath);
        const checksum2 = await generateChecksum(filePath);

        // Property: Empty file should always produce the same checksum
        expect(checksum1).toBe(checksum2);

        // Known SHA256 hash of empty string
        const emptyHash =
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        expect(checksum1).toBe(emptyHash);
      }),
      {
        numRuns: 10, // Fewer runs since this is deterministic
      }
    );
  });

  /**
   * Additional property: Single byte change produces different checksum
   * Changing a single byte in a file should produce a different checksum
   */
  it("Property: Single byte change produces different checksum", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 100, maxLength: 1000 }),
        fc.integer({ min: 0, max: 99 }), // Position to change
        fc.integer({ min: 0, max: 255 }), // New byte value
        async (content, position, newByte) => {
          // Ensure position is within bounds
          const actualPosition = position % content.length;

          // Skip if the new byte is the same as the old byte
          if (content[actualPosition] === newByte) {
            return;
          }

          // Create original file
          const originalPath = path.join(tempDir, "original.bin");
          fs.writeFileSync(originalPath, Buffer.from(content));

          // Create modified file
          const modifiedContent = Buffer.from(content);
          modifiedContent[actualPosition] = newByte;
          const modifiedPath = path.join(tempDir, "modified.bin");
          fs.writeFileSync(modifiedPath, modifiedContent);

          // Generate checksums
          const originalChecksum = await generateChecksum(originalPath);
          const modifiedChecksum = await generateChecksum(modifiedPath);

          // Property: Single byte change should produce different checksum
          expect(originalChecksum).not.toBe(modifiedChecksum);
        }
      ),
      {
        numRuns: 100,
      }
    );
  });
});
