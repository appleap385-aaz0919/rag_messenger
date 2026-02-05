import type { Command } from '../../types';

/**
 * 명령어 레지스트리
 * 사용 가능한 명령어 등록 및 관리
 */
export class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  register(command: Command): void {
    this.commands.set(command.name, command);
  }

  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  has(name: string): boolean {
    return this.commands.has(name);
  }

  getNames(): string[] {
    return Array.from(this.commands.keys());
  }
}

export const commandRegistry = new CommandRegistry();
