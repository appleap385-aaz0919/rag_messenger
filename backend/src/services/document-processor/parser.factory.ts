import path from 'path';
import { PDFParser } from './pdf.parser';
import { DocxParser } from './docx.parser';
import { ExcelParser } from './excel.parser';
import { PptxParser } from './pptx.parser';
import { TextParser } from './text.parser';
import { JsonParser } from './json.parser';

/**
 * 파일 파서 팩토리
 * 파일 확장자에 따라 적절한 파서 반환
 */
export class ParserFactory {
  private static parsers: Map<string, any> = new Map();

  static {
    this.parsers.set('.pdf', PDFParser);
    this.parsers.set('.docx', DocxParser);
    this.parsers.set('.doc', DocxParser);
    this.parsers.set('.xlsx', ExcelParser);
    this.parsers.set('.xls', ExcelParser);
    this.parsers.set('.csv', ExcelParser);
    this.parsers.set('.pptx', PptxParser);
    this.parsers.set('.ppt', PptxParser);
    this.parsers.set('.txt', TextParser);
    this.parsers.set('.md', TextParser);
    this.parsers.set('.json', JsonParser);
    this.parsers.set('.xml', TextParser);
  }

  static getParser(filePath: string): any {
    const ext = path.extname(filePath).toLowerCase();
    const ParserClass = this.parsers.get(ext);

    if (!ParserClass) {
      throw new Error(`지원하지 않는 파일 형식입니다: ${ext}`);
    }

    return new ParserClass();
  }

  static getSupportedExtensions(): string[] {
    return Array.from(this.parsers.keys());
  }

  static isSupported(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.parsers.has(ext);
  }
}
