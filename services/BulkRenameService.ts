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
import { ImageOptimizationService } from './ImageOptimizationService';

export class BulkRenameService implements IBulkRenameService {
  private readonly baseOutputDir: string;
  private readonly llmService: ILLMService;
  private readonly imageOptimizer: ImageOptimizationService;
  private readonly BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);


  constructor(
    llmService: ILLMService,
    baseOutputDir: string = 'public/renamed'
  ) {
    this.llmService = llmService;
    this.baseOutputDir = baseOutputDir;
    this.imageOptimizer = new ImageOptimizationService();
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
    const outputDir = path.join(this.baseOutputDir, chatId);

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

  private async processBatch(
    images: File[],
    instruction: string
  ): Promise<{ filenames: string[]; explanation: string }> {
    // Convert and optimize images for LLM inputs
    const llmInputs: LLMInput[] = await Promise.all(
      images.map(async (image) => {
        const imageBuffer = Buffer.from(await image.arrayBuffer());
        console.log(`\nProcessing image: ${image.name}`);
        const optimizedImage = await this.imageOptimizer.optimizeImage(imageBuffer);
        return {
          content: optimizedImage.buffer,
          type: 'image' as const,
        };
      })
    );

    // Get filenames and explanation for this batch
    const [filenamesResponse, fullResponse] = await Promise.all([
      this.llmService.talk({
        inputs: llmInputs,
        instruction: `${instruction}
Please ONLY return a JSON array of new filenames for the provided ${images.length} images. Each filename should be a string that includes the file extension. Example format: ["new-name-1.jpg", "new-name-2.png"]`,
        outputType: 'text',
      }),
      this.llmService.talk({
        inputs: llmInputs,
        instruction: `${instruction}
Please analyze these ${images.length} images and provide your reasoning.`,
        outputType: 'text',
      })
    ]);

    return {
      filenames: JSON.parse(filenamesResponse.output.content as string),
      explanation: fullResponse.output.content as string
    };
  }

  async renameImages(request: BulkRenameRequest): Promise<BulkRenameResponse> {
    try {
      const allImages = request.images;
      const totalBatches = Math.ceil(allImages.length / this.BATCH_SIZE);
      let allFilenames: string[] = [];
      let allExplanations: string[] = [];

      // Process images in batches
      for (let i = 0; i < totalBatches; i++) {
        const start = i * this.BATCH_SIZE;
        const end = Math.min(start + this.BATCH_SIZE, allImages.length);
        const batchImages = allImages.slice(start, end);
        
        console.log(`Processing batch ${i + 1}/${totalBatches} (${batchImages.length} images)`);
        
        const { filenames, explanation } = await this.processBatch(
          batchImages,
          `${request.aiInstructionText} (Processing batch ${i + 1}/${totalBatches})`
        );

        allFilenames = [...allFilenames, ...filenames];
        allExplanations.push(explanation);
      }

      // Generate chatId based on the AI response and instruction
      const chatId = this.generateChatId(`${request.aiInstructionText}-${allFilenames.join('-')}`);

      // Create images with new names in the public/chat-id directory
      const summary = await this.createImagesWithNames({
        images: allImages,
        newFilenames: allFilenames,
        chatId
      });

      // Combine all explanations into one response
      const fullContent = allExplanations.join('\n\n=== Next Batch ===\n\n');
      const filenamesContent = JSON.stringify(allFilenames, null, 2);

      return {
        status: 'success',
        summary,
        chatId,
        aiResponse: {
          filenamesArray: {
            content: filenamesContent,
            isJson: true
          },
          fullResponse: {
            content: fullContent,
            isJson: false
          }
        }
      };
    } catch (error) {
      console.error('Failed to process images:', error);
      throw new Error('Failed to process images');
    }
  }
}
