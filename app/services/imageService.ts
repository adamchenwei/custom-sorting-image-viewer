/* eslint-disable @typescript-eslint/no-explicit-any */
// app/services/imageService.ts
interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[];
}

interface ImageItem {
  assetPath: string;
  fileName: string;
}

export const moveImages = async (
  images: ImageItem[],
  targetPath: string,
  sortOptions?: SortOptions
): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    console.log('Sending bulk move request for:', { images, targetPath, sortOptions });
    
    const response = await fetch('/api/images/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        images,
        targetPath,
        sortOptions
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Move request failed:', result);
      throw new Error(result.error || 'Failed to move images');
    }

    return {
      success: true,
      data: result.newData
    };
  } catch (error: unknown) {
    console.error('Error in moveImages service:', error);
    throw error;
  }
}

export const deleteImages = async (images: unknown): Promise<{ success: boolean; error?: string }> => {
  const typedImages = images as Array<{ assetPath: string; fileName: string }>;
  try {
    console.log('Sending bulk delete request for:', typedImages);
    
    const response = await fetch('/api/images/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images: typedImages }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Bulk delete request failed:', result);
      throw new Error(result.error || 'Failed to delete images');
    }

    console.log('Bulk delete response:', result);
    return {
      success: true
    };
  } catch (error: unknown) {
    console.error('Error deleting images:', error);
    return { success: false, error: String(error) };
  }
}
