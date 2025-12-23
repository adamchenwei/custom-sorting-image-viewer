import { NextRequest, NextResponse } from 'next/server';
import { generateSignedUrl, generateMultipleSignedUrls } from '@/services/cloudfront';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageKey = searchParams.get('key');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600', 10);

    if (!imageKey) {
      return NextResponse.json(
        { error: 'Missing required parameter: key' },
        { status: 400 }
      );
    }

    const signedUrl = generateSignedUrl({
      imageKey,
      expiresInSeconds: expiresIn,
    });

    return NextResponse.json({ url: signedUrl, key: imageKey });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keys, expiresIn = 3600 } = body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameter: keys (array of image keys)' },
        { status: 400 }
      );
    }

    if (keys.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 keys allowed per request' },
        { status: 400 }
      );
    }

    const signedUrls = generateMultipleSignedUrls(keys, expiresIn);

    return NextResponse.json({ urls: signedUrls });
  } catch (error) {
    console.error('Error generating signed URLs:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URLs' },
      { status: 500 }
    );
  }
}
