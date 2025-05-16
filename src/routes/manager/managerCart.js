import express from 'express';
import ManagerCartService from '../../services/manager/managerCartService.js';
import logger from '../../config/logger.js';

const router = express.Router();

router.post('/add', async (req, res) => {
  try {
    const { funeralListId } = req.body;

    if (!funeralListId || !Array.isArray(funeralListId) || funeralListId.length === 0) {
      return res.status(400).json({ message: '추가할 장례식장 ID 배열이 필요합니다.' });
    }

    const addData = {
      funeralListId,
      managerId: req.body.managerId, // 추후 토큰 처리 방식으로 변경 필요
    };

    const result = await ManagerCartService.addManagerCart(addData);
    res.status(result.addedCount > 0 ? 201 : 200).json(result);
  } catch (error) {
    logger.error('상조팀장 장바구니 추가 실패', error);
    res.status(500).json({ message: '상조팀장 장바구니 추가 실패', error: error.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const managerId = req.body.managerId; // 추후 토큰 처리 방식으로 변경

    if (!managerId) {
      return res.status(400).json({ message: '장바구니 조회에 있어 상조팀장 ID는 필수 입니다.' });
    }

    const result = await ManagerCartService.getManagerCart(managerId);
    res.status(200).json(result);
  } catch (error) {
    logger.error('상조팀장 장바구니 조회 실패', error);
    res.status(500).json({ message: '상조팀장 장바구니 조회 실패', error: error.message });
  }
});

router.delete('/delete', async (req, res) => {
  try {
    const { managerCartId } = req.body;
    const managerId = req.body.managerId; // 추후 토큰 처리 방식으로 변경

    if (!managerCartId || !Array.isArray(managerCartId) || managerCartId.length === 0) {
      return res.status(400).json({ message: '삭제할 장바구니 ID 배열이 필요합니다.' });
    }

    if (!managerId) {
      return res.status(400).json({ message: '상조팀장 ID는 필수입니다.' });
    }

    const result = await ManagerCartService.deleteManagerCart(managerCartId, managerId);

    res.status(200).json(result);
  } catch (error) {
    logger.error('상조팀장 장바구니 삭제 실패', error);
    res.status(500).json({
      message: '상조팀장 장바구니 삭제 실패',
      error: error.message,
    });
  }
});

export default router;
