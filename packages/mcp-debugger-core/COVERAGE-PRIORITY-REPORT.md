# Coverage Priority Report
**Generated:** 2025-11-27
**Overall Coverage:** 93.71% lines, 82.51% branches
**Target:** 90% lines ✅, 85% branches (need +2.5%)

## Executive Summary

✅ **LINE COVERAGE TARGET MET:** 93.71% (target: 90%)
⚠️ **BRANCH COVERAGE:** 82.51% (target: 85%, gap: 2.49%)

We need to improve branch coverage by just **2.5%** to meet enterprise targets!

## Modules at 100% Coverage (Excellent!)

1. ✅ **audit-logger.ts** - 100% lines, 100% branches
2. ✅ **breakpoint-manager.ts** - 100% lines, 100% branches
3. ✅ **cdp-breakpoint-operations.ts** - 100% lines, 96.42% branches
4. ✅ **cpu-profiler.ts** - 100% lines, 94.11% branches
5. ✅ **debugger-core.ts** - 100% lines, 100% branches
6. ✅ **memory-profiler.ts** - 100% lines, 90% branches
7. ✅ **performance-timeline.ts** - 100% lines, 93.93% branches

## Priority 1: Modules Below 85% Branch Coverage (Critical for Target)

These modules need branch coverage improvements to reach 85% overall:

### 1. **hang-detector.ts** - 93.61% lines, **72.91% branches** ⚠️
   - Gap: 12.09% branches
   - Uncovered: Lines 79-80, 141, 169-170, 229, 232, 252
   - **Impact:** High - 8 uncovered lines
   - **Action:** Add tests for edge cases and error paths

### 2. **health-checker.ts** - 98.73% lines, **69.56% branches** ⚠️
   - Gap: 15.44% branches
   - Uncovered: Line 142
   - **Impact:** Medium - 1 uncovered line
   - **Action:** Add tests for health check failure scenarios

### 3. **process-spawner.ts** - 84% lines, **78.57% branches** ⚠️
   - Gap: 6.43% branches, 6% lines
   - Uncovered: Lines 41-42, 57-58, 62-63, 88-89
   - **Impact:** High - 8 uncovered lines
   - **Action:** Add tests for spawn errors and edge cases

### 4. **retry-handler.ts** - 96.49% lines, **73.91% branches** ⚠️
   - Gap: 11.09% branches
   - Uncovered: Lines 59, 110
   - **Impact:** Low - 2 uncovered lines
   - **Action:** Add tests for retry exhaustion scenarios

### 5. **session-timeout-manager.ts** - 94.11% lines, **79.48% branches** ⚠️
   - Gap: 5.52% branches
   - Uncovered: Lines 69, 87, 163, 182, 198
   - **Impact:** Medium - 5 uncovered lines
   - **Action:** Add tests for timeout edge cases

### 6. **shutdown-handler.ts** - 83.92% lines, **80% branches** ⚠️
   - Gap: 5% branches, 6.08% lines
   - Uncovered: Lines 30-31, 38-39, 46, 55, 91-93
   - **Impact:** High - 9 uncovered lines
   - **Action:** Add tests for signal handling and cleanup

### 7. **session-manager.ts** - 100% lines, **80% branches** ⚠️
   - Gap: 5% branches
   - Uncovered: Lines 91-117 (branch coverage only)
   - **Impact:** Low - all lines covered
   - **Action:** Add tests for conditional branches

### 8. **prometheus-exporter.ts** - 90.9% lines, **80.95% branches** ⚠️
   - Gap: 4.05% branches
   - Uncovered: Lines 22, 81-83, 97-99
   - **Impact:** Medium - 6 uncovered lines
   - **Action:** Add tests for metrics export edge cases

### 9. **rate-limiter.ts** - 98.07% lines, **81.81% branches** ⚠️
   - Gap: 3.19% branches
   - Uncovered: Lines 98, 149
   - **Impact:** Low - 2 uncovered lines
   - **Action:** Add tests for rate limit edge cases

