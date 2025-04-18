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

  constructor(
    llmService: ILLMService,
    baseOutputDir: string = 'public/images/renamed'
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
      const outputDir = path.join(this.baseOutputDir, chatId);

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      const summary: ImageRenameResult[] = [];

      // Process each image with the new filenames
      for (let i = 0; i < request.images.length; i++) {
        const image = request.images[i];
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
