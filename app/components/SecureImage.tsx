'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SecureImageProps {
  imageKey: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function SecureImage({
  imageKey,
  alt = '',
  width = 800,
  height = 600,
  className = '',
  priority = false,
  onLoad,
  onError,
}: SecureImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `/api/cloudfront/signed-url?key=${encodeURIComponent(imageKey)}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch signed URL');
        }
        
        const data = await response.json();
        setSignedUrl(data.url);
      } catch (err) {
        console.error('Error fetching signed URL:', err);
        setError('Failed to load image');
        onError?.();
      } finally {
        setLoading(false);
      }
    }

    if (imageKey) {
      fetchSignedUrl();
    }
  }, [imageKey, onError]);

  if (loading) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500">{error || 'Image not available'}</span>
      </div>
    );
  }

  return (
    <Image
      src={signedUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized
      onLoad={onLoad}
      onError={() => {
        setError('Failed to load image');
        onError?.();
      }}
    />
  );
}

export default SecureImage;
