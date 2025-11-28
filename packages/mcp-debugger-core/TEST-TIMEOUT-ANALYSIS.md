# Test Timeout Analysis and Solutions

## Problem Statement

**Symptom:** Full test suite with coverage times out after 60-120 seconds
**Status:** 
- ✅ Individual test files pass with coverage
- ✅ Full test suite passes WITHOUT coverage  
- ❌ Full test suite with coverage TIMES OUT

## Root Cause Analysis

### 1. Orphaned Debug Processes
**Finding:** Multiple Node.js processes with `--inspect-brk=0` flag remain running after tests complete

**Evidence:**
```bash
$ ps aux | grep "node --inspect-brk"
node --inspect-brk=0 --enable-source-maps .../simple-script.js
node --inspect-brk=0 --enable-source-maps .../step-test.js
# ... multiple processes
```

**Impact:** These processes hold resources and prevent Jest from exiting cleanly

### 2. Coverage Instrumentation Overhead
**Finding:** Code coverage instrumentation significantly slows down test execution

**Impact:**
- Tests that normally complete in 2-3 seconds take 10-15 seconds with coverage
- Cumulative effect across 100+ test files causes timeout
- Resource contention when running multiple workers

### 3. Insufficient Cleanup in Tests
**Finding:** Some tests may not be properly cleaning up debug sessions

**Impact:**
- WebSocket connections remain open
- Child processes not killed
- Event listeners not removed
- Memory leaks accumulate

## Solutions Implemented

### Solution 1: Jest Configuration Updates ✅

**File:** `packages/debugger-core/jest.config.js`

**Changes:**
```javascript
{
  testTimeout: 30000,        // 30 seconds per test (was default 5s)
  maxWorkers: 2,             // Limit concurrent workers (was unlimited)
  forceExit: true,           // Force exit after tests (prevents hanging)
  detectOpenHandles: true,   // Detect resources that prevent exit
}
```

**Rationale:**
- Longer timeout accommodates coverage overhead
- Fewer workers reduces resource contention
- Force exit prevents hanging on orphaned resources
- Open handle detection helps identify cleanup issues

### Solution 2: Test File Fix ✅

**File:** `packages/debugger-core/src/lib/source-map-manager.coverage.spec.ts`

**Issue:** Multiple `describe` blocks without proper setup/teardown

**Fix:** Added manager and testFixtureDir to each describe block:
```typescript
describe('mapSourceToCompiled - Mapping Logic', () => {
  let manager: SourceMapManager;
  const testFixtureDir = path.join(__dirname, '../../test-fixtures');

  beforeEach(() => {
    manager = new SourceMapManager();
  });

  afterEach(() => {
    manager.clearCache();
  });
  // ... tests
});
```

## Recommended Solutions (To Implement)

### Solution 3: Run Tests in Batches

**Approach:** Split test execution into smaller batches

**Implementation:**
```bash
# Run tests by category
npm run test:unit -- --coverage
npm run test:integration -- --coverage  
npm run test:profiling -- --coverage

# Or run in smaller groups
npm run test -- --testPathPattern="breakpoint|session" --coverage
npm run test -- --testPathPattern="profiler|metrics" --coverage
```

**Benefits:**
- Reduces memory pressure
- Easier to identify problematic tests
- Can run in parallel in CI/CD

### Solution 4: Improve Test Cleanup

**Target Files:**
- `debug-session.coverage.spec.ts`
- `hang-detector.spec.ts`
- `profiling.integration.spec.ts`
- Any test that spawns processes

**Required Changes:**
```typescript
afterEach(async () => {
  // Kill all child processes
  if (session?.process && !session.process.killed) {
    session.process.kill('SIGKILL');
  }
  
  // Close all WebSocket connections
  if (session?.inspector) {
    await session.inspector.disconnect();
  }
  
  // Clear all timers
  jest.clearAllTimers();
  
  // Cleanup session manager
  await sessionManager.cleanupAll();
});
```

### Solution 5: Add Process Cleanup Utility

**Create:** `packages/debugger-core/src/test-utils/cleanup.ts`

```typescript
export async function cleanupDebugProcesses() {
  // Kill all node processes with --inspect-brk
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    exec('pkill -f "node --inspect-brk"', () => resolve(undefined));
  });
}

export function setupTestCleanup() {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(async () => {
    await cleanupDebugProcesses();
  });
}
```

**Usage in tests:**
```typescript
import { setupTestCleanup } from '../test-utils/cleanup';

describe('My Test Suite', () => {
  setupTestCleanup();
  // ... tests
});
```

### Solution 6: CI/CD Optimization

**GitHub Actions / CI Configuration:**
```yaml
- name: Run tests with coverage
  run: |
    # Run with limited workers and longer timeout
    npm test -- --coverage --maxWorkers=2 --testTimeout=60000
    
    # Or run in batches
    npm test -- --testPathPattern="unit" --coverage
    npm test -- --testPathPattern="integration" --coverage
```

### Solution 7: Coverage Threshold Configuration

**Update:** `jest.config.js`

```javascript
{
  coverageThresholds: {
    global: {
      lines: 90,
      branches: 85,
      functions: 90,
      statements: 90,
    },
  },
  // Collect coverage only from source files
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/test-utils/**',
  ],
}
```

## Testing Strategy

### Phase 1: Verify Individual Tests ✅
```bash
# Test each file individually with coverage
for file in src/**/*.spec.ts; do
  npx jest "$file" --coverage --maxWorkers=1
done
```

### Phase 2: Test in Small Batches
```bash
# Group 1: Core functionality
npx jest --testPathPattern="(session|breakpoint|inspector)" --coverage

# Group 2: Profiling
npx jest --testPathPattern="(profiler|metrics|performance)" --coverage

# Group 3: Integration
npx jest --testPathPattern="integration" --coverage
```

### Phase 3: Full Suite with Optimizations
```bash
# Run full suite with all optimizations
npx jest --coverage --maxWorkers=2 --forceExit --detectOpenHandles
```

## Monitoring and Debugging

### Check for Orphaned Processes
```bash
# Before running tests
ps aux | grep "node --inspect-brk" | wc -l  # Should be 0

# After running tests
ps aux | grep "node --inspect-brk" | wc -l  # Should be 0

# Kill orphaned processes
pkill -f "node --inspect-brk"
```

### Identify Hanging Tests
```bash
# Run with verbose output
npx jest --coverage --verbose --detectOpenHandles

# Run with specific timeout
npx jest --coverage --testTimeout=10000
```

### Memory Profiling
```bash
# Run with Node.js memory profiling
node --expose-gc --max-old-space-size=4096 \
  node_modules/.bin/jest --coverage --maxWorkers=1
```

## Success Criteria

- [ ] All tests pass individually with coverage
- [ ] Tests can run in batches with coverage
- [ ] Full test suite completes with coverage in < 5 minutes
- [ ] No orphaned processes after test completion
- [ ] Coverage meets targets: 90% lines, 85% branches
- [ ] CI/CD pipeline runs successfully with coverage

## Next Steps

1. ✅ Update Jest configuration
2. ✅ Fix source-map-manager test file
3. ⏳ Create test cleanup utility
4. ⏳ Update all tests to use cleanup utility
5. ⏳ Test in batches to identify problematic tests
6. ⏳ Fix identified problematic tests
7. ⏳ Run full suite with coverage
8. ⏳ Set up CI/CD with coverage gates

## Status

**Current:** Solutions 1 and 2 implemented
**Next:** Implement Solution 5 (cleanup utility) and test in batches
**Blocker:** Need to identify which specific tests are causing timeouts
