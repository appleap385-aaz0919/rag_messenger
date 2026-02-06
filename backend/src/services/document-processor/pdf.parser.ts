import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';

export class PdfParser {
  async parse(filePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filePath);
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`PDF 파일 파싱 실패 (${path.basename(filePath)}): ${error.message}`);
      }
      throw new Error(`PDF 파일 파싱 실패 (${path.basename(filePath)}): 알 수 없는 오류`);
    }
  }
}

export const pdfParser = new PdfParser();
