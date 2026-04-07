# Unit Tests for Veracode Fix for SCA Action

This directory contains unit tests for the Veracode Fix for SCA GitHub Action.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (re-run on file changes)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Coverage

### Current Coverage

- **build-cli-args.js**: 100% coverage ✅
  - All branches covered
  - All functions covered
  - All statements covered

- Other modules: Integration tests to follow

### Coverage Thresholds

Per-file requirements:
- `build-cli-args.js`: 100% on all metrics (new testable module)
- Global project: 50% (gradually increasing as more tests are added)

## Test Files

### `build-cli-args.test.js`

Tests for the CLI argument builder, specifically the `--transitive` flag logic.

**Test Groups:**

1. **--transitive flag behavior** (4 tests)
   - Verifies `--transitive` is included when `fix-transitive='true'`
   - Verifies `--transitive` is included when `fix-transitive=''` (default)
   - Verifies `--transitive` is NOT included when `fix-transitive='false'`
   - Handles lowercase input correctly

2. **Base arguments always present** (4 tests)
   - Verifies base command structure (`fix sca .`)
   - Verifies `--results` path is always included
   - Verifies `--async` and `--decouple` flags are always included
   - Verifies correct argument order

3. **Backward compatibility** (2 tests)
   - Verifies default behavior includes `--transitive` (backward compatible)
   - Verifies opt-out is possible with `fix-transitive='false'`

4. **Argument count verification** (2 tests)
   - Verifies correct argument count with `--transitive`
   - Verifies correct argument count without `--transitive`

5. **Edge cases** (3 tests)
   - Handles undefined workspace paths gracefully
   - Handles various truthy values for transitive flag
   - Handles various falsy values for transitive flag

**Total: 15 tests, all passing ✅**

## Test Structure

```
__tests__/
├── README.md                        # This file
├── setup.js                         # Mock utilities and setup
├── build-cli-args.test.js          # Tests for CLI argument builder
```

## How to Add New Tests

### 1. For testing pure functions (like `build-cli-args.js`):

```javascript
// __tests__/my-module.test.js
const { myFunction } = require('../src/my-module.js');

describe('myFunction', () => {
  test('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### 2. For testing modules that use `@actions/core`:

Use the mocks from `setup.js`:

```javascript
const { mockCore } = require('./setup');

// Inside your test:
mockCore.getInput.mockReturnValue('some-value');
```

## Configuration

### `jest.config.js`

Jest configuration file with:
- Node environment (for GitHub Actions testing)
- Test file pattern matching
- Coverage collection (excludes complex GitHub API modules for now)
- Coverage thresholds per file and globally

## Future Test Coverage

As the codebase grows, plan to add tests for:

1. **`run-fix-sca.js`**: Integration tests with mocked exec
2. **`create-pr.js`**: Tests with mocked GitHub API
3. **`upload-pr-comment.js`**: Tests with mocked API calls
4. **`index.js`**: End-to-end orchestration tests

## Best Practices

### ✅ Do

- Write descriptive test names that explain what is being tested
- Group related tests using `describe` blocks
- Test behavior, not implementation
- Mock external dependencies (GitHub API, file system)
- Use `beforeEach` to reset mocks between tests

### ❌ Don't

- Write tests that are tightly coupled to implementation details
- Test multiple concerns in a single test
- Skip difficult-to-test code without refactoring first
- Mock more than necessary (keep tests focused)

## CI/CD Integration

These tests should run in GitHub Actions CI/CD pipeline:

```yaml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage
```

## Troubleshooting

### Tests not running
```bash
npm install  # Ensure Jest is installed
npm test     # Run tests
```

### Coverage thresholds failing
```bash
npm run test:coverage  # See which files are below threshold
# Update jest.config.js to adjust thresholds if intentional
```

### Mock not working
Check that you're requiring the mock before the module that uses it:

```javascript
// ✅ Correct
jest.mock('@actions/core');
const { myFunction } = require('../src/my-module.js');

// ❌ Wrong
const { myFunction } = require('../src/my-module.js');
jest.mock('@actions/core');
```

---

**Last Updated:** April 7, 2026
**Jest Version:** 29.7.0
**Node Version:** 20+
