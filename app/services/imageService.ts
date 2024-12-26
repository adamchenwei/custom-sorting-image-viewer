// app/services/imageService.ts
interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[];
}

export async function moveImage(
  assetPath: string, 
  fileName: string, 
  targetPath: string,
  sortOptions?: SortOptions
): Promise<{ success: boolean, data?: any[] }> {
  try {
    console.log('Sending move request for:', { assetPath, fileName, targetPath, sortOptions });
    
    const response = await fetch('/api/images/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        assetPath, 
        fileName, 
        targetPath,
        sortOptions // Include sort options in the request
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Move request failed:', result);
      throw new Error(result.error || 'Failed to move image');
    }

    // Return the filtered data based on current sort options
    return {
      success: true,
      data: result.newData
    };
  } catch (error) {
    console.error('Error in moveImage service:', error);
    throw error;
  }
}

export async function deleteImage(assetPath: string, fileName: string): Promise<boolean> {
  try {
    console.log('Sending delete request for:', { assetPath, fileName });
    
    const response = await fetch('/api/images/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assetPath, fileName }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Delete request failed:', result);
      throw new Error(result.error || 'Failed to delete image');
    }

    console.log('Delete response:', result);
    return true;
  } catch (error) {
    console.error('Error in deleteImage service:', error);
    throw error;
  }
}