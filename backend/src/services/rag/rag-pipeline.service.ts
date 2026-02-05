import { llmService } from '../llm/llm.factory';
import { embeddingsService } from '../embeddings/embeddings.service';
import { chromaDBService } from '../vectorstore/chromadb.service';
import type { ChatResponse, DocumentSource } from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * RAG 파이프라인 서비스
 * 검색 증강 생성을 통한 질문 응답
 */
export class RAGPipelineService {
  private systemPrompt = `당신은 "제프리"라는 이름의 AI 문서 어시스턴트입니다.
주인님의 질문에 정중하고 친절하게 답변해주세요.
제공된 문서 내용을 바탕으로 답변하되, 문서에 없는 내용은 "문서에서 찾을 수 없습니다"라고 말씀해주세요.
답변은 다음 형식을 따르주세요:

주인님, 요청하신 정보를 찾았습니다.
[AI 메신저의 답변 내용]

참조 문서:
파일명.ext
D:\\...\\경로\\파일명.ext`;

  /**
   * 질문 처리 및 응답 생성
   */
  async query(question: string, _conversationId?: string): Promise<ChatResponse> {
    // 1. 질문 임베딩
    const { embedding: questionEmbedding } = await embeddingsService.embedText(question);

    // 2. 관련 문서 검색
    const searchResults = await chromaDBService.search(questionEmbedding, 5);

    // 3. 컨텍스트 구성
    const context = this.buildContext(searchResults);

    // 4. 프롬프트 구성
    const prompt = this.buildPrompt(question, context);

    // 5. LLM 응답 생성
    const { content } = await llmService.chat([
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt },
    ]);

    // 6. 소스 추출
    const sources = this.extractSources(searchResults);

    return {
      messageId: uuidv4(),
      content,
      sources,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 검색 결과에서 컨텍스트 구성
   */
  private buildContext(searchResults: Array<{ content: string; similarity: number }>): string {
    if (searchResults.length === 0) {
      return '관련 문서를 찾을 수 없습니다.';
    }

    // 유사도가 0.3 이상인 결과만 사용
    const relevantResults = searchResults.filter((r) => r.similarity > 0.3);

    if (relevantResults.length === 0) {
      return '관련 문서를 찾을 수 없습니다.';
    }

    return relevantResults
      .map((r, i) => `[문서 ${i + 1}]\n${r.content}`)
      .join('\n\n');
  }

  /**
   * 프롬프트 구성
   */
  private buildPrompt(question: string, context: string): string {
    return `다음 문서를 참고하여 질문에 답변해주세요:

${context}

질문: ${question}`;
  }

  /**
   * 검색 결과에서 소스 정보 추출
   */
  private extractSources(
    searchResults: Array<{
      content: string;
      metadata: { filePath: string; fileName: string; chunkIndex: number; fileType: string };
      similarity: number;
    }>,
  ): DocumentSource[] {
    // 중복 제거 및 상위 3개 반환
    const uniqueSources = new Map<string, DocumentSource>();

    for (const result of searchResults) {
      const key = result.metadata.filePath;
      if (!uniqueSources.has(key)) {
        uniqueSources.set(key, {
          filePath: result.metadata.filePath,
          fileName: result.metadata.fileName,
          chunkIndex: result.metadata.chunkIndex,
          relevance: result.similarity,
        });
      }
    }

    return Array.from(uniqueSources.values()).slice(0, 3);
  }

  /**
   * 스트리밍 응답 생성 (선택적 구현)
   */
  async queryStream(
    question: string,
    onChunk: (chunk: string) => void,
  ): Promise<ChatResponse> {
    // 1. 질문 임베딩
    const { embedding: questionEmbedding } = await embeddingsService.embedText(question);

    // 2. 관련 문서 검색
    const searchResults = await chromaDBService.search(questionEmbedding, 5);

    // 3. 컨텍스트 구성
    const context = this.buildContext(searchResults);

    // 4. 프롬프트 구성
    const prompt = this.buildPrompt(question, context);

    // 5. LLM 스트리밍 응답
    const { content } = await llmService.streamComplete?.(
      prompt,
      onChunk,
      { temperature: 0.7 },
    ) || { content: '' };

    // 6. 소스 추출
    const sources = this.extractSources(searchResults);

    return {
      messageId: uuidv4(),
      content,
      sources,
      timestamp: new Date().toISOString(),
    };
  }
}

export const ragService = new RAGPipelineService();
