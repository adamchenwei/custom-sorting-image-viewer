import React, { useState, useEffect } from "react";

interface MoveModalProps {
  onClose: () => void;
  onSubmit: (targetPath: string) => void;
  isOpen: boolean;
}

const MOVE_PATH_KEY = "imageMoveTargetPath";

export function MoveModal({ onClose, onSubmit, isOpen }: MoveModalProps) {
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
          <h2 className="text-xl font-bold">Move Image</h2>
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
