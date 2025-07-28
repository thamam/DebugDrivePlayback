#!/bin/bash
set -e

echo "🧪 Debug Player Framework - Complete Integration Test Suite"
echo "============================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
BACKEND_TESTS_PASSED=false
FRONTEND_TESTS_PASSED=false

# Function to check if a service is running
check_service() {
    local url=$1
    local name=$2
    local timeout=${3:-5}
    
    echo -n "🔍 Checking $name... "
    
    if curl -s --max-time $timeout "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=${3:-30}
    local attempt=1
    
    echo "⏳ Waiting for $name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 2 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name is ready${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 1
        ((attempt++))
    done
    
    echo -e "${RED}✗ $name failed to start within $max_attempts seconds${NC}"
    return 1
}

# Function to start services if needed
start_services() {
    echo "🚀 Starting services..."
    echo ""
    
    # Check if Express server is running
    if ! check_service "http://localhost:5000/api/health" "Express Server"; then
        echo "⚡ Starting Express server..."
        npm run dev > /dev/null 2>&1 &
        EXPRESS_PID=$!
        
        if wait_for_service "http://localhost:5000/api/health" "Express Server"; then
            echo -e "${GREEN}✓ Express server started (PID: $EXPRESS_PID)${NC}"
        else
            echo -e "${RED}✗ Failed to start Express server${NC}"
            exit 1
        fi
    fi
    
    # Check if Python backend is running
    if ! check_service "http://localhost:8000/health" "Python Backend"; then
        echo "⚡ Starting Python backend..."
        cd python_backend
        uvicorn main:app --reload --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
        PYTHON_PID=$!
        cd ..
        
        if wait_for_service "http://localhost:8000/health" "Python Backend"; then
            echo -e "${GREEN}✓ Python backend started (PID: $PYTHON_PID)${NC}"
        else
            echo -e "${RED}✗ Failed to start Python backend${NC}"
            exit 1
        fi
    fi
    
    echo ""
}

# Function to run backend integration tests
run_backend_tests() {
    echo "🧪 Running Backend Integration Tests..."
    echo "-------------------------------------"
    
    if python3 test-integration-flow.py; then
        echo -e "${GREEN}✅ Backend integration tests PASSED${NC}"
        BACKEND_TESTS_PASSED=true
    else
        echo -e "${RED}❌ Backend integration tests FAILED${NC}"
        BACKEND_TESTS_PASSED=false
    fi
    
    echo ""
}

# Function to run frontend integration tests
run_frontend_tests() {
    echo "🖥️  Running Frontend Integration Tests..."
    echo "----------------------------------------"
    
    # Check if Playwright is installed
    if ! command -v npx > /dev/null || ! npx playwright --version > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Playwright not found, installing...${NC}"
        npx playwright install chromium
    fi
    
    if node test-frontend-integration.js; then
        echo -e "${GREEN}✅ Frontend integration tests PASSED${NC}"
        FRONTEND_TESTS_PASSED=true
    else
        echo -e "${RED}❌ Frontend integration tests FAILED${NC}"
        FRONTEND_TESTS_PASSED=false
    fi
    
    echo ""
}

