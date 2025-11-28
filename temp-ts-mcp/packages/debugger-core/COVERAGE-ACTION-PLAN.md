# Test Coverage Action Plan

## Executive Summary

**Measured Coverage (Actual):**
- Lines: 74.19% (Target: 90%, Gap: -15.81%)
- Statements: 73.83% (Target: 90%, Gap: -16.17%)
- Functions: 78.81% (Target: 90%, Gap: -11.19%)
- Branches: 55.30% (Target: 85%, Gap: -29.70%)

**Status:** ⚠️ **NOT ENTERPRISE-READY**

## What Changed

### Before (Estimated):
- Coverage: ~60% (guessed)
- No concrete data
- No actionable tasks

### After (Measured):
- Coverage: 74.19% lines, 55.30% branches (actual data)
- Detailed per-file breakdown
- **35 new tasks added to tasks.md** with specific targets
- Clear priority levels (P0, P1, P2)

## Critical Findings

### 6 Modules with <50% Coverage (P0 - Critical):

1. **cdp-breakpoint-operations.ts**: 15.62% lines, 14.28% branches
   - Gap: 54 lines, 24 branches
   - Impact: Core CDP operations unreliable

2. **breakpoint-manager.ts**: 41.02% lines, 10.34% branches
   - Gap: 46 lines, 26 branches
   - Impact: Breakpoint operations unreliable

3. **cpu-profiler.ts**: 41.23% lines, 23.52% branches
   - Gap: 57 lines, 39 branches
   - Impact: CPU profiling unreliable

4. **memory-profiler.ts**: 45.71% lines, 20% branches
   - Gap: 57 lines, 16 branches
   - Impact: Memory profiling unreliable

5. **performance-timeline.ts**: 46.15% lines, 15.15% branches
   - Gap: 49 lines, 28 branches
   - Impact: Performance tracking unreliable

6. **audit-logger.ts**: 52.38% lines, 50% branches
   - Gap: 10 lines, 4 branches
   - Impact: Compliance/security logging unreliable

## Tasks Added to tasks.md

### Task 31: Achieve 90% Coverage (P0 - Critical)
- 31.1: Fix cdp-breakpoint-operations.ts (15% → 90%)
- 31.2: Fix breakpoint-manager.ts branches (10% → 85%)
- 31.3: Fix cpu-profiler.ts (41% → 90%)
- 31.4: Fix memory-profiler.ts (45% → 90%)
- 31.5: Fix performance-timeline.ts (46% → 90%)
- 31.6: Fix audit-logger.ts (52% → 90%)

### Task 32: Improve Moderate-Gap Modules (P1 - High)
- 32.1: Improve debug-session.ts (62% → 90%)
- 32.2: Improve source-map-manager.ts (54% → 90%)
- 32.3: Improve test-runner.ts (63% → 90%)
- 32.4: Improve shutdown-handler.ts (66% → 90%)
- 32.5: Improve variable-inspector.ts (76% → 90%)

### Task 33: Improve Branch Coverage (P2 - Medium)
- 33.1: Improve 6 modules from 60-77% → 85% branches

### Task 34: Fix Test Execution Issues
- 34.1: Investigate timeout with coverage
- 34.2: Optimize test execution
- 34.3: Set up CI/CD coverage gates

### Task 35: Coverage Validation Checkpoint
- Final validation and sign-off

## Estimated Effort

### P0 (Critical) - Tasks 31.1-31.6:
- **Tests needed:** ~300-400 tests
- **Time:** 1-2 weeks
- **Priority:** IMMEDIATE

### P1 (High) - Tasks 32.1-32.5:
- **Tests needed:** ~400-500 tests
- **Time:** 2-3 weeks
- **Priority:** Next sprint

### P2 (Medium) - Task 33:
- **Tests needed:** ~200-300 tests
- **Time:** 1-2 weeks
- **Priority:** Following sprint

