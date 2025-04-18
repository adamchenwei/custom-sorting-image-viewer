export interface ImageRenameResult {
  originalFilename: string;
  newFilename: string;
  status: 'success' | 'error';
}

export interface BulkRenameResponse {
  status: string;
  summary: ImageRenameResult[];
  chatId: string;
}

export interface BulkRenameRequest {
  images: File[];
  aiInstructionText: string;
}

export interface IBulkRenameService {
  renameImages(request: BulkRenameRequest): Promise<BulkRenameResponse>;
}
