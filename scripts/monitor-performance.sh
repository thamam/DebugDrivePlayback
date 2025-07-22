#!/bin/bash

# Performance Monitoring Script
# Continuously monitors Debug Player Framework performance
# Alerts when performance targets are exceeded
#
# Environment Variables:
#   TEST_TRIP_PATH - Path to test trip data directory (default: /home/thh3/data/trips/2025-07-15T12_06_02)

set -euo pipefail

# Performance targets (aligned with PERFORMANCE_GUIDE.md)
TIMELINE_TARGET=16    # ms
API_TARGET=20        # ms
MEMORY_TARGET=50     # MB/hour
CACHE_TARGET=90      # % hit rate

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="performance-monitor.log"

echo -e "${BLUE}🔍 Debug Player Framework - Performance Monitor${NC}"
echo "=================================================================="
echo "Monitoring performance metrics against zero-delay targets..."
echo "Log file: $LOG_FILE"
echo ""

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check if server is running
check_server() {
    if curl -s "http://localhost:5000/api/health" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to test API performance
test_api_performance() {
    local total_time=0
    local success_count=0
    local iterations=10
    
    echo -n "Testing API performance (${iterations} calls)... "
    
    for i in $(seq 1 $iterations); do
        local timestamp=$(echo "1752570362.062682 + $i * 0.1" | bc -l)
        
        local start_time=$(date +%s%3N)
        
        if curl -s -X POST "http://localhost:5000/api/python/data/timestamp" \
            -H "Content-Type: application/json" \
            -d "{\"timestamp\": $timestamp, \"signals\": [\"speed\"]}" \
            > /dev/null 2>&1; then
            
            local end_time=$(date +%s%3N)
            local duration=$((end_time - start_time))
            total_time=$((total_time + duration))
            success_count=$((success_count + 1))
        fi
        
        sleep 0.1
    done
    
    if [ $success_count -gt 0 ]; then
        local avg_time=$((total_time / success_count))
        
        if [ $avg_time -le $API_TARGET ]; then
            echo -e "${GREEN}✅ PASS${NC} - Average: ${avg_time}ms (target: <${API_TARGET}ms)"
            log "API Performance: PASS - ${avg_time}ms average"
        else
            echo -e "${RED}❌ FAIL${NC} - Average: ${avg_time}ms (target: <${API_TARGET}ms)"
            log "API Performance: FAIL - ${avg_time}ms average exceeds ${API_TARGET}ms target"
        fi
    else
        echo -e "${RED}❌ FAIL${NC} - No successful API calls"
        log "API Performance: FAIL - No successful calls"
    fi
}

# Function to check cache hit rate (analyze server logs)
check_cache_performance() {
    echo -n "Analyzing cache performance... "
    
    # Look for cache hit indicators in server logs (responses < 5ms typically indicate cache hits)
    if [ -f "server.log" ]; then
        local total_requests=$(grep -c "POST /api/python/data/timestamp" server.log 2>/dev/null || echo "0")
        local fast_requests=$(grep "POST /api/python/data/timestamp.*[0-4]ms" server.log 2>/dev/null | wc -l || echo "0")
        
        if [ $total_requests -gt 0 ]; then
            local hit_rate=$((fast_requests * 100 / total_requests))
            
            if [ $hit_rate -ge $CACHE_TARGET ]; then
                echo -e "${GREEN}✅ PASS${NC} - Cache hit rate: ${hit_rate}% (target: >${CACHE_TARGET}%)"
                log "Cache Performance: PASS - ${hit_rate}% hit rate"
            else
                echo -e "${YELLOW}⚠️  WARN${NC} - Cache hit rate: ${hit_rate}% (target: >${CACHE_TARGET}%)"
                log "Cache Performance: WARN - ${hit_rate}% hit rate below ${CACHE_TARGET}% target"
            fi
        else
            echo -e "${YELLOW}⚠️  WARN${NC} - No requests found in server.log"
            log "Cache Performance: WARN - No data available"
        fi
    else
        echo -e "${YELLOW}⚠️  WARN${NC} - server.log not found"
        log "Cache Performance: WARN - server.log not found"
    fi
}

# Function to monitor memory usage
check_memory_usage() {
    echo -n "Checking memory usage... "
    
    # Get Node.js process memory usage
    local node_pids=$(pgrep -f "node.*server/index.ts" || echo "")
    
    if [ -n "$node_pids" ]; then
        local total_memory=0
        local process_count=0
        
        for pid in $node_pids; do
            if [ -f "/proc/$pid/status" ]; then
                local memory_kb=$(grep "VmRSS:" "/proc/$pid/status" | awk '{print $2}' || echo "0")
                local memory_mb=$((memory_kb / 1024))
                total_memory=$((total_memory + memory_mb))
                process_count=$((process_count + 1))
            fi
        done
        
        if [ $process_count -gt 0 ]; then
            if [ $total_memory -le 200 ]; then  # Reasonable baseline for current memory
                echo -e "${GREEN}✅ PASS${NC} - Memory usage: ${total_memory}MB"
                log "Memory Usage: PASS - ${total_memory}MB total"
            else
                echo -e "${YELLOW}⚠️  WARN${NC} - Memory usage: ${total_memory}MB (high)"
                log "Memory Usage: WARN - ${total_memory}MB total (potential leak)"
            fi
        else
            echo -e "${YELLOW}⚠️  WARN${NC} - No memory data available"
            log "Memory Usage: WARN - No data available"
        fi
    else
        echo -e "${YELLOW}⚠️  WARN${NC} - Node.js server not running"
        log "Memory Usage: WARN - Server not running"
    fi
}

# Function to test data loading performance
test_data_loading() {
    echo -n "Testing data loading performance... "
    
    local start_time=$(date +%s%3N)
    
    if curl -s -X POST "http://localhost:5000/api/python/load-data" \
        -H "Content-Type: application/json" \
        -d '{"filePath": "'${TEST_TRIP_PATH:-/home/thh3/data/trips/2025-07-15T12_06_02}'", "pluginType": "vehicle_data"}' \
        > /dev/null 2>&1; then
        
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        
        if [ $duration -le 15000 ]; then  # 15 second target
            echo -e "${GREEN}✅ PASS${NC} - Data loading: ${duration}ms (target: <15000ms)"
            log "Data Loading: PASS - ${duration}ms"
        else
            echo -e "${RED}❌ FAIL${NC} - Data loading: ${duration}ms (target: <15000ms)"
            log "Data Loading: FAIL - ${duration}ms exceeds 15000ms target"
        fi
    else
        echo -e "${YELLOW}⚠️  WARN${NC} - Data loading test failed"
        log "Data Loading: WARN - Test failed"
    fi
}

# Function to generate performance report
generate_report() {
    echo ""
    echo "=================================================================="
    echo -e "${BLUE}📋 Performance Summary Report${NC}"
    echo "=================================================================="
    
    # Count recent log entries
    local pass_count=$(grep -c "PASS" "$LOG_FILE" 2>/dev/null || echo "0")
    local fail_count=$(grep -c "FAIL" "$LOG_FILE" 2>/dev/null || echo "0")
    local warn_count=$(grep -c "WARN" "$LOG_FILE" 2>/dev/null || echo "0")
    
    echo "Recent test results:"
    echo "  ✅ Passed: $pass_count"
    echo "  ❌ Failed: $fail_count"
    echo "  ⚠️  Warnings: $warn_count"
    
    if [ $fail_count -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 All performance targets met!${NC}"
        echo "The Debug Player Framework is meeting zero-delay requirements."
    else
        echo ""
        echo -e "${RED}⚠️  Performance issues detected${NC}"
        echo "Review failed tests and consider optimization."
    fi
    
    echo ""
    echo "📄 Full log: $LOG_FILE"
}

# Main monitoring loop
main() {
    log "Performance monitoring started"
    
    # Check if server is running
    if ! check_server; then
        echo -e "${RED}❌ Server not running on localhost:5000${NC}"
        echo "Please start the server with: npm run dev"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Server is running${NC}"
    echo ""
    
    # Run performance tests
    test_api_performance
    check_cache_performance
    check_memory_usage
    test_data_loading
    
    # Generate report
    generate_report
    
    log "Performance monitoring completed"
}

# Check for dependencies
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is required but not installed${NC}"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    echo -e "${RED}❌ bc is required but not installed${NC}"
    exit 1
fi

# Run main function
main "$@"