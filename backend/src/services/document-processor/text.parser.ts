import fs from 'fs/promises';

/**
 * 텍스트 파서
 * TXT, MD, XML 등 텍스트 기반 파일 처리
 */
export class TextParser {
  async parse(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  extractMetadata(filePath: string): Record<string, any> {
    const ext = filePath.split('.').pop()?.toLowerCase() || 'txt';

    const mimeTypes: Record<string, string> = {
      txt: 'text/plain',
      md: 'text/markdown',
      xml: 'application/xml',
    };

    return {
      type: ext,
      mimeType: mimeTypes[ext] || 'text/plain',
    };
  }
}
