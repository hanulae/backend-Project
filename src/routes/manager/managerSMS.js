/**
 * 상조팀장 SMS 인증 라우터
 * - 공용(상조팀장/장례식장) 인증코드 발송·검증, 내 정보 변경용 인증코드 발송·검증 API 제공
 * - 일부 엔드포인트는 인증 미들웨어가 필요합니다.
 */
import express from 'express';
import {
  sendVerificationSMS,
  getUserPhone,
  verifyCode,
} from '../../services/manager/managerSmsService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * [POST] /manager/sms/send
 * 인증 코드 전송 (공개, 상조팀장/장례식장 공용)
 *
 * Body:
 * - phoneNumber: string (필수)
 * - userType?: string (선택) — 중복 체크 등 정책상 필요 시 사용
 * - status?: string (선택) — 업무 상태값(서비스 정책에 따름)
 *
 * Response:
 * - 200 OK: { message: '인증 코드가 전송되었습니다.' }
 * - 400 Bad Request: 파라미터 누락 등
 */
// 인증 코드 전송 //상조팀장,장례식장 공용 사용
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber, userType, status } = req.body;
    console.log('🚀 ~ router.post ~ managerPhone, userType:', phoneNumber, userType);
    //userType 핸드폰번호 중복 체크 시 사용
    if (!phoneNumber) {
      return res.status(400).json({ message: '전화번호를 입력해주세요.' });
    }

    await sendVerificationSMS(phoneNumber, status);
    res.status(200).json({ message: '인증 코드가 전송되었습니다.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * [POST] /manager/sms/update/send
 * 인증 코드 전송 (인증 필요, 내 정보 변경용)
 *
 * Headers:
 * - Authorization: Bearer <JWT>
 *
 * Body:
 * - managerPhone: string (필수) — 현재 등록된 전화번호와 동일해야 함
 *
 * 동작:
 * - 토큰의 managerId로 DB 전화번호 조회 → 입력값과 일치 확인 → 인증코드 발송
 *
 * Response:
 * - 200 OK: { message: '인증 코드가 전송되었습니다.' }
 * - 400 Bad Request: 입력값/일치 검증 실패 등
 */
// 인증 코드 전송
router.post('/update/send', authMiddleware, async (req, res) => {
  try {
    const { managerPhone } = req.body;
    const managerId = req.user.managerId;

    if (!managerPhone) {
      return res.status(400).json({ message: '전화번호를 입력해주세요.' });
    }

    const manager = await getUserPhone(managerId);

    if (managerPhone != manager.managerPhoneNumber) {
      return res.status(400).json({ message: '현재 전화번호와 동일하지 않습니다.' });
    }

    await sendVerificationSMS(managerPhone);
    res.status(200).json({ message: '인증 코드가 전송되었습니다.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * [POST] /manager/sms/verify
 * 인증 코드 검증 (공개)
 *
 * Body:
 * - phoneNumber: string (필수)
 * - code: string (필수)
 * - userType?: string (선택)
 *
 * Response:
 * - 200 OK: { message: '인증 성공', verified: true }
 * - 400 Bad Request: { message: '인증 실패', verified: false }
 */
// 인증 코드 검증
router.post('/verify', async (req, res) => {
  try {
    const { phoneNumber, code, userType } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ message: '전화번호와 인증코드를 모두 입력해주세요.' });
    }

    const isVerified = await verifyCode(phoneNumber, code, userType);

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
 * [POST] /manager/sms/update/verify
 * 인증 코드 검증 (인증 필요, 내 정보 변경용)
 *
 * Headers:
 * - Authorization: Bearer <JWT>
 *
 * Body:
 * - phoneNumber: string (필수)
 * - code: string (필수)
 * - userType?: string (선택)
 *
 * Response:
 * - 200 OK: { message: '인증 성공', verified: true }
 * - 400 Bad Request: { message: '인증 실패', verified: false }
 */
// 인증 코드 검증
router.post('/update/verify', authMiddleware, async (req, res) => {
  try {
    const { phoneNumber, code, userType } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ message: '전화번호와 인증코드를 모두 입력해주세요.' });
    }

    const isVerified = await verifyCode(phoneNumber, code, userType);

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
