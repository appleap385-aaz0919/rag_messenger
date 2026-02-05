import fs from 'fs/promises';
import mammoth from 'mammoth';

/**
 * DOCX 파서
 */
export class DocxParser {
  async parse(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });

    return result.value;
  }

  extractMetadata(): Record<string, any> {
    return {
      type: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }
}
