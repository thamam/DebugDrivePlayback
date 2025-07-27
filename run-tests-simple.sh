#!/bin/bash

# Simple Test Runner Script - Replit Compatible
# Quick way to run available tests and generate reports

echo "🚀 Debug Player Framework - Simple Test Runner"
echo "=============================================="

# Create test reports directory
mkdir -p test-reports

# Run Unit Tests (with lower coverage threshold for Replit)
echo "📋 Running Unit Tests..."
npx jest --coverage --coverageDirectory=test-reports/coverage --testPathPatterns="__tests__" --passWithNoTests --maxWorkers=2

# Run Type Checking (with skip lib check for faster execution)
echo "🔍 Running Type Checking..."
npx tsc --noEmit --skipLibCheck

# Try E2E Tests (skip if dependencies missing)
echo "🖥️ Attempting E2E Tests..."
if npx playwright install --dry-run &>/dev/null; then
    npx playwright test --reporter=html --output test-reports/e2e-results --workers=1
else
    echo "⏭️ E2E tests skipped - browser dependencies not available"
fi

echo "✅ Available tests completed!"
echo "📊 Reports available in: test-reports/"
echo "🌐 Open test-reports/index.html for detailed results"