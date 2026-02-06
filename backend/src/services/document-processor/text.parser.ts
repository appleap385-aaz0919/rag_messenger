import fs from 'fs/promises';
import path from 'path';

export class TextParser {
  async parse(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Text 파일 파싱 실패 (${path.basename(filePath)}): ${error.message}`);
      }
      throw new Error(`Text 파일 파싱 실패 (${path.basename(filePath)}): 알 수 없는 오류`);
    }
  }
}

export const textParser = new TextParser();
