import fs from 'fs/promises';

/**
 * JSON 파서
 */
export class JsonParser {
  async parse(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    // JSON을 읽기 쉬운 텍스트로 변환
    return this.jsonToText(data);
  }

  private jsonToText(data: unknown, indent: number = 0): string {
    const padding = '  '.repeat(indent);

    if (data === null) {
      return `${padding}null`;
    }

    if (typeof data === 'undefined') {
      return `${padding}undefined`;
    }

    if (typeof data === 'string') {
      return `${padding}${data}`;
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return `${padding}${String(data)}`;
    }

    if (Array.isArray(data)) {
      return data
        .map((item) => this.jsonToText(item, indent))
        .join('\n');
    }

    if (typeof data === 'object') {
      let text = '';
      for (const [key, value] of Object.entries(data)) {
        text += `${padding}${key}:\n${this.jsonToText(value, indent + 1)}\n`;
      }
      return text;
    }

    return `${padding}${String(data)}`;
  }

  extractMetadata(): Record<string, any> {
    return {
      type: 'json',
      mimeType: 'application/json',
    };
  }
}
