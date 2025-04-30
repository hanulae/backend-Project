import express from 'express';
import emailRoutes from './email.js';

const router = express.Router();
router.use('/email', emailRoutes);

export default router;
