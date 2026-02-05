import { Request, Response, NextFunction } from 'express';
import { ChatRequest, ChatResponse } from '../types';
import { ragService } from '../services/rag/rag-pipeline.service';
import { createError } from '../middleware/error.middleware';

export class ChatController {
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, conversationId } = req.body as ChatRequest;

      if (!message || typeof message !== 'string') {
        throw createError('메시지는 필수 항목입니다.', 400);
      }

      const response: ChatResponse = await ragService.query(message, conversationId);

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: 대화 기록 조회 구현
      res.json({
        success: true,
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // TODO: 특정 대화 조회 구현
      res.json({
        success: true,
        data: { id, messages: [] },
      });
    } catch (error) {
      next(error);
    }
  }
}
