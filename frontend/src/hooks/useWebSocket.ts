import { useEffect, useState, useRef } from 'react';
import type { WSEvent, IndexProgressEvent, FileChangedEvent } from '../types';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = '3001'; // Backend port
      const wsUrl = `${protocol}//${host}:${port}/ws`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket 연결됨');
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket 연결 해제');

        // 재연결 시도
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('WebSocket 재연결 시도 중...');
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket 오류:', error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSEvent;
          handleWSEvent(data);
        } catch (error) {
          console.error('WebSocket 메시지 파싱 오류:', error);
        }
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleWSEvent = (event: WSEvent) => {
    switch (event.type) {
      case 'index_progress':
        handleIndexProgress(event as IndexProgressEvent);
        break;
      case 'index_complete':
        handleIndexComplete();
        break;
      case 'file_changed':
        handleFileChanged(event as FileChangedEvent);
        break;
      case 'error':
        console.error('WebSocket 에러:', event.data);
        break;
    }
  };

  const handleIndexProgress = (event: IndexProgressEvent) => {
    const { progress, currentFile } = event.data;
    console.log(`인덱싱 진행률: ${progress}%, 파일: ${currentFile}`);
    // TODO: 인덱싱 스토어 업데이트
  };

  const handleIndexComplete = () => {
    console.log('인덱싱 완료');
    // TODO: 인덱싱 스토어 업데이트
  };

  const handleFileChanged = (event: FileChangedEvent) => {
    const { filePath, action } = event.data;
    console.log(`파일 변경: ${filePath} (${action})`);
    // TODO: 파일 목록 새로고침
  };

  return { isConnected };
}
