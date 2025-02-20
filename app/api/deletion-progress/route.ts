import { NextResponse } from 'next/server';
import { deletionProgress } from '../delete-images/route';

export async function GET() {
  return NextResponse.json({
    progress: deletionProgress.progress,
    error: deletionProgress.error,
    status: deletionProgress.status,
    matchedFiles: deletionProgress.matchedFiles,
    processedFiles: deletionProgress.processedFiles,
    totalFiles: deletionProgress.totalFiles,
    details: deletionProgress.details
  });
}