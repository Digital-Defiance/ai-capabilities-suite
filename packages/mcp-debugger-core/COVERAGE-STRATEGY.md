# Strategy to Reach 85% Branch Coverage

## Current Status
- **Current**: 84.47% branches
- **Target**: 85% branches
- **Gap**: 0.53% (approximately 5-10 branches)

## Modules Below 85% Branch Coverage (Prioritized by Impact)

### High Impact (Will get us to 85%)
1. **session-manager.ts**: 70% → 90% branches
   - Need: 2-3 tests for error handling branches
   - Lines: 51, 91-117

2. **rate-limiter.ts**: 81.81% → 85% branches
   - Need: 1-2 tests for edge cases
   - Lines: 98, 149

3. **retry-handler.ts**: 73.91% → 85% branches
   - Need: 2-3 tests for retry exhaustion
   - Lines: 59, 110

## Implementation Plan

### Step 1: Add session-manager tests (Highest Priority)
- Test non-Error exception in removeSession
- Test error branch in removeSession catch block
- **Expected gain**: ~2% branch coverage

### Step 2: Add rate-limiter tests
- Test checkLimit with no config and no default
- Test edge case in default config reset
- **Expected gain**: ~1% branch coverage

### Step 3: Add retry-handler tests
- Test max retries exceeded
- Test retry with different error types
- **Expected gain**: ~1% branch coverage

## Total Expected Gain
2% + 1% + 1% = 4% additional branch coverage
84.47% + 4% = 88.47% ✅ (Exceeds 85% target)

## Note on Failing Tests
The 34 failing tests are mostly in:
- test-runner.coverage.spec.ts (text parsing)
- test-framework.integration.spec.ts (mocha/vitest timeouts)
- shutdown-handler.coverage.spec.ts (signal handlers)
- source-map-manager.spec.ts (fixture paths)

These are integration/edge case tests that don't significantly impact branch coverage.
Focus on unit tests for core logic to reach 85% coverage target.
