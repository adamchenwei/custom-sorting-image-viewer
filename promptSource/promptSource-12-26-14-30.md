# Custom Requirements
- 
- This app uses tailwind for css, typescript and nodejs v20
- This app uses typescript and nodejs v20
- This app used for browsing images in productive way to analysis and perform crud on the images
- 

# Content from directory: /Users/adamchenwei/www/custom-sorting-image-viewer/app

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/results/page.tsx

"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { format, getDay } from "date-fns";
import { X } from "lucide-react";
import { deleteImage } from "../services/imageService";

interface ImageData {
  fileName: string;
  assetPath: string;
  yyyy: number;
  mm: number;
  dd: number;
  hh: number;
  minute: number;
  ss: number;
}

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[]; // Array of selected days of the week
}

const SORT_OPTIONS_KEY = "imageSortOptions";
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_OPTIONS: SortOptions = {
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  weeks: [], // Initialize with empty array
};

function SorterModal({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (options: SortOptions) => void;
}) {
  const [options, setOptions] = useState<SortOptions>(() => {
    if (typeof window === "undefined") return DEFAULT_OPTIONS;

    const saved = localStorage.getItem(SORT_OPTIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure weeks array exists
        return {
          ...DEFAULT_OPTIONS,
          ...parsed,
          weeks: Array.isArray(parsed.weeks) ? parsed.weeks : [],
        };
      } catch (e) {
        console.error("Error parsing saved sort options:", e);
        return DEFAULT_OPTIONS;
      }
    }
    return DEFAULT_OPTIONS;
  });

  useEffect(() => {
    localStorage.setItem(SORT_OPTIONS_KEY, JSON.stringify(options));
  }, [options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOptions((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWeekChange = (day: string) => {
    setOptions((prev) => ({
      ...prev,
      weeks: prev.weeks.includes(day)
        ? prev.weeks.filter((d) => d !== day)
        : [...prev.weeks, day],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(options);
  };

  const handleClear = () => {
    setOptions(DEFAULT_OPTIONS);
    localStorage.setItem(SORT_OPTIONS_KEY, JSON.stringify(DEFAULT_OPTIONS));
    onApply(DEFAULT_OPTIONS);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sort Options</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={options.startDate}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={options.endDate}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={options.startTime}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={options.endTime}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Days of Week
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={options.weeks?.includes(day) ?? false}
                      onChange={() => handleWeekChange(day)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
            <div className="space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [showSorter, setShowSorter] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadImagesWithSavedSort = async () => {
      try {
        setLoading(true);
        setError(null);

        const savedOptions = localStorage.getItem(SORT_OPTIONS_KEY);
        const sortOptions = savedOptions ? JSON.parse(savedOptions) : null;

        if (
          sortOptions &&
          Object.values(sortOptions).some((value) => value !== "")
        ) {
          const response = await fetch("/api/sort", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sortOptions),
          });
          const data = await response.json();
          setImages(data);
          if (data.length > 0) {
            setSelectedImage(data[0]);
            setSelectedIndex(0);
          }
        } else {
          const response = await fetch("/api/images");
          const data = await response.json();
          setImages(data);
          if (data.length > 0) {
            setSelectedImage(data[0]);
            setSelectedIndex(0);
          }
        }
      } catch (err) {
        console.error("Error loading images:", err);
        setError("Failed to load images");
      } finally {
        setLoading(false);
      }
    };

    loadImagesWithSavedSort();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && selectedIndex > 0) {
        setSelectedIndex((prev) => prev - 1);
        setSelectedImage(images[selectedIndex - 1]);
      } else if (e.key === "ArrowDown" && selectedIndex < images.length - 1) {
        setSelectedIndex((prev) => prev + 1);
        setSelectedImage(images[selectedIndex + 1]);
      }
    },
    [selectedIndex, images]
  );

  const handleDelete = async (image: ImageData, index: number) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      setLoading(true);
      console.log("Deleting image:", image);

      await deleteImage(image.assetPath, image.fileName);

      // Update local state
      setImages((prevImages) =>
        prevImages.filter((img) => img.assetPath !== image.assetPath)
      );

      // If the deleted image was selected, select the next available image
      if (selectedImage?.assetPath === image.assetPath) {
        const nextIndex = Math.min(index, images.length - 2);
        if (nextIndex >= 0) {
          setSelectedImage(images[nextIndex]);
          setSelectedIndex(nextIndex);
        } else {
          setSelectedImage(null);
          setSelectedIndex(-1);
        }
      }
    } catch (error) {
      console.error("Error in handleDelete:", error);
      setError("Failed to delete image");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen">
      {/* Left side - Image list */}
      <div className="w-1/2 overflow-y-auto p-4">
        <button
          onClick={() => setShowSorter(true)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sort
        </button>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded">
            Loading...
          </div>
        )}

        <div className="space-y-2">
          {images.length === 0 && !loading && (
            <div className="p-2 text-gray-500">
              No images found matching the criteria
            </div>
          )}

          {images.map((image, index) => (
            <div
              key={image.assetPath}
              className={`p-2 cursor-pointer rounded flex justify-between items-start group ${
                selectedImage?.assetPath === image.assetPath
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-400"
              }`}
              onClick={() => {
                setSelectedImage(image);
                setSelectedIndex(index);
              }}
            >
              <div className="flex-1">
                <div className="break-words">{image.fileName}</div>
                <div
                  className={`text-sm ${
                    selectedImage?.assetPath === image.assetPath
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {format(
                    new Date(
                      image.yyyy,
                      image.mm - 1,
                      image.dd,
                      image.hh,
                      image.minute,
                      image.ss
                    ),
                    "PPpp"
                  )}
                </div>
              </div>
              <button
                className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                  selectedImage?.assetPath === image.assetPath
                    ? "hover:bg-blue-700 text-white"
                    : "hover:bg-blue-500 text-gray-600 hover:text-white"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(image, index);
                }}
                aria-label="Delete image"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Image preview */}
      <div className="w-1/2 h-full relative">
        {selectedImage ? (
          <Image
            src={selectedImage.assetPath}
            alt={selectedImage.fileName}
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No image selected
          </div>
        )}
      </div>

      {/* Sorter Modal */}
      {showSorter && (
        <SorterModal
          onClose={() => setShowSorter(false)}
          onApply={async (options) => {
            try {
              setLoading(true);
              setError(null);
              const response = await fetch("/api/sort", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(options),
              });
              const sortedData = await response.json();
              setImages(sortedData);
              if (sortedData.length > 0) {
                setSelectedImage(sortedData[0]);
                setSelectedIndex(0);
              } else {
                setSelectedImage(null);
                setSelectedIndex(-1);
              }
              setShowSorter(false);
            } catch (err) {
              console.error("Error applying sort:", err);
              setError("Failed to apply sorting");
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </div>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/layout.tsx

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Custom Sorting Image Viewer",
  description: "Custom Sorting Image Viewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/sort/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDay } from 'date-fns';

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks?: string[];
}

interface ImageData {
  fileName: string;
  fileFormat: string;
  yyyy: number;
  mm: number;
  dd: number;
  hh: number;
  minute: number;
  ss: number;
  assetPath: string;
}

// Helper function to convert day name to number (0-6, where 0 is Sunday)
function getDayNumber(dayName: string): number {
  const days = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  return days[dayName as keyof typeof days] ?? -1;
}

export async function POST(request: Request) {
  try {
    const options: SortOptions = await request.json();
    console.log('Received sort options:', options);

    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const data: ImageData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log('Total images before filtering:', data.length);

    // Return all images if no filters are applied
    if (!options.startDate && !options.endDate && !options.startTime && !options.endTime && (!options.weeks || options.weeks.length === 0)) {
      console.log('No filters applied, returning all data');
      return NextResponse.json(data);
    }

    let filteredData = [...data];

    // Date filtering
    if (options.startDate || options.endDate) {
      filteredData = filteredData.filter(item => {
        const itemDateString = `${item.yyyy}-${String(item.mm).padStart(2, '0')}-${String(item.dd).padStart(2, '0')}`;
        
        if (options.startDate && itemDateString < options.startDate) {
          return false;
        }
        
        if (options.endDate && itemDateString > options.endDate) {
          return false;
        }
        
        return true;
      });
    }

    // Time filtering
    if (options.startTime || options.endTime) {
      filteredData = filteredData.filter(item => {
        const itemTimeString = `${String(item.hh).padStart(2, '0')}:${String(item.minute).padStart(2, '0')}`;
        
        if (options.startTime && itemTimeString < options.startTime) {
          return false;
        }
        
        if (options.endTime && itemTimeString > options.endTime) {
          return false;
        }
        
        return true;
      });
    }

    // Week day filtering
    if (options.weeks && Array.isArray(options.weeks) && options.weeks.length > 0) {
      filteredData = filteredData.filter(item => {
        const date = new Date(item.yyyy, item.mm - 1, item.dd);
        const dayNumber = getDay(date);
        return options.weeks?.some(dayName => getDayNumber(dayName) === dayNumber) ?? false;
      });
    }

    console.log('Final filtered data length:', filteredData.length);
    return NextResponse.json(filteredData);

  } catch (error) {
    console.error('Sort API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/images/delete/route.ts

// app/api/images/delete/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface DeleteRequest {
  assetPath: string;
  fileName: string;
}

export async function POST(request: Request) {
  try {
    const body: DeleteRequest = await request.json();
    console.log('Delete request received:', body);
    
    // 1. Delete the file from public/images
    const imagePath = path.join(process.cwd(), 'public', 'images', body.fileName);
    console.log('Attempting to delete file at:', imagePath);
    
    try {
      const stats = await fs.stat(imagePath);
      console.log('File exists:', stats.isFile());
      
      // Delete the actual image file
      await fs.unlink(imagePath);
      console.log('Successfully deleted image file');
    } catch (error: any) {
      console.error('Error during file deletion:', {
        error: error.message,
        code: error.code,
        path: imagePath
      });
      
      return NextResponse.json(
        { 
          error: 'Image file could not be deleted',
          details: error.message,
          path: imagePath
        },
        { status: 500 }
      );
    }

    // 2. Update data.json
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    console.log('Updating data.json at:', dataPath);
    
    try {
      const dataContent = await fs.readFile(dataPath, 'utf-8');
      const data = JSON.parse(dataContent);
      
      console.log('Current data entries:', data.length);
      const updatedData = data.filter((item: any) => item.assetPath !== body.assetPath);
      console.log('Updated data entries:', updatedData.length);
      
      await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));
      console.log('Successfully updated data.json');
      
      return NextResponse.json({ 
        success: true,
        message: 'Image and data entry successfully deleted',
        deletedFile: imagePath
      });
    } catch (error) {
      console.error('Error updating data.json:', error);
      return NextResponse.json(
        { error: 'Failed to update data.json' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Delete API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/images/route.ts

// app/api/images/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dataPath = path.join(process.cwd(), 'public', 'data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  return NextResponse.json(data);
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/page.tsx

import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="https://nextjs.org/icons/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              app/page.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="https://nextjs.org/icons/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/services/imageService.ts

// app/services/imageService.ts
export async function deleteImage(assetPath: string, fileName: string): Promise<boolean> {
  try {
    console.log('Sending delete request for:', { assetPath, fileName });
    
    const response = await fetch('/api/images/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assetPath, fileName }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Delete request failed:', result);
      throw new Error(result.error || 'Failed to delete image');
    }

    console.log('Delete response:', result);
    return true;
  } catch (error) {
    console.error('Error in deleteImage service:', error);
    throw error;
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/tsconfig.json

{
  "compilerOptions": {
    "target": "es2017",
    "module": "commonjs",
    "lib": [
      "es2017"
    ],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "scripts/**/*",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/package.json

{
  "name": "custom-sorting-image-viewer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "next start",
    "lint": "next lint",
    "process-images": "ts-node scripts/processImages.ts",
    "dev": "npm run process-images && next dev",
    "prompt": "./scripts/consolidate-app-custom-sorting-image-viewer.sh ./app/ --exclude node_modules dist",
    "build": "npm run process-images && next build"
  },
  "dependencies": {
    "date-fns": "^4.1.0",
    "lucide-react": "^0.469.0",
    "next": "14.2.13",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20.17.10",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.13",
    "install": "^0.13.0",
    "npm": "^11.0.0",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2"
  }
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;


# Content from main directory: /Users/adamchenwei/www/custom-sorting-image-viewer/

// /Users/adamchenwei/www/custom-sorting-image-viewer//app/results/page.tsx

"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { format, getDay } from "date-fns";
import { X } from "lucide-react";
import { deleteImage } from "../services/imageService";

interface ImageData {
  fileName: string;
  assetPath: string;
  yyyy: number;
  mm: number;
  dd: number;
  hh: number;
  minute: number;
  ss: number;
}

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[]; // Array of selected days of the week
}

const SORT_OPTIONS_KEY = "imageSortOptions";
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_OPTIONS: SortOptions = {
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  weeks: [], // Initialize with empty array
};

function SorterModal({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (options: SortOptions) => void;
}) {
  const [options, setOptions] = useState<SortOptions>(() => {
    if (typeof window === "undefined") return DEFAULT_OPTIONS;

    const saved = localStorage.getItem(SORT_OPTIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure weeks array exists
        return {
          ...DEFAULT_OPTIONS,
          ...parsed,
          weeks: Array.isArray(parsed.weeks) ? parsed.weeks : [],
        };
      } catch (e) {
        console.error("Error parsing saved sort options:", e);
        return DEFAULT_OPTIONS;
      }
    }
    return DEFAULT_OPTIONS;
  });

  useEffect(() => {
    localStorage.setItem(SORT_OPTIONS_KEY, JSON.stringify(options));
  }, [options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOptions((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWeekChange = (day: string) => {
    setOptions((prev) => ({
      ...prev,
      weeks: prev.weeks.includes(day)
        ? prev.weeks.filter((d) => d !== day)
        : [...prev.weeks, day],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(options);
  };

  const handleClear = () => {
    setOptions(DEFAULT_OPTIONS);
    localStorage.setItem(SORT_OPTIONS_KEY, JSON.stringify(DEFAULT_OPTIONS));
    onApply(DEFAULT_OPTIONS);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sort Options</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={options.startDate}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={options.endDate}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={options.startTime}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={options.endTime}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Days of Week
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={options.weeks?.includes(day) ?? false}
                      onChange={() => handleWeekChange(day)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
            <div className="space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [showSorter, setShowSorter] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadImagesWithSavedSort = async () => {
      try {
        setLoading(true);
        setError(null);

        const savedOptions = localStorage.getItem(SORT_OPTIONS_KEY);
        const sortOptions = savedOptions ? JSON.parse(savedOptions) : null;

        if (
          sortOptions &&
          Object.values(sortOptions).some((value) => value !== "")
        ) {
          const response = await fetch("/api/sort", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sortOptions),
          });
          const data = await response.json();
          setImages(data);
          if (data.length > 0) {
            setSelectedImage(data[0]);
            setSelectedIndex(0);
          }
        } else {
          const response = await fetch("/api/images");
          const data = await response.json();
          setImages(data);
          if (data.length > 0) {
            setSelectedImage(data[0]);
            setSelectedIndex(0);
          }
        }
      } catch (err) {
        console.error("Error loading images:", err);
        setError("Failed to load images");
      } finally {
        setLoading(false);
      }
    };

    loadImagesWithSavedSort();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && selectedIndex > 0) {
        setSelectedIndex((prev) => prev - 1);
        setSelectedImage(images[selectedIndex - 1]);
      } else if (e.key === "ArrowDown" && selectedIndex < images.length - 1) {
        setSelectedIndex((prev) => prev + 1);
        setSelectedImage(images[selectedIndex + 1]);
      }
    },
    [selectedIndex, images]
  );

  const handleDelete = async (image: ImageData, index: number) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      setLoading(true);
      console.log("Deleting image:", image);

      await deleteImage(image.assetPath, image.fileName);

      // Update local state
      setImages((prevImages) =>
        prevImages.filter((img) => img.assetPath !== image.assetPath)
      );

      // If the deleted image was selected, select the next available image
      if (selectedImage?.assetPath === image.assetPath) {
        const nextIndex = Math.min(index, images.length - 2);
        if (nextIndex >= 0) {
          setSelectedImage(images[nextIndex]);
          setSelectedIndex(nextIndex);
        } else {
          setSelectedImage(null);
          setSelectedIndex(-1);
        }
      }
    } catch (error) {
      console.error("Error in handleDelete:", error);
      setError("Failed to delete image");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen">
      {/* Left side - Image list */}
      <div className="w-1/2 overflow-y-auto p-4">
        <button
          onClick={() => setShowSorter(true)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sort
        </button>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded">
            Loading...
          </div>
        )}

        <div className="space-y-2">
          {images.length === 0 && !loading && (
            <div className="p-2 text-gray-500">
              No images found matching the criteria
            </div>
          )}

          {images.map((image, index) => (
            <div
              key={image.assetPath}
              className={`p-2 cursor-pointer rounded flex justify-between items-start group ${
                selectedImage?.assetPath === image.assetPath
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-400"
              }`}
              onClick={() => {
                setSelectedImage(image);
                setSelectedIndex(index);
              }}
            >
              <div className="flex-1">
                <div className="break-words">{image.fileName}</div>
                <div
                  className={`text-sm ${
                    selectedImage?.assetPath === image.assetPath
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {format(
                    new Date(
                      image.yyyy,
                      image.mm - 1,
                      image.dd,
                      image.hh,
                      image.minute,
                      image.ss
                    ),
                    "PPpp"
                  )}
                </div>
              </div>
              <button
                className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                  selectedImage?.assetPath === image.assetPath
                    ? "hover:bg-blue-700 text-white"
                    : "hover:bg-blue-500 text-gray-600 hover:text-white"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(image, index);
                }}
                aria-label="Delete image"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Image preview */}
      <div className="w-1/2 h-full relative">
        {selectedImage ? (
          <Image
            src={selectedImage.assetPath}
            alt={selectedImage.fileName}
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No image selected
          </div>
        )}
      </div>

      {/* Sorter Modal */}
      {showSorter && (
        <SorterModal
          onClose={() => setShowSorter(false)}
          onApply={async (options) => {
            try {
              setLoading(true);
              setError(null);
              const response = await fetch("/api/sort", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(options),
              });
              const sortedData = await response.json();
              setImages(sortedData);
              if (sortedData.length > 0) {
                setSelectedImage(sortedData[0]);
                setSelectedIndex(0);
              } else {
                setSelectedImage(null);
                setSelectedIndex(-1);
              }
              setShowSorter(false);
            } catch (err) {
              console.error("Error applying sort:", err);
              setError("Failed to apply sorting");
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </div>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer//app/layout.tsx

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Custom Sorting Image Viewer",
  description: "Custom Sorting Image Viewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer//app/api/sort/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDay } from 'date-fns';

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks?: string[];
}

interface ImageData {
  fileName: string;
  fileFormat: string;
  yyyy: number;
  mm: number;
  dd: number;
  hh: number;
  minute: number;
  ss: number;
  assetPath: string;
}

// Helper function to convert day name to number (0-6, where 0 is Sunday)
function getDayNumber(dayName: string): number {
  const days = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  return days[dayName as keyof typeof days] ?? -1;
}

export async function POST(request: Request) {
  try {
    const options: SortOptions = await request.json();
    console.log('Received sort options:', options);

    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const data: ImageData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log('Total images before filtering:', data.length);

    // Return all images if no filters are applied
    if (!options.startDate && !options.endDate && !options.startTime && !options.endTime && (!options.weeks || options.weeks.length === 0)) {
      console.log('No filters applied, returning all data');
      return NextResponse.json(data);
    }

    let filteredData = [...data];

    // Date filtering
    if (options.startDate || options.endDate) {
      filteredData = filteredData.filter(item => {
        const itemDateString = `${item.yyyy}-${String(item.mm).padStart(2, '0')}-${String(item.dd).padStart(2, '0')}`;
        
        if (options.startDate && itemDateString < options.startDate) {
          return false;
        }
        
        if (options.endDate && itemDateString > options.endDate) {
          return false;
        }
        
        return true;
      });
    }

    // Time filtering
    if (options.startTime || options.endTime) {
      filteredData = filteredData.filter(item => {
        const itemTimeString = `${String(item.hh).padStart(2, '0')}:${String(item.minute).padStart(2, '0')}`;
        
        if (options.startTime && itemTimeString < options.startTime) {
          return false;
        }
        
        if (options.endTime && itemTimeString > options.endTime) {
          return false;
        }
        
        return true;
      });
    }

    // Week day filtering
    if (options.weeks && Array.isArray(options.weeks) && options.weeks.length > 0) {
      filteredData = filteredData.filter(item => {
        const date = new Date(item.yyyy, item.mm - 1, item.dd);
        const dayNumber = getDay(date);
        return options.weeks?.some(dayName => getDayNumber(dayName) === dayNumber) ?? false;
      });
    }

    console.log('Final filtered data length:', filteredData.length);
    return NextResponse.json(filteredData);

  } catch (error) {
    console.error('Sort API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer//app/api/images/delete/route.ts

// app/api/images/delete/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface DeleteRequest {
  assetPath: string;
  fileName: string;
}

export async function POST(request: Request) {
  try {
    const body: DeleteRequest = await request.json();
    console.log('Delete request received:', body);
    
    // 1. Delete the file from public/images
    const imagePath = path.join(process.cwd(), 'public', 'images', body.fileName);
    console.log('Attempting to delete file at:', imagePath);
    
    try {
      const stats = await fs.stat(imagePath);
      console.log('File exists:', stats.isFile());
      
      // Delete the actual image file
      await fs.unlink(imagePath);
      console.log('Successfully deleted image file');
    } catch (error: any) {
      console.error('Error during file deletion:', {
        error: error.message,
        code: error.code,
        path: imagePath
      });
      
      return NextResponse.json(
        { 
          error: 'Image file could not be deleted',
          details: error.message,
          path: imagePath
        },
        { status: 500 }
      );
    }

    // 2. Update data.json
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    console.log('Updating data.json at:', dataPath);
    
    try {
      const dataContent = await fs.readFile(dataPath, 'utf-8');
      const data = JSON.parse(dataContent);
      
      console.log('Current data entries:', data.length);
      const updatedData = data.filter((item: any) => item.assetPath !== body.assetPath);
      console.log('Updated data entries:', updatedData.length);
      
      await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));
      console.log('Successfully updated data.json');
      
      return NextResponse.json({ 
        success: true,
        message: 'Image and data entry successfully deleted',
        deletedFile: imagePath
      });
    } catch (error) {
      console.error('Error updating data.json:', error);
      return NextResponse.json(
        { error: 'Failed to update data.json' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Delete API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer//app/api/images/route.ts

// app/api/images/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const dataPath = path.join(process.cwd(), 'public', 'data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  return NextResponse.json(data);
}

// /Users/adamchenwei/www/custom-sorting-image-viewer//app/page.tsx

import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="https://nextjs.org/icons/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              app/page.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="https://nextjs.org/icons/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer//app/services/imageService.ts

// app/services/imageService.ts
export async function deleteImage(assetPath: string, fileName: string): Promise<boolean> {
  try {
    console.log('Sending delete request for:', { assetPath, fileName });
    
    const response = await fetch('/api/images/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assetPath, fileName }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Delete request failed:', result);
      throw new Error(result.error || 'Failed to delete image');
    }

    console.log('Delete response:', result);
    return true;
  } catch (error) {
    console.error('Error in deleteImage service:', error);
    throw error;
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer//next-env.d.ts

/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.


// /Users/adamchenwei/www/custom-sorting-image-viewer//tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;


// /Users/adamchenwei/www/custom-sorting-image-viewer//scripts/processImages.ts

// scripts/processImages.ts
const fs = require('fs');
const path = require('path');

interface ImageData {
  fileName: string;
  fileFormat: string;
  yyyy: number;
  mm: number;
  dd: number;
  hh: number;
  minute: number;
  ss: number;
  assetPath: string;
  fileDescription: string;
  meta: {
    value: string;
    type: string;
  };
}

interface ProcessingSummary {
  processedFiles: string[];
  unprocessedFiles: string[];
}

function extractDateTimeFromFileName(fileName: string): ImageData | null {
  console.log('Processing file:', fileName);
  
  // Format 1: Screenshot_20241204_170033.jpg (YYYYMMDD_HHMMSS)
  let match = fileName.match(/Screenshot_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  
  // Format 2: Screenshot_2024-12-19_205547_com.ubercab.driver.jpg (YYYY-MM-DD_HHMMSS_description)
  if (!match) {
    match = fileName.match(/Screenshot_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})_(.+)\.jpg/);
  }

  // Format 3: 20240921_135601295.jpeg (YYYYMMDD_HHMMSSXXX)
  if (!match) {
    match = fileName.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\d{3}\.(jpeg|jpg)$/);
  }

  if (match) {
    console.log('Matched filename pattern, groups:', match.slice(1));
    const [_, yyyy, mm, dd, hh, minute, ss, description] = match;
    
    // Convert all strings to numbers with parseInt
    const data: ImageData = {
      fileName,
      fileFormat: path.extname(fileName).slice(1),
      yyyy: parseInt(yyyy, 10),
      mm: parseInt(mm, 10),
      dd: parseInt(dd, 10),
      hh: parseInt(hh, 10),
      minute: parseInt(minute, 10),
      ss: parseInt(ss, 10),
      assetPath: '',
      fileDescription: description ? description.replace(/_/g, ' ') : '',
      meta: {
        value: 'timestamp',
        type: 'image'
      }
    };
    
    console.log('Extracted data:', data);
    return data;
  }

  console.log('No pattern matched for file:', fileName);
  return null;
}

function processImagesDirectory(dirPath: string, baseDir: string): { items: ImageData[], summary: ProcessingSummary } {
  console.log('Processing directory:', dirPath);
  const items: ImageData[] = [];
  const summary: ProcessingSummary = {
    processedFiles: [],
    unprocessedFiles: []
  };
  
  try {
    const files: string[] = fs.readdirSync(dirPath);
    console.log('Found files:', files);

    files.forEach((file: string) => {
      const fullPath: string = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        console.log('Found subdirectory:', file);
        const subDirResult = processImagesDirectory(fullPath, baseDir);
        items.push(...subDirResult.items);
        summary.processedFiles.push(...subDirResult.summary.processedFiles);
        summary.unprocessedFiles.push(...subDirResult.summary.unprocessedFiles);
      } else {
        const fileExt: string = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg'].includes(fileExt)) {
          console.log('Processing image file:', file);
          const imageData = extractDateTimeFromFileName(file);
          
          if (imageData) {
            const relativePath: string = path.relative(baseDir, fullPath);
            imageData.assetPath = '/' + relativePath.replace(/\\/g, '/');
            console.log('Added image data:', imageData);
            items.push(imageData);
            summary.processedFiles.push(file);
          } else {
            summary.unprocessedFiles.push(file);
          }
        } else {
          // Non-jpg files are considered unprocessed
          summary.unprocessedFiles.push(file);
        }
      }
    });

    // Sort items by date and time, newest first
    items.sort((a, b) => {
      const dateA = new Date(a.yyyy, a.mm - 1, a.dd, a.hh, a.minute, a.ss);
      const dateB = new Date(b.yyyy, b.mm - 1, b.dd, b.hh, b.minute, b.ss);
      return dateB.getTime() - dateA.getTime();
    });

  } catch (error) {
    console.error('Error processing directory:', dirPath, error);
  }

  return { items, summary };
}

function printSummary(summary: ProcessingSummary, totalFiles: number): void {
  console.log('\n=== Processing Summary ===');
  console.log(`Total files found: ${totalFiles}`);
  console.log(`Successfully processed: ${summary.processedFiles.length} files`);
  console.log(`Failed to process: ${summary.unprocessedFiles.length} files\n`);

  if (summary.unprocessedFiles.length > 0) {
    console.log('Failed to process the following files:');
    summary.unprocessedFiles.forEach(file => console.log(`  • ${file}`));
  }
  console.log('\n=========================');
}

function main() {
  console.log('Starting image processing...');
  const publicDir: string = path.join(process.cwd(), 'public');
  const imagesDir: string = path.join(publicDir, 'images');
  
  console.log('Public directory:', publicDir);
  console.log('Images directory:', imagesDir);
  
  if (!fs.existsSync(imagesDir)) {
    console.log('Images directory does not exist, creating it...');
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const { items: imageData, summary } = processImagesDirectory(imagesDir, publicDir);
  console.log('Processed image data:', imageData);

  const outputPath = path.join(publicDir, 'data.json');
  fs.writeFileSync(outputPath, JSON.stringify(imageData, null, 2));
  console.log(`Written ${imageData.length} items to:`, outputPath);

  // Print processing summary
  const totalFiles = summary.processedFiles.length + summary.unprocessedFiles.length;
  printSummary(summary, totalFiles);
}

main();

