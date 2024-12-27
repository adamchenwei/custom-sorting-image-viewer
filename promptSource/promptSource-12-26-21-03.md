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
import { format } from "date-fns";
import { ArrowRight, X, CheckSquare, Square } from "lucide-react";
import { deleteImage, moveImages } from "../services/imageService";
import { MoveModal } from "../components/MoveModal";
import { SorterModal } from "../components/SorterModal";

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
  weeks: string[];
}

export default function ResultsPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showSorter, setShowSorter] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [currentSortOptions, setCurrentSortOptions] =
    useState<SortOptions | null>(null);

  const loadImagesWithSort = async (sortOptions: SortOptions | null) => {
    try {
      setLoading(true);
      setError(null);

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

  useEffect(() => {
    const savedOptions = localStorage.getItem("imageSortOptions");
    const sortOptions = savedOptions ? JSON.parse(savedOptions) : null;
    setCurrentSortOptions(sortOptions);
    loadImagesWithSort(sortOptions);
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

  const handleImageSelect = (image: ImageData, event: React.MouseEvent) => {
    // If shift key is pressed, maintain preview selection
    if (!event.shiftKey) {
      setSelectedImage(image);
      setSelectedIndex(
        images.findIndex((img) => img.assetPath === image.assetPath)
      );
    }

    // Toggle selection for multi-select
    setSelectedImages((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(image.assetPath)) {
        newSelection.delete(image.assetPath);
      } else {
        newSelection.add(image.assetPath);
      }
      return newSelection;
    });
  };

  const handleMove = async (targetPath: string) => {
    try {
      setLoading(true);
      setError(null);

      const imagesToMove = Array.from(selectedImages).map((assetPath) => {
        const image = images.find((img) => img.assetPath === assetPath);
        return {
          assetPath,
          fileName: image!.fileName,
        };
      });

      const moveResult = await moveImages(
        imagesToMove,
        targetPath,
        currentSortOptions || undefined
      );

      if (moveResult.success && moveResult.data) {
        setImages(moveResult.data);

        // Update selected image if needed
        if (moveResult.data.length > 0) {
          const firstVisibleSelected = moveResult.data.find((img) =>
            selectedImages.has(img.assetPath)
          );
          if (firstVisibleSelected) {
            setSelectedImage(firstVisibleSelected);
            setSelectedIndex(moveResult.data.indexOf(firstVisibleSelected));
          } else {
            setSelectedImage(moveResult.data[0]);
            setSelectedIndex(0);
          }
        } else {
          setSelectedImage(null);
          setSelectedIndex(-1);
        }
      }

      // Clear selections after move
      setSelectedImages(new Set());
      setShowMoveModal(false);
    } catch (err) {
      console.error("Error moving images:", err);
      setError("Failed to move images");
    } finally {
      setLoading(false);
    }
  };

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

      // Remove from selected images if it was selected
      if (selectedImages.has(image.assetPath)) {
        setSelectedImages((prev) => {
          const newSelection = new Set(prev);
          newSelection.delete(image.assetPath);
          return newSelection;
        });
      }

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

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedImages.size} images?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const imagesToDelete = Array.from(selectedImages).map((assetPath) => {
        const image = images.find((img) => img.assetPath === assetPath);
        return {
          assetPath,
          fileName: image!.fileName,
        };
      });

      await deleteImages(imagesToDelete);

      // Update local state
      setImages((prevImages) =>
        prevImages.filter((img) => !selectedImages.has(img.assetPath))
      );

      // If any of the deleted images was selected, select the first remaining image
      if (selectedImage && selectedImages.has(selectedImage.assetPath)) {
        const remainingImages = images.filter(
          (img) => !selectedImages.has(img.assetPath)
        );
        if (remainingImages.length > 0) {
          setSelectedImage(remainingImages[0]);
          setSelectedIndex(0);
        } else {
          setSelectedImage(null);
          setSelectedIndex(-1);
        }
      }

      // Clear selections
      setSelectedImages(new Set());
    } catch (err) {
      console.error("Error deleting images:", err);
      setError("Failed to delete images");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySort = async (options: SortOptions) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentSortOptions(options);
      await loadImagesWithSort(options);
      setShowSorter(false);
    } catch (err) {
      console.error("Error applying sort:", err);
      setError("Failed to apply sorting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left side - Image list */}
      <div className="w-1/2 overflow-y-auto p-4">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setShowSorter(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sort
          </button>
          {selectedImages.size > 0 && (
            <>
              <button
                onClick={() => setShowMoveModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Move Selected ({selectedImages.size})
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Selected ({selectedImages.size})
              </button>
            </>
          )}
        </div>

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
              className={`p-2 cursor-pointer rounded flex items-start group ${
                selectedImage?.assetPath === image.assetPath
                  ? "bg-blue-100"
                  : "hover:bg-gray-100"
              } ${selectedImages.has(image.assetPath) ? "bg-blue-50" : ""}`}
              onClick={(e) => handleImageSelect(image, e)}
            >
              {/* Checkbox */}
              <div className="flex-shrink-0 mr-2">
                {selectedImages.has(image.assetPath) ? (
                  <CheckSquare className="text-blue-500" size={20} />
                ) : (
                  <Square className="text-gray-400" size={20} />
                )}
              </div>

              {/* Thumbnail Container */}
              <div className="flex-shrink-0 mr-3 relative w-16 h-16">
                <Image
                  src={image.assetPath}
                  alt={image.fileName}
                  fill
                  sizes="64px"
                  className="rounded object-cover"
                  priority={index < 10}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="break-words truncate">{image.fileName}</div>
                <div className="text-sm text-gray-500">
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

              {/* Action Buttons */}
              <div className="flex items-center ml-2 flex-shrink-0">
                <button
                  className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500 text-gray-600 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(image, index);
                  }}
                  aria-label="Delete image"
                >
                  <X size={16} />
                </button>
                <button
                  className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500 text-gray-600 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImages(new Set([image.assetPath]));
                    setShowMoveModal(true);
                  }}
                  aria-label="Move image"
                >
                  <ArrowRight size={16} />
                </button>
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

      {/* Modals */}
      {showMoveModal && selectedImages.size > 0 && (
        <MoveModal
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
            setSelectedImages(new Set());
          }}
          onSubmit={handleMove}
          selectionCount={selectedImages.size}
        />
      )}

      {showSorter && (
        <SorterModal
          onClose={() => setShowSorter(false)}
          onApply={handleApplySort}
        />
      )}
    </div>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/components/MoveModal.tsx

