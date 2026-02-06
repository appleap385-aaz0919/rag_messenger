import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';

export class DocxParser {
  async parse(filePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`DOCX 파일 파싱 실패 (${path.basename(filePath)}): ${error.message}`);
      }
      throw new Error(`DOCX 파일 파싱 실패 (${path.basename(filePath)}): 알 수 없는 오류`);
    }
  }
}

export const docxParser = new DocxParser();