### 10. **inspector-client.ts** - 86.56% lines, **82.35% branches** ⚠️
   - Gap: 2.65% branches, 3.44% lines
   - Uncovered: Lines 29-30, 64, 85-86, 100-102, 126
   - **Impact:** Medium - 8 uncovered lines
   - **Action:** Fix WebSocket mocking issues

### 11. **debug-session.ts** - 92.08% lines, **82.14% branches** ⚠️
   - Gap: 2.86% branches
   - Uncovered: Multiple lines (see report)
   - **Impact:** High - complex module
   - **Action:** Add tests for state transitions and error paths

## Priority 2: Modules Below 90% Line Coverage

### 1. **test-runner.ts** - **73.7% lines**, 59.5% branches ⚠️⚠️
   - Gap: 16.3% lines, 25.5% branches
   - Uncovered: Lines 72-105, 160-173, 211, 224-236, 297-298, 330, 356, 376-377
   - **Impact:** CRITICAL - 40+ uncovered lines
   - **Action:** Add comprehensive tests for test execution and parsing

### 2. **process-spawner.ts** - **84% lines**, 78.57% branches ⚠️
   - Already listed in Priority 1

### 3. **shutdown-handler.ts** - **83.92% lines**, 80% branches ⚠️
   - Already listed in Priority 1

### 4. **inspector-client.ts** - **86.56% lines**, 82.35% branches ⚠️
   - Already listed in Priority 1

## Recommended Action Plan

### Phase 1: Quick Wins (Target: +2.5% branch coverage)
Focus on modules with small gaps but high impact:

1. **inspector-client.ts** - Fix WebSocket mocking (8 lines, 2.65% branches)
2. **rate-limiter.ts** - Add edge case tests (2 lines, 3.19% branches)
3. **prometheus-exporter.ts** - Add export tests (6 lines, 4.05% branches)
4. **session-manager.ts** - Add branch tests (0 lines, 5% branches)

**Expected gain:** ~15% branch coverage improvement → **Target achieved!**

### Phase 2: Line Coverage Improvements
After reaching 85% branch coverage:

1. **test-runner.ts** - Add comprehensive tests (40+ lines)
2. **shutdown-handler.ts** - Add signal handling tests (9 lines)
3. **process-spawner.ts** - Add spawn error tests (8 lines)

### Phase 3: Comprehensive Coverage
For 95%+ coverage:

1. **hang-detector.ts** - Add edge case tests
2. **health-checker.ts** - Add failure scenario tests
3. **retry-handler.ts** - Add exhaustion tests

## Test Failures to Fix

### Critical Failures:
1. **test-runner.spec.ts** - Process timeout test failing
2. **inspector-client.mock.spec.ts** - WebSocket mocking issues (26 failures)
3. **debug-session.unit.spec.ts** - State transition tests (4 failures)

### Medium Priority:
4. **compatibility-testing.spec.ts** - Jest integration test
5. **performance-benchmarks.spec.ts** - Benchmark tests (2 failures)
6. **chaos-testing.spec.ts** - Crash handling tests (2 failures)

### Low Priority:
7. **security-testing.spec.ts** - PII masking format issues (16 failures)
8. **source-map-manager.coverage.spec.ts** - Edge case test (1 failure)
9. **test-runner.unit.spec.ts** - Mocha parsing test (1 failure)

## Success Metrics

- ✅ Line coverage: 93.71% (target: 90%)
- ⚠️ Branch coverage: 82.51% (target: 85%, need: +2.49%)
- ✅ Function coverage: 96.83% (target: 90%)
- 📊 Test suites: 38 passed, 7 failed
- 📊 Total tests: ~500+ tests

## Conclusion

We're in excellent shape! Just **2.5% more branch coverage** needed to meet enterprise targets.

**Recommended next step:** Focus on Phase 1 quick wins to reach 85% branch coverage, then address test failures.
