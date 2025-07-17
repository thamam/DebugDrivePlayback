import { test, expect } from '@playwright/test';

test.describe('Widget Demo Test', () => {
  test('basic widget manager access', async ({ page }) => {
    await page.goto('/');
    
    // Check that the main page loads
    await expect(page.locator('text=Debug Player Framework')).toBeVisible();
    
    // Navigate to Widget Manager
    await page.click('text=Widget Manager');
    await expect(page).toHaveURL('/widget-manager');
    
    // Check that widget manager loads
    await expect(page.locator('text=Widget Dashboard')).toBeVisible();
    
    // Check that Add Widget button is present
    await expect(page.locator('button:has-text("Add Widget")')).toBeVisible();
    
    console.log('✅ Basic widget manager access test passed');
  });
});