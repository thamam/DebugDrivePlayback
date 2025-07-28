#!/bin/bash

# Debug Player Framework - Comprehensive Test Runner
# This script runs ALL tests in the codebase, including those not in the main test suite

set -e  # Exit on any error

echo "=================================================="
echo "🧪 Debug Player Framework - COMPREHENSIVE Test Runner"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Results tracking
declare -A TEST_RESULTS
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${YELLOW}Running: ${test_name}${NC}"
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: ${test_name}${NC}"
        TEST_RESULTS["$test_name"]="PASSED"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: ${test_name}${NC}"
        TEST_RESULTS["$test_name"]="FAILED"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Check if services are running
check_services() {
    echo "🔍 Checking required services..."
    
    EXPRESS_RUNNING=false
    PYTHON_RUNNING=false
    
    # Check Express server
    if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Express server is running${NC}"
        EXPRESS_RUNNING=true
    else
        echo -e "${YELLOW}⚠ Express server not running - integration tests will be skipped${NC}"
        echo "  Start with: npm run dev"
    fi
    
    # Check Python backend
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Python backend is running${NC}"
        PYTHON_RUNNING=true
    else
        echo -e "${YELLOW}⚠ Python backend not running - integration tests will be skipped${NC}"
        echo "  Start with: cd python_backend && uvicorn main:app --reload"
    fi
    
    echo ""
}

# Function to run a test conditionally
run_test_conditional() {
    local test_name="$1"
    local test_command="$2"
    local condition="$3"
    
    if [ "$condition" = "true" ]; then
        run_test "$test_name" "$test_command"
    else
        echo -e "\n${YELLOW}Skipping: ${test_name} (dependencies not available)${NC}"
        TEST_RESULTS["$test_name"]="SKIPPED"
    fi
}

# Main test execution
main() {
    check_services
    
    echo "📋 Test Inventory:"
    echo "1. Unit Tests (Jest)"
    echo "2. E2E Tests (Playwright)"
    echo "3. Python Backend Tests"
    echo "4. Frontend Integration Tests"
    echo "5. Full Integration Tests"
    echo "6. Performance Tests"
    echo "7. Basic Flow Tests"
    echo ""
    
    # 1. Unit Tests (Jest)
    run_test "Unit Tests (Jest)" "npm run test:unit -- --silent"
    
    # 2. E2E Tests (Playwright)
    run_test "E2E Tests (Playwright)" "npm run test:e2e -- --reporter=dot"
    
    # 3. Python Backend Tests
    run_test "Python Backend Tests" "cd python_backend && python test_backend.py"
    
    # 4. Frontend Integration Tests (requires Express server)
    BOTH_RUNNING=$( [ "$EXPRESS_RUNNING" = "true" ] && [ "$PYTHON_RUNNING" = "true" ] && echo "true" || echo "false" )
    run_test_conditional "Frontend Integration Tests" "node test-frontend-integration.cjs" "$BOTH_RUNNING"
    
    # 5. Full Integration Tests (requires both servers)
    run_test_conditional "Integration Flow Tests" "python test-integration-flow.py" "$BOTH_RUNNING"
    
    # 6. Performance Tests (requires Express server)
    run_test_conditional "Performance Tests" "node test-performance.cjs" "$EXPRESS_RUNNING"
    
    # 7. Basic Flow Tests
    run_test "Basic Flow Tests" "python test_basic_flows.py"
    
    # Print summary
    echo ""
    echo "=================================================="
    echo "📊 COMPREHENSIVE TEST SUMMARY"
    echo "=================================================="
    echo ""
    echo "Total Tests Run: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    echo ""
    echo "Detailed Results:"
    echo "-----------------"
    
    for test_name in "${!TEST_RESULTS[@]}"; do
        result="${TEST_RESULTS[$test_name]}"
        if [ "$result" = "PASSED" ]; then
            echo -e "${GREEN}✅ $test_name: PASSED${NC}"
        elif [ "$result" = "SKIPPED" ]; then
            echo -e "${YELLOW}⏭️ $test_name: SKIPPED${NC}"
        else
            echo -e "${RED}❌ $test_name: FAILED${NC}"
        fi
    done
    
    echo ""
    
    # Generate test report
    REPORT_FILE="test-reports/comprehensive-test-report-$(date +%Y%m%d-%H%M%S).txt"
    mkdir -p test-reports
    
    {
        echo "Debug Player Framework - Comprehensive Test Report"
        echo "Generated: $(date)"
        echo ""
        echo "Summary:"
        echo "- Total Tests: $TOTAL_TESTS"
        echo "- Passed: $PASSED_TESTS"
        echo "- Failed: $FAILED_TESTS"
        echo ""
        echo "Results:"
        for test_name in "${!TEST_RESULTS[@]}"; do
            echo "- $test_name: ${TEST_RESULTS[$test_name]}"
        done
    } > "$REPORT_FILE"
    
    echo "📄 Test report saved to: $REPORT_FILE"
    echo ""
    
    # Exit code based on failures
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  Some tests failed. Please check the failures above.${NC}"
        exit 1
    fi
}

# Run main function
main