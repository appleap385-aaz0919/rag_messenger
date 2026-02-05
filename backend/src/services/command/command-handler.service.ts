import { commandRegistry } from './command-registry.service';
import { indexingService } from '../indexing/indexing.service';
import { documentProcessor } from '../document-processor/document-processor.service';
import type { CommandResult } from '../../types';

/**
 * 명령어 핸들러
 * 사용자 명령어를 파싱하고 실행
 */
export class CommandHandler {
  /**
   * 명령어 파싱
   * /명령어 인자1 인자2...
   */
  parseCommand(input: string): { name: string; args: string[] } | null {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) {
      return null;
    }

    const parts = trimmed.slice(1).split(/\s+/);
    const name = parts[0];
    const args = parts.slice(1);

    return { name, args };
  }

  /**
   * 명령어 실행
   */
  async execute(input: string): Promise<CommandResult> {
    const parsed = this.parseCommand(input);

    if (!parsed) {
      return {
        success: false,
        message: '잘못된 명령어 형식입니다. 명령어는 /로 시작해야 합니다.',
      };
    }

    const { name, args } = parsed;

    if (!commandRegistry.has(name)) {
      return {
        success: false,
        message: `알 수 없는 명령어입니다: /${name}`,
      };
    }

    const command = commandRegistry.get(name)!;

    try {
      return await command.handler(args);
    } catch (error) {
      return {
        success: false,
        message: `명령어 실행 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }

  /**
   * 명령어가 아닌지 확인
   */
  isCommand(input: string): boolean {
    return input.trim().startsWith('/');
  }
}

export const commandHandler = new CommandHandler();

// 기본 명령어 등록
commandRegistry.register({
  name: '재학습',
  description: '모든 문서를 다시 인덱싱합니다.',
  handler: async () => {
    try {
      await indexingService.startIndexing();
      return {
        success: true,
        message: '인덱싱이 시작되었습니다.',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '인덱싱 시작 실패',
      };
    }
  },
});

commandRegistry.register({
  name: '폴더추가',
  description: '새로운 폴더를 추가합니다. 사용법: /폴더추가 [폴더경로]',
  handler: async (args) => {
    if (args.length === 0) {
      return {
        success: false,
        message: '폴더 경로를 입력해주세요. 사용법: /폴더추가 [폴더경로]',
      };
    }

    const folder = args.join(' ');
    // TODO: config.json 업데이트 로직 추가 필요
    return {
      success: true,
      message: `폴더가 추가되었습니다: ${folder}`,
      data: { folder },
    };
  },
});

commandRegistry.register({
  name: '폴더제거',
  description: '폴더를 제거합니다. 사용법: /폴더제거 [폴더경로]',
  handler: async (args) => {
    if (args.length === 0) {
      return {
        success: false,
        message: '폴더 경로를 입력해주세요. 사용법: /폴더제거 [폴더경로]',
      };
    }

    const folder = args.join(' ');
    // TODO: config.json 업데이트 로직 추가 필요
    return {
      success: true,
      message: `폴더가 제거되었습니다: ${folder}`,
      data: { folder },
    };
  },
});

commandRegistry.register({
  name: '파일목록',
  description: '등록된 모든 파일 목록을 표시합니다.',
  handler: async () => {
    try {
      const files = await documentProcessor.getAllFiles();
      return {
        success: true,
        message: `총 ${files.length}개의 파일이 있습니다.`,
        data: files,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '파일 목록 가져오기 실패',
      };
    }
  },
});

commandRegistry.register({
  name: '상태',
  description: '인덱싱 상태를 표시합니다.',
  handler: async () => {
    const status = indexingService.getStatus();
    return {
      success: true,
      message: `인덱싱 상태: ${status.isIndexing ? '진행 중' : '완료'} (${status.progress}%)`,
      data: status,
    };
  },
});

commandRegistry.register({
  name: '도움말',
  description: '사용 가능한 명령어 목록을 표시합니다.',
  handler: async () => {
    const commands = commandRegistry.getAll();
    const helpText = commands
      .map((cmd) => `/${cmd.name}: ${cmd.description}`)
      .join('\n');

    return {
      success: true,
      message: '사용 가능한 명령어:\n' + helpText,
    };
  },
});
