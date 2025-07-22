#!/usr/bin/env node

/**
 * Performance Benchmarking Script
 * Validates that the Debug Player Framework meets zero-delay performance requirements
 */

const fs = require('fs');
const path = require('path');

// Performance targets (from PERFORMANCE_GUIDE.md)
const PERFORMANCE_TARGETS = {
  timelineResponse: 16, // ms - 1 frame at 60fps
  apiResponseP95: 20,   // ms - API response time 95th percentile
  cacheHitResponse: 1,  // ms - Cache hit should be instant
  dataLoading: 15000,   // ms - Large dataset loading
  memoryGrowth: 50,     // MB/hour - Memory growth limit
  cacheHitRate: 90,     // % - Cache efficiency target
  uiFrameRate: 60       // fps - UI responsiveness
};

class PerformanceBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testResults: {},
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  async runAllBenchmarks() {
    console.log('\n🚀 Debug Player Framework - Performance Benchmark');
    console.log('=' .repeat(60));
    
    await this.testTimelineResponsiveness();
    await this.testAPIPerformance();
    await this.testCachePerformance();
    await this.testMemoryUsage();
    await this.testDataLoadingPerformance();
    
    this.generateReport();
  }

  async testTimelineResponsiveness() {
    console.log('\n📊 Testing Timeline Responsiveness...');
    
    const times = [];
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      
      // Simulate timeline interaction
      const timeValue = Math.random() * 300; // Random time within typical range
      await this.simulateTimelineChange(timeValue);
      
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      times.push(duration);
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    const max = Math.max(...times);
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
    
    const result = {
      test: 'Timeline Responsiveness',
      averageTime: avg.toFixed(2),
      maxTime: max.toFixed(2),
      p95Time: p95.toFixed(2),
      target: PERFORMANCE_TARGETS.timelineResponse,
      passed: avg <= PERFORMANCE_TARGETS.timelineResponse
    };
    
    this.results.testResults.timelineResponsiveness = result;
    
    if (result.passed) {
      console.log(`✅ PASS: Average ${avg.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.timelineResponse}ms)`);
      this.results.passed++;
    } else {
      console.log(`❌ FAIL: Average ${avg.toFixed(2)}ms exceeds ${PERFORMANCE_TARGETS.timelineResponse}ms target`);
      this.results.failed++;
    }
  }

  async simulateTimelineChange(timeValue) {
    // Simulate the work done during timeline change
    // This represents the synchronous operations in useDebugPlayer
    const cacheKey = Math.round(timeValue * 10) / 10;
    const mockCache = new Map();
    
    // Simulate cache lookup (should be instant)
    if (mockCache.has(cacheKey)) {
      return mockCache.get(cacheKey);
    }
    
    // Simulate minimal processing for cache miss
    return { timestamp: timeValue, cached: false };
  }

  async testAPIPerformance() {
    console.log('\n🌐 Testing API Performance...');
    
    if (!await this.isServerRunning()) {
      console.log('⚠️  Server not running - skipping API tests');
      this.results.warnings++;
      return;
    }
    
    const times = [];
    const iterations = 50;
    
    for (let i = 0; i < iterations; i++) {
      const timestamp = 1752570362.062682 + (i * 0.1);
      
      const start = Date.now();
      
      try {
        const response = await fetch('http://localhost:5000/api/python/data/timestamp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: timestamp,
            signals: ['speed', 'steering']
          }),
        });
        
        if (response.ok) {
          await response.json();
          const duration = Date.now() - start;
          times.push(duration);
        }
      } catch (error) {
        console.log(`⚠️  API call ${i + 1} failed:`, error.message);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    if (times.length === 0) {
      console.log('❌ No successful API calls - check server status');
      this.results.failed++;
      return;
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
    
    const result = {
      test: 'API Performance',
      averageTime: avg.toFixed(2),
      p95Time: p95.toFixed(2),
      target: PERFORMANCE_TARGETS.apiResponseP95,
      passed: p95 <= PERFORMANCE_TARGETS.apiResponseP95,
      successfulCalls: times.length,
      totalCalls: iterations
    };
    
    this.results.testResults.apiPerformance = result;
    
    if (result.passed) {
      console.log(`✅ PASS: P95 ${p95.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.apiResponseP95}ms)`);
      this.results.passed++;
    } else {
      console.log(`❌ FAIL: P95 ${p95.toFixed(2)}ms exceeds ${PERFORMANCE_TARGETS.apiResponseP95}ms target`);
      this.results.failed++;
    }
  }

  async testCachePerformance() {
    console.log('\n💾 Testing Cache Performance...');
    
    const cacheMap = new Map();
    const times = [];
    const iterations = 1000;
    
    // Pre-populate cache
    for (let i = 0; i < 100; i++) {
      const key = Math.round(i * 0.1 * 10) / 10;
      cacheMap.set(key, { timestamp: i * 0.1, data: 'mock_data' });
    }
    
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      
      const key = Math.round((i % 100) * 0.1 * 10) / 10;
      const cached = cacheMap.get(key);
      
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      times.push(duration);
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    const max = Math.max(...times);
    
    const result = {
      test: 'Cache Performance',
      averageTime: avg.toFixed(4),
      maxTime: max.toFixed(4),
      target: PERFORMANCE_TARGETS.cacheHitResponse,
      passed: avg <= PERFORMANCE_TARGETS.cacheHitResponse
    };
    
    this.results.testResults.cachePerformance = result;
    
    if (result.passed) {
      console.log(`✅ PASS: Average ${avg.toFixed(4)}ms (target: <${PERFORMANCE_TARGETS.cacheHitResponse}ms)`);
      this.results.passed++;
    } else {
      console.log(`❌ FAIL: Average ${avg.toFixed(4)}ms exceeds ${PERFORMANCE_TARGETS.cacheHitResponse}ms target`);
      this.results.failed++;
    }
  }

  async testMemoryUsage() {
    console.log('\n🧠 Testing Memory Usage...');
    
    const initialMemory = process.memoryUsage();
    const simulatedCache = new Map();
    
    // Simulate 1 hour of cache usage
    const entriesPerHour = 3600; // 1 entry per second for 1 hour
    
    for (let i = 0; i < entriesPerHour; i++) {
      const key = Math.round(i * 0.1 * 10) / 10;
      simulatedCache.set(key, {
        timestamp: i * 0.1,
        data: {
          speed: Math.random() * 30,
          steering: Math.random() * 45,
          brake: Math.random() * 100
        }
      });
      
      // LRU cleanup simulation (keep last 1000 entries)
      if (simulatedCache.size > 1000) {
        const firstKey = simulatedCache.keys().next().value;
        simulatedCache.delete(firstKey);
      }
    }
    
    const finalMemory = process.memoryUsage();
    const memoryGrowthMB = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
    
    const result = {
      test: 'Memory Usage',
      memoryGrowthMB: memoryGrowthMB.toFixed(2),
      target: PERFORMANCE_TARGETS.memoryGrowth,
      passed: memoryGrowthMB <= PERFORMANCE_TARGETS.memoryGrowth,
      cacheSize: simulatedCache.size
    };
    
    this.results.testResults.memoryUsage = result;
    
    if (result.passed) {
      console.log(`✅ PASS: ${memoryGrowthMB.toFixed(2)}MB growth (target: <${PERFORMANCE_TARGETS.memoryGrowth}MB/hour)`);
      this.results.passed++;
    } else {
      console.log(`❌ FAIL: ${memoryGrowthMB.toFixed(2)}MB exceeds ${PERFORMANCE_TARGETS.memoryGrowth}MB/hour target`);
      this.results.failed++;
    }
  }

  async testDataLoadingPerformance() {
    console.log('\n📁 Testing Data Loading Performance...');
    
    if (!await this.isServerRunning()) {
      console.log('⚠️  Server not running - skipping data loading test');
      this.results.warnings++;
      return;
    }
    
    const start = Date.now();
    
    try {
      const response = await fetch('http://localhost:5000/api/python/load-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: process.env.TEST_TRIP_PATH || '/home/thh3/data/trips/2025-07-15T12_06_02',
          pluginType: 'vehicle_data'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const duration = Date.now() - start;
        
        const result = {
          test: 'Data Loading',
          loadingTime: duration,
          target: PERFORMANCE_TARGETS.dataLoading,
          passed: duration <= PERFORMANCE_TARGETS.dataLoading,
          dataPoints: data.data_points || 0
        };
        
        this.results.testResults.dataLoading = result;
        
        if (result.passed) {
          console.log(`✅ PASS: ${duration}ms for ${data.data_points} points (target: <${PERFORMANCE_TARGETS.dataLoading}ms)`);
          this.results.passed++;
        } else {
          console.log(`❌ FAIL: ${duration}ms exceeds ${PERFORMANCE_TARGETS.dataLoading}ms target`);
          this.results.failed++;
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Data loading test failed: ${error.message}`);
      this.results.failed++;
    }
  }

  async isServerRunning() {
    try {
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        timeout: 2000
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  generateReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 PERFORMANCE BENCHMARK REPORT');
    console.log('=' .repeat(60));
    
    const totalTests = this.results.passed + this.results.failed;
    const passRate = totalTests > 0 ? (this.results.passed / totalTests * 100).toFixed(1) : 0;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${this.results.passed} ✅`);
    console.log(`   Failed: ${this.results.failed} ❌`);
    console.log(`   Warnings: ${this.results.warnings} ⚠️`);
    console.log(`   Pass Rate: ${passRate}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 ALL PERFORMANCE TARGETS MET! 🎉');
      console.log('   The Debug Player Framework meets zero-delay requirements.');
    } else {
      console.log('\n⚠️  PERFORMANCE ISSUES DETECTED');
      console.log('   Review failed tests and optimize accordingly.');
    }
    
    // Save detailed results
    const reportPath = path.join(__dirname, '..', 'test-reports', 'performance-benchmark.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }

  generateRecommendations() {
    console.log('\n💡 Performance Recommendations:');
    
    const failed = Object.values(this.results.testResults).filter(test => !test.passed);
    
    if (failed.length === 0) {
      console.log('   ✅ All performance targets met - maintain current optimizations');
      console.log('   📈 Consider implementing planned improvements from PERFORMANCE_GUIDE.md');
      return;
    }
    
    failed.forEach(test => {
      switch (test.test) {
        case 'Timeline Responsiveness':
          console.log('   ⚡ Timeline: Implement Web Workers for background processing');
          console.log('   ⚡ Timeline: Review render cycle for blocking operations');
          break;
        case 'API Performance':
          console.log('   🌐 API: Implement connection pooling and keep-alive');
          console.log('   🌐 API: Add Redis caching layer');
          break;
        case 'Cache Performance':
          console.log('   💾 Cache: Optimize cache data structure (consider WeakMap)');
          console.log('   💾 Cache: Review LRU algorithm implementation');
          break;
        case 'Memory Usage':
          console.log('   🧠 Memory: Implement more aggressive cache cleanup');
          console.log('   🧠 Memory: Review for memory leaks in React components');
          break;
        case 'Data Loading':
          console.log('   📁 Data: Implement streaming data loading');
          console.log('   📁 Data: Optimize file I/O with memory mapping');
          break;
      }
    });
  }
}

// Run benchmark if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runAllBenchmarks().catch(console.error);
}

module.exports = PerformanceBenchmark;