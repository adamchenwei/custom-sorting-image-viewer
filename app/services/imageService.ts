// app/services/imageService.ts
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