import app from './app';
import config from './config/app.config';
import http from 'http';
import { WebSocketServer } from 'ws';

const server = http.createServer(app);

// WebSocket Setup
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    console.log('Received:', message);
  });

  ws.send(JSON.stringify({ type: 'connection', message: 'Connected to Jeffrey Backend' }));
});

// Global WSS reference if needed
// export const wssInstance = wss; 

server.listen(config.server.port, () => {
  console.log(`\n🚀 Jeffrey Backend running at http://${config.server.host}:${config.server.port}`);
  console.log(`   Frontend URL: ${config.frontendUrl}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
