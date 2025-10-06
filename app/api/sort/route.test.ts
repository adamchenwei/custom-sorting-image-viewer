import { POST } from './route';
import fs from 'fs';

// Mock fs to avoid actual file system access
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
}));

interface MockImageData {
  yyyy: number;
  mm: number;
  dd: number;
  hh: number;
  minute: number;
  ss: number;
  fileName: string;
  assetPath: string;
}

// Mock data that spans multiple years
const mockImageData = [
  // A match in 2022 (October, Monday)
  { yyyy: 2022, mm: 10, dd: 3, hh: 10, minute: 0, ss: 0, fileName: '2022-10-03.jpg', assetPath: '' },
  // A non-match in 2022 (December)
  { yyyy: 2022, mm: 12, dd: 5, hh: 10, minute: 0, ss: 0, fileName: '2022-12-05.jpg', assetPath: '' },
  // A match in 2023 (November, Monday)
  { yyyy: 2023, mm: 11, dd: 6, hh: 10, minute: 0, ss: 0, fileName: '2023-11-06.jpg', assetPath: '' },
  // A match in 2025 (October, Monday) - The only one currently showing
  { yyyy: 2025, mm: 10, dd: 6, hh: 10, minute: 0, ss: 0, fileName: '2025-10-06.jpg', assetPath: '' },
  // A non-match in 2025 (October, Tuesday)
  { yyyy: 2025, mm: 10, dd: 7, hh: 10, minute: 0, ss: 0, fileName: '2025-10-07.jpg', assetPath: '' },
];

describe('POST /api/sort', () => {
  beforeEach(() => {
    // Before each test, reset the mock to return our test data
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockImageData));
    // Mock the current date to be in 2025 for consistent test runs
    jest.useFakeTimers().setSystemTime(new Date('2025-10-06T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return images from all years matching the month and week filters', async () => {
    const requestBody = {
      startDate: '2022-01-01',
      endDate: '2025-10-06',
      startTime: '00:00',
      endTime: '23:59',
      weeks: ['Monday'],
      onlySameMonth: true, // October
      aMonthBefore: true,  // September
      aMonthAfter: true,   // November
      includeAllYears: false,
    };

    const request = new Request('http://localhost/api/sort', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const responseData = await response.json();

    // We expect 3 images to match: one from 2022, one from 2023, and one from 2025.
    expect(responseData.length).toBe(3);
    expect(responseData.some((img: MockImageData) => img.yyyy === 2022)).toBe(true);
    expect(responseData.some((img: MockImageData) => img.yyyy === 2023)).toBe(true);
    expect(responseData.some((img: MockImageData) => img.yyyy === 2025)).toBe(true);
  });
});
