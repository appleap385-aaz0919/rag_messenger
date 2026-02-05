import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

/**
 * PDF 파서
 */
export class PDFParser {
  async parse(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);

    return data.text;
  }

  extractMetadata(_filePath: string): Record<string, any> {
    return {
      type: 'pdf',
      mimeType: 'application/pdf',
    };
  }
}
