const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  try {
    console.log('Navigating to http://localhost:5000...');
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Check for vite error overlay
    const errorOverlay = await page.$('vite-error-overlay');
    const hasErrorOverlay = errorOverlay !== null;
    
    console.log('\n=== Frontend Error Report ===\n');
    
    if (hasErrorOverlay) {
      console.log('❌ Vite error overlay detected!');
      
      // Try to get error details from the overlay
      const errorMessage = await page.evaluate(() => {
        const overlay = document.querySelector('vite-error-overlay');
        if (overlay && overlay.shadowRoot) {
          const messageEl = overlay.shadowRoot.querySelector('.message');
          return messageEl ? messageEl.textContent : 'Unknown error';
        }
        return 'Could not read error details';
      });
      
      console.log(`Error message: ${errorMessage}`);
    } else {
      console.log('✅ No Vite error overlay detected');
    }
    
    // Report console errors
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    if (errors.length > 0) {
      console.log('\n❌ Console errors found:');
      errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.text}`);
      });
    } else {
      console.log('\n✅ No console errors');
    }
    
    // Report page errors
    if (pageErrors.length > 0) {
      console.log('\n❌ Page errors found:');
      pageErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.message}`);
        if (error.stack) {
          console.log(`     Stack: ${error.stack.split('\n')[0]}`);
        }
      });
    } else {
      console.log('\n✅ No page errors');
    }
    
    // Check if main app loaded
    const appElement = await page.$('#root');
    if (appElement) {
      const hasContent = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root && root.children.length > 0;
      });
      
      if (hasContent) {
        console.log('\n✅ App root element has content');
      } else {
        console.log('\n❌ App root element is empty');
      }
    } else {
      console.log('\n❌ App root element not found');
    }
    
    // Get page title
    const title = await page.title();
    console.log(`\nPage title: "${title}"`);
    
  } catch (error) {
    console.error('Error during check:', error);
  } finally {
    await browser.close();
  }
})();
