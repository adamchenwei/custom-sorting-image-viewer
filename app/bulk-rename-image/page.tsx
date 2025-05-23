'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { ImageRenameResult } from '../../services/types/bulk-rename.types';

export default function BulkRenameImage() {
  const [aiInstructionText, setAiInstructionText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<ImageRenameResult[]>([]);
  const [aiResponse, setAiResponse] = useState<{
    filenamesArray: { content: string; isJson: boolean };
    fullResponse: { content: string; isJson: boolean };
  } | null>(null);
  
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': []
    }
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('aiInstructionText', aiInstructionText);
      acceptedFiles.forEach(file => {
        formData.append('images', file);
      });

      const controller = new AbortController();
      const timeoutMs = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || '300000', 10);
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch('/api/bulk-rename-image', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to process images');
      }

      const result = await response.json();
      setSummary(result.summary);
      setAiResponse(result.aiResponse || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bulk Rename Images</h1>
      
      <div className="mb-4">
        <label className="block mb-2">AI Instructions:</label>
        <textarea
          className="w-full p-2 border rounded"
          value={aiInstructionText}
          onChange={(e) => setAiInstructionText(e.target.value)}
          rows={4}
          placeholder="Enter instructions for AI renaming..."
        />
      </div>

      <div className="mb-4">
        <div
          {...getRootProps()}
          className="border-2 border-dashed p-4 text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          <p>Drag & drop images here, or click to select files</p>
        </div>

        {acceptedFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            {acceptedFiles.map((file: any) => (
              <div key={file.path} className="relative h-32">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !acceptedFiles.length || !aiInstructionText}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
      >
        {isLoading ? 'Processing...' : 'Submit'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {aiResponse && (
        <>
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">Generated Filenames</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-48">
              <code className="block whitespace-pre text-sm">
                {aiResponse.filenamesArray.isJson 
                  ? JSON.stringify(JSON.parse(aiResponse.filenamesArray.content), null, 2)
                  : aiResponse.filenamesArray.content}
              </code>
            </pre>
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">AI Chat Reply</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              <code className="block whitespace-pre text-sm">
                {aiResponse.fullResponse.isJson 
                  ? JSON.stringify(JSON.parse(aiResponse.fullResponse.content), null, 2)
                  : aiResponse.fullResponse.content}
              </code>
            </pre>
          </div>
        </>
      )}

      {summary.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Results</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Count</th>
                <th className="border p-2">Original Filename</th>
                <th className="border p-2">New Filename</th>
                <th className="border p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2">{item.originalFilename}</td>
                  <td className="border p-2">{item.newFilename}</td>
                  <td className="border p-2">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
