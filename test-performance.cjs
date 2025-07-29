#!/usr/bin/env node
/**
 * Performance Testing Suite for Debug Player Framework
 * Tests timeline performance, memory usage, and rendering efficiency
 */

const { chromium } = require('playwright');

class PerformanceTestSuite {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testTripPath = '/home/thh3/data/trips/2025-07-15T12_06_02';
    this.browser = null;
    this.page = null;
    this.requestStartTime = 0;
    this.metrics = {};
  }

  async setup() {
    this.browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-web-security'] 
    });
    
    const context = await this.browser.newContext();
    this.page = await context.newPage();
    
    // Enable performance monitoring
    await this.page.addInitScript(() => {
      window.performanceMetrics = {
        renderTimes: [],
        apiCallTimes: [],
        memoryUsage: [],
        timelineEvents: []
      };
      
      // Monitor performance entries
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            window.performanceMetrics.renderTimes.push({
              name: entry.name,
              duration: entry.duration,
              timestamp: entry.startTime
            });
          }
        }
      });
      observer.observe({ entryTypes: ['measure'] });
      
      // Monitor memory usage
      setInterval(() => {
        if (performance.memory) {
          window.performanceMetrics.memoryUsage.push({
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit,
            timestamp: Date.now()
          });
        }
      }, 1000);
    });

    // Monitor network requests
    this.page.on('response', async (response) => {
      if (response.url().includes('/api/python/data/timestamp')) {
        // For performance monitoring, we'll use our own timing
        this.metrics.apiResponseTime = Date.now() - this.requestStartTime;
        console.log(`📊 Signal API: ${this.metrics.apiResponseTime}ms`);
      }
    });

    // Track request start times
    this.page.on('request', (request) => {
      if (request.url().includes('/api/python/data/timestamp')) {
        this.requestStartTime = Date.now();
      }
    });

    // Monitor console for performance issues
    this.page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('slow') || msg.text().includes('performance')) {
        console.log(`⚠️ Performance Alert: ${msg.text()}`);
      }
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async test01_LoadDataPerformance() {
    console.log('🧪 Test 1: Data Loading Performance');
    
    const startTime = Date.now();
    
    await this.page.goto(`${this.baseUrl}/trip-loader`);
    await this.page.waitForLoadState('networkidle');
    
    // Fill trip path and load data
    await this.page.fill('input[id="trip-path"]', this.testTripPath);
    
    const loadStartTime = Date.now();
    await this.page.click('text=Load Trip Data');
    
    // Wait for loading to complete
    await this.page.waitForSelector('text=Start Analysis', { timeout: 60000 });
    const loadEndTime = Date.now();
    
    const totalLoadTime = loadEndTime - loadStartTime;
    console.log(`✓ Data loading completed in ${totalLoadTime}ms`);
    
    // Check if loading was reasonable (under 30 seconds)
    if (totalLoadTime > 30000) {
      console.log(`⚠️ WARNING: Data loading took ${totalLoadTime/1000}s - this is quite slow`);
    }
    
    this.metrics.dataLoadTime = totalLoadTime;
    return totalLoadTime < 30000;
  }

  async test02_TimelinePerformance() {
    console.log('🧪 Test 2: Timeline Slider Performance');
    
    // Navigate to debug player
    await this.page.click('text=Start Analysis');
    await this.page.waitForLoadState('networkidle');
    
    // Wait for initial data to load
    await this.page.waitForTimeout(3000);
    
    // Find timeline slider
    const slider = await this.page.locator('input[type="range"], .timeline-slider').first();
    if (await slider.count() === 0) {
      console.log('❌ No timeline slider found');
      return false;
    }
    
    // Test timeline interaction performance
    const interactions = 10;
    const interactionTimes = [];
    
    console.log(`Testing ${interactions} timeline interactions...`);
    
    for (let i = 0; i < interactions; i++) {
      const startTime = performance.now();
      
      // Move slider to different positions
      const position = i / (interactions - 1); // 0 to 1
      const box = await slider.boundingBox();
      
      if (box) {
        const x = box.x + (box.width * position);
        const y = box.y + (box.height / 2);
        
        await this.page.mouse.click(x, y);
        
        // Wait for any API calls to complete
        await this.page.waitForTimeout(500);
        
        const endTime = performance.now();
        const interactionTime = endTime - startTime;
        interactionTimes.push(interactionTime);
        
        console.log(`  Interaction ${i+1}: ${interactionTime.toFixed(2)}ms`);
      }
    }
    
    const avgInteractionTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length;
    const maxInteractionTime = Math.max(...interactionTimes);
    
    console.log(`✓ Average interaction time: ${avgInteractionTime.toFixed(2)}ms`);
    console.log(`✓ Max interaction time: ${maxInteractionTime.toFixed(2)}ms`);
    
    // Flag if interactions are too slow (over 100ms feels sluggish)
    if (avgInteractionTime > 100) {
      console.log(`⚠️ WARNING: Timeline interactions are slow (${avgInteractionTime.toFixed(2)}ms avg)`);
    }
    
    this.metrics.avgTimelineInteraction = avgInteractionTime;
    this.metrics.maxTimelineInteraction = maxInteractionTime;
    
    return avgInteractionTime < 100;
  }

  async test03_MemoryUsageMonitoring() {
    console.log('🧪 Test 3: Memory Usage Monitoring');
    
    // Get initial memory
    const initialMemory = await this.page.evaluate(() => {
      return performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      } : null;
    });
    
    if (!initialMemory) {
      console.log('⚠️ Memory monitoring not available in this browser');
      return true;
    }
    
    console.log(`Initial memory: ${(initialMemory.used / 1024 / 1024).toFixed(2)}MB`);
    
    // Interact with timeline for 30 seconds
    console.log('Monitoring memory usage during timeline interactions...');
    
    const slider = await this.page.locator('input[type="range"], .timeline-slider').first();
    const box = await slider.boundingBox();
    
    if (box) {
      for (let i = 0; i < 20; i++) {
        const position = Math.random();
        const x = box.x + (box.width * position);
        const y = box.y + (box.height / 2);
        
        await this.page.mouse.click(x, y);
        await this.page.waitForTimeout(1000);
      }
    }
    
    // Get final memory
    const finalMemory = await this.page.evaluate(() => {
      return performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      } : null;
    });
    
    const memoryIncrease = finalMemory.used - initialMemory.used;
    const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
    
    console.log(`Final memory: ${(finalMemory.used / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
    
    // Flag if memory increased by more than 50MB (potential leak)
    if (memoryIncreaseMB > 50) {
      console.log(`⚠️ WARNING: Significant memory increase (${memoryIncreaseMB.toFixed(2)}MB) - possible memory leak`);
    }
    
    this.metrics.memoryIncrease = memoryIncreaseMB;
    
    return memoryIncreaseMB < 50;
  }

  async test04_RenderingPerformance() {
    console.log('🧪 Test 4: Rendering Performance');
    
    // Measure frame rates and render times
    const perfData = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        let startTime = performance.now();
        
        function countFrame() {
          frameCount++;
          if (performance.now() - startTime > 5000) { // 5 seconds
            const fps = frameCount / 5;
            resolve({ fps, frameCount });
          } else {
            requestAnimationFrame(countFrame);
          }
        }
        
        requestAnimationFrame(countFrame);
      });
    });
    
    console.log(`✓ Average FPS: ${perfData.fps.toFixed(2)}`);
    console.log(`✓ Total frames in 5s: ${perfData.frameCount}`);
    
    // Flag if FPS is too low (under 30 FPS indicates poor performance)
    if (perfData.fps < 30) {
      console.log(`⚠️ WARNING: Low frame rate (${perfData.fps.toFixed(2)} FPS) - rendering performance issues`);
    }
    
    this.metrics.averageFPS = perfData.fps;
    
    return perfData.fps >= 30;
  }

  async test05_ApiPerformanceStress() {
    console.log('🧪 Test 5: API Performance Under Load');
    
    // Rapidly move timeline to stress test the API
    const slider = await this.page.locator('input[type="range"], .timeline-slider').first();
    const box = await slider.boundingBox();
    
    if (!box) {
      console.log('❌ Timeline slider not found');
      return false;
    }
    
    const rapidInteractions = 20;
    const apiTimes = [];
    
    console.log(`Performing ${rapidInteractions} rapid timeline movements...`);
    
    for (let i = 0; i < rapidInteractions; i++) {
      const position = i / (rapidInteractions - 1);
      const x = box.x + (box.width * position);
      const y = box.y + (box.height / 2);
      
      const startTime = Date.now();
      await this.page.mouse.click(x, y);
      
      // Wait briefly for API call
      await this.page.waitForTimeout(200);
      
      // Check if API response time is recorded
      if (this.metrics.apiResponseTime) {
        apiTimes.push(this.metrics.apiResponseTime);
      }
    }
    
    if (apiTimes.length > 0) {
      const avgApiTime = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
      const maxApiTime = Math.max(...apiTimes);
      
      console.log(`✓ Average API response: ${avgApiTime.toFixed(2)}ms`);
      console.log(`✓ Max API response: ${maxApiTime.toFixed(2)}ms`);
      
      if (avgApiTime > 100) {
        console.log(`⚠️ WARNING: Slow API responses (${avgApiTime.toFixed(2)}ms avg)`);
      }
      
      this.metrics.avgApiResponseTime = avgApiTime;
      this.metrics.maxApiResponseTime = maxApiTime;
      
      return avgApiTime < 100;
    }
    
    return true;
  }

  async runAllTests() {
    console.log('🚀 Starting Performance Test Suite');
    console.log('=' .repeat(50));
    
    const results = {};
    
    try {
      await this.setup();
      
      results.dataLoading = await this.test01_LoadDataPerformance();
      results.timeline = await this.test02_TimelinePerformance();
      results.memory = await this.test03_MemoryUsageMonitoring();
      results.rendering = await this.test04_RenderingPerformance();
      results.apiStress = await this.test05_ApiPerformanceStress();
      
    } catch (error) {
      console.log('❌ Performance test error:', error.message);
      results.error = error.message;
    } finally {
      await this.teardown();
    }
    
    // Print summary
    console.log('\n📊 Performance Test Results');
    console.log('=' .repeat(30));
    
    const passed = Object.values(results).filter(r => r === true).length;
    const total = Object.keys(results).filter(k => k !== 'error').length;
    
    for (const [test, result] of Object.entries(results)) {
      if (test === 'error') continue;
      const status = result ? '✅' : '❌';
      console.log(`${status} ${test}: ${result ? 'PASS' : 'FAIL'}`);
    }
    
    console.log('\n📈 Performance Metrics:');
    if (this.metrics.dataLoadTime) console.log(`Data Loading: ${this.metrics.dataLoadTime}ms`);
    if (this.metrics.avgTimelineInteraction) console.log(`Timeline Interaction: ${this.metrics.avgTimelineInteraction.toFixed(2)}ms avg`);
    if (this.metrics.memoryIncrease) console.log(`Memory Increase: ${this.metrics.memoryIncrease.toFixed(2)}MB`);
    if (this.metrics.averageFPS) console.log(`Average FPS: ${this.metrics.averageFPS.toFixed(2)}`);
    if (this.metrics.avgApiResponseTime) console.log(`API Response: ${this.metrics.avgApiResponseTime.toFixed(2)}ms avg`);
    
    if (results.error) {
      console.log(`❌ Error: ${results.error}`);
    }
    
    console.log(`\n📈 Overall: ${passed}/${total} tests passed`);
    
    return results;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tests = new PerformanceTestSuite();
  tests.runAllTests().then(results => {
    const allPassed = Object.values(results).filter(r => r === true).length === 
                      Object.keys(results).filter(k => k !== 'error').length;
    process.exit(allPassed ? 0 : 1);
  }).catch(error => {
    console.error('Performance test runner error:', error);
    process.exit(1);
  });
}

module.exports = PerformanceTestSuite;
