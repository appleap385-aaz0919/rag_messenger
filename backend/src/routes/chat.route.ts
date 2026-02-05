import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';

const router = Router();
const chatController = new ChatController();

router.post('/message', chatController.sendMessage.bind(chatController));
router.get('/history', chatController.getHistory.bind(chatController));
router.get('/conversation/:id', chatController.getConversation.bind(chatController));

export { router as chatRouter };
