# Test Failures Analysis & Fix Plan

**Generated:** 2025-11-27
**Total Failing Suites:** 7
**Total Failing Tests:** ~50

## Critical Failures (Block Coverage Progress)

### 1. 🔴 inspector-client.mock.spec.ts - 26 FAILURES
**Root Cause:** WebSocket mocking incompatibility
**Error:** `TypeError: this.ws.on is not a function`
**Impact:** CRITICAL - Blocks inspector-client, debug-session, and variable-inspector tests

**Analysis:**
```typescript
// Current issue: mock-socket library doesn't fully implement WebSocket API
// The InspectorClient expects ws.on() method but mock doesn't provide it
at on (src/lib/inspector-client.ts:20:21)
at InspectorClient.connect (src/lib/inspector-client.ts:18:16)
```

**Fix Strategy:**
1. Check if we're using the correct mock-socket API
2. May need to create a custom WebSocket mock that implements EventEmitter
3. Or refactor InspectorClient to use standard WebSocket events (addEventListener)

**Files to Fix:**
- `src/lib/inspector-client.ts` - May need to support both .on() and .addEventListener()
- `src/lib/inspector-client.mock.spec.ts` - Update mocking approach
- `test-utils/mock-websocket.ts` - Create proper WebSocket mock

**Estimated Time:** 2-3 hours
**Priority:** P0 - Critical

---

### 2. 🔴 debug-session.unit.spec.ts - 4 FAILURES
**Root Cause:** State transition and process management issues
**Impact:** HIGH - Core debugging functionality

**Failures:**
1. ❌ "should fail gracefully with invalid file" - Session created instead of throwing
2. ❌ "should transition from RUNNING to PAUSED on pause" - State stuck at "running"
3. ❌ "should pause running process" - State stuck at "running"
4. ❌ "should handle process crash" - Process not detected as crashed

**Analysis:**
```typescript
// Issue 1: Invalid file doesn't throw error
await expect(
  sessionManager.createSession({
    command: 'node',
    args: ['/path/to/nonexistent/file.js'],
  })
).rejects.toThrow(); // But it resolves!

// Issue 2-3: Pause not working
await session.pause();
expect(session.getState()).toBe(SessionState.PAUSED); // Still "running"

// Issue 4: Crash detection not working
expect(proc?.exitCode !== null || proc?.killed).toBe(true); // Both false
```

**Fix Strategy:**
1. Add validation in createSession to check file exists
2. Fix pause() implementation to properly update state
3. Improve crash detection in process event handlers
4. Add proper async handling for state transitions

**Files to Fix:**
- `src/lib/debug-session.ts` - Fix pause(), crash detection, validation
- `src/lib/session-manager.ts` - Add file validation
- `src/lib/debug-session.unit.spec.ts` - May need to adjust test expectations

**Estimated Time:** 2-3 hours
**Priority:** P0 - Critical

---

### 3. 🟡 test-runner.spec.ts - 1 FAILURE
**Root Cause:** Test timeout configuration issue
**Error:** `Test execution timed out after 1ms`
**Impact:** MEDIUM - Test framework integration

**Analysis:**
```typescript
// The test is timing out immediately (1ms)
// This suggests the timeout is being set incorrectly
Test execution timed out after 1ms
  at Timeout._onTimeout (src/lib/test-runner.ts:337:20)
```

**Fix Strategy:**
1. Check timeout parameter handling in executeTests()
2. Ensure timeout is properly passed to child process
3. May need to adjust test expectations or increase timeout

**Files to Fix:**
- `src/lib/test-runner.ts` - Fix timeout handling
- `src/lib/test-runner.spec.ts` - Adjust test timeout

**Estimated Time:** 30 minutes
**Priority:** P1 - High

---

## Medium Priority Failures

### 4. 🟡 security-testing.spec.ts - 16 FAILURES
**Root Cause:** PII masking format mismatch
**Impact:** MEDIUM - Security features

**Failures:**
- ❌ Email masking: Expected "***" but got "[EMAIL]"
- ❌ SSN masking: Expected "***" but got "[SSN]"
- ❌ Credit card masking: Expected "***" but got "[CREDIT_CARD]"
- ❌ Phone masking: Expected "***" but got "[PHONE]"
- ❌ Session timeout: `timeoutManager.trackSession is not a function`
- ❌ Path traversal: Path validation not working
- ❌ Command injection: Test logic error
- ❌ Prototype pollution: Cleanup not working

**Analysis:**
```typescript
// Issue: DataMasker uses placeholder format [TYPE] instead of ***
expect(masked.email).toContain('***'); // Gets "[EMAIL]"

// Issue: SessionTimeoutManager API mismatch
timeoutManager.trackSession(session.id, 2000); // Not a function
timeoutManager.on('warning', ...); // Not a function
```

**Fix Strategy:**
1. Update DataMasker to use "***" format or update tests
2. Fix SessionTimeoutManager API implementation
3. Fix path validation logic
4. Fix test assertions for command injection and prototype pollution

**Files to Fix:**
- `src/lib/data-masker.ts` - Change masking format
- `src/lib/session-timeout-manager.ts` - Add missing methods
- `src/lib/security-testing.spec.ts` - Fix test logic

