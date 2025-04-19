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
Please ONLY return a JSON array of new filenames for the provided ${images.length} images. Each filename should be a string that includes the file extension. Make sure to maintain consistency with any previously mentioned filenames. Example format: ["new-name-1.jpg", "new-name-2.png"]`,
        outputType: 'text',
      }),
      this.llmService.talk({
        inputs: llmInputs,
        instruction: `${instruction}
Please analyze these ${images.length} images and provide your reasoning.`,
        outputType: 'text',
      })
    ]);

    // Parse and validate filenames
    let parsedFilenames: string[] = [];
    try {
      parsedFilenames = JSON.parse(filenamesResponse.output.content as string);
      
      // Ensure we have the correct number of filenames
      if (parsedFilenames.length !== images.length) {
        console.warn(`LLM returned ${parsedFilenames.length} filenames for ${images.length} images. Adding fallback names.`);
        
        // Extend array with fallback names if needed
        while (parsedFilenames.length < images.length) {
          const index = parsedFilenames.length;
          parsedFilenames.push(`unnamed_${index}${path.extname(images[index].name)}`);
        }
        
        // Trim excess filenames if needed
        if (parsedFilenames.length > images.length) {
          parsedFilenames = parsedFilenames.slice(0, images.length);
        }
      }
      
      // Ensure all filenames have extensions
      parsedFilenames = parsedFilenames.map((filename, index) => {
        if (!path.extname(filename)) {
          return `${filename}${path.extname(images[index].name)}`;
        }
        return filename;
      });
      
    } catch (error) {
      console.error('Failed to parse filenames from LLM response:', error);
      // Fallback to default naming
      parsedFilenames = images.map((image, index) => `unnamed_${index}${path.extname(image.name)}`);
    }
    
    return {
      filenames: parsedFilenames,
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
        
        // For the first batch, generate filenames normally
        // For subsequent batches, pass the context of already generated filenames
        let batchInstruction = request.aiInstructionText;
        if (i > 0 && allFilenames.length > 0) {
          // Add context about previously generated filenames
          batchInstruction = `${request.aiInstructionText}\n\nIMPORTANT: For consistency, please follow the naming pattern used in these previously generated filenames: ${JSON.stringify(allFilenames)}\n\n(Processing batch ${i + 1}/${totalBatches})`;
        } else {
          batchInstruction = `${request.aiInstructionText} (Processing batch ${i + 1}/${totalBatches})`;
        }
        
        const { filenames, explanation } = await this.processBatch(
          batchImages,
          batchInstruction
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
