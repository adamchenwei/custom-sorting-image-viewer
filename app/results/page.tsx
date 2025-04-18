"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowRight, X, CheckSquare, Square, Layers } from "lucide-react";
import { moveImages, deleteImages } from "../services/imageService";
import { MoveModal } from "../components/MoveModal";
import { SorterModal } from "../components/SorterModal";
import { isUSHoliday } from "../utils/holidays";

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
  const [isOverlapMode, setIsOverlapMode] = useState(false);

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

  const handleImageSelect = (
    image: ImageData,
    event: React.MouseEvent,
    isCheckboxClick: boolean
  ) => {
    if (isCheckboxClick) {
      setSelectedImages((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(image.assetPath)) {
          newSelection.delete(image.assetPath);
        } else {
          newSelection.add(image.assetPath);
        }
        return newSelection;
      });
      return;
    }

    setSelectedImage(image);
    setSelectedIndex(
      images.findIndex((img) => img.assetPath === image.assetPath)
    );
    if (!isOverlapMode) {
      setSelectedImages(new Set());
    }
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

      await deleteImages([
        { assetPath: image.assetPath, fileName: image.fileName },
      ]);

      setImages((prevImages) =>
        prevImages.filter((img) => img.assetPath !== image.assetPath)
      );

      if (selectedImages.has(image.assetPath)) {
        setSelectedImages((prev) => {
          const newSelection = new Set(prev);
          newSelection.delete(image.assetPath);
          return newSelection;
        });
      }

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

      setImages((prevImages) =>
        prevImages.filter((img) => !selectedImages.has(img.assetPath))
      );

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

  const renderImageViewer = () => {
    if (isOverlapMode && selectedImages.size > 0) {
      const selectedImagesList = Array.from(selectedImages)
        .map((assetPath) => images.find((img) => img.assetPath === assetPath))
        .filter((img): img is ImageData => img !== undefined);

      return (
        <div className="relative w-full h-full">
          {selectedImagesList.map((image, index) => (
            <div
              key={image.assetPath}
              className="absolute inset-0 mix-blend-normal"
              style={{
                zIndex: selectedImagesList.length - index,
              }}
            >
              <Image
                src={image.assetPath}
                alt={image.fileName}
                fill
                className="mix-blend-multiply"
                style={{
                  objectFit: "contain",
                  opacity: Math.max(0.7 - index * 0.15, 0.1).toString(),
                  filter: `brightness(${1.2 + index * 0.1})`, // Slightly brighten to compensate
                }}
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      );
    }

    return selectedImage ? (
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
    );
  };

  return (
    <div className="flex h-screen">
      {/* Left side - Image list */}
      <div className="w-1/2 flex flex-col h-full">
        {/* Sticky menu section */}
        <div className="sticky top-0 bg-white z-10 p-4 border-b">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSorter(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sort
            </button>
            <button
              onClick={() => setIsOverlapMode(!isOverlapMode)}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                isOverlapMode
                  ? "bg-indigo-500 text-white hover:bg-indigo-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Layers size={16} />
              {isOverlapMode ? "Single" : "Overlap"}
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
                <button
                  onClick={() => {
                    setSelectedImages(new Set());
                    if (isOverlapMode) {
                      setSelectedImage(null);
                      setSelectedIndex(-1);
                    }
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Clear Selection
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-4 p-2 bg-blue-100 text-blue-700 rounded">
              Loading...
            </div>
          )}
        </div>

        {/* Scrollable content section */}
        <div className="flex-1 overflow-y-auto p-4">
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
                    ? "bg-blue-100 text-gray-500"
                    : "hover:bg-gray-100 text-black"
                } ${
                  selectedImages.has(image.assetPath)
                    ? "bg-blue-50 text-black"
                    : ""
                }`}
                onClick={(e) => handleImageSelect(image, e, false)}
              >
                <div
                  className="flex-shrink-0 mr-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageSelect(image, e, true);
                  }}
                >
                  {selectedImages.has(image.assetPath) ? (
                    <CheckSquare className="text-blue-500" size={20} />
                  ) : (
                    <Square className="text-gray-400" size={20} />
                  )}
                </div>

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
                      "EEE PPpp"
                    )}
                  </div>
                  {(() => {
                    const dateStr = `${image.yyyy}-${String(image.mm).padStart(
                      2,
                      "0"
                    )}-${String(image.dd).padStart(2, "0")}`;
                    const holidays = isUSHoliday(dateStr);
                    if (
                      holidays[0].id !== "error" &&
                      holidays[0].id !== "not-holiday"
                    ) {
                      return (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {holidays.map((holiday) => (
                            <span
                              key={holiday.id}
                              className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-900"
                            >
                              {holiday.id}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

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
      </div>

      {/* Right side - Image preview */}
      <div className="w-1/2 h-full relative">{renderImageViewer()}</div>

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
