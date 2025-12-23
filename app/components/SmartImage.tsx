'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getImageSource, fetchSignedUrl } from '@/services/imageUrl';

interface SmartImageProps {
  assetPath: string;
  alt?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  forceLocal?: boolean;
  forceCloudFront?: boolean;
}

/**
 * SmartImage component that automatically switches between local and CloudFront images
 * based on the NEXT_PUBLIC_USE_CLOUDFRONT_IMAGES environment variable.
 * 
 * Supports both `fill` mode and explicit width/height.
 */
export function SmartImage({
  assetPath,
  alt = '',
  fill = false,
  width,
  height,
  className = '',
  style,
  priority = false,
  onLoad,
  onError,
  forceLocal,
  forceCloudFront,
}: SmartImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveImageSource() {
      try {
        setLoading(true);
        setError(null);

        const imageSource = getImageSource({
          assetPath,
          forceLocal,
          forceCloudFront,
        });

        if (imageSource.type === 'local') {
          setImageSrc(imageSource.src || null);
        } else if (imageSource.type === 'cloudfront' && imageSource.cloudFrontKey) {
          const signedUrl = await fetchSignedUrl(imageSource.cloudFrontKey);
          setImageSrc(signedUrl);
        }
      } catch (err) {
        console.error('Error resolving image source:', err);
        setError('Failed to load image');
        onError?.();
      } finally {
        setLoading(false);
      }
    }

    if (assetPath) {
      resolveImageSource();
    }
  }, [assetPath, forceLocal, forceCloudFront, onError]);

  if (loading) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
        style={fill ? { position: 'absolute', inset: 0, ...style } : { width, height, ...style }}
      >
        <span className="text-gray-400 text-xs">Loading...</span>
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={fill ? { position: 'absolute', inset: 0, ...style } : { width, height, ...style }}
      >
        <span className="text-gray-500 text-xs">{error || 'Image not available'}</span>
      </div>
    );
  }

  const imageProps = fill
    ? { fill: true as const }
    : { width: width || 800, height: height || 600 };

  return (
    <Image
      src={imageSrc}
      alt={alt}
      {...imageProps}
      className={className}
      style={style}
      priority={priority}
      unoptimized={imageSrc.startsWith('https://')}
      onLoad={onLoad}
      onError={() => {
        setError('Failed to load image');
        onError?.();
      }}
    />
  );
}

export default SmartImage;