// app/components/MoveModal.tsx
import React, { useState, useEffect } from "react";

interface MoveModalProps {
  onClose: () => void;
  onSubmit: (targetPath: string) => void;
  isOpen: boolean;
  selectionCount?: number;
}

const MOVE_PATH_KEY = "imageMoveTargetPath";

export function MoveModal({
  onClose,
  onSubmit,
  isOpen,
  selectionCount = 1,
}: MoveModalProps) {
  const [targetPath, setTargetPath] = useState("");

  // Load from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedPath = localStorage.getItem(MOVE_PATH_KEY);
      if (savedPath) {
        setTargetPath(savedPath);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit(targetPath);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onSubmit, targetPath]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(MOVE_PATH_KEY, targetPath);
    onSubmit(targetPath);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Move {selectionCount} {selectionCount === 1 ? "Image" : "Images"}
          </h2>
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
                Target Directory (under /public)
              </label>
              <input
                type="text"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder="e.g., images/processed"
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Move
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer/app/components/SorterModal.tsx

import { useState, useEffect } from "react";
import { format, addMinutes } from "date-fns";

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[];
}

interface SorterModalProps {
  onClose: () => void;
  onApply: (options: SortOptions) => void;
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

function getDefaultOptions(): SortOptions {
  const now = new Date();
  const threeYearsAgo = new Date(now);
  threeYearsAgo.setFullYear(now.getFullYear() - 3);
  const later = addMinutes(now, 15);

  return {
    startDate: format(threeYearsAgo, "yyyy-MM-dd"),
    endDate: format(now, "yyyy-MM-dd"),
    startTime: format(now, "HH:mm"),
    endTime: format(later, "HH:mm"),
    weeks: [DAYS_OF_WEEK[now.getDay() === 0 ? 6 : now.getDay() - 1]],
  };
}

const DEFAULT_OPTIONS = getDefaultOptions();

export function SorterModal({ onClose, onApply }: SorterModalProps) {
  const [options, setOptions] = useState<SortOptions>(() => {
    if (typeof window === "undefined") return DEFAULT_OPTIONS;

    const saved = localStorage.getItem(SORT_OPTIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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

  const handleNext15Minutes = () => {
    const now = new Date();
    const later = addMinutes(now, 15);

    setOptions((prev) => ({
      ...prev,
      startTime: format(now, "HH:mm"),
      endTime: format(later, "HH:mm"),
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
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <button
                  type="button"
                  onClick={handleNext15Minutes}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Next 15 Minutes
                </button>
              </div>
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
                      checked={options.weeks.includes(day)}
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

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/images/move/route.ts

// app/api/images/move/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getDay } from 'date-fns';

interface MoveRequest {
  images: {
    assetPath: string;
    fileName: string;
  }[];
  targetPath: string;
  sortOptions?: {
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    weeks?: string[];
  };
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
  fileDescription?: string;
  meta?: {
    value: string;
    type: string;
  };
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

// Apply sorting filters to the data
function applySortOptions(data: ImageData[], sortOptions: MoveRequest['sortOptions']) {
  if (!sortOptions) return data;

  let filteredData = [...data];

  // Date filtering
  if (sortOptions.startDate || sortOptions.endDate) {
    filteredData = filteredData.filter(item => {
      const itemDateString = `${item.yyyy}-${String(item.mm).padStart(2, '0')}-${String(item.dd).padStart(2, '0')}`;
      
      if (sortOptions.startDate && itemDateString < sortOptions.startDate) {
        return false;
      }
      
      if (sortOptions.endDate && itemDateString > sortOptions.endDate) {
        return false;
      }
      
      return true;
    });
  }

  // Time filtering
  if (sortOptions.startTime || sortOptions.endTime) {
    filteredData = filteredData.filter(item => {
      const itemTimeString = `${String(item.hh).padStart(2, '0')}:${String(item.minute).padStart(2, '0')}`;
      
      if (sortOptions.startTime && itemTimeString < sortOptions.startTime) {
        return false;
      }
      
      if (sortOptions.endTime && itemTimeString > sortOptions.endTime) {
        return false;
      }
      
      return true;
    });
  }

  // Week day filtering
  if (sortOptions.weeks && Array.isArray(sortOptions.weeks) && sortOptions.weeks.length > 0) {
    filteredData = filteredData.filter(item => {
      const date = new Date(item.yyyy, item.mm - 1, item.dd);
      const dayNumber = getDay(date);
      return sortOptions.weeks?.some(dayName => getDayNumber(dayName) === dayNumber) ?? false;
    });
  }

  return filteredData;
}

export async function POST(request: Request) {
  try {
    const body: MoveRequest = await request.json();
    console.log('Move request received:', body);
    
    const publicDir = path.join(process.cwd(), 'public');
    const targetDir = path.join(publicDir, body.targetPath);
    
    // Create target directory if it doesn't exist
    await fs.mkdir(targetDir, { recursive: true });
    
    // Keep track of successful and failed moves
    const moveResults: { success: string[]; failed: string[] } = {
      success: [],
      failed: []
    };

    // Move all files
    for (const image of body.images) {
      try {
        const currentPath = path.join(publicDir, 'images', image.fileName);
        const targetPath = path.join(targetDir, image.fileName);
        
        // Check if source file exists
        await fs.access(currentPath);
        
        // Check if target file already exists
        try {
          await fs.access(targetPath);
          moveResults.failed.push(`${image.fileName} (already exists in target directory)`);
          continue;
        } catch {
          // Target doesn't exist, we can proceed
        }
        
        // Perform the move
        await fs.rename(currentPath, targetPath);
        moveResults.success.push(image.fileName);
      } catch (error) {
        console.error(`Failed to move ${image.fileName}:`, error);
        moveResults.failed.push(image.fileName);
      }
    }
    
    if (moveResults.success.length === 0) {
      throw new Error('No files were successfully moved');
    }
    
    // Update data.json
    console.log('Updating data.json...');
    const dataPath = path.join(publicDir, 'data.json');
    const dataContent = await fs.readFile(dataPath, 'utf-8');
    let imageData: ImageData[] = JSON.parse(dataContent);
    
    // Update the asset paths for successfully moved images
    let updatedCount = 0;
    imageData = imageData.map(item => {
      const matchingImage = body.images.find(img => img.assetPath === item.assetPath);
      if (matchingImage && moveResults.success.includes(matchingImage.fileName)) {
        updatedCount++;
        const relativePath = path.join(body.targetPath, item.fileName);
        return {
          ...item,
          assetPath: '/' + relativePath.replace(/\\/g, '/')
        };
      }
      return item;
    });

    if (updatedCount === 0) {
      throw new Error('Failed to update image data');
    }
    
    // Write the updated data back to data.json
    await fs.writeFile(dataPath, JSON.stringify(imageData, null, 2));
    
    // Apply sort options if they exist
    const sortedData = body.sortOptions ? applySortOptions(imageData, body.sortOptions) : imageData;
    
    // Return response with results
    return NextResponse.json({ 
      success: true,
      message: 'Images processed',
      results: moveResults,
      newData: sortedData
    });

  } catch (error: any) {
    console.error('Move API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to move images',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/images/delete/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface DeleteRequest {
  images: {
    assetPath: string;
    fileName: string;
  }[];
}

export async function POST(request: Request) {
  try {
    const body: DeleteRequest = await request.json();
    console.log('Delete request received:', body);
    
    const deleteResults: { success: string[]; failed: string[] } = {
      success: [],
      failed: []
    };

    // Process each image
    for (const image of body.images) {
      try {
        const imagePath = path.join(process.cwd(), 'public', 'images', image.fileName);
        console.log('Attempting to delete file at:', imagePath);
        
        // Check if file exists and delete it
        try {
          const stats = await fs.stat(imagePath);
          if (stats.isFile()) {
            await fs.unlink(imagePath);
            deleteResults.success.push(image.fileName);
          } else {
            deleteResults.failed.push(`${image.fileName} (not a file)`);
          }
        } catch (error: any) {
          console.error(`Error deleting ${image.fileName}:`, error);
          deleteResults.failed.push(image.fileName);
        }
      } catch (error) {
        console.error(`Error processing ${image.fileName}:`, error);
        deleteResults.failed.push(image.fileName);
      }
    }

    // Update data.json
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const dataContent = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(dataContent);
    
    // Filter out deleted images
    const successfullyDeletedPaths = new Set(
      body.images
        .filter(img => deleteResults.success.includes(img.fileName))
        .map(img => img.assetPath)
    );
    
    const updatedData = data.filter((item: any) => !successfullyDeletedPaths.has(item.assetPath));
    
    // Write updated data back to file
    await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));
    
    return NextResponse.json({ 
      success: true,
      message: 'Images processed',
      results: deleteResults,
      remainingImages: updatedData
    });
    
  } catch (error: any) {
    console.error('Delete API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete images',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/images/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { revalidateTag } from 'next/cache';

// Enable caching but allow revalidation
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Tag this response for cache invalidation
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=31536000',
        'tags': ['images-data']
      }
    });
  } catch (error) {
    console.error('Error reading data.json:', error);
    return NextResponse.json(
      { error: 'Failed to read data' },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer/app/api/revalidate/route.ts

// app/api/revalidate/route.ts
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST() {
  try {
    revalidateTag('images-data');
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    return NextResponse.json({ revalidated: false, error: error.message }, { status: 500 });
  }
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
interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[];
}

interface ImageToMove {
  assetPath: string;
  fileName: string;
}

export async function moveImages(
  images: ImageToMove[],
  targetPath: string,
  sortOptions?: SortOptions
): Promise<{ success: boolean; data?: any[] }> {
  try {
    console.log('Sending bulk move request for:', { images, targetPath, sortOptions });
    
    const response = await fetch('/api/images/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        images,
        targetPath,
        sortOptions
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Move request failed:', result);
      throw new Error(result.error || 'Failed to move images');
    }

    return {
      success: true,
      data: result.newData
    };
  } catch (error) {
    console.error('Error in moveImages service:', error);
    throw error;
  }
}

export async function deleteImages(
  images: { assetPath: string; fileName: string }[]
): Promise<boolean> {
  try {
    console.log('Sending bulk delete request for:', images);
    
    const response = await fetch('/api/images/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Bulk delete request failed:', result);
      throw new Error(result.error || 'Failed to delete images');
    }

    console.log('Bulk delete response:', result);
    return true;
  } catch (error) {
    console.error('Error in deleteImages service:', error);
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
    "process-images": "ts-node scripts/process-images-cli.ts",
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
import { format } from "date-fns";
import { ArrowRight, X, CheckSquare, Square } from "lucide-react";
import { deleteImage, moveImages } from "../services/imageService";
import { MoveModal } from "../components/MoveModal";
import { SorterModal } from "../components/SorterModal";

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
  weeks: string[];
}

export default function ResultsPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showSorter, setShowSorter] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [currentSortOptions, setCurrentSortOptions] =
    useState<SortOptions | null>(null);

  const loadImagesWithSort = async (sortOptions: SortOptions | null) => {
    try {
      setLoading(true);
      setError(null);

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

  useEffect(() => {
    const savedOptions = localStorage.getItem("imageSortOptions");
    const sortOptions = savedOptions ? JSON.parse(savedOptions) : null;
    setCurrentSortOptions(sortOptions);
    loadImagesWithSort(sortOptions);
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

  const handleImageSelect = (image: ImageData, event: React.MouseEvent) => {
    // If shift key is pressed, maintain preview selection
    if (!event.shiftKey) {
      setSelectedImage(image);
      setSelectedIndex(
        images.findIndex((img) => img.assetPath === image.assetPath)
      );
    }

    // Toggle selection for multi-select
    setSelectedImages((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(image.assetPath)) {
        newSelection.delete(image.assetPath);
      } else {
        newSelection.add(image.assetPath);
      }
      return newSelection;
    });
  };

  const handleMove = async (targetPath: string) => {
    try {
      setLoading(true);
      setError(null);

      const imagesToMove = Array.from(selectedImages).map((assetPath) => {
        const image = images.find((img) => img.assetPath === assetPath);
        return {
          assetPath,
          fileName: image!.fileName,
        };
      });

      const moveResult = await moveImages(
        imagesToMove,
        targetPath,
        currentSortOptions || undefined
      );

      if (moveResult.success && moveResult.data) {
        setImages(moveResult.data);

        // Update selected image if needed
        if (moveResult.data.length > 0) {
          const firstVisibleSelected = moveResult.data.find((img) =>
            selectedImages.has(img.assetPath)
          );
          if (firstVisibleSelected) {
            setSelectedImage(firstVisibleSelected);
            setSelectedIndex(moveResult.data.indexOf(firstVisibleSelected));
          } else {
            setSelectedImage(moveResult.data[0]);
            setSelectedIndex(0);
          }
        } else {
          setSelectedImage(null);
          setSelectedIndex(-1);
        }
      }

      // Clear selections after move
      setSelectedImages(new Set());
      setShowMoveModal(false);
    } catch (err) {
      console.error("Error moving images:", err);
      setError("Failed to move images");
    } finally {
      setLoading(false);
    }
  };

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

      // Remove from selected images if it was selected
      if (selectedImages.has(image.assetPath)) {
        setSelectedImages((prev) => {
          const newSelection = new Set(prev);
          newSelection.delete(image.assetPath);
          return newSelection;
        });
      }

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

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedImages.size} images?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const imagesToDelete = Array.from(selectedImages).map((assetPath) => {
        const image = images.find((img) => img.assetPath === assetPath);
        return {
          assetPath,
          fileName: image!.fileName,
        };
      });

      await deleteImages(imagesToDelete);

      // Update local state
      setImages((prevImages) =>
        prevImages.filter((img) => !selectedImages.has(img.assetPath))
      );

      // If any of the deleted images was selected, select the first remaining image
      if (selectedImage && selectedImages.has(selectedImage.assetPath)) {
        const remainingImages = images.filter(
          (img) => !selectedImages.has(img.assetPath)
        );
        if (remainingImages.length > 0) {
          setSelectedImage(remainingImages[0]);
          setSelectedIndex(0);
        } else {
          setSelectedImage(null);
          setSelectedIndex(-1);
        }
      }

      // Clear selections
      setSelectedImages(new Set());
    } catch (err) {
      console.error("Error deleting images:", err);
      setError("Failed to delete images");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySort = async (options: SortOptions) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentSortOptions(options);
      await loadImagesWithSort(options);
      setShowSorter(false);
    } catch (err) {
      console.error("Error applying sort:", err);
      setError("Failed to apply sorting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left side - Image list */}
      <div className="w-1/2 overflow-y-auto p-4">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setShowSorter(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sort
          </button>
          {selectedImages.size > 0 && (
            <>
              <button
                onClick={() => setShowMoveModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Move Selected ({selectedImages.size})
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Selected ({selectedImages.size})
              </button>
            </>
          )}
        </div>

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
              className={`p-2 cursor-pointer rounded flex items-start group ${
                selectedImage?.assetPath === image.assetPath
                  ? "bg-blue-100"
                  : "hover:bg-gray-100"
              } ${selectedImages.has(image.assetPath) ? "bg-blue-50" : ""}`}
              onClick={(e) => handleImageSelect(image, e)}
            >
              {/* Checkbox */}
              <div className="flex-shrink-0 mr-2">
                {selectedImages.has(image.assetPath) ? (
                  <CheckSquare className="text-blue-500" size={20} />
                ) : (
                  <Square className="text-gray-400" size={20} />
                )}
              </div>

              {/* Thumbnail Container */}
              <div className="flex-shrink-0 mr-3 relative w-16 h-16">
                <Image
                  src={image.assetPath}
                  alt={image.fileName}
                  fill
                  sizes="64px"
                  className="rounded object-cover"
                  priority={index < 10}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="break-words truncate">{image.fileName}</div>
                <div className="text-sm text-gray-500">
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

              {/* Action Buttons */}
              <div className="flex items-center ml-2 flex-shrink-0">
                <button
                  className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500 text-gray-600 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(image, index);
                  }}
                  aria-label="Delete image"
                >
                  <X size={16} />
                </button>
                <button
                  className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500 text-gray-600 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImages(new Set([image.assetPath]));
                    setShowMoveModal(true);
                  }}
                  aria-label="Move image"
                >
                  <ArrowRight size={16} />
                </button>
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

      {/* Modals */}
      {showMoveModal && selectedImages.size > 0 && (
        <MoveModal
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
            setSelectedImages(new Set());
          }}
          onSubmit={handleMove}
          selectionCount={selectedImages.size}
        />
      )}

      {showSorter && (
        <SorterModal
          onClose={() => setShowSorter(false)}
          onApply={handleApplySort}
        />
      )}
    </div>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer//app/components/MoveModal.tsx

// app/components/MoveModal.tsx
import React, { useState, useEffect } from "react";

interface MoveModalProps {
  onClose: () => void;
  onSubmit: (targetPath: string) => void;
  isOpen: boolean;
  selectionCount?: number;
}

const MOVE_PATH_KEY = "imageMoveTargetPath";

export function MoveModal({
  onClose,
  onSubmit,
  isOpen,
  selectionCount = 1,
}: MoveModalProps) {
  const [targetPath, setTargetPath] = useState("");

  // Load from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedPath = localStorage.getItem(MOVE_PATH_KEY);
      if (savedPath) {
        setTargetPath(savedPath);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit(targetPath);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onSubmit, targetPath]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(MOVE_PATH_KEY, targetPath);
    onSubmit(targetPath);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Move {selectionCount} {selectionCount === 1 ? "Image" : "Images"}
          </h2>
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
                Target Directory (under /public)
              </label>
              <input
                type="text"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder="e.g., images/processed"
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Move
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// /Users/adamchenwei/www/custom-sorting-image-viewer//app/components/SorterModal.tsx

import { useState, useEffect } from "react";
import { format, addMinutes } from "date-fns";

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[];
}

interface SorterModalProps {
  onClose: () => void;
  onApply: (options: SortOptions) => void;
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

function getDefaultOptions(): SortOptions {
  const now = new Date();
  const threeYearsAgo = new Date(now);
  threeYearsAgo.setFullYear(now.getFullYear() - 3);
  const later = addMinutes(now, 15);

  return {
    startDate: format(threeYearsAgo, "yyyy-MM-dd"),
    endDate: format(now, "yyyy-MM-dd"),
    startTime: format(now, "HH:mm"),
    endTime: format(later, "HH:mm"),
    weeks: [DAYS_OF_WEEK[now.getDay() === 0 ? 6 : now.getDay() - 1]],
  };
}

const DEFAULT_OPTIONS = getDefaultOptions();

export function SorterModal({ onClose, onApply }: SorterModalProps) {
  const [options, setOptions] = useState<SortOptions>(() => {
    if (typeof window === "undefined") return DEFAULT_OPTIONS;

    const saved = localStorage.getItem(SORT_OPTIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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

  const handleNext15Minutes = () => {
    const now = new Date();
    const later = addMinutes(now, 15);

    setOptions((prev) => ({
      ...prev,
      startTime: format(now, "HH:mm"),
      endTime: format(later, "HH:mm"),
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
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <button
                  type="button"
                  onClick={handleNext15Minutes}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Next 15 Minutes
                </button>
              </div>
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
                      checked={options.weeks.includes(day)}
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

// /Users/adamchenwei/www/custom-sorting-image-viewer//app/api/images/move/route.ts

// app/api/images/move/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getDay } from 'date-fns';

interface MoveRequest {
  images: {
    assetPath: string;
    fileName: string;
  }[];
  targetPath: string;
  sortOptions?: {
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    weeks?: string[];
  };
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
  fileDescription?: string;
  meta?: {
    value: string;
    type: string;
  };
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

// Apply sorting filters to the data
function applySortOptions(data: ImageData[], sortOptions: MoveRequest['sortOptions']) {
  if (!sortOptions) return data;

  let filteredData = [...data];

  // Date filtering
  if (sortOptions.startDate || sortOptions.endDate) {
    filteredData = filteredData.filter(item => {
      const itemDateString = `${item.yyyy}-${String(item.mm).padStart(2, '0')}-${String(item.dd).padStart(2, '0')}`;
      
      if (sortOptions.startDate && itemDateString < sortOptions.startDate) {
        return false;
      }
      
      if (sortOptions.endDate && itemDateString > sortOptions.endDate) {
        return false;
      }
      
      return true;
    });
  }

  // Time filtering
  if (sortOptions.startTime || sortOptions.endTime) {
    filteredData = filteredData.filter(item => {
      const itemTimeString = `${String(item.hh).padStart(2, '0')}:${String(item.minute).padStart(2, '0')}`;
      
      if (sortOptions.startTime && itemTimeString < sortOptions.startTime) {
        return false;
      }
      
      if (sortOptions.endTime && itemTimeString > sortOptions.endTime) {
        return false;
      }
      
      return true;
    });
  }

  // Week day filtering
  if (sortOptions.weeks && Array.isArray(sortOptions.weeks) && sortOptions.weeks.length > 0) {
    filteredData = filteredData.filter(item => {
      const date = new Date(item.yyyy, item.mm - 1, item.dd);
      const dayNumber = getDay(date);
      return sortOptions.weeks?.some(dayName => getDayNumber(dayName) === dayNumber) ?? false;
    });
  }

  return filteredData;
}

export async function POST(request: Request) {
  try {
    const body: MoveRequest = await request.json();
    console.log('Move request received:', body);
    
    const publicDir = path.join(process.cwd(), 'public');
    const targetDir = path.join(publicDir, body.targetPath);
    
    // Create target directory if it doesn't exist
    await fs.mkdir(targetDir, { recursive: true });
    
    // Keep track of successful and failed moves
    const moveResults: { success: string[]; failed: string[] } = {
      success: [],
      failed: []
    };

    // Move all files
    for (const image of body.images) {
      try {
        const currentPath = path.join(publicDir, 'images', image.fileName);
        const targetPath = path.join(targetDir, image.fileName);
        
        // Check if source file exists
        await fs.access(currentPath);
        
        // Check if target file already exists
        try {
          await fs.access(targetPath);
          moveResults.failed.push(`${image.fileName} (already exists in target directory)`);
          continue;
        } catch {
          // Target doesn't exist, we can proceed
        }
        
        // Perform the move
        await fs.rename(currentPath, targetPath);
        moveResults.success.push(image.fileName);
      } catch (error) {
        console.error(`Failed to move ${image.fileName}:`, error);
        moveResults.failed.push(image.fileName);
      }
    }
    
    if (moveResults.success.length === 0) {
      throw new Error('No files were successfully moved');
    }
    
    // Update data.json
    console.log('Updating data.json...');
    const dataPath = path.join(publicDir, 'data.json');
    const dataContent = await fs.readFile(dataPath, 'utf-8');
    let imageData: ImageData[] = JSON.parse(dataContent);
    
    // Update the asset paths for successfully moved images
    let updatedCount = 0;
    imageData = imageData.map(item => {
      const matchingImage = body.images.find(img => img.assetPath === item.assetPath);
      if (matchingImage && moveResults.success.includes(matchingImage.fileName)) {
        updatedCount++;
        const relativePath = path.join(body.targetPath, item.fileName);
        return {
          ...item,
          assetPath: '/' + relativePath.replace(/\\/g, '/')
        };
      }
      return item;
    });

    if (updatedCount === 0) {
      throw new Error('Failed to update image data');
    }
    
    // Write the updated data back to data.json
    await fs.writeFile(dataPath, JSON.stringify(imageData, null, 2));
    
    // Apply sort options if they exist
    const sortedData = body.sortOptions ? applySortOptions(imageData, body.sortOptions) : imageData;
    
    // Return response with results
    return NextResponse.json({ 
      success: true,
      message: 'Images processed',
      results: moveResults,
      newData: sortedData
    });

  } catch (error: any) {
    console.error('Move API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to move images',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer//app/api/images/delete/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface DeleteRequest {
  images: {
    assetPath: string;
    fileName: string;
  }[];
}

export async function POST(request: Request) {
  try {
    const body: DeleteRequest = await request.json();
    console.log('Delete request received:', body);
    
    const deleteResults: { success: string[]; failed: string[] } = {
      success: [],
      failed: []
    };

    // Process each image
    for (const image of body.images) {
      try {
        const imagePath = path.join(process.cwd(), 'public', 'images', image.fileName);
        console.log('Attempting to delete file at:', imagePath);
        
        // Check if file exists and delete it
        try {
          const stats = await fs.stat(imagePath);
          if (stats.isFile()) {
            await fs.unlink(imagePath);
            deleteResults.success.push(image.fileName);
          } else {
            deleteResults.failed.push(`${image.fileName} (not a file)`);
          }
        } catch (error: any) {
          console.error(`Error deleting ${image.fileName}:`, error);
          deleteResults.failed.push(image.fileName);
        }
      } catch (error) {
        console.error(`Error processing ${image.fileName}:`, error);
        deleteResults.failed.push(image.fileName);
      }
    }

    // Update data.json
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const dataContent = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(dataContent);
    
    // Filter out deleted images
    const successfullyDeletedPaths = new Set(
      body.images
        .filter(img => deleteResults.success.includes(img.fileName))
        .map(img => img.assetPath)
    );
    
    const updatedData = data.filter((item: any) => !successfullyDeletedPaths.has(item.assetPath));
    
    // Write updated data back to file
    await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));
    
    return NextResponse.json({ 
      success: true,
      message: 'Images processed',
      results: deleteResults,
      remainingImages: updatedData
    });
    
  } catch (error: any) {
    console.error('Delete API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete images',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer//app/api/images/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { revalidateTag } from 'next/cache';

// Enable caching but allow revalidation
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Tag this response for cache invalidation
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=31536000',
        'tags': ['images-data']
      }
    });
  } catch (error) {
    console.error('Error reading data.json:', error);
    return NextResponse.json(
      { error: 'Failed to read data' },
      { status: 500 }
    );
  }
}

// /Users/adamchenwei/www/custom-sorting-image-viewer//app/api/revalidate/route.ts

// app/api/revalidate/route.ts
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST() {
  try {
    revalidateTag('images-data');
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    return NextResponse.json({ revalidated: false, error: error.message }, { status: 500 });
  }
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
interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[];
}

interface ImageToMove {
  assetPath: string;
  fileName: string;
}

export async function moveImages(
  images: ImageToMove[],
  targetPath: string,
  sortOptions?: SortOptions
): Promise<{ success: boolean; data?: any[] }> {
  try {
    console.log('Sending bulk move request for:', { images, targetPath, sortOptions });
    
    const response = await fetch('/api/images/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        images,
        targetPath,
        sortOptions
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Move request failed:', result);
      throw new Error(result.error || 'Failed to move images');
    }

    return {
      success: true,
      data: result.newData
    };
  } catch (error) {
    console.error('Error in moveImages service:', error);
    throw error;
  }
}

export async function deleteImages(
  images: { assetPath: string; fileName: string }[]
): Promise<boolean> {
  try {
    console.log('Sending bulk delete request for:', images);
    
    const response = await fetch('/api/images/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Bulk delete request failed:', result);
      throw new Error(result.error || 'Failed to delete images');
    }

    console.log('Bulk delete response:', result);
    return true;
  } catch (error) {
    console.error('Error in deleteImages service:', error);
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

// app/utils/processImages.ts
import fs from 'fs';
import path from 'path';

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

export function extractDateTimeFromFileName(fileName: string): ImageData | null {
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
    const [_, yyyy, mm, dd, hh, minute, ss, description] = match;
    
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
    
    return data;
  }

  return null;
}

export function processImagesDirectory(dirPath: string, baseDir: string): { items: ImageData[], summary: ProcessingSummary } {
  const items: ImageData[] = [];
  const summary: ProcessingSummary = {
    processedFiles: [],
    unprocessedFiles: []
  };
  
  try {
    const files = fs.readdirSync(dirPath);

    files.forEach((file: string) => {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const subDirResult = processImagesDirectory(fullPath, baseDir);
        items.push(...subDirResult.items);
        summary.processedFiles.push(...subDirResult.summary.processedFiles);
        summary.unprocessedFiles.push(...subDirResult.summary.unprocessedFiles);
      } else {
        const fileExt = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg'].includes(fileExt)) {
          const imageData = extractDateTimeFromFileName(file);
          
          if (imageData) {
            const relativePath = path.relative(baseDir, fullPath);
            imageData.assetPath = '/' + relativePath.replace(/\\/g, '/');
            items.push(imageData);
            summary.processedFiles.push(file);
          } else {
            summary.unprocessedFiles.push(file);
          }
        } else {
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

// /Users/adamchenwei/www/custom-sorting-image-viewer//scripts/process-images-cli.ts

// scripts/process-images-cli.ts
import path from 'path';
import fs from 'fs';
import { processImagesDirectory, extractDateTimeFromFileName } from './processImages';

function main() {
  try {
    // Get the public directory path
    const publicDir = path.join(process.cwd(), 'public');
    const imagesDir = path.join(publicDir, 'images');
    const dataJsonPath = path.join(publicDir, 'data.json');

    // Ensure the images directory exists
    if (!fs.existsSync(imagesDir)) {
      console.error('Images directory does not exist:', imagesDir);
      console.log('Creating images directory...');
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Process the images directory
    console.log('Processing images directory:', imagesDir);
    const { items, summary } = processImagesDirectory(imagesDir, publicDir);

    // Write the results to data.json
    fs.writeFileSync(dataJsonPath, JSON.stringify(items, null, 2));

    // Print summary
    console.log('\nProcessing Summary:');
    console.log('------------------');
    console.log('Total images processed:', summary.processedFiles.length);
    console.log('Successfully processed files:', summary.processedFiles.length);
    console.log('Unprocessed files:', summary.unprocessedFiles.length);
    
    if (summary.unprocessedFiles.length > 0) {
      console.log('\nUnprocessed files:');
      summary.unprocessedFiles.forEach(file => console.log(`- ${file}`));
    }

    console.log('\nData written to:', dataJsonPath);

  } catch (error) {
    console.error('Error processing images:', error);
    process.exit(1);
  }
}

// Execute the script
main();

