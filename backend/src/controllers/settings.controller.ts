import { Request, Response } from 'express';
import config from '../config/app.config';
import fs from 'fs/promises';
import path from 'path';

export class SettingsController {
  private configPath = path.resolve(process.cwd(), 'config.json');

  private async saveConfigToDisk() {
    try {
      // Create a clean version of the config to save back to JSON
      // Note: app.config.ts might have some runtime-only fields or transformations
      // We should ideally only save the fields that exist in the original config.json
      const configToSave = {
        server: config.server,
        llm: config.llm,
        vectorStore: config.vectorStore,
        embeddings: config.embeddings,
        folders: config.folders,
        chunking: config.chunking,
        fileWatcher: config.fileWatcher,
        supportedFormats: config.supportedFormats
      };

      await fs.writeFile(this.configPath, JSON.stringify(configToSave, null, 2), 'utf-8');
      console.log('[Settings] Config saved to disk');
    } catch (error) {
      console.error('[Settings] Failed to save config to disk:', error);
      throw error;
    }
  }

  async getSettings(_req: Request, res: Response) {
    try {
      // Return safe config (exclude API keys if sensitive)
      const safeConfig = {
        ...config,
        llm: {
          ...config.llm,
          apiKey: config.llm.apiKey ? '***' : undefined
        },
        embeddings: {
          ...config.embeddings,
          apiKey: config.embeddings.apiKey ? '***' : undefined
        }
      };
      return res.json({ success: true, data: safeConfig });
    } catch (error) {
      console.error('[Settings] Error fetching settings:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const updates = req.body;
      console.log('[Settings] Received updates:', updates);

      // Update in-memory
      Object.assign(config, updates);

      // Persist
      await this.saveConfigToDisk();

      return res.json({ success: true, message: 'Settings updated and saved', data: config });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
  }

  async getFolders(_req: Request, res: Response) {
    try {
      console.log('[Settings] GET /folders - current config count:', config.folders?.length || 0);
      return res.json({ success: true, data: config.folders || [] });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to get folders' });
    }
  }

  async addFolder(req: Request, res: Response) {
    try {
      const { folder } = req.body;
      if (!folder) {
        return res.status(400).json({ success: false, error: 'Folder path is required' });
      }

      if (!config.folders) config.folders = [];
      if (!config.folders.includes(folder)) {
        config.folders.push(folder);
        await this.saveConfigToDisk();
      }

      return res.json({ success: true, data: config.folders });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to add folder' });
    }
  }

  async removeFolder(req: Request, res: Response) {
    try {
      const { folder } = req.body;
      if (!folder) {
        return res.status(400).json({ success: false, error: 'Folder path is required' });
      }

      if (config.folders) {
        config.folders = config.folders.filter((f: string) => f !== folder);
        await this.saveConfigToDisk();
      }

      return res.json({ success: true, data: config.folders || [] });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to remove folder' });
    }
  }

  async getLLMConfig(_req: Request, res: Response) {
    try {
      return res.json({
        success: true,
        data: {
          provider: config.llm.provider,
          model: config.llm.model,
          temperature: config.llm.temperature,
          maxTokens: config.llm.maxTokens
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to get LLM config' });
    }
  }

  async updateLLMConfig(req: Request, res: Response) {
    try {
      const updates = req.body;

      // Update in-memory
      Object.assign(config.llm, updates);

      // Persist
      await this.saveConfigToDisk();

      return res.json({
        success: true,
        data: {
          provider: config.llm.provider,
          model: config.llm.model,
          temperature: config.llm.temperature,
          maxTokens: config.llm.maxTokens
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to update LLM config' });
    }
  }
}

export const settingsController = new SettingsController();
