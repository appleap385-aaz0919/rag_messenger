import config from '../../config/app.config';
import type {
    ILLMService,
    LLMMessage,
    LLMCompletionOptions,
    LLMCompletionResult,
} from './base.interface';

/**
 * Anthropic 호환 LLM 서비스 (api.z.ai/api/anthropic 등)
 */
export class AnthropicService implements ILLMService {
    private apiKey: string;
    private baseUrl: string;
    private model: string;

    constructor() {
        this.apiKey = config.llm.apiKey || process.env.ANTHROPIC_API_KEY || '';
        this.baseUrl = (config.llm.baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
        this.model = config.llm.model || 'claude-3-sonnet-20240229';
    }

    private getHeaders(): Record<string, string> {
        if (!this.apiKey) {
            throw new Error('Anthropic API Key가 설정되지 않았습니다.');
        }
        return {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
        };
    }

    async complete(prompt: string, options?: LLMCompletionOptions): Promise<LLMCompletionResult> {
        return this.chat([{ role: 'user', content: prompt }], options);
    }

    async chat(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<LLMCompletionResult> {
        try {
            // Anthropic API 형식으로 변환
            const anthropicMessages = messages.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content,
            }));

            // system 메시지 분리
            const systemMessage = messages.find(m => m.role === 'system')?.content || '';
            const nonSystemMessages = anthropicMessages.filter(m => m.role !== 'system');

            const response = await fetch(`${this.baseUrl}/v1/messages`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: options?.maxTokens ?? config.llm.maxTokens ?? 2000,
                    system: systemMessage,
                    messages: nonSystemMessages,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Anthropic API 오류: ${response.status} - ${errorText}`);
            }

            const data = await response.json() as any;
            const content = data.content?.[0]?.text || '';

            return {
                content,
                usage: {
                    promptTokens: data.usage?.input_tokens || 0,
                    completionTokens: data.usage?.output_tokens || 0,
                    totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
                },
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Anthropic LLM 요청 실패: ${error.message}`);
            }
            throw new Error('Anthropic LLM 요청 실패: 알 수 없는 오류');
        }
    }

    async *streamComplete(
        prompt: string,
        options?: LLMCompletionOptions
    ): AsyncGenerator<string> {
        const response = await fetch(`${this.baseUrl}/v1/messages`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                model: this.model,
                max_tokens: options?.maxTokens ?? config.llm.maxTokens ?? 2000,
                messages: [{ role: 'user', content: prompt }],
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Anthropic API 오류: ${response.status} - ${errorText}`);
        }

        if (!response.body) throw new Error('Response body is null');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') continue;
                    try {
                        const data = JSON.parse(dataStr);
                        // Anthropic 스트리밍 응답 형식
                        if (data.type === 'content_block_delta') {
                            const text = data.delta?.text || '';
                            if (text) {
                                yield text;
                            }
                        }
                    } catch (e) {
                        // ignore parse errors
                    }
                }
            }
        }
    }

    async getModelInfo(): Promise<{ name: string; contextSize: number }> {
        return {
            name: this.model,
            contextSize: 200000,
        };
    }
}
