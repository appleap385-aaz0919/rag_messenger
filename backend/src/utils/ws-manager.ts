import { WebSocket } from 'ws';
import { WSEvent } from '../types';

class WebSocketManager {
  private clients: Set<WebSocket> = new Set();

  addClient(client: WebSocket): void {
    this.clients.add(client);
    console.log(`WebSocket 클라이언트 연결됨. 현재 클라이언트 수: ${this.clients.size}`);
  }

  removeClient(client: WebSocket): void {
    this.clients.delete(client);
    console.log(`WebSocket 클라이언트 연결 해제. 현재 클라이언트 수: ${this.clients.size}`);
  }

  broadcast(event: WSEvent): void {
    const message = JSON.stringify(event);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  sendToClient(client: WebSocket, event: WSEvent): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(event));
    }
  }

  handleMessage(_client: WebSocket, _data: unknown): void {
    // 클라이언트로부터 받은 메시지 처리
    console.log('WebSocket 메시지 수신:', _data);
  }

  broadcastIndexProgress(progress: number, currentFile: string, processedFiles: number, totalFiles: number): void {
    this.broadcast({
      type: 'index_progress',
      data: { progress, currentFile, processedFiles, totalFiles },
    });
  }

  broadcastIndexComplete(): void {
    this.broadcast({
      type: 'index_complete',
      data: { timestamp: new Date() },
    });
  }

  broadcastFileChanged(filePath: string, action: 'added' | 'modified' | 'deleted'): void {
    this.broadcast({
      type: 'file_changed',
      data: { filePath, action },
    });
  }

  broadcastError(error: string): void {
    this.broadcast({
      type: 'error',
      data: { error },
    });
  }
}

export const wsManager = new WebSocketManager();
