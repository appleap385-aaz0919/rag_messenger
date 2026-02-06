// import { chromaService } from '../vectorstore/chroma.service';
// import { hnswService } from '../vectorstore/hnsw.service';
import { inMemoryVectorStore } from '../vectorstore/in-memory-store';
import { llmService } from '../llm/llm.factory';
import { embeddingsService } from '../embeddings/embeddings.factory';

import { DocumentSource } from '../../types';

export interface RagResponse {
  answer: string;
  sources: DocumentSource[];
}

export class RagPipelineService {
  async query(question: string): Promise<RagResponse> {
    const startTime = Date.now();
    try {
      console.log(`[RAG] Starting query: "${question.substring(0, 30)}..."`);

      // 1. Retrieve
      console.time('[RAG] Retrieval');
      const queryEmbeddingResult = await embeddingsService.embedText(question);
      const results = await inMemoryVectorStore.search(queryEmbeddingResult.embedding, 5);
      console.timeEnd('[RAG] Retrieval');

      if (!results || results.length === 0) {
        return {
          answer: "죄송합니다. 관련 문서를 찾을 수 없어 답변드릴 수 없습니다.",
          sources: []
        };
      }

      // 2. Format Context & Generate Prompt
      const context = results.map(d => d.content).join('\n\n---\n\n');
      const prompt = this.buildPrompt(context, question);

      // 3. Generate
      console.time('[RAG] Generation');
      const response = await llmService.complete(prompt);
      console.timeEnd('[RAG] Generation');

      const sources = this.extractSources(results);
      console.log(`[RAG] Total query time: ${Date.now() - startTime}ms`);

      return {
        answer: response.content,
        sources
      };
    } catch (error) {
      console.error('RAG Query Failed:', error);
      throw error;
    }
  }

  async *queryStream(question: string): AsyncGenerator<{ type: 'chunk' | 'sources' | 'error'; content: any }> {
    const startTime = Date.now();
    try {
      console.log(`[RAG-Stream] Starting: "${question.substring(0, 30)}..."`);

      console.time('[RAG-Stream] Retrieval');
      const queryEmbeddingResult = await embeddingsService.embedText(question);
      const rawResults = await inMemoryVectorStore.search(queryEmbeddingResult.embedding, 5);

      // Log all similarities for debugging
      rawResults.forEach((r, i) => {
        console.log(`[RAG-Log] Rank ${i + 1}: Sim=${r.similarity.toFixed(4)} | File=${r.metadata.fileName || r.metadata.filename}`);
      });

      // Strongly filter
      const results = rawResults.filter(r => r.similarity > 0.75); // Even stricter
      console.timeEnd('[RAG-Stream] Retrieval');

      if (!results || results.length === 0) {
        console.log('[RAG-Stream] No related documents found. Falling back to general knowledge.');
        // If no documents found, proceed with empty context instead of failing
      }

      const sources = this.extractSources(results || []);
      if (sources.length > 0) {
        console.log(`[RAG-Stream] Retrieved ${results.length} documents. Top source: ${sources[0]?.fileName}`);
        yield { type: 'sources', content: sources };
      }

      // 2. Build Prompt
      const context = results.map(d => d.content).join('\n\n---\n\n');
      const prompt = this.buildPrompt(context, question);

      // 3. Stream Generate
      console.log(`[RAG-Stream] Generation started (Prompt length: ${prompt.length})`);
      const startGen = Date.now();

      const stream = llmService.streamComplete(prompt);

      let chunkCount = 0;
      for await (const chunk of stream) {
        chunkCount++;
        if (chunkCount === 1) console.log(`[RAG-Stream] First chunk received in ${Date.now() - startGen}ms`);
        yield { type: 'chunk', content: chunk };
      }

      console.log(`[RAG-Stream] Generation finished. Total chunks: ${chunkCount}, Time: ${Date.now() - startGen}ms`);
      console.log(`[RAG-Stream] Total time: ${Date.now() - startTime}ms`);

    } catch (error) {
      console.error('[RAG-Stream] Failed:', error);
      yield { type: 'error', content: error instanceof Error ? error.message : String(error) };
    }
  }

  private buildPrompt(context: string, question: string): string {
    const isGreeting = /^(안녕|하이|반가워|hi|hello)/i.test(question);

    let instructions = '';
    if (isGreeting) {
      instructions = '주인님께 정중하게 인사하고 도움을 제안하세요.';
    } else if (!context) {
      instructions = '아는 범위 내에서 비서처럼 정중하게 답변하세요.';
    } else {
      instructions = '제공된 정보를 바탕으로 주인님의 질문에 한국어로 명확히 답변하세요.';
    }

    const system = `당신은 주인님을 모시는 AI 비서 '제프리'입니다. 
항상 짧고 정중하게 한국어로 답변하세요.
지침: ${instructions}`;

    const contextPart = context ? `\n\n[참고 문서]\n${context}` : '';

    return `<|system|>\n${system}<|end|>\n<|user|>\n${question}${contextPart}<|end|>\n<|assistant|>\n`;
  }

  private extractSources(results: any[]): DocumentSource[] {
    const uniqueSources = new Map<string, DocumentSource>();
    results.forEach((res) => {
      const m = res.metadata;
      // Indexing uses 'source' and 'filename' (fixed in IndexingService as well)
      const path = m.filePath || m.source;
      const name = m.fileName || m.filename;
      if (path && name) {
        if (!uniqueSources.has(path)) {
          uniqueSources.set(path, {
            filePath: path,
            fileName: name,
            chunkIndex: m.chunkIndex,
            relevance: res.similarity
          });
        }
      }
    });
    return Array.from(uniqueSources.values());
  }
}

export const ragPipelineService = new RagPipelineService();
