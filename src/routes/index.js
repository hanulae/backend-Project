import express from 'express';

import managerRoutes from './manager/managerIndex.js';
import funeralRoutes from './funeral/funeralIndex.js';
import adminRoutes from './admin/adminIndex.js';
import commonRoutes from './common/commonIndex.js';

const router = express.Router();

// router.get('/', (req, res) => {
//   res.send('안녕하세요');
// });

// manager 라우트 설정
router.use('/manager', managerRoutes);
router.use('/funeral', funeralRoutes);
router.use('/admin', adminRoutes);
router.use('/common', commonRoutes);

export default router;
