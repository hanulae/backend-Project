/**
 * 상조팀장 계좌 소유자 확인 라우터
 * - 은행 코드/계좌번호/예금주명을 기반으로 계좌 소유자(실명) 확인 API 제공
 * - 인증 미들웨어는 적용되어 있지 않습니다.
 */
import express from 'express';
import { verifyAccountOwner } from '../../services/manager/bankAccountService.js';

const router = express.Router();

/**
 * [POST] /manager/bank/verify
 * 계좌 소유자(예금주) 확인
 *
 * Body:
 * - bankCode: string (필수) — 은행 코드
 * - bankNumber: string (필수) — 계좌번호
 * - name: string (필수) — 예금주 성명
 *
 * Response:
 * - 200 OK: { message: '계좌 인증 성공', result: Object }
 * - 400 Bad Request: 필수값 누락 또는 검증 실패 시 에러 메시지
 */
router.post('/verify', async (req, res) => {
  try {
    const { bankCode, bankNumber, name } = req.body;

    if (!bankCode || !bankNumber || !name) {
      return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
    }

    const result = await verifyAccountOwner({ bankCode, bankNumber, name });
    res.status(200).json({ message: '계좌 인증 성공', result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
