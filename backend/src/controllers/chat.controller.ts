import { Request, Response } from 'express';
import { ragPipelineService } from '../services/rag/rag-pipeline.service';
import { chatHistoryStore } from '../services/chat/history-store';
import { indexingService } from '../services/indexing/indexing.service';
import { inMemoryVectorStore } from '../services/vectorstore/in-memory-store';
import config from '../config/app.config';
import { v4 as uuidv4 } from 'uuid';

export class ChatController {
  async sendMessage(req: Request, res: Response) {
    try {
      const { message, conversationId } = req.body;
      const targetConversationId = conversationId || uuidv4();

      if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }

      console.log(`[Chat] Received message for ${targetConversationId}: ${message}`);

      // 1. Save User Message
      await chatHistoryStore.addMessage(targetConversationId, {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // 2. Query RAG
      indexingService.pauseIndexing();
      let result;
      try {
        result = await ragPipelineService.query(message);
      } finally {
        indexingService.resumeIndexing();
      }

      // 3. Save Assistant Message
      const assistantMessage = {
        id: uuidv4(),
        role: 'assistant' as const,
        content: result.answer,
        sources: result.sources,
        timestamp: new Date()
      };
      await chatHistoryStore.addMessage(targetConversationId, assistantMessage);

      // 4. Return in frontend expected format
      return res.json({
        success: true,
        data: {
          id: assistantMessage.id,
          conversationId: targetConversationId,
          content: assistantMessage.content,
          role: assistantMessage.role,
          sources: assistantMessage.sources,
          timestamp: assistantMessage.timestamp.toISOString()
        }
      });
    } catch (err: any) {
      console.error('[Chat] Error processing message:', err);
      return res.status(500).json({
        success: false,
        error: {
          message: err instanceof Error ? err.message : 'Internal server error processing message'
        }
      });
    }
  }

  async sendMessageStream(req: Request, res: Response) {
    const { message, conversationId } = req.body;
    const targetConversationId = conversationId || uuidv4();

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering (Nginx, etc.)
    });

    // Send initial ping to confirm connection
    res.write(':\n\n'); // SSE comment
    res.write(`data: ${JSON.stringify({ type: 'sources', content: [] })}\n\n`);

    let fullAnswer = '';
    let sources: any[] = [];
    const assistantMessageId = uuidv4();

    try {
      // 1. Handle Commands (e.g., /재학습, /상태)
      if (message.startsWith('/')) {
        const command = message.split(' ')[0].substring(1);
        let systemResponse = '';

        if (command === '재학습') {
          systemResponse = '예, 주인님. 즉시 학습을 시작합니다. 잠시만 기다려 주십시오.';
          indexingService.indexFolders(req.body.folders || config.folders || []).catch(console.error);
        } else if (command === '상태') {
          const status = indexingService.getStatus();
          const count = await inMemoryVectorStore.count();
          systemResponse = `주인님, 현재 시스템 상태를 보고드립니다.\n- 상태: ${status.status === 'indexing' ? '학습 중' : '대기 중'}\n- 학습된 문서: ${count}개\n- 진행률: ${status.progress.current}/${status.progress.total}`;
        } else if (command === 'clear' || command === '초기화') {
          await inMemoryVectorStore.clear();
          systemResponse = '주인님, 모든 학습 데이터를 초기화했습니다.';
        } else {
          systemResponse = `죄송합니다 주인님, '${command}'는 알 수 없는 명령입니다.`;
        }

        // 1-1. Save Command & System Message
        await chatHistoryStore.addMessage(targetConversationId, { id: uuidv4(), role: 'user', content: message, timestamp: new Date() });
        const sysMsg = { id: assistantMessageId, role: 'assistant' as const, content: systemResponse, timestamp: new Date() };
        await chatHistoryStore.addMessage(targetConversationId, sysMsg);

        // 1-2. Stream Response for UI consistency
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: systemResponse })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'done', content: { id: assistantMessageId, conversationId: targetConversationId, content: systemResponse, sources: [] } })}\n\n`);
        res.end();
        return;
      }

      // 2. Save User Message
      await chatHistoryStore.addMessage(targetConversationId, {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // 3. Query Stream (normal message)
      indexingService.pauseIndexing();
      const stream = ragPipelineService.queryStream(message);

      for await (const packet of stream) {
        if (packet.type === 'chunk') {
          fullAnswer += packet.content;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: packet.content })}\n\n`);
        } else if (packet.type === 'sources') {
          sources = packet.content;
          res.write(`data: ${JSON.stringify({ type: 'sources', content: sources })}\n\n`);
        } else if (packet.type === 'error') {
          res.write(`data: ${JSON.stringify({ type: 'error', content: packet.content })}\n\n`);
        }
      }

      // 3. Save Assistant Message once finished
      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: fullAnswer,
        sources: sources,
        timestamp: new Date()
      };
      await chatHistoryStore.addMessage(targetConversationId, assistantMessage);

      // 4. Send completion signal
      res.write(`data: ${JSON.stringify({
        type: 'done',
        content: {
          id: assistantMessageId,
          conversationId: targetConversationId,
          content: fullAnswer,
          sources: sources
        }
      })}\n\n`);

      res.end();
      return;
    } catch (error) {
      console.error('[Chat-Stream] Error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'Internal server error' })}\n\n`);
      res.end();
      return;
    } finally {
      indexingService.resumeIndexing();
    }
  }

  async getHistory(_req: Request, res: Response) {
    try {
      const history = await chatHistoryStore.getHistory();
      return res.json({ success: true, data: history });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch history'
        }
      });
    }
  }

  async getConversation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const conversation = await chatHistoryStore.getConversation(id);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: { message: 'Conversation not found' }
        });
      }

      return res.json({ success: true, data: conversation });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch conversation'
        }
      });
    }
  }
}

export const chatController = new ChatController();
