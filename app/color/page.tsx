"use client";

import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageUploader } from "@/components/ImageUploader";
import { ResultsList } from "@/components/ResultsList";
import {
  analyzeRedPercentage,
  loadResults,
  saveResults,
} from "@/utils/colorAnalysis";
import { ImageAnalysisResult } from "@/types";

export default function Home() {
  const [results, setResults] = useState<ImageAnalysisResult[]>([]);

  useEffect(() => {
    setResults(loadResults());
  }, []);

  const handleImageSelected = async (file: File) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const redPercentage = analyzeRedPercentage(imageData);

        const newResult: ImageAnalysisResult = {
          id: uuidv4(),
          timestamp: Date.now(),
          filename: file.name,
          redPercentage,
        };

        const updatedResults = [newResult, ...results];
        setResults(updatedResults);
        saveResults(updatedResults);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Image Red Color Analyzer</h1>
      <ImageUploader onImageSelected={handleImageSelected} />
      <ResultsList results={results} />
    </main>
  );
}
