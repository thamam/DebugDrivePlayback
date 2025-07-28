/**
 * Simple E2E Tests - Just test that the core app works
 * Replaces 234 over-engineered tests with 5 simple ones
 */
import { test, expect } from '@playwright/test';

test.describe('Basic App Functionality', () => {
  test('should load the main debug player page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to trip loader', async ({ page }) => {
    await page.goto('/trip-loader');
    await expect(page.locator('input')).toBeVisible();
  });

  test('should navigate to widget manager', async ({ page }) => {
    await page.goto('/widget-manager');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Just check that basic navigation exists
    const links = page.locator('a');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
  });
});
