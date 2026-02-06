import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/app.config';
import routes from './routes';
import { watcherService } from './services/file-watcher/watcher.service';
import { inMemoryVectorStore } from './services/vectorstore/in-memory-store';
import { chatHistoryStore } from './services/chat/history-store';

const app = express();

// Initialize Data Stores & Services
(async () => {
    try {
        console.log('[App] Starting initialization...');
        await inMemoryVectorStore.initialize();
        console.log('[App] Vector store initialized');
        await chatHistoryStore.initialize();
        console.log('[App] Chat history store initialized');

        console.log('[App] Initialization complete. Automatic indexing disabled to ensure responsiveness.');
    } catch (e) {
        console.error('[App] Initialization failed:', e);
    }
})();

// Middleware
app.use(helmet());
app.use(cors({
    origin: config.frontendUrl, // 'http://localhost:3000'
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use('/api', routes);

// Health Check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Services
// Add watched folders from config to File Watcher
/* Disable auto-watching to prevent IO saturation during stabilization
config.folders.forEach(folder => {
    try {
        watcherService.addFolder(folder);
    } catch (e) {
        console.warn(`Failed to watch folder: ${folder}`, e);
    }
});
*/

export default app;
