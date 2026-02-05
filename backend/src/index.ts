import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import config from './config/app.config';
import { chatRouter } from './routes/chat.route';
import { documentsRouter } from './routes/documents.route';
import { settingsRouter } from './routes/settings.route';
import { errorHandler } from './middleware/error.middleware';
import { wsManager } from './utils/ws-manager';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Express 미들웨어
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API 라우트
app.use('/api/chat', chatRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/settings', settingsRouter);

// 상태 확인 엔드포인트
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 에러 핸들러
app.use(errorHandler);

// WebSocket 설정
wss.on('connection', (ws) => {
  wsManager.addClient(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      wsManager.handleMessage(ws, data);
    } catch (error) {
      console.error('WebSocket 메시지 파싱 오류:', error);
    }
  });

  ws.on('close', () => {
    wsManager.removeClient(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket 오류:', error);
  });
});

// 서버 시작
server.listen(config.server.port, config.server.host, () => {
  console.log(`제프리 서버가 http://${config.server.host}:${config.server.port}에서 실행 중입니다.`);
  console.log(`WebSocket 서버가 ws://${config.server.host}:${config.server.port}/ws에서 실행 중입니다.`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호 수신, 서버 종료 중...');
  server.close(() => {
    console.log('서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

export { app, server, wss };
