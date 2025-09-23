import { ImageAnalysisResult } from "@/types";

export const analyzeRedPercentage = (imageData: ImageData): number => {
  const data = imageData.data;
  let redPixels = 0;
  const totalPixels = imageData.width * imageData.height;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];

    // Consider a pixel "red" if red channel is significantly higher than others
    if (red > 150 && red > green * 1.5 && red > blue * 1.5) {
      redPixels++;
    }
  }

  return Number(((redPixels / totalPixels) * 100).toFixed(2));
};


const STORAGE_KEY = 'image-analysis-results';

export const saveResults = (results: ImageAnalysisResult[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  }
};

export const loadResults = (): ImageAnalysisResult[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};