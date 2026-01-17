import { test, expect } from '@playwright/test';

test.describe('Notifications', () => {
    test('should display notification bell', async ({ page }) => {
        await page.goto('/trips');

        // Locate bell
        const bell = page.locator('button:has(.lucide-bell)');
        await expect(bell).toBeVisible();
    });

    test('should open notifications popover', async ({ page }) => {
        await page.goto('/trips');

        const bell = page.locator('button:has(.lucide-bell)');
        await bell.click();

        // Basic check for popover content
        await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    });

    test('should navigate to notifications page', async ({ page }) => {
        await page.goto('/notifications');
        await expect(page.getByRole('heading', { name: 'Notifications', exact: true })).toBeVisible();
    });
});
