/**
 * Image URL Service
 * 
 * Provides a unified way to get image URLs, supporting both:
 * - Local: /public folder (current)
 * - CloudFront: S3 with signed URLs (new)
 * 
 * Toggle via USE_CLOUDFRONT_IMAGES environment variable
 */

const USE_CLOUDFRONT = process.env.NEXT_PUBLIC_USE_CLOUDFRONT_IMAGES === 'true';

export interface ImageUrlOptions {
  assetPath: string;
  forceLocal?: boolean;
  forceCloudFront?: boolean;
}

/**
 * Converts a local asset path to a CloudFront key
 * Example: /images_optimized/Screenshot_2025-12-09_201623.webp -> images_optimized/Screenshot_2025-12-09_201623.webp
 */
export function assetPathToCloudFrontKey(assetPath: string): string {
  // Remove leading slash
  return assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
}

/**
 * Determines if CloudFront should be used for image loading
 */
export function shouldUseCloudFront(options?: { forceLocal?: boolean; forceCloudFront?: boolean }): boolean {
  if (options?.forceLocal) return false;
  if (options?.forceCloudFront) return true;
  return USE_CLOUDFRONT;
}

/**
 * Gets the image source - either local path or indicates CloudFront should be used
 * For CloudFront images, the actual signed URL must be fetched via API
 */
export function getImageSource(options: ImageUrlOptions): {
  type: 'local' | 'cloudfront';
  src?: string;
  cloudFrontKey?: string;
} {
  const useCloudFront = shouldUseCloudFront({
    forceLocal: options.forceLocal,
    forceCloudFront: options.forceCloudFront,
  });

  if (useCloudFront) {
    return {
      type: 'cloudfront',
      cloudFrontKey: assetPathToCloudFrontKey(options.assetPath),
    };
  }

  return {
    type: 'local',
    src: options.assetPath,
  };
}

/**
 * Fetches a signed URL from the API for CloudFront images
 */
export async function fetchSignedUrl(cloudFrontKey: string): Promise<string> {
  const response = await fetch(
    `/api/cloudfront/signed-url?key=${encodeURIComponent(cloudFrontKey)}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch signed URL');
  }

  const data = await response.json();
  return data.url;
}

/**
 * Fetches multiple signed URLs in a batch
 */
export async function fetchSignedUrls(cloudFrontKeys: string[]): Promise<Record<string, string>> {
  const response = await fetch('/api/cloudfront/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keys: cloudFrontKeys }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch signed URLs');
  }

  const data = await response.json();
  return data.urls;
}
