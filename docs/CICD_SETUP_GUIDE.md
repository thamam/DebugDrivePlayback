# 🚀 CI/CD Setup Guide

## Overview

This document describes the comprehensive CI/CD pipeline setup for the Debug Player Framework. The pipeline includes multiple GitHub Actions workflows that run all possible tests on every commit and pull request.

## 📋 Workflow Summary

### 1. 🧪 Comprehensive CI/CD Pipeline (`comprehensive-ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests
**Purpose:** Complete validation of all features and functionality

**Test Coverage:**
- ✅ **Code Quality & Linting** - ESLint, Prettier, TypeScript checks
- ✅ **Unit Tests (Jest)** - All component and utility tests with coverage
- ✅ **E2E Tests (Playwright)** - Cross-browser testing (Chromium, Firefox, WebKit)
- ✅ **Python Backend Tests** - Multi-version Python testing (3.9-3.11)
- ✅ **Integration Tests** - Frontend-Backend integration with PostgreSQL
- ✅ **Performance Tests** - Load testing and performance benchmarks
- ✅ **Storybook Tests** - Component documentation builds
- ✅ **Security Scan** - npm audit and CodeQL analysis
- ✅ **Docker Tests** - Container build and deployment testing

### 2. 💨 Smoke Tests (`smoke-tests.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests
**Purpose:** Fast feedback for basic functionality

**Quick Checks:**
- Build validation
- TypeScript compilation
- Quick unit tests
- Service startup verification
- Python backend import test

### 3. 🌙 Nightly Comprehensive Testing (`nightly-comprehensive.yml`)
**Triggers:** Scheduled (2 AM UTC daily), Manual dispatch
**Purpose:** Extended testing across multiple environments

**Extended Coverage:**
- Multi-version matrix testing (Node.js 18/20/22, Python 3.9-3.12)
- Long-running performance tests
- Memory leak detection
- Deep code quality analysis (SonarQube, OWASP)

### 4. 🚀 Deployment Testing (`deployment-tests.yml`)
**Triggers:** Version tags, Releases, Manual dispatch
**Purpose:** Pre-deployment validation

**Deployment Checks:**
- Production build validation
- Critical path testing
- Container deployment tests
- Security scanning
- Performance baseline establishment

### 5. 🔧 Manual Test Runner (`manual-test-runner.yml`)
**Triggers:** Manual dispatch only
**Purpose:** Flexible test execution for debugging

**Options:**
- Select specific test suites
- Choose browser for E2E tests
- Run custom commands
- Enable debug mode

## 🧪 Complete Test Inventory

### Unit Tests
- **Location:** `tests/unit/`, `client/src/components/**/__tests__/`
- **Framework:** Jest with Babel
- **Coverage:** Components, hooks, utilities, widget system
- **Files:**
  - `disabled-features.test.js`
  - `widget-engine.test.ts`
  - `widget-templates.test.ts`
  - `widget-integration.test.ts`
  - `widget-manager.test.tsx`
  - `widget-wizard.test.tsx`

### E2E Tests
- **Location:** `tests/e2e/`
- **Framework:** Playwright
- **Browsers:** Chromium, Firefox, WebKit
- **Files:**
  - `ui-functionality.spec.ts`
  - `widget-accessibility.spec.ts`
  - `widget-dashboard.spec.ts`
  - `widget-demo.spec.ts`
  - `widget-manager.spec.ts`
  - `widget-visual.spec.ts`
  - `widget-wizard.spec.ts`

### Backend Tests
- **Location:** `python_backend/`
- **Framework:** Python unittest + custom test runner
- **Files:**
  - `test_backend.py`
  - Plugin system tests
  - Data processing tests

### Integration Tests
- **Files:**
  - `test-frontend-integration.cjs`
  - `test-integration-flow.py`
  - `test_basic_flows.py`
- **Coverage:** API integration, data flow, service communication

### Performance Tests
- **File:** `test-performance.cjs`
- **Framework:** Playwright with custom metrics
- **Metrics:** Load times, memory usage, API response times, FPS

### Comprehensive Test Runner
- **File:** `run-all-tests-comprehensive.sh`
- **Purpose:** Runs ALL tests in correct order with dependency checking

## 🔧 Setup Instructions

### 1. Repository Setup

The workflows are automatically available once this repository is pushed to GitHub. No additional setup required for basic functionality.

### 2. Required Secrets (Optional)

For enhanced features, add these secrets in GitHub Settings > Secrets and variables > Actions:

