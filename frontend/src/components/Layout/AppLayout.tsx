import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MainChat } from './MainChat';
import { RightPanel } from './RightPanel';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen">
      {/* 왼쪽 사이드바 (240px) */}
      <Sidebar />

      {/* 메인 채팅 영역 */}
      <MainChat>{children}</MainChat>

      {/* 우측 패널 (토글) */}
      <RightPanel />
    </div>
  );
}
