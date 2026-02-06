import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { documentsController } from '../controllers/documents.controller';
import { settingsController } from '../controllers/settings.controller';

const router = Router();

// Chat Routes
router.post('/chat/message', (req, res) => chatController.sendMessage(req, res));
router.post('/chat/message/stream', (req, res) => chatController.sendMessageStream(req, res));
router.get('/chat/history', (req, res) => chatController.getHistory(req, res));

// Documents Routes
router.get('/documents/files', (req, res) => documentsController.getFiles(req, res));
router.post('/documents/index', (req, res) => documentsController.indexFiles(req, res));
router.post('/documents/stop-index', (req, res) => documentsController.stopIndex(req, res));
router.post('/documents/clear-index', (req, res) => documentsController.clearIndex(req, res));
router.get('/documents/status', (req, res) => documentsController.getStatus(req, res));
router.get('/documents/search', (req, res) => documentsController.searchFiles(req, res));

// Settings Routes
router.get('/settings', (req, res) => settingsController.getSettings(req, res));
router.put('/settings', (req, res) => settingsController.updateSettings(req, res));
router.get('/settings/folders', (req, res) => settingsController.getFolders(req, res));
router.post('/settings/folders', (req, res) => settingsController.addFolder(req, res));
router.delete('/settings/folders', (req, res) => settingsController.removeFolder(req, res));
router.get('/settings/llm', (req, res) => settingsController.getLLMConfig(req, res));
router.put('/settings/llm', (req, res) => settingsController.updateLLMConfig(req, res));

export default router;
