#!/bin/bash

# GitHub Actions Workflow Validation Script
# Validates all workflow files and checks for common issues

set -e

echo "🔍 GitHub Actions Workflow Validation"
echo "======================================"

WORKFLOWS_DIR=".github/workflows"
ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to print error
print_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️ WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check if workflows directory exists
if [ ! -d "$WORKFLOWS_DIR" ]; then
    print_error "Workflows directory '$WORKFLOWS_DIR' does not exist"
    exit 1
fi

# Find all workflow files
WORKFLOW_FILES=$(find "$WORKFLOWS_DIR" -name "*.yml" -o -name "*.yaml" 2>/dev/null)

if [ -z "$WORKFLOW_FILES" ]; then
    print_error "No workflow files found in '$WORKFLOWS_DIR'"
    exit 1
fi

echo "📋 Found workflow files:"
echo "$WORKFLOW_FILES" | sed 's/^/  - /'
echo ""

# Validate each workflow file
for workflow in $WORKFLOW_FILES; do
    echo "🔍 Validating: $(basename "$workflow")"
    
    # Check if file is readable
    if [ ! -r "$workflow" ]; then
        print_error "Cannot read workflow file: $workflow"
        continue
    fi
    
    # Check YAML syntax using python
    if command -v python3 &> /dev/null; then
        if ! python3 -c "import yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
            print_error "Invalid YAML syntax in: $workflow"
            continue
        fi
    fi
    
    # Check for required fields
    if ! grep -q "^name:" "$workflow"; then
        print_warning "Missing 'name' field in: $workflow"
    fi
    
    if ! grep -q "^on:" "$workflow"; then
        print_error "Missing 'on' field in: $workflow"
        continue
    fi
    
    if ! grep -q "^jobs:" "$workflow"; then
        print_error "Missing 'jobs' field in: $workflow"
        continue
    fi
    
    # Check for common issues
    if grep -q "secrets\." "$workflow" && ! grep -q "secrets:" "$workflow"; then
        print_warning "Using secrets but no secrets defined in: $workflow"
    fi
    
    # Check for hardcoded versions
    if grep -q "node-version.*['\"]16['\"]" "$workflow"; then
        print_warning "Using hardcoded Node.js version 16 in: $workflow"
    fi
    
    # Check for checkout action
    if ! grep -q "actions/checkout@" "$workflow"; then
        print_warning "No checkout action found in: $workflow"
    fi
    
    # Check for setup actions
    if grep -q "npm" "$workflow" && ! grep -q "actions/setup-node@" "$workflow"; then
        print_warning "Using npm without setup-node action in: $workflow"
    fi
    
    if grep -q "python\|pip" "$workflow" && ! grep -q "actions/setup-python@" "$workflow"; then
        print_warning "Using Python without setup-python action in: $workflow"
    fi
    
    print_success "Validation completed for: $(basename "$workflow")"
    echo ""
done

# Validate specific workflow requirements
echo "🧪 Checking Test Coverage..."

# Check if comprehensive test workflow exists
if [ -f "$WORKFLOWS_DIR/comprehensive-ci.yml" ]; then
    print_success "Comprehensive CI workflow found"
    
    # Check if it includes all test types
    comprehensive_workflow="$WORKFLOWS_DIR/comprehensive-ci.yml"
    
    test_types=("unit-tests" "e2e-tests" "python-tests" "integration-tests" "performance-tests")
    for test_type in "${test_types[@]}"; do
        if grep -q "$test_type" "$comprehensive_workflow"; then
            print_success "Test type '$test_type' found in comprehensive workflow"
        else
            print_warning "Test type '$test_type' missing from comprehensive workflow"
        fi
    done
else
    print_error "Comprehensive CI workflow not found"
fi

# Check package.json for test scripts
if [ -f "package.json" ]; then
    print_success "package.json found"
    
    required_scripts=("test:unit" "test:e2e" "test:coverage" "build" "check")
    for script in "${required_scripts[@]}"; do
        if grep -q "\"$script\":" package.json; then
            print_success "npm script '$script' found"
        else
            print_warning "npm script '$script' missing from package.json"
        fi
    done
else
    print_error "package.json not found"
fi

# Check for Python requirements
if [ -f "python_backend/requirements.txt" ]; then
    print_success "Python requirements.txt found"
else
    print_warning "Python requirements.txt not found"
fi

# Check for test data configuration
if [ -f "test-data-config.json" ]; then
    print_success "Test data configuration found"
else
    print_warning "Test data configuration not found"
fi

# Summary
echo "======================================"
echo "📊 Validation Summary:"
echo "  - Workflow files validated: $(echo "$WORKFLOW_FILES" | wc -l)"
echo "  - Errors: $ERRORS"
echo "  - Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    print_success "All workflows passed validation! 🎉"
    
    if [ $WARNINGS -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}💡 Consider addressing the warnings above for optimal CI/CD setup.${NC}"
    fi
    
    echo ""
    echo "🚀 Your GitHub Actions workflows are ready to run!"
    echo "   - Push to main/develop to trigger comprehensive tests"
    echo "   - Create PR to trigger smoke tests and full validation"
    echo "   - Manual workflow dispatch available for custom test runs"
    
    exit 0
else
    print_error "Validation failed with $ERRORS error(s)"
    echo ""
    echo "🔧 Please fix the errors above before using the workflows."
    exit 1
fi