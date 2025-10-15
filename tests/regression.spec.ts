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

test('should load more images when scrolling down (infinite scroll)', async ({ page }) => {
  // Navigate to the results page with default filters
  await page.goto('/results');

  // Wait for the image list to be populated
  await page.waitForSelector('.space-y-2 > div', { timeout: 10000 });

  // Get initial count of displayed images
  const initialImageCount = await page.locator('.space-y-2 > div').count();
  console.log('Initial image count:', initialImageCount);

  // Verify that we have at least some images loaded
  expect(initialImageCount).toBeGreaterThan(0);

  // Get the scrollable container (the one with overflow-y-auto)
  const scrollContainer = page.locator('.flex-1.overflow-y-auto').first();

  // Scroll to the bottom of the container
  await scrollContainer.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });

  // Wait for more images to load (give it a moment to load)
  await page.waitForTimeout(1000);

  // Get the new count of displayed images
  const newImageCount = await page.locator('.space-y-2 > div').count();
  console.log('New image count after scroll:', newImageCount);

  // Assert that more images were loaded (should be at least 20 more)
  expect(newImageCount).toBeGreaterThan(initialImageCount);
  
  // If we loaded the first batch (20 items), we should have more after scrolling
  if (initialImageCount === 20) {
    expect(newImageCount).toBeGreaterThanOrEqual(30); // At least 10 more
  }
});
