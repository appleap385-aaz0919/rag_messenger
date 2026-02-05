import fs from 'fs/promises';
import JSZip from 'jszip';

/**
 * PowerPoint 파서
 */
export class PptxParser {
  async parse(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(buffer);

    let text = '';

    // 슬라이드 파일 찾기 (ppt/slides/slide*.xml)
    const slideFiles = Object.keys(zip.files).filter((name) =>
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );

    for (const slideFile of slideFiles.sort()) {
      const content = await zip.file(slideFile)?.async('string');
      if (content) {
        // XML에서 텍스트 추출 (단순화된 방식)
        const textMatches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
        if (textMatches) {
          const slideText = textMatches
            .map((match) => match.replace(/<a:t[^>]*>|<\/a:t>/g, ''))
            .join(' ');
          text += `## ${slideFile}\n${slideText}\n\n`;
        }
      }
    }

    return text;
  }

  extractMetadata(): Record<string, any> {
    return {
      type: 'pptx',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
  }
}
