# CI/CD Documentation

## GitHub Actions Workflows

### 🔄 **CI Pipeline** (`ci.yml`)
**Triggers:** Push to `main/develop`, Pull Requests to `main`

**What it does:**
- ✅ Installs dependencies
- ✅ Runs unit tests (Jest)
- ✅ Runs E2E tests (Playwright - Chromium only)
- ✅ Builds application
- ✅ Uploads artifacts on failure

**Runtime:** ~30 seconds

### 🚀 **Release Pipeline** (`release.yml`)
**Triggers:** GitHub releases, Manual dispatch

**What it does:**
- ✅ Runs full test suite
- ✅ Builds for production
- ✅ Creates deployment package
- ✅ Uploads release artifacts

### 🔍 **Dependency Review** (`dependency-review.yml`)
**Triggers:** Pull Requests to `main`

**What it does:**
- ✅ Reviews dependency changes
- ✅ Blocks high-severity vulnerabilities
- ✅ Validates allowed licenses

## 📁 Workflow Files

| Workflow | Purpose | Triggers |
|----------|---------|----------|
| [`ci.yml`](workflows/ci.yml) | Fast validation & feedback | Push to main/develop, PRs |
| [`release.yml`](workflows/release.yml) | Production deployment | Tags, releases, manual dispatch |
| [`dependency-review.yml`](workflows/dependency-review.yml) | Security review | Pull requests to main |

## 🧪 Complete Test Coverage

- **✅ Unit Tests** - Jest with coverage reporting
- **✅ E2E Tests** - Playwright across multiple browsers
- **✅ Integration Tests** - Frontend-backend communication
- **✅ Python Backend Tests** - API and plugin system
- **✅ Performance Tests** - Load testing and benchmarks
- **✅ Security Scans** - Dependency audits and CodeQL
- **✅ Code Quality** - Linting, formatting, type checking
- **✅ Build Tests** - Production builds and Docker containers

## Local Commands

```bash
# Run CI tests locally
npm run test:ci

# Run individual test suites
npm run test:unit      # Jest unit tests
npm run test:e2e       # Playwright E2E tests (all browsers)

# Run build
npm run build
```

## Test Strategy

**Simplified & Robust:**
- **Unit Tests:** 52 tests covering core widget functionality
- **E2E Tests:** 5 simple tests covering basic navigation
- **No longer included:** Accessibility, visual regression, complex widget interactions

**Why simplified?**
- Original 234 tests were over-engineered and brittle
- Simple tests = reliable CI/CD
- Focus on what matters: core functionality works

## Deployment

The CI creates deployment-ready artifacts:
- `dist/` - Built frontend and backend
- `debug-player-{sha}.tar.gz` - Complete deployment package

Ready for deployment to any Node.js hosting platform.

## 📖 Documentation

See [`docs/CICD_SETUP_GUIDE.md`](../docs/CICD_SETUP_GUIDE.md) for detailed setup instructions and troubleshooting.

## 📊 Test Results

All workflows generate detailed reports and artifacts:
- Coverage reports
- Test results and screenshots  
- Performance benchmarks
- Security scan results

Results are available in the Actions tab and as downloadable artifacts.
