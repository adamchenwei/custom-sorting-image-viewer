import slugify from 'slugify';
import fs from 'fs/promises';
import path from 'path';
import {
  BulkRenameRequest,
  BulkRenameResponse,
  IBulkRenameService,
  ImageRenameResult,
} from './types/bulk-rename.types';
import { ILLMService, LLMInput } from './types/llm.types';

export class BulkRenameService implements IBulkRenameService {
  private readonly baseOutputDir: string;
  private readonly llmService: ILLMService;
  private readonly publicDir: string = 'public';

  constructor(
    llmService: ILLMService,
    baseOutputDir: string = 'public/renamed'
  ) {
    this.llmService = llmService;
    this.baseOutputDir = baseOutputDir;
  }

  private generateChatId(instruction: string): string {
    // Extract key terms from instruction (first 5 words)
    const keyTerms = instruction
      .toLowerCase()
      .split(/\s+/)
      .slice(0, 5)
      .join('-');

    // Create a slug from the key terms
    const slug = slugify(keyTerms, {
      lower: true,
      strict: true,
      trim: true
    });

    // Add timestamp to ensure uniqueness
    const timestamp = new Date().getTime();
    return `${slug}-${timestamp}`;
  }

  private async createImagesWithNames(params: {
    images: File[];
    newFilenames: string[];
    chatId: string;
  }): Promise<ImageRenameResult[]> {
    const { images, newFilenames, chatId } = params;
    const outputDir = path.join(this.publicDir, chatId);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const summary: ImageRenameResult[] = [];

    // Process each image with the new filenames
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const newFilename = newFilenames[i] || `unnamed_${i}${path.extname(image.name)}`;

      try {
        // Save the image to the output directory
        const buffer = await image.arrayBuffer();
        await fs.writeFile(
          path.join(outputDir, newFilename),
          Buffer.from(buffer)
        );

        summary.push({
          originalFilename: image.name,
          newFilename,
          status: 'success',
        });
      } catch (error) {
        summary.push({
          originalFilename: image.name,
          newFilename,
          status: 'error',
        });
      }
    }

    return summary;
  }

  async renameImages(request: BulkRenameRequest): Promise<BulkRenameResponse> {
    try {
      // Convert images to LLM inputs
      const llmInputs: LLMInput[] = await Promise.all(
        request.images.map(async (image) => ({
          content: Buffer.from(await image.arrayBuffer()),
          type: 'image' as const,
        }))
      );

      // Get AI suggestions for new filenames
      const llmResponse = await this.llmService.talk({
        inputs: llmInputs,
        instruction: `${request.aiInstructionText}\nPlease return a JSON array of new filenames for the provided images. Each filename should be a string that includes the file extension. Example format: ["new-name-1.jpg", "new-name-2.png"]`,
        outputType: 'text',
      });

      // Parse the JSON response
      const newFilenames = JSON.parse(llmResponse.output.content as string) as string[];

      // Generate chatId based on the AI response and instruction
      const chatId = this.generateChatId(`${request.aiInstructionText}-${newFilenames.join('-')}`);

      // Create images with new names in the public/chat-id directory
      const summary = await this.createImagesWithNames({
        images: request.images,
        newFilenames,
        chatId
      });

      // Also save copies to the original output directory for backward compatibility
      const outputDir = path.join(this.baseOutputDir, chatId);
      await fs.mkdir(outputDir, { recursive: true });

      // Copy files from public/chat-id to the original output directory
      for (const result of summary) {
        if (result.status === 'success') {
          const sourceFile = path.join(this.publicDir, chatId, result.newFilename);
          const destFile = path.join(outputDir, result.newFilename);
          await fs.copyFile(sourceFile, destFile);
        }
      }

      return {
        status: 'success',
        summary,
        chatId,
      };
    } catch (error) {
      console.error('Failed to process images:', error);
      throw new Error('Failed to process images');
    }
  }
}
