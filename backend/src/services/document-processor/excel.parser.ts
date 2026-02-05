import fs from 'fs/promises';
import xlsx from 'xlsx';

/**
 * Excel 파서
 */
export class ExcelParser {
  async parse(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    let text = '';

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const sheetText = xlsx.utils.sheet_to_txt(worksheet);

      text += `## ${sheetName}\n${sheetText}\n\n`;
    }

    return text;
  }

  extractMetadata(): Record<string, any> {
    return {
      type: 'excel',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
