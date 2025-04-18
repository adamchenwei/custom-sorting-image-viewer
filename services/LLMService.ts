import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import {
  ILLMService,
  LLMRequest,
  LLMResponse,
  LLMProvider,
  MediaType,
} from './types/llm.types';

export class LLMService implements ILLMService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor(
    openaiApiKey: string = process.env.OPENAI_API_KEY || '',
    anthropicApiKey: string = process.env.CLAUDE_AI_API || ''
  ) {
    console.log('Anthropic API key----------:', anthropicApiKey);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
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
        messages.push({
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${(input.content as Buffer).toString('base64')}`,
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
          // Convert image content to base64
          const base64Data = (input.content as Buffer).toString('base64');
          
          // Always use PNG as the media type
          const mediaType = 'image/png';
          
          messages.push({
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
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

      console.log('Anthropic API response:', response);

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
    let output;
    let provider = request.provider || 'anthropic';

    try {
      if (provider === 'anthropic') {
        output = await this.talkToAnthropic(request.instruction, request.inputs, outputType);
      } else {
        output = await this.talkToOpenAI(request.instruction, request.inputs, outputType);
      }
    } catch (error) {
      if (provider === 'anthropic' && !request.provider) {
        // If Anthropic fails and it was the default choice, try OpenAI as fallback
        console.warn('Anthropic API failed, falling back to OpenAI:', error);
        provider = 'openai';
        output = await this.talkToOpenAI(request.instruction, request.inputs, outputType);
      } else {
        throw error;
      }
    }

    return {
      output,
      provider,
    };
  }
}
