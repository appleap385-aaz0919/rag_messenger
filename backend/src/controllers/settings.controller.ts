import { Request, Response, NextFunction } from 'express';
import config from '../config/app.config';
import { createError } from '../middleware/error.middleware';

export class SettingsController {
  async getFolders(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        success: true,
        data: config.folders,
      });
    } catch (error) {
      next(error);
    }
  }

  async addFolder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { folder } = req.body;

      if (!folder || typeof folder !== 'string') {
        throw createError('폴더 경로는 필수 항목입니다.', 400);
      }

      // TODO: 폴더 추가 및 config.json 업데이트 구현
      res.json({
        success: true,
        message: '폴더가 추가되었습니다.',
        data: [...config.folders, folder],
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFolder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { folder } = req.body;

      if (!folder || typeof folder !== 'string') {
        throw createError('폴더 경로는 필수 항목입니다.', 400);
      }

      // TODO: 폴더 제거 및 config.json 업데이트 구현
      const filtered = config.folders.filter((f: string) => f !== folder);

      res.json({
        success: true,
        message: '폴더가 제거되었습니다.',
        data: filtered,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLLMConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          provider: config.llm.provider,
          model: config.llm.model,
          baseUrl: config.llm.baseUrl,
          temperature: config.llm.temperature,
          maxTokens: config.llm.maxTokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLLMConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider, model, baseUrl, temperature, maxTokens } = req.body;

      // TODO: config.json 업데이트 구현
      res.json({
        success: true,
        message: 'LLM 설정이 업데이트되었습니다.',
        data: { provider, model, baseUrl, temperature, maxTokens },
      });
    } catch (error) {
      next(error);
    }
  }
}
