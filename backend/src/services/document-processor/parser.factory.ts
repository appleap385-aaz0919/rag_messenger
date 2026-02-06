import { textParser } from './text.parser';
import { pdfParser } from './pdf.parser';
import { docxParser } from './docx.parser';
import path from 'path';

export interface IFileParser {
  parse(filePath: string): Promise<string>;
}

export class ParserFactory {
  static getParser(filePath: string): IFileParser {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.txt':
      case '.md':
      case '.json': // Temporarily treat JSON as text or add JsonParser later
      case '.js':
      case '.ts':
        return textParser;
      case '.pdf':
        return pdfParser;
      case '.docx':
      case '.doc':
        return docxParser;
      // Add more parsers here
      default:
        // Default to text parser for code files or unknown text types, 
        // or throw error. For now, let's try text parser if it looks text-like,
        // otherwise throw.
        // Let's stick to explicit support.
        throw new Error(`지원하지 않는 파일 형식입니다: ${ext}`);
    }
  }
}
