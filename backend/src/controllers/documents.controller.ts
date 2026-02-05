import { Request, Response, NextFunction } from 'express';
import { indexingService } from '../services/indexing/indexing.service';
import { documentProcessor } from '../services/document-processor/document-processor.service';
import { createError } from '../middleware/error.middleware';

export class DocumentsController {
  async startIndex(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await indexingService.startIndexing();

      res.json({
        success: true,
        message: '인덱싱이 시작되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = indexingService.getStatus();

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFiles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = await documentProcessor.getAllFiles();

      res.json({
        success: true,
        data: files,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        throw createError('검색어는 필수 항목입니다.', 400);
      }

      // TODO: 파일 검색 구현
      res.json({
        success: true,
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }
}
