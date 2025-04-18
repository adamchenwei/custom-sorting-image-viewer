export interface ImageRenameResult {
  originalFilename: string;
  newFilename: string;
  status: 'success' | 'error';
}

export interface BulkRenameResponse {
  status: 'success' | 'error';
  summary: ImageRenameResult[];
  chatId: string;
  aiResponse?: {
    filenamesArray: {
      content: string;
      isJson: boolean;
    };
    fullResponse: {
      content: string;
      isJson: boolean;
    };
  };
}

export interface BulkRenameRequest {
  images: File[];
  aiInstructionText: string;
}

export interface IBulkRenameService {
  renameImages(request: BulkRenameRequest): Promise<BulkRenameResponse>;
}
