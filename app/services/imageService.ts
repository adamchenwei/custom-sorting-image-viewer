// app/services/imageService.ts
interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[];
}

interface ImageToMove {
  assetPath: string;
  fileName: string;
}

export async function moveImages(
  images: ImageToMove[],
  targetPath: string,
  sortOptions?: SortOptions
): Promise<{ success: boolean; data?: any[] }> {
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
  } catch (error) {
    console.error('Error in moveImages service:', error);
    throw error;
  }
}

export async function deleteImages(
  images: { assetPath: string; fileName: string }[]
): Promise<boolean> {
  try {
    console.log('Sending bulk delete request for:', images);
    
    const response = await fetch('/api/images/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Bulk delete request failed:', result);
      throw new Error(result.error || 'Failed to delete images');
    }

    console.log('Bulk delete response:', result);
    return true;
  } catch (error) {
    console.error('Error in deleteImages service:', error);
    throw error;
  }
}