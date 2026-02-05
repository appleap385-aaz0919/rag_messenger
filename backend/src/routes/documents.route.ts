import { Router } from 'express';
import { DocumentsController } from '../controllers/documents.controller';

const router = Router();
const documentsController = new DocumentsController();

router.post('/index', documentsController.startIndex.bind(documentsController));
router.get('/status', documentsController.getStatus.bind(documentsController));
router.get('/files', documentsController.getFiles.bind(documentsController));
router.get('/search', documentsController.searchFiles.bind(documentsController));

export { router as documentsRouter };
