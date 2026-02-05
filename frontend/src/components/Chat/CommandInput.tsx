import { useState, useEffect, useRef } from 'react';
import { FiSlash } from 'react-icons/fi';

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
}

const COMMANDS = [
  { name: '재학습', description: '모든 문서를 다시 인덱싱합니다.' },
  { name: '폴더추가', description: '새로운 폴더를 추가합니다. 사용법: /폴더추가 [폴더경로]' },
  { name: '폴더제거', description: '폴더를 제거합니다. 사용법: /폴더제거 [폴더경로]' },
  { name: '파일목록', description: '등록된 모든 파일 목록을 표시합니다.' },
  { name: '상태', description: '인덱싱 상태를 표시합니다.' },
  { name: '도움말', description: '사용 가능한 명령어 목록을 표시합니다.' },
];

export function CommandInput({ value, onChange, onSend, placeholder }: CommandInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 명령어 파싱
  const parseCommand = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) return null;

    const parts = trimmed.slice(1).split(/\s+/);
    return {
      name: parts[0],
      args: parts.slice(1),
    };
  };

  // 현재 입력과 일치하는 명령어 필터링
  const getMatchingCommands = () => {
    const command = parseCommand(value);
    if (!command) return [];

    return COMMANDS.filter((cmd) =>
      cmd.name.toLowerCase().startsWith(command.name.toLowerCase())
    );
  };

  const matchingCommands = getMatchingCommands();

  // 자동완션 선택
  const selectSuggestion = (commandName: string) => {
    const command = parseCommand(value);
    if (!command) return;

    const args = command.args.join(' ');
    onChange(`/${commandName}${args ? ` ${args}` : ''}`);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < matchingCommands.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Tab' && matchingCommands.length > 0) {
      e.preventDefault();
      selectSuggestion(matchingCommands[selectedIndex].name);
    } else if (e.key === 'Enter' && !e.shiftKey && matchingCommands.length === 0) {
      e.preventDefault();
      onSend();
    }
  };

  // 외부 클릭 시 제안 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 입력 값 변경 시 자동완성 표시
  useEffect(() => {
    setShowSuggestions(matchingCommands.length > 0);
    setSelectedIndex(0);
  }, [value]);

  const isCommand = value.trim().startsWith('/');

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {isCommand && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <FiSlash className="text-accent" />
          </div>
        )}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || '메시지를 입력하세요... (/명령어)'}
          className={`w-full bg-transparent resize-none outline-none px-3 py-2 text-sm max-h-32 min-h-[40px] ${
            isCommand ? 'pl-10 text-accent' : ''
          }`}
          rows={1}
        />
      </div>

      {/* 명령어 자동완성 */}
      {showSuggestions && matchingCommands.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
          {matchingCommands.map((cmd, index) => (
            <button
              key={cmd.name}
              onClick={() => selectSuggestion(cmd.name)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-accent">/{cmd.name}</span>
              </div>
              <div className="text-xs text-gray-500">{cmd.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
