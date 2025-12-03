/**
 * @fileoverview Property-based tests for changelog generator
 * **Feature: release-automation, Property 10: Changelog categorization completeness**
 * **Validates: Requirements 9.2**
 */

const fc = require("fast-check");
const { categorizeCommits } = require("../changelog-generator");

// Helper to generate a 40-character hex string
const hexString40 = () =>
  fc
    .array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 })
    .map((arr) => arr.map((n) => n.toString(16)).join(""));

describe("changelog-generator Property-Based Tests", () => {
  /**
   * Property 10: Changelog categorization completeness
   * For any set of commits, every commit should appear in exactly one category in the generated changelog.
   */
  it("Property 10: Changelog categorization completeness - every commit appears in exactly one category", () => {
    fc.assert(
      fc.property(
        // Generate an array of commits with various message patterns
        fc.array(
          fc.record({
            hash: hexString40(),
            author: fc.string({ minLength: 1, maxLength: 50 }),
            date: fc.date(),
            message: fc.oneof(
              // Feature messages
              fc.constantFrom(
                "feat: add new feature",
                "feature: implement something",
                "Add new functionality",
                "Implement user authentication"
              ),
              // Fix messages
              fc.constantFrom(
                "fix: resolve bug",
                "bugfix: correct issue",
                "Fix memory leak",
                "Resolve crash on startup"
              ),
              // Breaking change messages
              fc.constantFrom(
                "feat!: breaking change",
                "BREAKING CHANGE: remove old API",
                "breaking: update interface"
              ),
              // Other messages
              fc.constantFrom(
                "chore: update dependencies",
                "docs: update README",
                "refactor: clean up code",
                "test: add unit tests",
                "style: format code"
              )
            ),
            pr: fc.option(fc.nat(9999), { nil: undefined }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (commits) => {
          // Categorize the commits
          const changelog = categorizeCommits(commits);

          // Property 1: Every commit should appear in exactly one category
          const allCategorizedCommits = [
            ...changelog.features,
            ...changelog.fixes,
            ...changelog.breaking,
            ...changelog.other,
          ];

          // Check that the total number of categorized commits equals input commits
          expect(allCategorizedCommits.length).toBe(commits.length);

          // Property 2: No commit should appear in multiple categories
          const commitHashes = new Set();
          for (const commit of allCategorizedCommits) {
            expect(commitHashes.has(commit.hash)).toBe(false);
            commitHashes.add(commit.hash);
          }

          // Property 3: All original commits should be present
          for (const originalCommit of commits) {
            const found = allCategorizedCommits.some(
              (c) => c.hash === originalCommit.hash
            );
            expect(found).toBe(true);
          }

          // Property 4: Categories should not contain duplicates
          const featureHashes = new Set(changelog.features.map((c) => c.hash));
          const fixHashes = new Set(changelog.fixes.map((c) => c.hash));
          const breakingHashes = new Set(changelog.breaking.map((c) => c.hash));
          const otherHashes = new Set(changelog.other.map((c) => c.hash));

          expect(featureHashes.size).toBe(changelog.features.length);
          expect(fixHashes.size).toBe(changelog.fixes.length);
          expect(breakingHashes.size).toBe(changelog.breaking.length);
          expect(otherHashes.size).toBe(changelog.other.length);

          // Property 5: Categories should be mutually exclusive
          const allHashes = [
            ...featureHashes,
            ...fixHashes,
            ...breakingHashes,
            ...otherHashes,
          ];
          const uniqueHashes = new Set(allHashes);
          expect(uniqueHashes.size).toBe(allHashes.length);
        }
      ),
      {
        numRuns: 100, // Run 100 iterations as specified in design
      }
    );
  });

  /**
   * Additional property: Categorization is deterministic
   * Calling categorizeCommits with the same input should always produce the same output
   */
  it("Property: Categorization is deterministic - same input produces same output", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            hash: hexString40(),
            author: fc.string({ minLength: 1, maxLength: 50 }),
            date: fc.date(),
            message: fc.string({ minLength: 1, maxLength: 100 }),
            pr: fc.option(fc.nat(9999), { nil: undefined }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (commits) => {
          // Categorize multiple times
          const result1 = categorizeCommits(commits);
          const result2 = categorizeCommits(commits);
          const result3 = categorizeCommits(commits);

          // Property: All results should be identical
          expect(result1.features.length).toBe(result2.features.length);
          expect(result2.features.length).toBe(result3.features.length);

          expect(result1.fixes.length).toBe(result2.fixes.length);
          expect(result2.fixes.length).toBe(result3.fixes.length);

          expect(result1.breaking.length).toBe(result2.breaking.length);
          expect(result2.breaking.length).toBe(result3.breaking.length);

          expect(result1.other.length).toBe(result2.other.length);
          expect(result2.other.length).toBe(result3.other.length);

          // Check that the same commits are in the same categories
          for (let i = 0; i < result1.features.length; i++) {
            expect(result1.features[i].hash).toBe(result2.features[i].hash);
            expect(result2.features[i].hash).toBe(result3.features[i].hash);
          }
        }
      ),
      {
        numRuns: 100,
      }
    );
  });

  /**
   * Additional property: Empty input produces empty categories
   * An empty commit array should result in empty categories
   */
  it("Property: Empty input produces empty categories", () => {
    const changelog = categorizeCommits([]);

    expect(changelog.features).toEqual([]);
    expect(changelog.fixes).toEqual([]);
    expect(changelog.breaking).toEqual([]);
    expect(changelog.other).toEqual([]);
  });

  /**
   * Additional property: Breaking changes take precedence
   * Commits with breaking change indicators should always be categorized as breaking,
   * even if they also match feature or fix patterns
   */
  it("Property: Breaking changes take precedence over other categories", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            hash: hexString40(),
            author: fc.string({ minLength: 1, maxLength: 50 }),
            date: fc.date(),
            message: fc.constantFrom(
              "feat!: breaking feature",
              "fix!: breaking fix",
              "BREAKING CHANGE: something",
              "breaking: change API"
            ),
            pr: fc.option(fc.nat(9999), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (commits) => {
          const changelog = categorizeCommits(commits);

          // Property: All commits should be in breaking category
          expect(changelog.breaking.length).toBe(commits.length);
          expect(changelog.features.length).toBe(0);
          expect(changelog.fixes.length).toBe(0);
          expect(changelog.other.length).toBe(0);
        }
      ),
      {
        numRuns: 100,
      }
    );
  });

  /**
   * Additional property: Commit structure is preserved
   * Categorization should not modify the commit objects
   */
  it("Property: Commit structure is preserved during categorization", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            hash: hexString40(),
            author: fc.string({ minLength: 1, maxLength: 50 }),
            date: fc.date(),
            message: fc.string({ minLength: 1, maxLength: 100 }),
            pr: fc.option(fc.nat(9999), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (commits) => {
          // Create a deep copy for comparison
          const originalCommits = JSON.parse(JSON.stringify(commits));

          const changelog = categorizeCommits(commits);

          // Collect all categorized commits
          const allCategorized = [
            ...changelog.features,
            ...changelog.fixes,
            ...changelog.breaking,
            ...changelog.other,
          ];

          // Property: Each categorized commit should match its original
          for (const categorized of allCategorized) {
            const original = originalCommits.find(
              (c) => c.hash === categorized.hash
            );
            expect(original).toBeDefined();
            expect(categorized.hash).toBe(original.hash);
            expect(categorized.author).toBe(original.author);
            expect(categorized.message).toBe(original.message);
            expect(categorized.pr).toBe(original.pr);
          }
        }
      ),
      {
        numRuns: 100,
      }
    );
  });

  /**
   * Additional property: Category counts sum to total
   * The sum of all category lengths should equal the input length
   */
  it("Property: Category counts sum to total input count", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            hash: hexString40(),
            author: fc.string({ minLength: 1, maxLength: 50 }),
            date: fc.date(),
            message: fc.string({ minLength: 1, maxLength: 100 }),
            pr: fc.option(fc.nat(9999), { nil: undefined }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (commits) => {
          const changelog = categorizeCommits(commits);

          const totalCategorized =
            changelog.features.length +
            changelog.fixes.length +
            changelog.breaking.length +
            changelog.other.length;

          // Property: Total categorized should equal input length
          expect(totalCategorized).toBe(commits.length);
        }
      ),
      {
        numRuns: 100,
      }
    );
  });
});
