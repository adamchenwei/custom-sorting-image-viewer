import { ImageAnalysisResult } from "@/types";
import React from "react";

interface ResultsListProps {
  results: ImageAnalysisResult[];
}

export const ResultsList: React.FC<ResultsListProps> = ({ results }) => {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
      {results.length === 0 ? (
        <p className="text-gray-500">
          No results yet. Upload an image to begin.
        </p>
      ) : (
        <ul className="space-y-4">
          {results.map((result) => (
            <li key={result.id} className="bg-white p-4 rounded-lg shadow">
              <p className="font-medium">{result.filename}</p>
              <p className="text-gray-600">
                Red percentage:{" "}
                <span className="text-red-600 font-semibold">
                  {result.redPercentage}%
                </span>
              </p>
              <p className="text-sm text-gray-500">
                {new Date(result.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
