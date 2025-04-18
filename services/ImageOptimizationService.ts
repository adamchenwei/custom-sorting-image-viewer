import sharp from 'sharp';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  preserveFormat?: boolean;
}

export interface OptimizedImage {
  buffer: Buffer;
  format: string;
  mimeType: string;
}

export class ImageOptimizationService {
  private static readonly DEFAULT_OPTIONS: ImageOptimizationOptions = {
    maxWidth: Number(process.env.IMAGE_MAX_WIDTH) || 800,
    maxHeight: Number(process.env.IMAGE_MAX_HEIGHT) || 800,
    quality: Number(process.env.IMAGE_QUALITY) || 80,
    format: (process.env.IMAGE_FORMAT as 'jpeg' | 'webp' | 'png') || 'jpeg',
    preserveFormat: true // Keep original format by default
  };

  private static readonly FORMAT_TO_MIME: Record<string, string> = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif'
  };

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  async detectImageFormat(imageBuffer: Buffer): Promise<string> {
    const metadata = await sharp(imageBuffer).metadata();
    if (!metadata.format) {
      throw new Error('Could not detect image format');
    }
    return metadata.format;
  }

  async optimizeImage(
    imageBuffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const finalOptions = { ...ImageOptimizationService.DEFAULT_OPTIONS, ...options };
    
    // Get original image info
    const originalInfo = await sharp(imageBuffer).metadata();
    const originalSize = imageBuffer.length;
    
    // Detect original format
    const originalFormat = await this.detectImageFormat(imageBuffer);
    
    // Determine output format
    const outputFormat = finalOptions.preserveFormat ? originalFormat : finalOptions.format;
    
    let pipeline = sharp(imageBuffer)
      .resize(finalOptions.maxWidth, finalOptions.maxHeight, {
        fit: 'inside',          // Maintain aspect ratio
        withoutEnlargement: true // Don't upscale small images
      });
      
    console.log(`Original image: ${this.formatBytes(originalSize)} | ${originalInfo.width}x${originalInfo.height} | ${originalFormat}`);

    // Convert to the specified format
    switch (outputFormat) {
      case 'webp':
        pipeline = pipeline.webp({ quality: finalOptions.quality });
        break;
      case 'png':
        pipeline = pipeline.png({ 
          quality: finalOptions.quality,
          compressionLevel: 9 // Max compression for PNG
        });
        break;
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality: finalOptions.quality });
        break;
      default:
        // For other formats (gif, etc.), keep as is but still resize
        break;
    }

    const buffer = await pipeline.toBuffer();
    // Get the final format from metadata to ensure it's accurate
    const metadata = await sharp(buffer).metadata();
    if (!metadata.format) {
      throw new Error('Could not detect output image format');
    }
    const format = metadata.format;
    
    // Ensure we have a valid MIME type
    const mimeType = format in ImageOptimizationService.FORMAT_TO_MIME
      ? ImageOptimizationService.FORMAT_TO_MIME[format as keyof typeof ImageOptimizationService.FORMAT_TO_MIME]
      : `image/${format}`;

    // Log optimization results
    const optimizedSize = buffer.length;
    const optimizedInfo = await sharp(buffer).metadata();
    const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`Optimized image: ${this.formatBytes(optimizedSize)} | ${optimizedInfo.width}x${optimizedInfo.height} | ${format}`);
    console.log(`Size reduction: ${compressionRatio}% | Settings: quality=${finalOptions.quality}, maxWidth=${finalOptions.maxWidth}, maxHeight=${finalOptions.maxHeight}`);
    
    return {
      buffer,
      format,
      mimeType
    };
  }

  async getOptimizedImageSize(imageBuffer: Buffer): Promise<number> {
    const metadata = await sharp(imageBuffer).metadata();
    return metadata.size || 0;
  }
}
