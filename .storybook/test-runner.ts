import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  // Hook to execute code before the test runner starts running tests
  setup() {
    // Add global setup here
  },
  
  /* Hook to execute code before visiting the story in the browser */
  async preVisit(page, context) {
    // The test-runner enables console debugging in the browser by default
    // but you can override it here to enable logging locally
    // page.on('console', (msg) => console.log(msg.text()));
  },
  
  /* Hook to execute code after visiting the story in the browser */
  async postVisit(page, context) {
    // the #storybook-root element wraps the story
    const elementHandler = await page.$('#storybook-root');
    const innerHTML = await elementHandler?.innerHTML();
    
    // Assert that no error boundaries were triggered
    if (innerHTML?.includes('Something went wrong')) {
      throw new Error(`Error boundary triggered in story: ${context.title}`);
    }
    
    // Check for console errors
    const logs = await page.evaluate(() => {
      // @ts-ignore
      return window.__STORYBOOK_CONSOLE_ERRORS__ || [];
    });
    
    if (logs.length > 0) {
      console.warn(`Console errors in story ${context.title}:`, logs);
    }
  },
};

export default config;