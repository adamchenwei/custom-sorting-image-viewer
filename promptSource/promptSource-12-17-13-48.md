# Custom Requirements
- 
- This app uses typescript and nodejs v20
- 

# Content from directory: /Users/adamchenwei/www/custom-sorting-image-viewer/app

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/results/page.tsx

"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { format } from "date-fns";

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
}

const SORT_OPTIONS_KEY = "imageSortOptions";

function SorterModal({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (options: SortOptions) => void;
}) {
  // Initialize with saved values
  const [options, setOptions] = useState<SortOptions>(() => {
    if (typeof window === "undefined")
      return {
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
      };

    const saved = localStorage.getItem(SORT_OPTIONS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved sort options:", e);
      }
    }
    return {
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
    };
  });

  // Update localStorage whenever options change
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(options);
  };

  const handleClear = () => {
    const emptyOptions = {
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
    };
    setOptions(emptyOptions);
    localStorage.setItem(SORT_OPTIONS_KEY, JSON.stringify(emptyOptions));
    onApply(emptyOptions);
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
              onClick={() => {
                setSelectedImage(image);
                setSelectedIndex(index);
              }}
              className={`p-2 cursor-pointer rounded ${
                selectedImage?.assetPath === image.assetPath
                  ? "bg-blue-600 text-white" // Changed from bg-blue-100 to bg-blue-600 and added text-white
                  : "hover:bg-blue-400"
              }`}
            >
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
  title: "Create Next App",
  description: "Generated by create next app",
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

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
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

export async function POST(request: Request) {
  try {
    const options: SortOptions = await request.json();
    console.log('Received sort options:', options);

    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const data: ImageData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log('Total images before filtering:', data.length);

    // Return all images if no filters are applied
    if (!options.startDate && !options.endDate && !options.startTime && !options.endTime) {
      console.log('No filters applied, returning all data');
      return NextResponse.json(data);
    }

    let filteredData = [...data];

    // Date filtering
    if (options.startDate || options.endDate) {
      filteredData = filteredData.filter(item => {
        const itemDateString = `${item.yyyy}-${String(item.mm).padStart(2, '0')}-${String(item.dd).padStart(2, '0')}`;
        
        if (options.startDate && itemDateString < options.startDate) {
          console.log(`Item excluded by start date - Item: ${item.fileName}, Date: ${itemDateString}`);
          return false;
        }
        
        if (options.endDate && itemDateString > options.endDate) {
          console.log(`Item excluded by end date - Item: ${item.fileName}, Date: ${itemDateString}`);
          return false;
        }
        
        return true;
      });
    }

    console.log('Data after date filtering:', filteredData.length);

    // Time filtering
    if (options.startTime || options.endTime) {
      console.log('Applying time filters:', { startTime: options.startTime, endTime: options.endTime });
      
      filteredData = filteredData.filter(item => {
        const itemTimeString = `${String(item.hh).padStart(2, '0')}:${String(item.minute).padStart(2, '0')}`;
        
        if (options.startTime && itemTimeString < options.startTime) {
          console.log(`Item excluded by start time - Item: ${item.fileName}, Time: ${itemTimeString}`);
          return false;
        }
        
        if (options.endTime && itemTimeString > options.endTime) {
          console.log(`Item excluded by end time - Item: ${item.fileName}, Time: ${itemTimeString}`);
          return false;
        }
        
        return true;
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

# Content from main directory: /Users/adamchenwei/www/custom-sorting-image-viewer/

// /Users/adamchenwei/www/custom-sorting-image-viewer//app/results/page.tsx

"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { format } from "date-fns";

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
}

const SORT_OPTIONS_KEY = "imageSortOptions";

function SorterModal({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (options: SortOptions) => void;
}) {
  // Initialize with saved values
  const [options, setOptions] = useState<SortOptions>(() => {
    if (typeof window === "undefined")
      return {
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
      };

    const saved = localStorage.getItem(SORT_OPTIONS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved sort options:", e);
      }
    }
    return {
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
    };
  });

  // Update localStorage whenever options change
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(options);
  };

  const handleClear = () => {
    const emptyOptions = {
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
    };
    setOptions(emptyOptions);
    localStorage.setItem(SORT_OPTIONS_KEY, JSON.stringify(emptyOptions));
    onApply(emptyOptions);
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
              onClick={() => {
                setSelectedImage(image);
                setSelectedIndex(index);
              }}
              className={`p-2 cursor-pointer rounded ${
                selectedImage?.assetPath === image.assetPath
                  ? "bg-blue-600 text-white" // Changed from bg-blue-100 to bg-blue-600 and added text-white
                  : "hover:bg-blue-400"
              }`}
            >
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
  title: "Create Next App",
  description: "Generated by create next app",
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

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
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

export async function POST(request: Request) {
  try {
    const options: SortOptions = await request.json();
    console.log('Received sort options:', options);

    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const data: ImageData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log('Total images before filtering:', data.length);

    // Return all images if no filters are applied
    if (!options.startDate && !options.endDate && !options.startTime && !options.endTime) {
      console.log('No filters applied, returning all data');
      return NextResponse.json(data);
    }

    let filteredData = [...data];

    // Date filtering
    if (options.startDate || options.endDate) {
      filteredData = filteredData.filter(item => {
        const itemDateString = `${item.yyyy}-${String(item.mm).padStart(2, '0')}-${String(item.dd).padStart(2, '0')}`;
        
        if (options.startDate && itemDateString < options.startDate) {
          console.log(`Item excluded by start date - Item: ${item.fileName}, Date: ${itemDateString}`);
          return false;
        }
        
        if (options.endDate && itemDateString > options.endDate) {
          console.log(`Item excluded by end date - Item: ${item.fileName}, Date: ${itemDateString}`);
          return false;
        }
        
        return true;
      });
    }

    console.log('Data after date filtering:', filteredData.length);

    // Time filtering
    if (options.startTime || options.endTime) {
      console.log('Applying time filters:', { startTime: options.startTime, endTime: options.endTime });
      
      filteredData = filteredData.filter(item => {
        const itemTimeString = `${String(item.hh).padStart(2, '0')}:${String(item.minute).padStart(2, '0')}`;
        
        if (options.startTime && itemTimeString < options.startTime) {
          console.log(`Item excluded by start time - Item: ${item.fileName}, Time: ${itemTimeString}`);
          return false;
        }
        
        if (options.endTime && itemTimeString > options.endTime) {
          console.log(`Item excluded by end time - Item: ${item.fileName}, Time: ${itemTimeString}`);
          return false;
        }
        
        return true;
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

function extractDateTimeFromFileName(fileName: string): ImageData | null {
  console.log('Processing file:', fileName);
  
  // Format: Screenshot_20241204_170033.jpg (YYYYMMDD_HHMMSS)
  const match = fileName.match(/Screenshot_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (match) {
    console.log('Matched filename pattern, groups:', match.slice(1));
    const [_, yyyy, mm, dd, hh, minute, ss] = match;
    
    // Convert all strings to numbers with parseInt
    const data = {
      fileName,
      fileFormat: path.extname(fileName).slice(1),
      yyyy: parseInt(yyyy, 10),
      mm: parseInt(mm, 10),
      dd: parseInt(dd, 10),
      hh: parseInt(hh, 10),
      minute: parseInt(minute, 10),
      ss: parseInt(ss, 10),
      assetPath: '',
      fileDescription: '',
      meta: {
        value: '',
        type: '',
      }
    };
    
    console.log('Extracted data:', data);
    return data;
  }

  console.log('No pattern matched for file:', fileName);
  return null;
}

function processImagesDirectory(dirPath: string, baseDir: string): ImageData[] {
  console.log('Processing directory:', dirPath);
  const items: ImageData[] = [];
  
  try {
    const files: string[] = fs.readdirSync(dirPath);
    console.log('Found files:', files);

    files.forEach((file: string) => {
      const fullPath: string = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        console.log('Found subdirectory:', file);
        items.push(...processImagesDirectory(fullPath, baseDir));
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
          }
        }
      }
    });
  } catch (error) {
    console.error('Error processing directory:', dirPath, error);
  }

  return items;
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

  const imageData: ImageData[] = processImagesDirectory(imagesDir, publicDir);
  console.log('Processed image data:', imageData);

  const outputPath = path.join(publicDir, 'data.json');
  fs.writeFileSync(outputPath, JSON.stringify(imageData, null, 2));
  console.log(`Written ${imageData.length} items to:`, outputPath);
}

main();

