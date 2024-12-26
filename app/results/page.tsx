// app/results/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowRight, X } from "lucide-react";
import { deleteImage, moveImage } from "../services/imageService";
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
  const [showSorter, setShowSorter] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [imageToMove, setImageToMove] = useState<ImageData | null>(null);
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

  const handleMove = async (image: ImageData, targetPath: string) => {
    try {
      setLoading(true);
      setError(null);

      // Move the image and wait for the server response
      const moveResult = await moveImage(
        image.assetPath,
        image.fileName,
        targetPath
      );

      if (moveResult) {
        // Add a small delay to ensure the server has processed the file move
        await new Promise((resolve) => setTimeout(resolve, 500));

        // First, get fresh data from the server
        const response = await fetch("/api/images");
        const freshData = await response.json();

        // Then apply the current sort options if they exist
        if (
          currentSortOptions &&
          Object.values(currentSortOptions).some((value) => value !== "")
        ) {
          const sortResponse = await fetch("/api/sort", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentSortOptions),
          });
          const sortedData = await sortResponse.json();
          setImages(sortedData);

          // Update selected image if needed
          if (sortedData.length > 0) {
            const movedImageIndex = sortedData.findIndex(
              (img: ImageData) => img.fileName === image.fileName
            );
            if (movedImageIndex !== -1) {
              setSelectedImage(sortedData[movedImageIndex]);
              setSelectedIndex(movedImageIndex);
            } else {
              setSelectedImage(sortedData[0]);
              setSelectedIndex(0);
            }
          }
        } else {
          setImages(freshData);

          // Update selected image if needed
          if (freshData.length > 0) {
            const movedImageIndex = freshData.findIndex(
              (img: ImageData) => img.fileName === image.fileName
            );
            if (movedImageIndex !== -1) {
              setSelectedImage(freshData[movedImageIndex]);
              setSelectedIndex(movedImageIndex);
            } else {
              setSelectedImage(freshData[0]);
              setSelectedIndex(0);
            }
          }
        }
      }

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

  // Rest of the component remains the same...
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
              className={`p-2 cursor-pointer rounded flex items-start group ${
                selectedImage?.assetPath === image.assetPath
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-400"
              }`}
              onClick={() => {
                setSelectedImage(image);
                setSelectedIndex(index);
              }}
            >
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

              {/* Action Buttons */}
              <div className="flex items-center ml-2 flex-shrink-0">
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
                  className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
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
      {showMoveModal && imageToMove && (
        <MoveModal
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
            setImageToMove(null);
          }}
          onSubmit={(targetPath) => handleMove(imageToMove, targetPath)}
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
