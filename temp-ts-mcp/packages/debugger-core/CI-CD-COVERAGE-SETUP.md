# CI/CD Coverage Setup Guide

## Overview

This document provides instructions for setting up coverage gates in CI/CD pipelines to ensure code quality standards are maintained.

## Coverage Targets

- **Line Coverage:** 90%
- **Branch Coverage:** 85%
- **Function Coverage:** 90%
- **Statement Coverage:** 90%

## Jest Configuration

The coverage thresholds are configured in `jest.config.js`:

```javascript
module.exports = {
  // ... other config
  coverageThresholds: {
    global: {
      lines: 90,
      branches: 85,
      functions: 90,
      statements: 90,
    },
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/test-utils/**',
  ],
};
```

## GitHub Actions Configuration

### Basic Setup

Create `.github/workflows/test-coverage.yml`:

```yaml
name: Test Coverage

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-coverage:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test:coverage
        env:
          NODE_OPTIONS: '--max-old-space-size=4096'
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: true
      
      - name: Check coverage thresholds
        run: |
          npm run test:coverage -- --coverageThreshold='{"global":{"lines":90,"branches":85,"functions":90,"statements":90}}'
```

### Batch Testing Setup

For better reliability, use batch testing:

```yaml
name: Test Coverage (Batched)

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-coverage:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        batch:
          - core-session
          - breakpoints
          - inspector
          - variables
          - execution
          - profiling
          - metrics
          - security
          - resilience
          - integration
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run test batch
        run: npm run test:${{ matrix.batch }}
        env:
          NODE_OPTIONS: '--max-old-space-size=4096'
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: ${{ matrix.batch }}
```

## GitLab CI Configuration

Create `.gitlab-ci.yml`:

```yaml
test:coverage:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 30 days
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'
```

## CircleCI Configuration

Create `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  test-coverage:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "package-lock.json" }}
      - run:
          name: Install dependencies
          command: npm ci
      - save_cache:
          paths:
            - node_modules
          key: v1-dependencies-{{ checksum "package-lock.json" }}
      - run:
          name: Run tests with coverage
          command: npm run test:coverage
          environment:
            NODE_OPTIONS: --max-old-space-size=4096
      - store_artifacts:
          path: coverage
      - store_test_results:
          path: coverage

workflows:
  version: 2
  test:
    jobs:
      - test-coverage
```

## NPM Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage --maxWorkers=2 --forceExit",
    "test:coverage:ci": "./run-coverage-batches.sh",
    "test:unit": "jest --testPathPattern='(session|breakpoint|inspector)' --coverage",
    "test:profiling": "jest --testPathPattern='(profiler|metrics)' --coverage",
    "test:integration": "jest --testPathPattern='integration' --coverage",
    "test:watch": "jest --watch",
    "coverage:report": "open coverage/lcov-report/index.html"
  }
}
```

## Coverage Reporting Services

### Codecov

1. Sign up at https://codecov.io
2. Add repository
3. Add to CI/CD:

```yaml
- name: Upload to Codecov
  uses: codecov/codecov-action@v3
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./coverage/lcov.info
    fail_ci_if_error: true
```

### Coveralls

1. Sign up at https://coveralls.io
2. Add repository
3. Add to CI/CD:

```yaml
- name: Upload to Coveralls
  uses: coverallsapp/github-action@v2
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    path-to-lcov: ./coverage/lcov.info
```

### SonarCloud

1. Sign up at https://sonarcloud.io
2. Add repository
3. Add to CI/CD:

```yaml
- name: SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## Local Development

### Running Coverage Locally

```bash
# Run all tests with coverage
npm run test:coverage

# Run specific batch
npm run test:unit

# Run in batches (recommended)
./run-coverage-batches.sh

# View coverage report
npm run coverage:report
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests with coverage
npm run test:coverage

# Check if coverage meets thresholds
if [ $? -ne 0 ]; then
  echo "❌ Tests failed or coverage below threshold"
  exit 1
fi
```

## Troubleshooting

### Tests Timeout with Coverage

**Solution:** Use batch testing
```bash
./run-coverage-batches.sh
```

### Out of Memory Errors

**Solution:** Increase Node.js memory
```bash
NODE_OPTIONS='--max-old-space-size=4096' npm run test:coverage
```

### Orphaned Processes

**Solution:** Clean up before running
```bash
pkill -f "node --inspect-brk"
npm run test:coverage
```

### Coverage Not Collected

**Solution:** Check collectCoverageFrom in jest.config.js
```javascript
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/**/*.spec.ts',
  '!src/**/*.test.ts',
]
```

## Monitoring Coverage Trends

### GitHub Actions Badge

Add to README.md:

```markdown
![Coverage](https://img.shields.io/codecov/c/github/username/repo)
```

### Coverage History

Track coverage over time:

```bash
# Generate coverage report
npm run test:coverage

# Save to history
mkdir -p coverage-history
cp coverage/coverage-summary.json coverage-history/$(date +%Y-%m-%d).json
```

## Best Practices

1. **Run coverage in CI/CD** - Don't rely on local runs
2. **Use batch testing** - Prevents timeouts and resource issues
3. **Set realistic thresholds** - 90% lines, 85% branches
4. **Monitor trends** - Track coverage over time
5. **Fail fast** - Block PRs that reduce coverage
6. **Clean up resources** - Prevent orphaned processes
7. **Use caching** - Speed up CI/CD runs
8. **Parallel execution** - Run batches in parallel when possible

## Next Steps

1. ✅ Configure Jest with coverage thresholds
2. ⏳ Set up CI/CD pipeline
3. ⏳ Add coverage reporting service
4. ⏳ Add coverage badge to README
5. ⏳ Set up pre-commit hooks
6. ⏳ Monitor coverage trends
