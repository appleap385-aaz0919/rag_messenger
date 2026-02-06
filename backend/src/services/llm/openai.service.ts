import { OpenAI } from 'openai';
import config from '../../config/app.config';
import type {
  ILLMService,
  LLMMessage,
  LLMCompletionOptions,
  LLMCompletionResult,
} from './base.interface';

/**
 * OpenAI 호환 LLM 서비스 구현체
 * Zhipu AI 등 OpenAI 호환 API를 지원하는 공급자 사용 가능
 */
export class OpenAIService implements ILLMService {
  private client: OpenAI | null = null;
  private model: string;

  constructor() {
    this.model = config.llm.model;
    this.initializeClient();
  }

  private initializeClient(): void {
    const apiKey = config.llm.apiKey;
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: config.llm.baseUrl || 'https://api.openai.com/v1',
      });
    }
  }

  private ensureClient(): OpenAI {
    if (!this.client) {
      throw new Error('API Key가 설정되지 않았습니다. 설정에서 API Key를 입력해주세요.');
    }
    return this.client;
  }

  async complete(prompt: string, options?: LLMCompletionOptions): Promise<LLMCompletionResult> {
    const client = this.ensureClient();

    try {
      const response = await client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? config.llm.temperature,
        max_tokens: options?.maxTokens ?? config.llm.maxTokens,
      });

      const content = response.choices[0]?.message?.content ?? '';

      return {
        content,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`LLM 응답 생성 실패: ${error.message}`);
      }
      throw new Error(`LLM 응답 생성 실패: 알 수 없는 오류`);
    }
  }

  async chat(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<LLMCompletionResult> {
    const client = this.ensureClient();

    try {
      const response = await client.chat.completions.create({
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature ?? config.llm.temperature,
        max_tokens: options?.maxTokens ?? config.llm.maxTokens,
      });

      const content = response.choices[0]?.message?.content ?? '';

      return {
        content,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`LLM 응답 생성 실패: ${error.message}`);
      }
      throw new Error(`LLM 응답 생성 실패: 알 수 없는 오류`);
    }
  }

  async *streamComplete(
    prompt: string,
    options?: LLMCompletionOptions,
  ): AsyncGenerator<string> {
    const client = this.ensureClient();

    const stream = await client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? config.llm.temperature,
      max_tokens: options?.maxTokens ?? config.llm.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? '';
      if (content) {
        yield content;
      }
    }
  }

  async getModelInfo(): Promise<{ name: string; contextSize: number }> {
    // Zhipu AI 및 OpenAI 모델의 기본 컨텍스트 크기
    const contextSizes: Record<string, number> = {
      'glm-4-plus': 128000,
      'glm-4-0520': 128000,
      'glm-4': 128000,
      'glm-4-flash': 128000,
      'glm-4-air': 128000,
      'gpt-4o': 128000,
      'gpt-4o-mini': 128000,
      'gpt-4-turbo': 128000,
      'gpt-3.5-turbo': 16385,
    };

    return {
      name: this.model,
      contextSize: contextSizes[this.model] ?? 4096,
    };
  }

  setModel(model: string): void {
    this.model = model;
  }

  setApiKey(apiKey: string): void {
    this.client = new OpenAI({
      apiKey,
      baseURL: config.llm.baseUrl || 'https://api.openai.com/v1',
    });
  }

  setBaseUrl(baseUrl: string): void {
    const apiKey = config.llm.apiKey || '';
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
    });
  }

  reinitialize(): void {
    this.initializeClient();
  }
}
