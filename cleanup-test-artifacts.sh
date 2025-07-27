#!/bin/bash

# Cleanup Test Artifacts Script
# This script removes test reports, coverage files, and other artifacts that should not be committed

echo "🧹 Cleaning up test artifacts..."

# Remove test reports
if [ -d "test-reports" ]; then
    echo "Removing test-reports directory..."
    rm -rf test-reports/
fi

# Remove coverage files
if [ -d "coverage" ]; then
    echo "Removing coverage directory..."
    rm -rf coverage/
fi

# Remove E2E test results
if [ -d "test-results" ]; then
    echo "Removing test-results directory..."
    rm -rf test-results/
fi

# Remove playwright artifacts
if [ -d "playwright-report" ]; then
    echo "Removing playwright-report directory..."
    rm -rf playwright-report/
fi

if [ -d "playwright/.cache" ]; then
    echo "Removing playwright cache..."
    rm -rf playwright/.cache/
fi

# Remove pytest cache
if [ -d ".pytest_cache" ]; then
    echo "Removing .pytest_cache directory..."
    rm -rf .pytest_cache/
fi

# Remove any coverage files
find . -name "*.coverage" -type f -delete 2>/dev/null
find . -name ".coverage" -type f -delete 2>/dev/null

# Remove log files
find . -name "*.log" -type f -delete 2>/dev/null

# Remove OS-specific files
find . -name ".DS_Store" -type f -delete 2>/dev/null
find . -name "Thumbs.db" -type f -delete 2>/dev/null

# Remove editor swap files
find . -name "*.swp" -type f -delete 2>/dev/null
find . -name "*.swo" -type f -delete 2>/dev/null
find . -name "*~" -type f -delete 2>/dev/null

echo "✅ Cleanup complete!"
echo ""
echo "📋 Summary of cleaned items:"
echo "- Test reports and coverage data"
echo "- E2E test artifacts"  
echo "- Cache directories"
echo "- Log files"
echo "- OS and editor temporary files"
echo ""
echo "💡 Run 'git status' to see remaining changes that need to be committed."