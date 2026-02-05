import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';

const router = Router();
const settingsController = new SettingsController();

router.get('/folders', settingsController.getFolders.bind(settingsController));
router.post('/folders', settingsController.addFolder.bind(settingsController));
router.delete('/folders', settingsController.removeFolder.bind(settingsController));
router.get('/llm', settingsController.getLLMConfig.bind(settingsController));
router.put('/llm', settingsController.updateLLMConfig.bind(settingsController));

export { router as settingsRouter };
