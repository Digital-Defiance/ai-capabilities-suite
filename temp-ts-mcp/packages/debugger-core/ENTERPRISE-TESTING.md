# Enterprise Testing Suite

This document describes the comprehensive enterprise-grade testing suite implemented for the MCP Debugger.

## Overview

The enterprise testing suite includes five major categories of tests designed to ensure the debugger meets production-grade quality standards:

1. **Load Testing** - Tests system behavior under high concurrent load
2. **Chaos Testing** - Tests system resilience under failure conditions  
3. **Compatibility Testing** - Tests compatibility across platforms and versions
4. **Security Testing** - Tests authentication, authorization, and data protection
5. **Performance Benchmarks** - Measures and tracks performance metrics

## Test Files

### 1. Load Testing (`load-testing.spec.ts`)

Tests the system's ability to handle high concurrent load and resource management.

**Test Coverage:**
- Concurrent session management (10, 50+ sessions)
- Session creation throughput measurement
- Resource cleanup under load (25+ sessions)
- Rapid session creation and destruction cycles
- Memory usage tracking during concurrent sessions

**Key Metrics:**
- Session creation throughput: ~5-6 sessions/sec
- Average session creation latency: ~180ms
- Memory per session: <50MB
- Cleanup time for 25 sessions: <15 seconds

### 2. Chaos Testing (`chaos-testing.spec.ts`)

Tests system resilience when things go wrong.

**Test Coverage:**
- Process crash detection and handling
- Multiple simultaneous crashes
- Process termination by signal (SIGKILL)
- Inspector connection loss simulation
- Reconnection attempts after disconnect
- Invalid CDP command handling
- CDP timeout errors
- Excessive breakpoint creation
- Rapid operation requests
- Graceful degradation with partial failures
- Recovery from temporary failures

**Failure Scenarios Tested:**
- Intentional process crashes
- Network disconnections
- Protocol errors
- Resource exhaustion
- Concurrent failures

### 3. Compatibility Testing (`compatibility-testing.spec.ts`)

Tests compatibility across different environments and versions.

**Test Coverage:**
- Node.js version compatibility (16, 18, 20, 22)
- TypeScript version compatibility (4.x, 5.x)
- Test framework compatibility (Jest, Mocha, Vitest)
- Platform compatibility (Linux, macOS, Windows)
- Feature detection (Inspector Protocol, Source Maps, WebSocket)
- Platform-specific path handling
- Cross-version compatibility matrix

**Compatibility Report:**
- Environment information (Node version, platform, architecture)
- Feature availability (Inspector, Source Maps, Async Hooks)
- Test framework detection
- TypeScript availability and version

### 4. Security Testing (`security-testing.spec.ts`)

Tests authentication, authorization, rate limiting, and data protection.

**Test Coverage:**

#### Authentication & Authorization:
- Valid token authentication
- Invalid token rejection
- Empty/null token handling
- Multiple valid tokens
- Timing attack prevention
- Token rotation support

#### Rate Limiting:
- Requests within limit allowed
- Requests exceeding limit blocked
- Limit reset after time window
- Independent client tracking
- Accurate retry-after information
- Burst traffic handling

#### PII Masking:
- Email address masking
- SSN pattern masking
- Credit card number masking
- Phone number masking
- Nested object masking
- Array masking
- Non-PII data preservation
- Opt-out for trusted environments

#### Session Timeout:
- Timeout enforcement
- Timeout warnings
- Activity-based timeout reset
- Expired session cleanup

#### Vulnerability Testing:
- Path traversal prevention
- Command injection prevention
- Input validation
- Error message sanitization
- Prototype pollution prevention

### 5. Performance Benchmarks (`performance-benchmarks.spec.ts`)

Measures and tracks performance metrics for key operations.

**Test Coverage:**

#### Session Operations:
- Session creation benchmarking
- Session cleanup benchmarking

#### Variable Inspection:
- Variable inspection latency
- Expression evaluation performance

#### Throughput Measurements:
- Concurrent session throughput
- Operation throughput

#### Performance Tracking:
- Baseline comparison
- Regression detection (>20% threshold)
- Performance improvement detection
- CI-friendly report generation
- Metrics export for tracking

**Benchmark Metrics:**
- Average, min, max latency
- P50, P95, P99 percentiles
- Throughput (operations/second)
- Total time and iteration count

## Running the Tests

### Run All Enterprise Tests

```bash
npx nx test @digitaldefiance/ts-mcp-core --testPathPattern="(load|chaos|compatibility|security|performance)" --forceExit
```

### Run Individual Test Suites

```bash
# Load testing
npx nx test @digitaldefiance/ts-mcp-core --testPathPattern="load-testing" --forceExit

# Chaos testing
npx nx test @digitaldefiance/ts-mcp-core --testPathPattern="chaos-testing" --forceExit

# Compatibility testing
npx nx test @digitaldefiance/ts-mcp-core --testPathPattern="compatibility-testing" --forceExit

# Security testing
npx nx test @digitaldefiance/ts-mcp-core --testPathPattern="security-testing" --forceExit

# Performance benchmarks
npx nx test @digitaldefiance/ts-mcp-core --testPathPattern="performance-benchmarks" --forceExit
```

## Performance Baseline

Benchmark results are saved to `packages/debugger-core/benchmark-results.json` and can be used for regression detection in CI/CD pipelines.

### Viewing Benchmark Results

```bash
cat packages/debugger-core/benchmark-results.json | jq
```

### CI Integration

The performance benchmarks export results in a CI-friendly format with:
- Timestamp and environment information
- Metric values with units
- Pass/fail thresholds
- Regression warnings

## Test Configuration

### Timeouts

Most tests use extended timeouts to accommodate:
- Session creation overhead
- Process spawning
- Inspector protocol handshake
- Cleanup operations

Default timeouts:
- Standard tests: 10 seconds
- Load tests: 30-60 seconds
- Chaos tests: 10-15 seconds

### Force Exit

Tests use `--forceExit` flag to prevent Jest from hanging due to:
- Open handles from child processes
- WebSocket connections
- Inspector protocol connections

## Known Limitations

1. **Breakpoint Tests Skipped**: Some breakpoint-related tests are skipped because the `breakpointManager` is private in `DebugSession`. These tests would require exposing the breakpoint API publicly.

2. **Platform-Specific Tests**: Some tests may behave differently on different platforms (Windows vs Linux/macOS) due to:
   - Path separator differences
   - Process signal handling
   - File system behavior

3. **Resource Intensive**: Load and chaos tests can be resource-intensive and may need adjustment based on available system resources.

## Future Enhancements

1. **Soak Testing**: Long-running tests (24+ hours) to detect memory leaks and degradation
2. **Distributed Load Testing**: Test with distributed load across multiple machines
3. **Advanced Chaos Engineering**: More sophisticated failure injection
4. **Security Penetration Testing**: Automated security scanning
5. **Performance Profiling**: Detailed CPU and memory profiling during tests

## Contributing

When adding new enterprise tests:

1. Follow the existing test structure and naming conventions
2. Include proper cleanup in `afterEach` blocks
3. Use appropriate timeouts for async operations
4. Add documentation for new test categories
5. Update this README with new test coverage

## Support

For issues or questions about the enterprise testing suite:

1. Check test output for detailed error messages
2. Review the test source code for implementation details
3. Consult the main project documentation
4. Open an issue on the project repository
