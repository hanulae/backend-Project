/**
 * 모듈: managerCart (base: /api/manager/cart)
 * 목적: 상조팀장의 장바구니 관리 라우터 관리
 * 정보: 장바구니 추가 기능은 현재 사용하지 않고 있음 서버에 저장이 아닌 AsyncStorage에 저장하는 방식으로 사용중
 */
import express from 'express';
import ManagerCartService from '../../services/manager/managerCartService.js';
import logger from '../../config/logger.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * [POST] /add - 장바구니 추가
 * 인증: 필요(authMiddleware)
 * 요청: { funeralListId: string[] }
 * 응답: 200 { success: true, data: result }
 * 오류: 400, 401, 500
 */
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { funeralListId } = req.body;

    if (!funeralListId || !Array.isArray(funeralListId) || funeralListId.length === 0) {
      return res.status(400).json({ message: '추가할 장례식장 ID 배열이 필요합니다.' });
    }

    const addData = {
      funeralListId,
      managerId: req.user.managerId,
    };

    const result = await ManagerCartService.addManagerCart(addData);
    res.status(result.addedCount > 0 ? 201 : 200).json(result);
  } catch (error) {
    logger.error('상조팀장 장바구니 추가 실패', error);
    res.status(500).json({ message: '상조팀장 장바구니 추가 실패', error: error.message });
  }
});

/**
 * [GET] /list - 장바구니 조회
 * 인증: 필요(authMiddleware)
 * 요청: 없음
 * 응답: 200 { success: true, data: result }
 * 오류: 400, 401, 500
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const managerId = req.user.managerId;

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

/**
 * [DELETE] /delete - 장바구니 삭제
 * 인증: 필요(authMiddleware)
 * 요청: { managerCartId: string[] }
 * 응답: 200 { success: true, data: result }
 * 오류: 400, 401, 500
 */
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    const { managerCartId } = req.body;
    const managerId = req.user.managerId;

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
