import { test, expect } from '@playwright/test';

test.describe('Widget Wizard GUI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the widget manager page
    await page.goto('/');
    await page.click('text=Widget Manager');
    await expect(page).toHaveURL('/widget-manager');
  });

  test('should display widget dashboard and manager', async ({ page }) => {
    // Check that widget dashboard is visible
    await expect(page.locator('text=Widget Dashboard')).toBeVisible();
    
    // Check that widget manager is visible
    await expect(page.locator('text=Widget System Active')).toBeVisible();
    
    // Check that "Add Widget" button is visible
    await expect(page.locator('button:has-text("Add Widget")').first()).toBeVisible();
  });

  test('should open widget wizard dialog', async ({ page }) => {
    // Click the "Add Widget" button
    await page.click('button:has-text("Add Widget")');
    
    // Check that the dialog opened
    await expect(page.locator('text=Create New Widget')).toBeVisible();
    
    // Check that template selection is visible
    await expect(page.locator('text=Choose Template')).toBeVisible();
    
    // Check that templates are displayed
    await expect(page.locator('text=Trajectory Visualizer')).toBeVisible();
    await expect(page.locator('text=Speed Analyzer')).toBeVisible();
    await expect(page.locator('text=Signal Monitor')).toBeVisible();
    await expect(page.locator('text=Data Exporter')).toBeVisible();
  });

  test('should complete widget creation workflow', async ({ page }) => {
    // Open widget wizard
    await page.click('button:has-text("Add Widget")');
    
    // Select trajectory visualizer template
    await page.click('text=Trajectory Visualizer');
    
    // Verify we're on configuration step
    await expect(page.locator('text=Configuration')).toBeVisible();
    
    // Check that widget name field is pre-filled
    const nameInput = page.locator('input[placeholder*="name"]').first();
    await expect(nameInput).toHaveValue('Trajectory Visualizer');
    
    // Customize widget name
    await nameInput.fill('My Custom Trajectory Widget');
    
    // Check configuration fields are visible
    await expect(page.locator('text=Show Planned Path')).toBeVisible();
    await expect(page.locator('text=Path Color')).toBeVisible();
    await expect(page.locator('text=Chart Size')).toBeVisible();
    
    // Modify configuration
    await page.click('text=Show Planned Path');
    await page.selectOption('select:near(:text("Chart Size"))', 'large');
    
    // Go to preview
    await page.click('button:has-text("Preview")');
    
    // Verify preview content
    await expect(page.locator('text=Widget Preview')).toBeVisible();
    await expect(page.locator('text=My Custom Trajectory Widget')).toBeVisible();
    await expect(page.locator('text=Template: Trajectory Visualizer')).toBeVisible();
    
    // Create the widget
    await page.click('button:has-text("Create Widget")');
    
    // Wait for dialog to close
    await expect(page.locator('text=Create New Widget')).not.toBeVisible();
    
    // Verify widget was created in the dashboard
    await expect(page.locator('text=My Custom Trajectory Widget')).toBeVisible();
  });

  test('should handle widget template selection', async ({ page }) => {
    await page.click('button:has-text("Add Widget")');
    
    // Test each template selection
    const templates = ['Trajectory Visualizer', 'Speed Analyzer', 'Signal Monitor', 'Data Exporter'];
    
    for (const template of templates) {
      await page.click(`text=${template}`);
      await expect(page.locator('text=Configuration')).toBeVisible();
      
      // Go back to template selection
      await page.click('button:has-text("Back")');
      await expect(page.locator('text=Choose Template')).toBeVisible();
    }
  });

  test('should validate widget configuration', async ({ page }) => {
    await page.click('button:has-text("Add Widget")');
    await page.click('text=Trajectory Visualizer');
    
    // Clear widget name to test validation
    const nameInput = page.locator('input[placeholder*="name"]').first();
    await nameInput.fill('');
    
    // Try to go to preview - should not work
    await page.click('button:has-text("Preview")');
    
    // Should still be on configuration step
    await expect(page.locator('text=Configuration')).toBeVisible();
    
    // Fill in valid name
    await nameInput.fill('Valid Widget Name');
    
    // Now preview should work
    await page.click('button:has-text("Preview")');
    await expect(page.locator('text=Widget Preview')).toBeVisible();
  });

  test('should handle different configuration field types', async ({ page }) => {
    await page.click('button:has-text("Add Widget")');
    await page.click('text=Trajectory Visualizer');
    
    // Test boolean field (checkbox)
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    await checkbox.click();
    
    // Test select field
    const selectField = page.locator('select');
    await expect(selectField).toBeVisible();
    await selectField.selectOption('small');
    
    // Test text input field
    const textInput = page.locator('input[type="text"]').first();
    await expect(textInput).toBeVisible();
    await textInput.fill('#ff0000');
    
    // Verify preview shows updated values
    await page.click('button:has-text("Preview")');
    await expect(page.locator('text=Widget Preview')).toBeVisible();
  });

  test('should navigate between wizard steps', async ({ page }) => {
    await page.click('button:has-text("Add Widget")');
    await page.click('text=Speed Analyzer');
    
    // Should be on configuration step
    await expect(page.locator('text=Configuration')).toBeVisible();
    
    // Go to preview
    await page.click('button:has-text("Preview")');
    await expect(page.locator('text=Widget Preview')).toBeVisible();
    
    // Go back to configuration
    await page.click('button:has-text("Back")');
    await expect(page.locator('text=Configuration')).toBeVisible();
    
    // Go back to template selection
    await page.click('button:has-text("Back")');
    await expect(page.locator('text=Choose Template')).toBeVisible();
  });

  test('should close dialog without creating widget', async ({ page }) => {
    await page.click('button:has-text("Add Widget")');
    await expect(page.locator('text=Create New Widget')).toBeVisible();
    
    // Close dialog with X button
    await page.click('button[aria-label="Close"]');
    await expect(page.locator('text=Create New Widget')).not.toBeVisible();
    
    // Should be back on main page
    await expect(page.locator('text=Widget Dashboard')).toBeVisible();
  });

  test('should display template information correctly', async ({ page }) => {
    await page.click('button:has-text("Add Widget")');
    
    // Check trajectory visualizer template info
    await expect(page.locator('text=Inputs:')).toBeVisible();
    await expect(page.locator('text=w_car_pose_now_x_')).toBeVisible();
    await expect(page.locator('text=w_car_pose_now_y')).toBeVisible();
    await expect(page.locator('text=path_x_data')).toBeVisible();
    await expect(page.locator('text=path_y_data')).toBeVisible();
    
    await expect(page.locator('text=Outputs:')).toBeVisible();
    await expect(page.locator('text=spatial_chart')).toBeVisible();
    await expect(page.locator('text=statistics')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.click('button:has-text("Add Widget")');
    await expect(page.locator('text=Create New Widget')).toBeVisible();
    
    // Dialog should still be usable on mobile
    await page.click('text=Trajectory Visualizer');
    await expect(page.locator('text=Configuration')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.click('button:has-text("Preview")');
    await expect(page.locator('text=Widget Preview')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.click('button:has-text("Create Widget")');
    await expect(page.locator('text=Create New Widget')).not.toBeVisible();
  });
});