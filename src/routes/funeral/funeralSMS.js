/**
 * 장례식장 SMS 인증 라우터
 * - 스태프/장례식장 휴대폰 인증번호 발송 및 검증 API 제공
 * - 스태프 발송은 인증 필요, 그 외는 공개 엔드포인트
 * 쿨SMS 사용
 */
import express from 'express';
import * as funeralSMSService from '../../services/funeral/funeralSMSService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
const router = express.Router();

/**
 * [POST] /funeral/sms/send/staff
 * 스태프 휴대폰 인증번호 발송 (인증 필요)
 *
 * Headers:
 * - Authorization: Bearer <JWT>
 *
 * Body:
 * - funeralPhone: string (필수)
 *
 * Response:
 * - 200 OK: { message: '인증번호 발송 완료' }
 * - 400 Bad Request: 필수값 누락 등
 */
router.post('/send/staff', authMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.user;
    const { funeralPhone } = req.body;
    if (!funeralPhone) return res.status(400).json({ message: '전화번호 필요' });

    await funeralSMSService.sendVerificationSMSStaff(funeralPhone, funeralId);
    res.status(200).json({ message: '인증번호 발송 완료' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * [POST] /funeral/sms/verify/staff
 * 스태프 휴대폰 인증번호 검증 (공개)
 *
 * Body:
 * - funeralPhone: string (필수)
 * - code: string (필수)
 *
 * Response:
 * - 200 OK: { message: '인증 성공', verified: true }
 * - 400 Bad Request: { message: '인증 실패', verified: false }
 */
router.post('/verify/staff', async (req, res) => {
  try {
    const { funeralPhone, code } = req.body;
    if (!funeralPhone || !code) return res.status(400).json({ message: '필수값 누락' });

    const isVerified = await funeralSMSService.verifyCodeStaff(funeralPhone, code);
    if (isVerified) {
      res.status(200).json({ message: '인증 성공', verified: true });
    } else {
      res.status(400).json({ message: '인증 실패', verified: false });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * [POST] /funeral/sms/send/funeral
 * 장례식장 휴대폰 인증번호 발송 (공개)
 *
 * Body:
 * - funeralPhone: string (필수)
 *
 * 동작:
 * - 하이픈 제거 후(cleaned) 인증번호 발송
 *
 * Response:
 * - 200 OK: { message: '인증번호 발송 완료' }
 * - 400 Bad Request: 필수값 누락 등
 */
//휴대폰 인증 번호 발송
router.post('/send/funeral', async (req, res) => {
  try {
    const { funeralPhone } = req.body;
    if (!funeralPhone) return res.status(400).json({ message: '필수값 누락' });

    const cleanedPhoneNumber = funeralPhone.replace(/-/g, '');

    await funeralSMSService.sendVerificationSMSFuneral(cleanedPhoneNumber);

    res.status(200).json({ message: '인증번호 발송 완료' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * [POST] /funeral/sms/verify/funeral
 * 장례식장 휴대폰 인증번호 검증 (공개)
 *
 * Body:
 * - funeralPhone: string (필수)
 * - code: string (필수)
 *
 * Response:
 * - 200 OK: { message: '인증 성공', verified: true }
 * - 400 Bad Request: { message: '인증 실패', verified: false }
 */
router.post('/verify/funeral', async (req, res) => {
  try {
    const { funeralPhone, code } = req.body;

    if (!funeralPhone || !code) return res.status(400).json({ message: '필수값 누락' });

    const isVerified = await funeralSMSService.verifyCodeFuneral(funeralPhone, code);
    if (isVerified) {
      res.status(200).json({ message: '인증 성공', verified: true });
    } else {
      res.status(400).json({ message: '인증 실패', verified: false });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
