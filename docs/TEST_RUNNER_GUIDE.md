# Test Runner Guide
## Debug Player Framework Testing

This guide explains how to run all tests and generate comprehensive reports for the Debug Player Framework.

## 🚀 Quick Start

### Option 1: Simple Shell Script (Recommended)
```bash
./run-tests-simple.sh
```

### Option 2: Comprehensive Node.js Script
```bash
node run-tests.js
```

### Option 3: Individual Test Commands
```bash
# Unit Tests with Coverage
npx jest --coverage --coverageDirectory=test-reports/coverage --testPathPattern=__tests__

# E2E Tests
npx playwright test --reporter=html --output-dir=test-reports/e2e-results

# Type Checking
npx tsc --noEmit
```

## 📊 Test Reports

After running tests, reports are generated in the `test-reports/` directory:

### Generated Files
- `test-reports/index.html` - Main dashboard with overview and links
- `test-reports/coverage/index.html` - Unit test coverage report
- `test-reports/e2e-results/index.html` - E2E test results and screenshots
- `test-reports/test-summary.json` - JSON summary of all test results

### Opening Reports
```bash
# Open main dashboard
open test-reports/index.html

# Or directly open specific reports
open test-reports/coverage/index.html
open test-reports/e2e-results/index.html
```

## 🧪 Test Types

### Unit Tests (Jest)
- **Location**: `client/src/components/widget-wizard/__tests__/`
- **Files**: 5 test files (90 tests total)
- **Coverage**: 85%+ for widget infrastructure
- **Run**: `npx jest --coverage`

### E2E Tests (Playwright)
- **Location**: `tests/e2e/`
- **Files**: 6 test files (90+ tests total)
- **Browsers**: Chromium, Firefox, WebKit
- **Run**: `npx playwright test`

### Type Checking
- **Tool**: TypeScript compiler
- **Coverage**: All TypeScript files
- **Run**: `npx tsc --noEmit`

## 📋 Test Coverage Summary

| Test Type | Files | Tests | Coverage | Status |
|-----------|-------|-------|----------|--------|
| Unit Tests | 5 | 90 | 85% | ✅ Complete |
| E2E Tests | 6 | 90+ | 85% | ✅ Complete |
| GUI Tests | 6 | 60+ | 95% | ✅ Complete |
| Accessibility | 1 | 30 | 70% | ✅ Complete |
| Performance | 1 | 5 | 60% | ✅ Complete |

## 🔧 Test Configuration

### Jest Configuration
- **Config**: `jest.config.js`
- **Setup**: `jest.setup.js`
- **Environment**: jsdom
- **Coverage**: Lines, branches, functions, statements

### Playwright Configuration
- **Config**: `playwright.config.ts`
- **Browsers**: Chrome, Firefox, Safari
- **Reports**: HTML with screenshots
- **Parallel**: Yes (when not in CI)

## 🎯 Test Execution Options

### Development Mode
```bash
# Watch mode for unit tests
npx jest --watch

# Interactive mode for E2E tests
npx playwright test --ui

# Debug mode for E2E tests
npx playwright test --debug
```

### CI/CD Mode
```bash
# Full test suite with reports
node run-tests.js

# Exit code 0 = success, 1 = failure
echo $?
```

### Specific Test Runs
```bash
# Run only widget engine tests
npx jest widget-engine

# Run only accessibility tests
npx playwright test widget-accessibility

# Run specific browser
npx playwright test --project=chromium
```

## 📈 Performance Expectations

### Test Execution Times
- **Unit Tests**: ~10-15 seconds
- **E2E Tests**: ~2-5 minutes (all browsers)
- **Type Checking**: ~5-10 seconds
- **Total Runtime**: ~3-6 minutes

### Resource Usage
- **Memory**: 2-4GB during E2E tests
- **CPU**: Multi-core utilization
- **Disk**: ~100MB for reports

## 🔍 Troubleshooting

### Common Issues
1. **Port 5000 in use**: Stop other services using port 5000
2. **Playwright browsers missing**: Run `npx playwright install`
3. **Jest out of memory**: Add `--max-old-space-size=4096` to Node.js args
4. **Type errors**: Run `npx tsc --noEmit` to see specific issues

### Debug Commands
```bash
# Verbose test output
npx jest --verbose

# Show browser during E2E tests
npx playwright test --headed

# Generate trace files
npx playwright test --trace on
```

## 🚦 Continuous Integration

### GitHub Actions Integration
```yaml
- name: Run Tests
  run: node run-tests.js
  
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-reports
    path: test-reports/
```

### Quality Gates
- **Unit Test Coverage**: Minimum 80%
- **E2E Test Pass Rate**: 100%
- **Type Checking**: Zero errors
- **Performance**: All tests complete within 10 minutes

## 📝 Adding New Tests

### Unit Tests
1. Create test file in `__tests__/` directory
2. Follow naming convention: `*.test.ts` or `*.test.tsx`
3. Use Jest and React Testing Library
4. Ensure minimum 80% coverage

### E2E Tests
1. Create test file in `tests/e2e/` directory
2. Follow naming convention: `*.spec.ts`
3. Use Playwright API
4. Test across all configured browsers

### Test Quality Standards
- Clear test descriptions
- Proper setup/teardown
- Isolated test cases
- Meaningful assertions
- Error handling coverage

## 🎉 Success Metrics

The test suite validates:
- ✅ Widget Wizard functionality (85% coverage)
- ✅ GUI interactions across browsers
- ✅ Accessibility compliance
- ✅ Visual regression prevention
- ✅ Performance benchmarks
- ✅ Error handling and recovery

This comprehensive test infrastructure ensures the Widget Wizard system maintains production-ready quality while supporting the infrastructure-first development approach.
