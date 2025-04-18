export type MediaType = 'text' | 'image' | 'audio';

export interface LLMInput {
  content: string | Buffer;
  type: MediaType;
}

export interface LLMOutput {
  content: string | Buffer;
  type: MediaType;
}

export type LLMProvider = 'openai' | 'anthropic';

export interface LLMRequest {
  inputs: LLMInput[];
  instruction: string;
  provider?: LLMProvider;
  outputType?: MediaType;
}

export interface LLMResponse {
  output: LLMOutput;
  provider: LLMProvider;
}

export interface ILLMService {
  talk(request: LLMRequest): Promise<LLMResponse>;
}