### Total:
- **Tests needed:** ~900-1200 tests
- **Time:** 4-7 weeks
- **Current tests:** ~600 tests
- **Target tests:** ~1500-1800 tests

## Test Execution Issue

### Problem:
```bash
# Works ✅
npx nx test @digitaldefiance/ts-mcp-core --no-coverage

# Times out ❌
npx nx test @digitaldefiance/ts-mcp-core --coverage

# Works ✅
npx nx test @digitaldefiance/ts-mcp-core --testPathPattern="auth-manager" --coverage
```

### Root Cause:
- Resource exhaustion with full suite + coverage
- Some tests don't cleanup properly
- Coverage instrumentation overhead

### Solution (Task 34):
1. Run tests in batches with coverage
2. Fix hanging tests
3. Add proper cleanup
4. Use `--maxWorkers=2` and `--forceExit`

## Next Steps

1. ✅ **Measure actual coverage** (DONE)
2. ✅ **Create detailed report** (DONE)
3. ✅ **Add tasks to tasks.md** (DONE)
4. ⏳ **Start Task 31.1** - Fix cdp-breakpoint-operations.ts
5. ⏳ **Continue with P0 tasks** - Complete all critical gaps
6. ⏳ **Move to P1 tasks** - Improve moderate gaps
7. ⏳ **Complete P2 tasks** - Improve branch coverage
8. ⏳ **Fix test execution** - Enable full suite coverage
9. ⏳ **Set up CI/CD gates** - Enforce 90%/85% thresholds

## Success Criteria

### Week 1 (P0 Complete):
- [ ] cdp-breakpoint-operations.ts: 90%+ lines, 85%+ branches
- [ ] breakpoint-manager.ts: 90%+ lines, 85%+ branches
- [ ] cpu-profiler.ts: 90%+ lines, 85%+ branches
- [ ] memory-profiler.ts: 90%+ lines, 85%+ branches
- [ ] performance-timeline.ts: 90%+ lines, 85%+ branches
- [ ] audit-logger.ts: 90%+ lines, 85%+ branches
- [ ] Overall: 80%+ lines, 65%+ branches

### Week 3 (P1 Complete):
- [ ] debug-session.ts: 90%+ lines, 85%+ branches
- [ ] source-map-manager.ts: 90%+ lines, 85%+ branches
- [ ] test-runner.ts: 90%+ lines, 85%+ branches
- [ ] shutdown-handler.ts: 90%+ lines, 85%+ branches
- [ ] variable-inspector.ts: 90%+ lines, 85%+ branches
- [ ] Overall: 85%+ lines, 75%+ branches

### Week 5 (P2 Complete):
- [ ] All modules: 85%+ branches
- [ ] Overall: 90%+ lines, 85%+ branches
- [ ] CI/CD gates: Enforced
- [ ] Full test suite: Runs with coverage

## Tracking Progress

### Use tasks.md to track:
```bash
# Mark task as in progress
- [-] 31.1 Fix cdp-breakpoint-operations.ts coverage

# Mark task as complete
- [x] 31.1 Fix cdp-breakpoint-operations.ts coverage
```

### Measure progress:
```bash
# Run coverage for specific file
npx nx test @digitaldefiance/ts-mcp-core --testPathPattern="cdp-breakpoint" --coverage

# Check coverage report
cat packages/debugger-core/test-output/jest/coverage/coverage-summary.json | jq '.["path/to/file"]'
```

## Conclusion

We now have:
1. ✅ **Actual coverage data** (not guesses)
2. ✅ **Specific targets** for each module
3. ✅ **Actionable tasks** in tasks.md
4. ✅ **Clear priorities** (P0, P1, P2)
5. ✅ **Estimated effort** (4-7 weeks)
6. ✅ **Success criteria** for each phase

**Next action:** Start implementing Task 31.1 (cdp-breakpoint-operations.ts tests)

This is now a **trackable, measurable, actionable plan** instead of guesswork.
