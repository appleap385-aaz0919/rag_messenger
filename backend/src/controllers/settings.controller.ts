import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import config from '../config/app.config';
import { LLMFactory } from '../services/llm/llm.factory';
import { EmbeddingsFactory } from '../services/embeddings/embeddings.factory';
import { createError } from '../middleware/error.middleware';

// 프로젝트 루트의 config.json 경로 (backend 폴더에서 상위로 올라감)
const CONFIG_PATH = path.join(process.cwd(), '..', 'config.json');

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
          apiKey: config.llm.apiKey || '',
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
      const { provider, model, baseUrl, apiKey, temperature, maxTokens } = req.body;

      // config.json 읽기
      const configContent = await fs.readFile(CONFIG_PATH, 'utf-8');
      const configData = JSON.parse(configContent);

      // LLM 설정 업데이트
      configData.llm.provider = provider;
      configData.llm.model = model;
      configData.llm.baseUrl = baseUrl;
      configData.llm.temperature = temperature;
      configData.llm.maxTokens = maxTokens;
      if (apiKey !== undefined) {
        configData.llm.apiKey = apiKey;
      }

      // embeddings 공급자도 동기화
      configData.embeddings.provider = provider;
      configData.embeddings.baseUrl = baseUrl;
      configData.embeddings.model = req.body.embeddingsModel || configData.embeddings.model;
      if (apiKey !== undefined) {
        configData.embeddings.apiKey = apiKey;
      }

      // config.json 쓰기
      await fs.writeFile(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf-8');

      // 서비스 인스턴스 재초기화
      LLMFactory.resetInstance();
      EmbeddingsFactory.resetInstance();

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
