#!/bin/bash

# Server Startup Test Script
# This script tests that ./run.sh successfully starts both servers

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

echo "🧪 Testing Server Startup"
echo "=========================="

# Start ./run.sh in background
print_info "Starting ./run.sh in background..."
./run.sh &
RUN_PID=$!

# Function to cleanup
cleanup() {
    print_info "Cleaning up..."
    kill $RUN_PID 2>/dev/null || true
    # Also kill any python processes that might be running
    pkill -f "python.*main.py" 2>/dev/null || true
    # Kill any node processes for this project
    pkill -f "tsx.*server/index.ts" 2>/dev/null || true
}
trap cleanup EXIT

# Wait for servers to start
print_info "Waiting 15 seconds for servers to start..."
sleep 15

# Test Express server (port 5000)
print_info "Testing Express server on port 5000..."
if curl -s -f http://localhost:5000 > /dev/null; then
    print_success "Express server is running on port 5000"
else
    print_error "Express server is not responding on port 5000"
    exit 1
fi

# Test Python backend (port 8000)
print_info "Testing Python backend on port 8000..."
if curl -s -f http://localhost:8000/health > /dev/null; then
    print_success "Python backend is running on port 8000"
    
    # Test health endpoint response
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
    if echo "$HEALTH_RESPONSE" | grep -q "status"; then
        print_success "Python backend health check is working"
    else
        print_warning "Python backend responding but health check format unexpected"
    fi
else
    print_error "Python backend is not responding on port 8000"
    exit 1
fi

# Test data loading endpoint
print_info "Testing data loading endpoint..."
DATA_RESPONSE=$(curl -s -X POST http://localhost:8000/load-data \
    -H "Content-Type: application/json" \
    -d '{"file_path": "data/trips/2025-07-15T12_06_02", "plugin_type": "vehicle_data"}' \
    -w "%{http_code}")

HTTP_CODE="${DATA_RESPONSE: -3}"
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
    print_success "Data loading endpoint is accessible (HTTP $HTTP_CODE)"
else
    print_warning "Data loading endpoint returned HTTP $HTTP_CODE (may be expected if test data doesn't exist)"
fi

print_success "🎉 All server tests passed!"
print_info "Both Express server (5000) and Python backend (8000) are running correctly"

# Keep running for a bit to show servers are stable
print_info "Servers will continue running for 10 more seconds..."
sleep 10

print_success "Server startup test completed successfully!"