import { test, expect } from '@playwright/test';

test('should display images from years before 2025', async ({ page }) => {

  // Navigate to the results page with a date range from 2022 to 2025
  const url = '/results?startDate=2022-01-01&endDate=2025-10-06&startTime=00%3A00&endTime=23%3A59&weeks=Monday&onlySameMonth=true&aMonthBefore=true&aMonthAfter=true';
  await page.goto(url);

  // Wait for the image list to be populated
  await page.waitForSelector('.space-y-2 > div');

  // Get the text content of all the displayed image items
  const imageItems = await page.locator('.space-y-2 > div').allTextContents();

  // Check if any of the displayed images are from a year before 2025
  const hasPre2025Image = imageItems.some(itemText => {
    return itemText.includes('2022') || itemText.includes('2023') || itemText.includes('2024');
  });

  // Assert that at least one image from a previous year is found
  expect(hasPre2025Image, 'Expected to find at least one image from a year before 2025').toBe(true);
});
