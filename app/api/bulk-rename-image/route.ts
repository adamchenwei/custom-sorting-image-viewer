import { NextRequest, NextResponse } from 'next/server';
import { BulkRenameService } from '../../../services/BulkRenameService';
import { LLMService } from '../../../services/LLMService';

const llmService = new LLMService();
const bulkRenameService = new BulkRenameService(llmService);

export async function POST(request: NextRequest) {
  try {
    console.log('Environment variables in API route:', {
      CLAUDE_AI_API: process.env.CLAUDE_AI_API,
    });
    const formData = await request.formData();
    const aiInstructionText = formData.get('aiInstructionText') as string;
    const imageFiles = formData.getAll('images') as File[];

    if (!aiInstructionText || !imageFiles.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await bulkRenameService.renameImages({
      images: imageFiles,
      aiInstructionText,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bulk rename error:', error);
    return NextResponse.json(
      { error: 'Failed to process images' },
      { status: 500 }
    );
  }
}
