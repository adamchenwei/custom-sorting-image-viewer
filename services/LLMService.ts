import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import {
  ILLMService,
  LLMRequest,
  LLMResponse,
  LLMProvider,
  MediaType,
} from './types/llm.types';
import { ImageOptimizationService } from './ImageOptimizationService';

export class LLMService implements ILLMService {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private imageOptimizer: ImageOptimizationService;

  constructor(
    openaiApiKey: string = process.env.OPENAI_API_KEY || '',
    anthropicApiKey: string = process.env.CLAUDE_AI_API || ''
  ) {
    console.log('Anthropic API key----------:', anthropicApiKey);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
    this.imageOptimizer = new ImageOptimizationService();
  }

  private async talkToOpenAI(
    instruction: string,
    inputs: { content: string | Buffer; type: MediaType }[],
    outputType: MediaType
  ): Promise<{ content: string | Buffer; type: MediaType }> {
    if (outputType !== 'text') {
      throw new Error('OpenAI currently only supports text output in this implementation');
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: instruction },
    ];

    // Add input content as user messages
    for (const input of inputs) {
      if (input.type === 'text') {
        messages.push({ role: 'user', content: input.content as string });
      } else if (input.type === 'image') {
        // Optimize image before sending to OpenAI
        const optimizedImage = await this.imageOptimizer.optimizeImage(input.content as Buffer);
        messages.push({
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${optimizedImage.mimeType};base64,${optimizedImage.buffer.toString('base64')}`,
              },
            },
          ],
        });
      }
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages,
      max_tokens: 1000,
    });

    // Log token usage
    console.log('OpenAI API Usage:', {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
      estimatedCost: `$${((response.usage?.total_tokens || 0) * 0.00001).toFixed(4)}` // $0.01 per 1K tokens
    });

    return {
      content: response.choices[0]?.message?.content || '',
      type: 'text',
    };
  }

  private async talkToAnthropic(
    instruction: string,
    inputs: { content: string | Buffer; type: MediaType }[],
    outputType: MediaType
  ): Promise<{ content: string | Buffer; type: MediaType }> {
    if (outputType !== 'text') {
      throw new Error('Anthropic currently only supports text output in this implementation');
    }

    console.log('Starting Anthropic API call with instruction:', instruction);

    try {
      const messages: any[] = [{ role: 'user', content: instruction }];

      // Add input content
      for (const input of inputs) {
        if (input.type === 'text') {
          messages.push({ role: 'user', content: input.content as string });
        } else if (input.type === 'image') {
          // Optimize image before converting to base64
          const optimizedImage = await this.imageOptimizer.optimizeImage(input.content as Buffer);
          const base64Data = optimizedImage.buffer.toString('base64');
          
          messages.push({
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: optimizedImage.mimeType,
                  data: base64Data,
                },
              },
            ],
          });
        }
      }

      console.log('Prepared messages for Anthropic:', JSON.stringify(messages, null, 2));

      const response = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages,
      });

      // Log token usage and cost
      console.log('Anthropic API Usage:', {
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        estimatedCost: `$${(
          ((response.usage?.input_tokens || 0) * 0.00015) + // $0.15 per 1K input tokens
          ((response.usage?.output_tokens || 0) * 0.00075)  // $0.75 per 1K output tokens
        ).toFixed(4)}`
      });

      return {
        content: response.content[0]?.text || '',
        type: 'text',
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  async talk(request: LLMRequest): Promise<LLMResponse> {
    const outputType = request.outputType || 'text';
    const provider = request.provider || 'anthropic';

    const output = provider === 'anthropic'
      ? await this.talkToAnthropic(request.instruction, request.inputs, outputType)
      : await this.talkToOpenAI(request.instruction, request.inputs, outputType);

    return {
      output,
      provider,
    };
  }
}