**Estimated Time:** 2 hours
**Priority:** P1 - High

---

### 5. 🟡 chaos-testing.spec.ts - 2 FAILURES
**Root Cause:** Process crash detection not working
**Impact:** MEDIUM - Reliability testing

**Failures:**
1. ❌ "should detect and handle process crash gracefully"
2. ❌ "should handle multiple simultaneous crashes"

**Analysis:**
```typescript
// Process not detected as crashed
expect(proc?.killed || proc?.exitCode !== null).toBe(true); // Both false

// No crashes detected
expect(crashedCount).toBe(5); // Got 0
```

**Fix Strategy:**
1. Improve crash detection in DebugSession
2. Add proper event handlers for process exit
3. Ensure crash state is properly tracked

**Files to Fix:**
- `src/lib/debug-session.ts` - Improve crash detection
- `src/lib/chaos-testing.spec.ts` - May need to adjust timing

**Estimated Time:** 1 hour
**Priority:** P2 - Medium

---

### 6. 🟡 performance-benchmarks.spec.ts - 2 FAILURES
**Root Cause:** API mismatch and metrics collection
**Impact:** LOW - Performance testing

**Failures:**
1. ❌ "should benchmark variable inspection latency" - `setBreakpoint is not a function`
2. ❌ "should track performance metrics over time" - No operations recorded

**Analysis:**
```typescript
// API mismatch
await session.breakpointManager.setBreakpoint(testFixturePath, 2);
// Should be: session.setBreakpoint() or breakpointManager.createBreakpoint()

// No metrics collected
expect(report.summary.totalOperations).toBeGreaterThan(0); // Got 0
```

**Fix Strategy:**
1. Fix API calls in benchmark tests
2. Ensure metrics are properly collected
3. May need to actually run operations to collect metrics

**Files to Fix:**
- `src/lib/performance-benchmarks.spec.ts` - Fix API calls

**Estimated Time:** 30 minutes
**Priority:** P2 - Medium

---

### 7. 🟡 compatibility-testing.spec.ts - 1 FAILURE
**Root Cause:** Jest process spawn issue
**Impact:** LOW - Compatibility testing

**Failure:**
❌ "should work with Jest" - Process exited before inspector URL found

**Analysis:**
```typescript
// Process exits too quickly or inspector not starting
Process exited with code 1 before inspector URL was found
```

**Fix Strategy:**
1. Check Jest test fixture
2. Ensure inspector flag is properly set
3. May need to adjust timeout or fixture

**Files to Fix:**
- `src/lib/compatibility-testing.spec.ts` - Fix Jest test fixture
- Test fixtures for Jest

**Estimated Time:** 30 minutes
**Priority:** P3 - Low

---

## Low Priority Failures

### 8. 🟢 source-map-manager.coverage.spec.ts - 1 FAILURE
**Root Cause:** Test expectation mismatch
**Impact:** LOW - Edge case coverage

**Failure:**
❌ "should try multiple patterns to find compiled file" - Found file when expected null

**Fix Strategy:**
1. Adjust test expectation or fix findCompiledFile logic
2. May be a false positive (finding file is actually correct behavior)

**Estimated Time:** 15 minutes
**Priority:** P3 - Low

---

### 9. 🟢 test-runner.unit.spec.ts - 1 FAILURE
**Root Cause:** Mocha output parsing
**Impact:** LOW - Unit test

**Failure:**
❌ "should handle Mocha text output fallback" - Parsed 0 tests instead of 3

**Fix Strategy:**
1. Fix Mocha output parsing regex
2. Update test fixture or parser

**Estimated Time:** 15 minutes
**Priority:** P3 - Low

---

## Recommended Fix Order

### Phase 1: Critical Blockers (P0) - 4-6 hours
1. **inspector-client.mock.spec.ts** (26 failures) - 2-3 hours
   - Fix WebSocket mocking
   - This unlocks many other tests
2. **debug-session.unit.spec.ts** (4 failures) - 2-3 hours
   - Fix state transitions
   - Fix crash detection
   - Add validation

### Phase 2: High Priority (P1) - 3 hours
3. **test-runner.spec.ts** (1 failure) - 30 min
4. **security-testing.spec.ts** (16 failures) - 2 hours

### Phase 3: Medium Priority (P2) - 2 hours
5. **chaos-testing.spec.ts** (2 failures) - 1 hour
6. **performance-benchmarks.spec.ts** (2 failures) - 30 min
7. **compatibility-testing.spec.ts** (1 failure) - 30 min

### Phase 4: Low Priority (P3) - 30 minutes
8. **source-map-manager.coverage.spec.ts** (1 failure) - 15 min
9. **test-runner.unit.spec.ts** (1 failure) - 15 min

**Total Estimated Time:** 9-11 hours

## Success Criteria

After fixes:
- ✅ All 45 test suites passing
- ✅ 500+ tests passing
- ✅ 93%+ line coverage maintained
- ✅ 85%+ branch coverage achieved
- ✅ No critical failures blocking development

## Next Steps

1. Review this analysis
2. Prioritize which phases to tackle
3. Start with Phase 1 (WebSocket mocking) as it unblocks the most tests
4. Track progress and adjust plan as needed
