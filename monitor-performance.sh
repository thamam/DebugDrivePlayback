#!/bin/bash

echo "🚀 Performance Monitoring - Debug Player Framework"
echo "=================================================="

# Function to check browser performance
check_browser_performance() {
    echo "📊 Checking timeline responsiveness..."
    
    # Monitor API response times from server logs
    echo "Recent API response times:"
    tail -10 server.log | grep "POST /api/python/data/timestamp" | awk '{print $NF}' | while read line; do
        # Extract milliseconds from "Xms" format
        ms=$(echo "$line" | grep -o '[0-9]*ms' | grep -o '[0-9]*')
        if [ ! -z "$ms" ]; then
            echo "  $ms ms"
        fi
    done
    
    echo ""
    echo "✓ API responses should be under 50ms for good performance"
    echo "✓ Timeline should respond immediately to user interaction"
}

# Function to check memory usage
check_memory_usage() {
    echo "🧠 Checking memory usage..."
    
    # Check if any Node processes are using excessive memory
    ps aux | grep -E "(tsx|node)" | grep -v grep | while read line; do
        mem=$(echo "$line" | awk '{print $6}')
        cmd=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}')
        if [ ! -z "$mem" ] && [ "$mem" -gt 500000 ]; then  # Over 500MB
            echo "⚠️ High memory usage: ${mem}KB - $cmd"
        fi
    done
    
    echo "✓ Memory usage monitoring active"
}

# Function to measure data loading performance
measure_data_loading() {
    echo "📈 Measuring data loading performance..."
    
    start_time=$(date +%s%N)
    
    # Test data loading endpoint
    response=$(curl -s -X POST "http://localhost:5000/api/python/load-data" \
        -H "Content-Type: application/json" \
        -d '{"filePath":"/home/thh3/data/trips/2025-07-15T12_06_02","pluginType":"vehicle_data"}')
    
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✓ Data loading completed in ${duration}ms"
        
        # Extract metrics from response
        data_points=$(echo "$response" | grep -o '"data_points":[0-9]*' | cut -d: -f2)
        echo "✓ Loaded $data_points data points"
        
        if [ "$duration" -lt 15000 ]; then
            echo "✅ GOOD: Data loading under 15 seconds"
        else
            echo "⚠️ SLOW: Data loading took ${duration}ms (over 15s)"
        fi
    else
        echo "❌ Data loading failed"
    fi
}

# Function to test timeline responsiveness
test_timeline_responsiveness() {
    echo "⏱️ Testing timeline responsiveness..."
    
    # Test signal data fetching speed
    start_time=$(date +%s%N)
    
    response=$(curl -s -X POST "http://localhost:5000/api/python/data/timestamp" \
        -H "Content-Type: application/json" \
        -d '{"timestamp":1752570370,"signals":["speed","steering","brake"]}')
    
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if echo "$response" | grep -q '"data"'; then
        echo "✓ Signal data fetch completed in ${duration}ms"
        
        if [ "$duration" -lt 50 ]; then
            echo "✅ EXCELLENT: Signal fetching under 50ms"
        elif [ "$duration" -lt 100 ]; then
            echo "✅ GOOD: Signal fetching under 100ms"
        else
            echo "⚠️ SLOW: Signal fetching took ${duration}ms"
        fi
    else
        echo "❌ Signal data fetching failed"
    fi
}

# Main execution
main() {
    echo "Starting performance monitoring..."
    echo ""
    
    check_browser_performance
    echo ""
    
    check_memory_usage
    echo ""
    
    measure_data_loading
    echo ""
    
    test_timeline_responsiveness
    echo ""
    
    echo "🎯 Performance Summary"
    echo "====================="
    echo "✓ Performance fixes applied:"
    echo "  - Data processing limited to 1000 sample points (was 767k)"
    echo "  - Eliminated expensive Math.random() and Math.sin() calculations"
    echo "  - Reduced timeline debouncing to 50ms for better responsiveness"
    echo ""
    echo "📋 Expected improvements:"
    echo "  - Timeline should respond immediately"
    echo "  - No more 3-5 second delays between interactions"
    echo "  - Browser should remain responsive during data loading"
    echo "  - Memory usage should be stable"
    echo ""
    echo "🔧 If performance is still poor, check:"
    echo "  1. Browser developer tools for JavaScript errors"
    echo "  2. Network tab for API response times"
    echo "  3. Performance tab for rendering bottlenecks"
    echo "  4. Memory tab for memory leaks"
}

main "$@"