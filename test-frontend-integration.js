#!/usr/bin/env node
/**
 * Frontend Integration Tests
 * Tests the complete frontend flow including session navigation
 */

const { chromium } = require('playwright');
const { expect } = require('@playwright/test');

class FrontendIntegrationTests {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testTripPath = '/home/thh3/data/trips/2025-07-15T12_06_02';
    this.browser = null;
    this.page = null;
  }

  async setup() {
    this.browser = await chromium.launch({ 
      headless: false, // Show browser for debugging
      slowMo: 100 
    });
    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text());
      } else if (msg.text().includes('Signals at time') || msg.text().includes('Debug player')) {
        console.log('🔍 Browser Log:', msg.text());
      }
    });
    
    // Catch network errors
    this.page.on('requestfailed', request => {
      console.log('❌ Network Error:', request.url(), request.failure()?.errorText);
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async test01_LoadHomePage() {
    console.log('🧪 Test 1: Loading home page');
    
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState('networkidle');
    
    // Check if page loaded correctly
    const title = await this.page.title();
    console.log(`✓ Page title: ${title}`);
    
    // Look for navigation elements
    const loadDataButton = await this.page.locator('text=Load Trip Data').first();
    if (await loadDataButton.count() > 0) {
      console.log('✓ Load Trip Data button found');
    } else {
      // Try alternative selectors
      const tripLoaderLink = await this.page.locator('a[href*="trip-loader"]').first();
      if (await tripLoaderLink.count() > 0) {
        console.log('✓ Trip loader navigation found');
      } else {
        console.log('⚠ No obvious trip loading interface found');
      }
    }
  }

  async test02_NavigateToTripLoader() {
    console.log('🧪 Test 2: Navigate to trip loader');
    
    // Try to navigate to trip loader page
    await this.page.goto(`${this.baseUrl}/trip-loader`);
    await this.page.waitForLoadState('networkidle');
    
    // Look for trip loader interface
    const pathInput = await this.page.locator('input[id="trip-path"]');
    const loadButton = await this.page.locator('text=Load Trip Data').last();
    
    if (await pathInput.count() > 0) {
      console.log('✓ Trip path input found');
    } else {
      console.log('⚠ Trip path input not found');
    }
    
    if (await loadButton.count() > 0) {
      console.log('✓ Load button found');
    } else {
      console.log('⚠ Load button not found');
    }
  }

  async test03_LoadTripData() {
    console.log('🧪 Test 3: Load trip data');
    
    // Fill in the trip path
    const pathInput = await this.page.locator('input[id="trip-path"]');
    if (await pathInput.count() > 0) {
      await pathInput.fill(this.testTripPath);
      console.log(`✓ Entered trip path: ${this.testTripPath}`);
      
      // Click load button
      const loadButton = await this.page.locator('text=Load Trip Data').last();
      await loadButton.click();
      console.log('✓ Clicked load button');
      
      // Wait for loading to complete (up to 30 seconds)
      try {
        await this.page.waitForSelector('text=Start Analysis', { timeout: 30000 });
        console.log('✓ Trip data loaded successfully');
        return true;
      } catch (error) {
        console.log('❌ Trip loading failed or timed out');
        
        // Check for error messages
        const errorMessages = await this.page.locator('.text-destructive, .text-red-500, [role="alert"]').allTextContents();
        if (errorMessages.length > 0) {
          console.log('❌ Error messages found:', errorMessages);
        }
        return false;
      }
    } else {
      console.log('❌ Cannot load trip data - path input not found');
      return false;
    }
  }

  async test04_StartAnalysis() {
    console.log('🧪 Test 4: Start analysis');
    
    // Click Start Analysis button
    const startButton = await this.page.locator('text=Start Analysis');
    if (await startButton.count() > 0) {
      await startButton.click();
      console.log('✓ Clicked Start Analysis');
      
      // Wait for navigation to debug player
      await this.page.waitForLoadState('networkidle');
      
      // Check current URL
      const currentUrl = this.page.url();
      console.log(`✓ Current URL: ${currentUrl}`);
      
      // Look for debug player elements
      const debugPlayerTitle = await this.page.locator('text=Debug Player');
      if (await debugPlayerTitle.count() > 0) {
        console.log('✓ Debug Player interface loaded');
        return true;
      } else {
        console.log('⚠ Debug Player interface not found');
        return false;
      }
    } else {
      console.log('❌ Start Analysis button not found');
      return false;
    }
  }

  async test05_CheckSessionID() {
    console.log('🧪 Test 5: Check session ID in debug player');
    
    // Wait a moment for React hooks to run
    await this.page.waitForTimeout(2000);
    
    // Look for console messages about session ID
    let sessionIdFound = false;
    
    // Check console logs for session ID messages
    await this.page.evaluate(() => {
      console.log('Frontend test: Checking session state');
    });
    
    // Wait a bit more for console messages
    await this.page.waitForTimeout(1000);
    
    // Try to find the session info in the interface
    const sessionInfo = await this.page.locator('text=/Session:.*/', { timeout: 5000 }).first();
    if (await sessionInfo.count() > 0) {
      const sessionText = await sessionInfo.textContent();
      console.log(`✓ Session info displayed: ${sessionText}`);
      sessionIdFound = true;
    } else {
      console.log('⚠ No session info visible in UI');
    }
    
    return sessionIdFound;
  }

  async test06_TestTimelineInteraction() {
    console.log('🧪 Test 6: Test timeline slider interaction');
    
    // Look for timeline controls
    const timelineSlider = await this.page.locator('input[type="range"], .timeline-slider').first();
    
    if (await timelineSlider.count() > 0) {
      console.log('✓ Timeline slider found');
      
      // Try to move the slider to different positions
      const positions = [0.2, 0.5, 0.8]; // 20%, 50%, 80% through the timeline
      
      for (let i = 0; i < positions.length; i++) {
        const position = positions[i];
        
        // Move slider to position (this is approximate)
        const box = await timelineSlider.boundingBox();
        if (box) {
          const x = box.x + (box.width * position);
          const y = box.y + (box.height / 2);
          
          await this.page.mouse.click(x, y);
          console.log(`✓ Moved slider to position ${Math.round(position * 100)}%`);
          
          // Wait for signal data fetching
          await this.page.waitForTimeout(500);
        }
      }
      
      return true;
    } else {
      console.log('❌ Timeline slider not found');
      return false;
    }
  }

  async test07_CheckSignalData() {
    console.log('🧪 Test 7: Check if signal data is being fetched');
    
    // Move timeline and check for console messages about signal fetching
    let signalDataFound = false;
    
    // Set up console message listener
    const consoleMessages = [];
    this.page.on('console', msg => {
      if (msg.text().includes('Signals at time') || msg.text().includes('signal')) {
        consoleMessages.push(msg.text());
        console.log('🔍 Signal data message:', msg.text());
        signalDataFound = true;
      }
    });
    
    // Trigger timeline changes
    const timelineSlider = await this.page.locator('input[type="range"], .timeline-slider').first();
    if (await timelineSlider.count() > 0) {
      // Click at different positions
      const box = await timelineSlider.boundingBox();
      if (box) {
        for (let i = 0; i < 3; i++) {
          const x = box.x + (box.width * (i / 2)); // 0%, 50%, 100%
          const y = box.y + (box.height / 2);
          
          await this.page.mouse.click(x, y);
          await this.page.waitForTimeout(1000); // Wait for debounced signal fetching
        }
      }
    }
    
    await this.page.waitForTimeout(2000); // Final wait for any delayed messages
    
    if (signalDataFound) {
      console.log(`✓ Signal data fetching detected: ${consoleMessages.length} messages`);
    } else {
      console.log('❌ No signal data fetching detected');
    }
    
    return signalDataFound;
  }

  async test08_CheckVisualizationPanels() {
    console.log('🧪 Test 8: Check visualization panels');
    
    // Look for different visualization tabs/panels
    const tabs = ['temporal', 'spatial', 'collision'];
    let panelsFound = 0;
    
    for (const tabName of tabs) {
      const tab = await this.page.locator(`text=${tabName}`, { timeout: 2000 }).first();
      if (await tab.count() > 0) {
        console.log(`✓ ${tabName} tab found`);
        panelsFound++;
        
        // Try to click the tab
        try {
          await tab.click();
          await this.page.waitForTimeout(500);
          console.log(`✓ ${tabName} tab clickable`);
        } catch (error) {
          console.log(`⚠ ${tabName} tab not clickable:`, error.message);
        }
      } else {
        console.log(`⚠ ${tabName} tab not found`);
      }
    }
    
    // Look for charts or visualization content
    const charts = await this.page.locator('canvas, svg, .chart, .visualization').count();
    console.log(`✓ Found ${charts} visualization elements`);
    
    return panelsFound > 0;
  }

  async runAllTests() {
    console.log('🚀 Starting Frontend Integration Tests');
    console.log('=' .repeat(50));
    
    const results = {};
    
    try {
      await this.setup();
      
      results.homePage = await this.test01_LoadHomePage();
      results.tripLoader = await this.test02_NavigateToTripLoader();
      results.loadData = await this.test03_LoadTripData();
      
      if (results.loadData) {
        results.startAnalysis = await this.test04_StartAnalysis();
        
        if (results.startAnalysis) {
          results.sessionID = await this.test05_CheckSessionID();
          results.timeline = await this.test06_TestTimelineInteraction();
          results.signalData = await this.test07_CheckSignalData();
          results.visualization = await this.test08_CheckVisualizationPanels();
        }
      }
      
    } catch (error) {
      console.log('❌ Test execution error:', error.message);
      results.error = error.message;
    } finally {
      await this.teardown();
    }
    
    // Print summary
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(30));
    
    const passed = Object.values(results).filter(r => r === true).length;
    const total = Object.keys(results).filter(k => k !== 'error').length;
    
    for (const [test, result] of Object.entries(results)) {
      if (test === 'error') continue;
      const status = result ? '✅' : '❌';
      console.log(`${status} ${test}: ${result ? 'PASS' : 'FAIL'}`);
    }
    
    if (results.error) {
      console.log(`❌ error: ${results.error}`);
    }
    
    console.log(`\n📈 Overall: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All frontend integration tests passed!');
    } else {
      console.log('🔧 Some tests failed - check the issues above');
    }
    
    return results;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tests = new FrontendIntegrationTests();
  tests.runAllTests().then(results => {
    const allPassed = Object.values(results).filter(r => r === true).length === 
                      Object.keys(results).filter(k => k !== 'error').length;
    process.exit(allPassed ? 0 : 1);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = FrontendIntegrationTests;