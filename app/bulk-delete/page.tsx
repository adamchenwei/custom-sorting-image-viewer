"use client";
import React, { useState } from "react";
import { Folder } from "lucide-react";

const Button = ({
  children,
  disabled,
  onClick,
  className = "",
  variant = "primary",
}) => {
  const baseStyles =
    "px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-blue-500 text-white hover:bg-blue-600 disabled:hover:bg-blue-500",
    outline: "border border-gray-300 hover:bg-gray-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, error, ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium text-gray-700">{label}</label>
    )}
    <input
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
      {...props}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

const ProgressBar = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  </div>
);

const Alert = ({ children, type = "error" }) => {
  const styles = {
    error: "bg-red-50 text-red-700 border-red-200",
    success: "bg-green-50 text-green-700 border-green-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className={`${styles[type]} border p-4 rounded-lg`}>{children}</div>
  );
};

const DeleteImagesPage = () => {
  const [percentage, setPercentage] = useState("");
  const [folder, setFolder] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState("idle");
  const [matchedFiles, setMatchedFiles] = useState([]);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  const handleDelete = async () => {
    if (!percentage || !folder) return;

    setError("");
    setIsDeleting(true);
    setProgress(0);
    setStatus("processing");
    setMatchedFiles([]);
    setProcessedFiles(0);
    setTotalFiles(0);

    try {
      const response = await fetch("/api/delete-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          percentage: Number(percentage),
          folder,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to start deletion process");
      }

      const pollProgress = async () => {
        try {
          const progressResponse = await fetch("/api/deletion-progress");
          const progressData = await progressResponse.json();

          if (progressData.error) {
            setError(progressData.error);
            setIsDeleting(false);
            setStatus("completed");
            return;
          }

          setProgress(progressData.progress);
          setStatus(progressData.status);
          setMatchedFiles(progressData.matchedFiles);
          setProcessedFiles(progressData.processedFiles);
          setTotalFiles(progressData.totalFiles);

          if (progressData.status !== "completed") {
            setTimeout(pollProgress, 1000);
          } else {
            setIsDeleting(false);
          }
        } catch (err) {
          setError("Failed to fetch progress");
          setIsDeleting(false);
          setStatus("completed");
        }
      };

      pollProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsDeleting(false);
      setStatus("completed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Delete Images by Red Percentage
            </h1>
            <p className="mt-2 text-gray-600">
              Delete all images with red percentage less than or equal to the
              specified threshold.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Maximum Red Percentage Threshold"
              type="number"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="Enter percentage (0-100)"
              disabled={isDeleting}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Folder Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  placeholder="Enter folder path"
                  disabled={isDeleting}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
                <button
                  onClick={() => alert("Folder picker would go here")}
                  disabled={isDeleting}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <Folder className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            {status === "processing" && (
              <Alert type="info">
                Processing files: {processedFiles} of {totalFiles}
                {matchedFiles.length > 0 && (
                  <div className="mt-2">
                    Matched files: {matchedFiles.join(", ")}
                  </div>
                )}
              </Alert>
            )}

            {status === "completed" && matchedFiles.length > 0 && (
              <Alert type="success">
                Deletion completed. Deleted files: {matchedFiles.join(", ")}
              </Alert>
            )}

            {(isDeleting || progress > 0) && (
              <div className="space-y-2">
                <ProgressBar progress={progress} />
                <p className="text-sm text-center text-gray-600">
                  {progress}% complete
                </p>
              </div>
            )}

            <Button
              onClick={handleDelete}
              disabled={!percentage || !folder || isDeleting}
              className="w-full"
            >
              {isDeleting ? "Deleting..." : "Delete Images"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteImagesPage;
