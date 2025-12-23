import { NextRequest, NextResponse } from 'next/server';
import { generateUploadUrl } from '@/services/s3';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType = 'image/webp', deviceId = 'default' } = body;

    if (!filename) {
      return NextResponse.json(
        { error: 'Missing required parameter: filename' },
        { status: 400 }
      );
    }

    const uploadUrl = await generateUploadUrl({
      filename,
      contentType,
      deviceId,
      expiresInSeconds: 300,
    });

    return NextResponse.json({
      uploadUrl,
      key: `${deviceId}/${Date.now()}-${filename}`,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
