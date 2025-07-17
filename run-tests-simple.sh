#!/bin/bash

# Simple Test Runner Script
# Quick way to run all tests and generate reports

echo "🚀 Debug Player Framework - Test Runner"
echo "======================================="

# Create test reports directory
mkdir -p test-reports

# Run Unit Tests
echo "📋 Running Unit Tests..."
npx jest --coverage --coverageDirectory=test-reports/coverage --testPathPattern=__tests__

# Run E2E Tests  
echo "🖥️ Running E2E Tests..."
npx playwright test --reporter=html --output-dir=test-reports/e2e-results

# Run Type Checking
echo "🔍 Running Type Checking..."
npx tsc --noEmit

echo "✅ All tests completed!"
echo "📊 Reports available in: test-reports/"
echo "🌐 Open test-reports/index.html for detailed results"