I want to share my Next.js v14 app that manages and displays image files with date-based filtering. The app has the following features:

Image Processing:

Processes images from a /public/images directory
Runs automatically via process-images script during npm run dev and npm run build
Generates a data.json file in the /public directory


Data Structure:

Currently handles image filenames in the format: Screenshot_YYYYMMDD_HHMMSS.jpg
Generates a JSON array where each object contains:

typescript 
interface ImageData {
  fileName: string;        // Original filename
  fileFormat: string;      // File extension without dot
  yyyy: number;           // Year
  mm: number;            // Month
  dd: number;            // Day
  hh: number;            // Hour
  minute: number;        // Minute
  ss: number;            // Second
  assetPath: string;     // Path relative to public dir (e.g., "/images/file.jpg")
  fileDescription: string; // Empty string
  meta: {
    value: string;
    type: string;
  }
}

API Routes:

GET /api/images: Returns all processed images from data.json
POST /api/sort: Accepts date/time filters and returns matching images


Gallery UI (/results route):

Split-screen layout (50/50)
Left side: Scrollable image list

Shows filename and formatted datetime
Click to select
Keyboard navigation (up/down arrows)
Selected item highlighted in blue
Text wraps if too long


Right side: Image preview

Contains selected image
Maintains aspect ratio
Fills available space




Sort Modal:

Opens via "Sort" button
Contains:

Start/End date inputs
Start/End time inputs
Apply button
Clear All button
Close button


Filters are saved to localStorage
Applied filters persist between page loads
When filters are applied, updates the image list immediately



The app uses TypeScript, Next.js's Image component for optimized image loading, and Tailwind CSS for styling. It includes loading states and error handling for API calls.