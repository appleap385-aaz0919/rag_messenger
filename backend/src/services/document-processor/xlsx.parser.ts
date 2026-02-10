import * as XLSX from 'xlsx';
import { IFileParser } from './parser.factory';

class XlsxParser implements IFileParser {
    async parse(filePath: string): Promise<string> {
        try {
            const workbook = XLSX.readFile(filePath);
            const results: string[] = [];

            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                if (data.length === 0) continue;

                results.push(`[시트: ${sheetName}]`);

                for (const row of data) {
                    const rowText = row
                        .map((cell: any) => (cell !== null && cell !== undefined ? String(cell).trim() : ''))
                        .filter((cell: string) => cell.length > 0)
                        .join(' | ');
                    if (rowText.length > 0) {
                        results.push(rowText);
                    }
                }
            }

            return results.join('\n');
        } catch (error) {
            console.error(`[XlsxParser] Failed to parse ${filePath}:`, error);
            return '';
        }
    }
}

export const xlsxParser = new XlsxParser();
