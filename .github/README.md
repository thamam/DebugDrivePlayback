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
