import { test, expect } from '@playwright/test';

test.describe('Todo Page', () => {
    test('should load todo page', async ({ page }) => {
        await page.goto('/todo');

        // Check for heading
        await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    });

    // Add more tests for interactions once auth is handled
});
