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

test('should increment startTime and endTime by 15 minutes when clicking +15m button', async ({ page }) => {
  // Navigate to the results page
  await page.goto('/results');

  // Open the sorter modal by clicking the Sort button
  await page.click('button:has-text("Sort")');

  // Wait for the modal to appear
  await page.waitForSelector('text=Sort Options');

  // First click "Next 15 Min" to set a known start time
  await page.click('button:has-text("Next 15 Min")');

  // Get the initial start and end times
  const initialStartTime = await page.inputValue('input[name="startTime"]');
  const initialEndTime = await page.inputValue('input[name="endTime"]');

  // Click the "+15m" button to increment by 15 minutes
  await page.click('button:has-text("+15m")');

  // Get the new start and end times
  const newStartTime = await page.inputValue('input[name="startTime"]');
  const newEndTime = await page.inputValue('input[name="endTime"]');

  // Parse times to compare
  const [initStartHours, initStartMins] = initialStartTime.split(':').map(Number);
  const [newStartHours, newStartMins] = newStartTime.split(':').map(Number);

  // Calculate expected new start time (initial + 15 minutes)
  const initStartTotalMins = initStartHours * 60 + initStartMins;
  const newStartTotalMins = newStartHours * 60 + newStartMins;
  const expectedNewStartMins = (initStartTotalMins + 15) % (24 * 60);

  // Verify the start time was incremented by 15 minutes
  expect(newStartTotalMins).toBe(expectedNewStartMins);

  // Verify the end time is 15 minutes after the new start time
  const [newEndHours, newEndMins] = newEndTime.split(':').map(Number);
  const newEndTotalMins = newEndHours * 60 + newEndMins;
  const expectedEndMins = (newStartTotalMins + 15) % (24 * 60);
  expect(newEndTotalMins).toBe(expectedEndMins);
});

test('should update URL params after applying +15m increment', async ({ page }) => {
  // Set larger viewport to ensure modal is fully visible
  await page.setViewportSize({ width: 1280, height: 900 });

  // Navigate to the results page with initial time params
  await page.goto('/results?startTime=10:00&endTime=10:15');

  // Open the sorter modal
  await page.click('button:has-text("Sort")');
  await page.waitForSelector('text=Sort Options');

  // Click the "+15m" button
  await page.click('button:has-text("+15m")');

  // Click Apply button using evaluate to bypass viewport issues
  await page.evaluate(() => {
    const button = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (button) button.click();
  });

  // Wait for URL to update
  await page.waitForURL(/startTime=10.*15/);

  // Verify URL contains updated time params
  const url = page.url();
  expect(url).toContain('startTime=10');
  expect(url).toContain('15'); // 10:15
  expect(url).toContain('endTime=10');
  expect(url).toContain('30'); // 10:30
});