# Function to run specific test scenarios
run_test_scenarios() {
    echo "🎯 Running Specific Test Scenarios..."
    echo "------------------------------------"
    
    # Test 1: Data Loading Flow
    echo "Scenario 1: Complete Data Loading Flow"
    echo "- Loading trip data from absolute path"
    echo "- Creating session"
    echo "- Loading trajectory data"
    echo "- Fetching signal data at multiple timestamps"
    
    if python3 -c "
from test_integration_flow import TestIntegrationFlow
import sys

try:
    test = TestIntegrationFlow()
    test.setup_class()
    test.test_01_backends_are_running()
    test.test_02_load_trip_data()
    test.test_03_create_session()
    test.test_04_load_trajectory_data()
    test.test_05_fetch_signal_data_at_timestamp()
    print('✅ Data Loading Flow: PASSED')
except Exception as e:
    print(f'❌ Data Loading Flow: FAILED - {e}')
    sys.exit(1)
"; then
        echo -e "${GREEN}✓ Data Loading Flow completed successfully${NC}"
    else
        echo -e "${RED}✗ Data Loading Flow failed${NC}"
    fi
    
    echo ""
    
    # Test 2: Session Navigation Flow
    echo "Scenario 2: Session Navigation Flow"
    echo "- Trip loader page interaction"
    echo "- Session creation and navigation"
    echo "- Debug player initialization"
    echo "- Timeline interaction"
    
    if node -e "
const FrontendIntegrationTests = require('./test-frontend-integration.js');
const tests = new FrontendIntegrationTests();

tests.runAllTests().then(results => {
    const criticalTests = ['loadData', 'startAnalysis', 'timeline'];
    const passed = criticalTests.every(test => results[test] === true);
    
    if (passed) {
        console.log('✅ Session Navigation Flow: PASSED');
        process.exit(0);
    } else {
        console.log('❌ Session Navigation Flow: FAILED');
        process.exit(1);
    }
}).catch(err => {
    console.log('❌ Session Navigation Flow: ERROR -', err.message);
    process.exit(1);
});
"; then
        echo -e "${GREEN}✓ Session Navigation Flow completed successfully${NC}"
    else
        echo -e "${RED}✗ Session Navigation Flow failed${NC}"
    fi
    
    echo ""
}

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    
    if [ ! -z "$EXPRESS_PID" ]; then
        echo "Stopping Express server (PID: $EXPRESS_PID)"
        kill $EXPRESS_PID > /dev/null 2>&1 || true
    fi
    
    if [ ! -z "$PYTHON_PID" ]; then
        echo "Stopping Python backend (PID: $PYTHON_PID)"
        kill $PYTHON_PID > /dev/null 2>&1 || true
    fi
    
    echo "Cleanup completed"
}

# Main execution
main() {
    # Set up trap for cleanup
    trap cleanup EXIT INT TERM
    
    # Start services
    start_services
    
    # Run all test suites
    run_backend_tests
    run_frontend_tests
    run_test_scenarios
    
    # Final summary
    echo "📊 FINAL TEST SUMMARY"
    echo "===================="
    
    if [ "$BACKEND_TESTS_PASSED" = true ]; then
        echo -e "${GREEN}✅ Backend Integration Tests: PASSED${NC}"
    else
        echo -e "${RED}❌ Backend Integration Tests: FAILED${NC}"
    fi
    
    if [ "$FRONTEND_TESTS_PASSED" = true ]; then
        echo -e "${GREEN}✅ Frontend Integration Tests: PASSED${NC}"
    else
        echo -e "${RED}❌ Frontend Integration Tests: FAILED${NC}"
    fi
    
    echo ""
    
    if [ "$BACKEND_TESTS_PASSED" = true ] && [ "$FRONTEND_TESTS_PASSED" = true ]; then
        echo -e "${GREEN}🎉 ALL INTEGRATION TESTS PASSED!${NC}"
        echo -e "${GREEN}   The complete data flow is working correctly!${NC}"
        echo ""
        echo "What this means:"
        echo "• Trip data loads successfully from absolute paths"
        echo "• Sessions are created and navigated properly"
        echo "• Timeline slider triggers real signal data fetching"
        echo "• No demo mode fallbacks are hiding real errors"
        echo "• Both frontend and backend integration work end-to-end"
        exit 0
    else
        echo -e "${RED}❌ SOME INTEGRATION TESTS FAILED${NC}"
        echo -e "${RED}   Manual testing should not be needed once these pass${NC}"
        echo ""
        echo "These tests will catch the issues you've been finding manually:"
        echo "• Session ID not being passed correctly"
        echo "• Signal data not being fetched on timeline changes"
        echo "• Visualization panels not displaying data"
        echo "• Database connection issues"
        exit 1
    fi
}

# Run main function
main "$@"
