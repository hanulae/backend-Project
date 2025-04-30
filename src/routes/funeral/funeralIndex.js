import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('안녕하세요');
});

export default router;
