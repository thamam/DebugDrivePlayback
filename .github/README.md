# 🤖 GitHub Actions Workflows

This directory contains comprehensive CI/CD workflows for the Debug Player Framework.

## 📁 Workflow Files

| Workflow | Purpose | Triggers |
|----------|---------|----------|
| [`comprehensive-ci.yml`](workflows/comprehensive-ci.yml) | Full test suite validation | Push to main/develop, PRs |
| [`smoke-tests.yml`](workflows/smoke-tests.yml) | Fast validation & feedback | Push to main/develop, PRs |
| [`nightly-comprehensive.yml`](workflows/nightly-comprehensive.yml) | Extended testing matrix | Scheduled (nightly) |
| [`deployment-tests.yml`](workflows/deployment-tests.yml) | Pre-deployment validation | Tags, releases |
| [`manual-test-runner.yml`](workflows/manual-test-runner.yml) | Manual test execution | Manual dispatch |

## 🧪 Complete Test Coverage

- **✅ Unit Tests** - Jest with coverage reporting
- **✅ E2E Tests** - Playwright across multiple browsers
- **✅ Integration Tests** - Frontend-backend communication
- **✅ Python Backend Tests** - API and plugin system
- **✅ Performance Tests** - Load testing and benchmarks
- **✅ Security Scans** - Dependency audits and CodeQL
- **✅ Code Quality** - Linting, formatting, type checking
- **✅ Build Tests** - Production builds and Docker containers
- **✅ Storybook Tests** - Component documentation

## 🚀 Quick Start

1. **Push to main/develop** → Triggers comprehensive tests
2. **Create Pull Request** → Triggers validation pipeline  
3. **Manual testing** → Use workflow dispatch for custom runs

## 🔧 Validation

Run the validation script to check workflow health:

```bash
.github/validate-workflows.sh
```

## 📖 Documentation

See [`docs/CICD_SETUP_GUIDE.md`](../docs/CICD_SETUP_GUIDE.md) for detailed setup instructions and troubleshooting.

## 📊 Test Results

All workflows generate detailed reports and artifacts:
- Coverage reports
- Test results and screenshots  
- Performance benchmarks
- Security scan results

Results are available in the Actions tab and as downloadable artifacts.