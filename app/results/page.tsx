"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { format, getDay } from "date-fns";
import { ArrowRight, X } from "lucide-react";
import { deleteImage } from "../services/imageService";
import { MoveModal } from "../components/MoveModal";
import { moveImage } from "../services/imageService";

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
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [imageToMove, setImageToMove] = useState<ImageData | null>(null);

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
  const handleMove = async (image: ImageData, targetPath: string) => {
    try {
      setLoading(true);
      setError(null);

      await moveImage(image.assetPath, image.fileName, targetPath);

      // Refresh the image list
      const response = await fetch("/api/images");
      const data = await response.json();
      setImages(data);

      setShowMoveModal(false);
      setImageToMove(null);
    } catch (err) {
      console.error("Error moving image:", err);
      setError("Failed to move image");
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
              <button
                className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity mr-2 ${
                  selectedImage?.assetPath === image.assetPath
                    ? "hover:bg-blue-700 text-white"
                    : "hover:bg-blue-500 text-gray-600 hover:text-white"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setImageToMove(image);
                  setShowMoveModal(true);
                }}
                aria-label="Move image"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          ))}

          {showMoveModal && (
            <MoveModal
              isOpen={showMoveModal}
              onClose={() => {
                setShowMoveModal(false);
                setImageToMove(null);
              }}
              onSubmit={(targetPath) => {
                if (imageToMove) {
                  handleMove(imageToMove, targetPath);
                }
              }}
            />
          )}
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
