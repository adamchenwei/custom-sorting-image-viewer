import { NextResponse } from 'next/server';

interface DeletionProgress {
  details: string[];
  progress: number;
  status: string;
  error?: string;
  matchedFiles?: number;
  processedFiles?: number;
  totalFiles?: number;
}

// Temporary placeholder or alternative solution
const deletionProgress: DeletionProgress = {
  details: [],
  progress: 0,
  status: 'idle',
  error: '',
  matchedFiles: 0,
  processedFiles: 0,
  totalFiles: 0
};

export async function GET() {
  // If we're at 100% progress and status isn't explicitly set, ensure it's marked as completed
  if (deletionProgress.progress === 100 && deletionProgress.status !== 'completed') {
    deletionProgress.status = 'completed';
  }

  // If status is completed but progress isn't 100, fix the inconsistency
  if (deletionProgress.status === 'completed' && deletionProgress.progress !== 100) {
    deletionProgress.progress = 100;
  }

  return NextResponse.json({
    progress: deletionProgress.progress,
    error: deletionProgress.error,
    status: deletionProgress.status,
    matchedFiles: deletionProgress.matchedFiles,
    processedFiles: deletionProgress.processedFiles,
    totalFiles: deletionProgress.totalFiles,
    details: deletionProgress.details,
    isCompleted: deletionProgress.status === 'completed'
  });
}