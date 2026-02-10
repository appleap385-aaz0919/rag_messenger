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

      // 인사나 간단한 질문은 문서 검색 건너뛰기 (패턴 확장)
      const isGreeting = /^(안녕|하이|반가워|hi|hello|좋은\s*(아침|저녁|오후)|잘\s*지내|감사합니다|고마워|수고|잘\s*자|바이|bye|thanks|thank you)/i.test(question);
      const isSimpleChat = question.length < 10 && !/문서|파일|검색|찾아|알려|뭐야|어때|무엇|어디|언제|누구|방법|절차|규정/.test(question);

      let results: any[] = [];
      let sources: any[] = [];

      if (!isGreeting && !isSimpleChat) {
        console.time('[RAG-Stream] Retrieval');

        // 1. 키워드 추출 및 전처리
        let processedQuestion = question
          .replace(/[?？!！.。,，]/g, '')
          // 년월 형식 변환: "2025년 3월" → "2025.03"
          .replace(/(\d{4})년\s*(\d{1,2})월/g, (_, year, month) => `${year}.${month.padStart(2, '0')}`)
          // 숫자만 있는 월도 처리: "3월" → "03"
          .replace(/(\d{1,2})월/g, (_, month) => month.padStart(2, '0'));

        const stopWords = ['내용', '알려줘', '뭐야', '있어', '대한', '관련', '주세요', '해줘', '찾아줘', '폴더에서', '폴더', '파일', '문서', '에서', '대해', '대해서', '어떤', '무슨', '보여줘', '검색', '안에', '속에', '폴더의', '폴더에', '것', '거', '좀', '하나', '뭔가', '무엇', '어떻게', '왜'];
        const keywords = processedQuestion
          .split(/\s+/)
          .filter(w => w.length >= 2 && !stopWords.includes(w));
        console.log(`[RAG-Hybrid] Keywords: ${keywords.join(', ')}`);

        // 2. 키워드 기반 검색 (파일명/내용 매칭)
        const keywordResults = inMemoryVectorStore.searchByKeyword(keywords, 8);
        console.log(`[RAG-Hybrid] Keyword search found ${keywordResults.length} results`);
        keywordResults.forEach((r, i) => {
          console.log(`[RAG-Hybrid] KW Rank ${i + 1}: Score=${r.similarity.toFixed(4)} | File=${r.metadata.fileName}`);
        });

        // 3. 벡터 검색
        const queryEmbeddingResult = await embeddingsService.embedText(question);
        const vectorResults = await inMemoryVectorStore.search(queryEmbeddingResult.embedding, 8);

        // Log vector similarities for debugging
        vectorResults.forEach((r, i) => {
          console.log(`[RAG-Log] Vector Rank ${i + 1}: Sim=${r.similarity.toFixed(4)} | File=${r.metadata.fileName || r.metadata.filename}`);
        });

        // 4. RRF(Reciprocal Rank Fusion) 기반 하이브리드 결과 합산
        const RRF_K = 60; // RRF 상수
        const scoreMap = new Map<string, { score: number; result: any; fileKey: string }>();

        // 키워드 결과 RRF 점수 (키워드 매칭 가중치 = 1.2)
        keywordResults.forEach((r, rank) => {
          const chunkKey = `${r.metadata.filePath || r.metadata.source}_${r.metadata.chunkIndex || 0}`;
          const fileKey = r.metadata.filePath || r.metadata.source || '';
          const rrfScore = 1.2 / (RRF_K + rank + 1);
          const existing = scoreMap.get(chunkKey);
          if (existing) {
            existing.score += rrfScore;
          } else {
            scoreMap.set(chunkKey, { score: rrfScore, result: r, fileKey });
          }
        });

        // 벡터 결과 RRF 점수 (유사도 임계값 0.45 이상만)
        vectorResults.forEach((r, rank) => {
          if (r.similarity < 0.45) return; // 낮은 유사도 문서 제외
          const chunkKey = `${r.metadata.filePath || r.metadata.source}_${r.metadata.chunkIndex || 0}`;
          const fileKey = r.metadata.filePath || r.metadata.source || '';
          const rrfScore = 1.0 / (RRF_K + rank + 1);
          const existing = scoreMap.get(chunkKey);
          if (existing) {
            existing.score += rrfScore;
          } else {
            scoreMap.set(chunkKey, { score: rrfScore, result: r, fileKey });
          }
        });

        // 점수 순 정렬
        const sortedEntries = Array.from(scoreMap.values()).sort((a, b) => b.score - a.score);

        // 5. 파일당 최대 3개 청크 제한 (다양성 확보)
        const fileChunkCount = new Map<string, number>();
        const combinedResults: any[] = [];

        for (const entry of sortedEntries) {
          const currentCount = fileChunkCount.get(entry.fileKey) || 0;
          if (currentCount >= 3) continue; // 한 파일에서 최대 3청크

          fileChunkCount.set(entry.fileKey, currentCount + 1);
          combinedResults.push({ ...entry.result, rrf_score: entry.score });

          if (combinedResults.length >= 5) break; // 최대 5개
        }

        results = combinedResults;
        console.timeEnd('[RAG-Stream] Retrieval');
        console.log(`[RAG-Hybrid] Combined results: ${results.length}`);

        if (!results || results.length === 0) {
          console.log('[RAG-Stream] No related documents found. Falling back to general knowledge.');
        }

        sources = this.extractSources(results || []);
        if (sources.length > 0) {
          console.log(`[RAG-Stream] Retrieved ${results.length} documents. Top source: ${sources[0]?.fileName}`);
          yield { type: 'sources', content: sources };
        }
      } else {
        console.log('[RAG-Stream] Greeting/simple chat detected. Skipping document retrieval.');
      }

      // 2. Build Prompt - 파일명을 포함하여 LLM이 출처를 알 수 있게 함
      const context = results.map(d => {
        const fileName = d.metadata?.fileName || d.metadata?.filename || '알수없음';
        return `[출처: ${fileName}]\n${d.content}`;
      }).join('\n\n---\n\n');
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
    const isGreeting = /^(안녕|하이|반가워|hi|hello|감사|고마워|수고|잘\s*자|바이|bye|thanks)/i.test(question);

    if (isGreeting) {
      return `당신은 주인님을 모시는 AI 비서 '제프리'입니다.
주인님께 정중하게 인사하고 도움을 제안하세요.

사용자: ${question}`;
    }

    if (!context || context.trim().length === 0) {
      return `당신은 주인님을 모시는 AI 비서 '제프리'입니다.

규칙:
- 짧고 정중하게 한국어로 답변하세요.
- 모르는 것은 솔직히 말씀드리세요.

사용자 질문: ${question}`;
    }

    // 문서가 있는 경우: 문서 내용을 먼저 제시하고 강력하게 지시
    return `당신은 주인님을 모시는 AI 비서 '제프리'입니다.

다음은 주인님의 질문과 관련된 참고 문서 내용입니다:

=== 참고 문서 시작 ===
${context}
=== 참고 문서 끝 ===

규칙:
1. 반드시 위 참고 문서 내용만을 바탕으로 답변하세요.
2. 문서에 없는 정보는 추측하지 말고 "문서에 해당 정보가 없습니다"라고 말씀드리세요.
3. 답변 시 관련 출처 파일명을 언급해 주세요.
4. 문서 내용을 인용하거나 요약하여 구체적으로 답변하세요.
5. 짧고 정중하게 한국어로 답변하세요.
6. 내부 사고 과정을 출력하지 마세요.

사용자 질문: ${question}`;
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
