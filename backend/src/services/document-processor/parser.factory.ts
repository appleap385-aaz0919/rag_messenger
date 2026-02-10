import { textParser } from './text.parser';
import { pdfParser } from './pdf.parser';
import { docxParser } from './docx.parser';
import { xlsxParser } from './xlsx.parser';
import path from 'path';

export interface IFileParser {
  parse(filePath: string): Promise<string>;
}

export class ParserFactory {
  private static readonly SUPPORTED_EXTENSIONS = [
    '.txt', '.md', '.json', '.js', '.ts', '.xml', '.csv',
    '.pdf', '.docx', '.doc', '.xlsx', '.xls'
  ];

  static isSupported(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.SUPPORTED_EXTENSIONS.includes(ext);
  }

  static getParser(filePath: string): IFileParser {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.txt':
      case '.md':
      case '.json':
      case '.js':
      case '.ts':
      case '.xml':
      case '.csv':
        return textParser;
      case '.pdf':
        return pdfParser;
      case '.docx':
      case '.doc':
        return docxParser;
      case '.xlsx':
      case '.xls':
        return xlsxParser;
      default:
        throw new Error(`지원하지 않는 파일 형식입니다: ${ext}`);
    }
  }
}
