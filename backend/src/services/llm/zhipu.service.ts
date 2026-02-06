import config from '../../config/app.config';
import { generateZhipuToken } from '../../utils/zhipu.util';
import type {
    ILLMService,
    LLMMessage,
    LLMCompletionOptions,
    LLMCompletionResult,
} from './base.interface';

export class ZhipuService implements ILLMService {
    private apiKey: string;
    private baseUrl: string;
    private model: string;

    constructor() {
        this.apiKey = config.llm.apiKey || process.env.ZHIPU_API_KEY || '';
        this.baseUrl = (config.llm.baseUrl || process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/, '');
        this.model = config.llm.model || 'glm-4';
    }

    private getHeaders(): Record<string, string> {
        if (!this.apiKey) {
            throw new Error('Zhipu API Key가 설정되지 않았습니다.');
        }
        const token = generateZhipuToken(this.apiKey);
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async complete(prompt: string, options?: LLMCompletionOptions): Promise<LLMCompletionResult> {
        return this.chat([{ role: 'user', content: prompt }], options);
    }

    async chat(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<LLMCompletionResult> {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    model: this.model,
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    temperature: options?.temperature ?? config.llm.temperature,
                    max_tokens: options?.maxTokens ?? config.llm.maxTokens,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Zhipu API 오류: ${response.status} - ${errorText}`);
            }

            const data = await response.json() as any;
            const content = data.choices[0]?.message?.content || '';

            return {
                content,
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0,
                },
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Zhipu LLM 요청 실패: ${error.message}`);
            }
            throw new Error('Zhipu LLM 요청 실패: 알 수 없는 오류');
        }
    }

    async *streamComplete(
        prompt: string,
        options?: LLMCompletionOptions
    ): AsyncGenerator<string> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: options?.temperature ?? config.llm.temperature,
                max_tokens: options?.maxTokens ?? config.llm.maxTokens,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Zhipu API 오류: ${response.status} - ${errorText}`);
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
                        const content = data.choices[0]?.delta?.content || '';
                        if (content) {
                            yield content;
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
            contextSize: 128000,
        };
    }
}