```
SONAR_TOKEN=your_sonarqube_token    # For code quality analysis
CODECOV_TOKEN=your_codecov_token    # For coverage reporting
```

### 3. Environment Configuration

Ensure these files exist in your repository:
- ✅ `package.json` with required npm scripts
- ✅ `python_backend/requirements.txt`
- ✅ `jest.config.cjs` 
- ✅ `playwright.config.ts`
- ✅ `test-data-config.json`

### 4. Test Data Setup

The pipeline includes test data configuration:
```json
{
  "testDataPaths": {
    "primary": "/home/thh3/data/trips/2025-07-15T12_06_02",
    "secondary": "/home/thh3/data/trips/2025-07-24T11_07_30", 
    "fallback": "./data/trips/2025-07-15T12_06_02"
  }
}
```

## 🚦 Workflow Triggers

### Automatic Triggers
- **Push to main/develop:** Runs comprehensive tests + smoke tests
- **Pull Request:** Runs comprehensive tests + smoke tests
- **Schedule (Nightly):** Runs extended test matrix
- **Tag/Release:** Runs deployment tests

### Manual Triggers
- **Workflow Dispatch:** All workflows support manual execution
- **Custom Test Runner:** Flexible test selection and debugging

## 📊 Test Results & Reporting

### Artifacts Uploaded
- Test coverage reports (HTML + LCOV)
- E2E test results and screenshots
- Performance benchmarks
- Integration test logs
- Storybook builds

### Coverage Reporting
- **Unit Tests:** Jest coverage with Codecov integration
- **E2E Tests:** Playwright test results with visual comparisons
- **Integration:** API and service integration validation

### GitHub Integration
- **Status Checks:** All PRs require passing tests
- **Summary Reports:** Detailed test results in GitHub UI
- **Artifact Downloads:** Test reports available for 90 days

## 🔍 Validation

Use the validation script to check your setup:

```bash
.github/validate-workflows.sh
```

This script verifies:
- ✅ YAML syntax validity
- ✅ Required workflow fields
- ✅ Test coverage completeness
- ✅ Package.json script availability
- ✅ Dependency configuration

## 🎯 Best Practices

### Test Organization
- **Fast Tests First:** Smoke tests provide quick feedback
- **Parallel Execution:** Tests run in parallel where possible
- **Fail Fast:** Critical failures stop dependent jobs
- **Retry Logic:** Flaky tests are retried automatically

### Resource Management
- **Concurrency:** Cancels previous runs on new pushes
- **Caching:** Dependencies cached for faster execution
- **Matrix Strategy:** Tests multiple environments efficiently
- **Timeouts:** Prevents stuck workflows

### Security
- **No Hardcoded Secrets:** All sensitive data uses GitHub secrets
- **Minimal Permissions:** Workflows use least-privilege access
- **Dependency Scanning:** Regular security audits
- **Code Analysis:** Static analysis with CodeQL

## 🐛 Troubleshooting

### Common Issues

1. **Test Failures on CI but passing locally**
   - Check environment differences (Node.js versions, dependencies)
   - Review test data availability in CI environment
   - Verify service startup timing

2. **Playwright Browser Issues**
   - Ensure `npx playwright install` is in workflow
   - Check for missing system dependencies
   - Verify headless mode compatibility

3. **Python Backend Connection Failures**
   - Verify service startup order and timing
   - Check port conflicts
   - Review health check endpoints

4. **Performance Test Inconsistencies**
   - Consider CI environment performance variability
   - Adjust performance thresholds for CI
   - Use multiple test runs for statistical significance

### Debug Options

1. **Enable Debug Mode** in manual test runner
2. **Check Artifacts** for detailed logs and reports
3. **Review GitHub Actions logs** for step-by-step execution
4. **Use SSH debugging** with `actions/debug` action if needed

## 📈 Metrics & Monitoring

The CI/CD pipeline provides comprehensive metrics:

- **Test Execution Time:** Track test suite performance
- **Success Rate:** Monitor test reliability
- **Coverage Trends:** Track code coverage over time
- **Performance Baselines:** Establish and monitor performance standards

## 🔄 Continuous Improvement

Regular maintenance tasks:
- Review and update dependency versions
- Optimize test execution times
- Add new test categories as needed
- Monitor and adjust performance thresholds
- Update browser versions for E2E tests

## 📞 Support

For issues with the CI/CD pipeline:
1. Check this documentation
2. Run the validation script
3. Review GitHub Actions logs
4. Open an issue with the error details