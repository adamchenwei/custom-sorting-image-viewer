import { test, expect } from '@playwright/test';

test.describe('Planner Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/planner');
    await expect(page).toHaveTitle(/Planner/);
    const heading = page.locator('h1');
    await expect(heading).toHaveText('Rideshare Event Planner');
  });

  test('should load without errors', async ({ page }) => {
    // The beforeEach hook already covers this, so this test just confirms the basic load.
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should interact with filters without crashing', async ({ page }) => {
    // Wait for the city options to be populated
    await page.waitForSelector('#city-select option[value="Jupiter"]');

    // Change year
    await page.selectOption('#year-select', '2026');
    await expect(page.locator('h1')).toBeVisible();

    // Change city
    await page.selectOption('#city-select', 'Jupiter');
    await expect(page.locator('h1')).toBeVisible();

    // Change date
    await page.fill('#date-picker', '2026-07-04');
    await expect(page.locator('h1')).toBeVisible();

    // Toggle weekday
    await page.check('#weekday-monday');
    await expect(page.locator('h1')).toBeVisible();

    // Select hour
    await page.selectOption('#hour-select', ['14', '15']);
    await expect(page.locator('h1')).toBeVisible();

    // Toggle school days/breaks
    await page.check('#school-days');
    await expect(page.locator('h1')).toBeVisible();
    await page.check('#school-breaks');
    await expect(page.locator('h1')).toBeVisible();

    // Wait for school county options to be populated
    await page.waitForSelector('#school-county-select option[value="Palm Beach County"]');

    // Select school county
    await page.selectOption('#school-county-select', 'Palm Beach County');
    await expect(page.locator('h1')).toBeVisible();

    // Select route type
    await page.selectOption('select[value="all"]', 'private');
    await expect(page.locator('h1')).toBeVisible();
  });
});
