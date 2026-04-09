import { Router } from 'express';
import { TTSController } from '../controllers/TTSController';

const router = Router();

router.post('/preview', TTSController.preview);
// router.post('/render', TTSController.render); // To be implemented

export default router;
