import { Ollama } from 'ollama';
import config from '../../config/app.config';
import type {
  ILLMService,
  LLMMessage,
  LLMCompletionOptions,
  LLMCompletionResult,
} from './base.interface';

/**
 * Ollama LLM 서비스 구현체
 */
export class OllamaService implements ILLMService {
  private client: Ollama;
  private model: string;

  constructor() {
    this.client = new Ollama({ host: config.llm.baseUrl });
    this.model = config.llm.model;
  }

  async complete(prompt: string, options?: LLMCompletionOptions): Promise<LLMCompletionResult> {
    try {
      const response = await this.client.generate({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? config.llm.temperature,
          num_predict: options?.maxTokens ?? config.llm.maxTokens,
        },
      });

      return {
        content: response.response,
        usage: {
          promptTokens: response.prompt_eval_count ?? 0,
          completionTokens: response.eval_count ?? 0,
          totalTokens: (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0),
        },
      };
    } catch (error) {
      if (error instanceof Error && 'cause' in error) {
        const cause = (error as { cause: { code?: string } }).cause;
        if (cause?.code === 'ECONNREFUSED') {
          throw new Error(`Ollama 서버에 연결할 수 없습니다 (${config.llm.baseUrl}). Ollama 서버가 실행 중인지 확인해주세요.`);
        }
      }
      throw new Error(`LLM 응답 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  async chat(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<LLMCompletionResult> {
    try {
      const response = await this.client.chat({
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: false,
        options: {
          temperature: options?.temperature ?? config.llm.temperature,
          num_predict: options?.maxTokens ?? config.llm.maxTokens,
        },
      });

      if (response.message?.content) {
        return {
          content: response.message.content,
          usage: {
            promptTokens: response.prompt_eval_count ?? 0,
            completionTokens: response.eval_count ?? 0,
            totalTokens: (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0),
          },
        };
      }

      throw new Error('Ollama 응답에 내용이 없습니다.');
    } catch (error) {
      if (error instanceof Error && 'cause' in error) {
        const cause = (error as { cause: { code?: string } }).cause;
        if (cause?.code === 'ECONNREFUSED') {
          throw new Error(`Ollama 서버에 연결할 수 없습니다 (${config.llm.baseUrl}). Ollama 서버가 실행 중인지 확인해주세요.`);
        }
      }
      if (error instanceof Error) {
        throw error; // Re-throw the error if it's already been handled
      }
      throw new Error(`LLM 응답 생성 실패: ${String(error)}`);
    }
  }

  async streamComplete(
    prompt: string,
    onChunk?: (chunk: string) => void,
    options?: LLMCompletionOptions,
  ): Promise<LLMCompletionResult> {
    let fullContent = '';

    const stream = await this.client.generate({
      model: this.model,
      prompt,
      stream: true,
      options: {
        temperature: options?.temperature ?? config.llm.temperature,
        num_predict: options?.maxTokens ?? config.llm.maxTokens,
      },
    });

    for await (const part of stream) {
      if (part.response) {
        fullContent += part.response;
        onChunk?.(part.response);
      }
    }

    return {
      content: fullContent,
    };
  }

  async getModelInfo(): Promise<{ name: string; contextSize: number }> {
    try {
      const response = await this.client.show({ model: this.model });
      const contextLength = response.model_info?.get?.('context_length');
      return {
        name: this.model,
        contextSize: contextLength ?? 2048,
      };
    } catch {
      return {
        name: this.model,
        contextSize: 2048,
      };
    }
  }

  setModel(model: string): void {
    this.model = model;
  }
}
