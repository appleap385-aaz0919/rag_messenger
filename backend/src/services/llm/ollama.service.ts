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

  async complete(prompt: string, options?: LLMCompletionOptions, retries = 3): Promise<LLMCompletionResult> {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await this.client.generate({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: options?.temperature ?? config.llm.temperature,
            num_predict: options?.maxTokens ?? config.llm.maxTokens,
          },
        });

        clearTimeout(timeoutId);

        return {
          content: response.response,
          usage: {
            promptTokens: response.prompt_eval_count ?? 0,
            completionTokens: response.eval_count ?? 0,
            totalTokens: (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0),
          },
        };
      } catch (error) {
        const isLastRetry = i === retries - 1;
        if (isLastRetry) {
          if (error instanceof Error && 'cause' in error) {
            const cause = (error as { cause: { code?: string } }).cause;
            if (cause?.code === 'ECONNREFUSED') {
              throw new Error(`Ollama 서버에 연결할 수 없습니다 (${config.llm.baseUrl}). Ollama 서버가 실행 중인지 확인해주세요.`);
            }
          }
          throw new Error(`LLM 응답 생성 실패 (최종 시도): ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
        console.warn(`[LLM] generate attempt ${i + 1} failed, retrying in 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('LLM 응답 생성 실패: 모든 재시도가 실패했습니다.');
  }

  async chat(messages: LLMMessage[], options?: LLMCompletionOptions, retries = 3): Promise<LLMCompletionResult> {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

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

        clearTimeout(timeoutId);

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
        const isLastRetry = i === retries - 1;
        if (isLastRetry) {
          if (error instanceof Error && 'cause' in error) {
            const cause = (error as { cause: { code?: string } }).cause;
            if (cause?.code === 'ECONNREFUSED') {
              throw new Error(`Ollama 서버에 연결할 수 없습니다 (${config.llm.baseUrl}). Ollama 서버가 실행 중인지 확인해주세요.`);
            }
          }
          if (error instanceof Error) {
            throw error;
          }
          throw new Error(`LLM 응답 생성 실패 (최종 시도): ${String(error)}`);
        }
        console.warn(`[LLM] chat attempt ${i + 1} failed, retrying in 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('LLM 응답 생성 실패: 모든 재시도가 실패했습니다.');
  }

  async *streamComplete(
    prompt: string,
    options?: LLMCompletionOptions,
  ): AsyncGenerator<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[Ollama-Stream] Timeout reached! Aborting request...');
      controller.abort();
    }, 300000); // 5 minutes

    try {
      console.log(`[Ollama-Stream] Requesting Ollama (phi3). Prompt chars: ${prompt.length}`);

      // Stop tokens are critical for Phi-3 to avoid "answering for the user" loop
      const generateOptions: any = {
        model: this.model,
        prompt,
        stream: true,
        options: {
          temperature: options?.temperature ?? config.llm.temperature,
          num_predict: options?.maxTokens ?? config.llm.maxTokens,
          repeat_penalty: 1.2,
          stop: ["<|end|>", "주인님:", "제프리:", "\n\n", "질문:", "답변:"],
        },
      };

      const stream = await (this.client as any).generate({
        ...generateOptions,
      }, { signal: controller.signal });
      console.log('[Ollama-Stream] Response headers received. Streaming started.');

      clearTimeout(timeoutId);

      let chunkCount = 0;
      for await (const part of stream) {
        if (part.response) {
          chunkCount++;
          if (chunkCount === 1) console.log('[Ollama-Stream] First response chunk received!');
          if (chunkCount % 20 === 0) console.log(`[Ollama-Stream] Yielded ${chunkCount} chunks...`);
          yield part.response;
        }
      }
      console.log(`[Ollama-Stream] Stream finished. Total chunks: ${chunkCount}`);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ollama 응답 대기 시간이 초과되었습니다 (60s).');
      }
      throw error;
    }
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
