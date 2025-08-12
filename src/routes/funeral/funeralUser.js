/**
 * 장례식장 사용자 관리 라우터
 * - 회원가입(파일 업로드 포함), 아이디 중복 확인, 내 프로필 조회 API 제공
 * - 회원가입은 파일 업로드 미들웨어 사용(S3 업로드), 프로필 조회는 인증 필요
 */
import express from 'express';
import * as funeralUserService from '../../services/funeral/funeralUserService.js';
import uploadFuneralFile from '../../middlewares/uploadFuneralFile.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import { deleteS3Object } from '../../config/s3.js'; // AWS S3 연결 모듈

const router = express.Router();

/**
 * [POST] /funeral/user/signup
 * 장례식장 회원가입 (파일 업로드 지원)
 *
 * 미들웨어:
 * - uploadFuneralFile: 제출 파일 업로드(S3)
 *
 * Body(Form-Data):
 * - funeralUsername: string (필수)
 * - funeralPassword: string (필수)
 * - funeralName: string (필수)
 * - funeralPhoneNumber: string (필수)
 * - funeralBankName: string (필수)
 * - funeralBankNumber: string (필수)
 * - funeralBankHolder: string (필수)
 * - funeralHome: string (필수)
 * - agreements: string(JSON) (필수) — { service, privacy, location, age, marketing }
 * - files?: File[] (선택)
 *
 * 동작:
 * - agreements는 JSON 문자열이므로 파싱 후 각각의 동의 항목으로 분해하여 저장
 * - 업로드된 파일은 `req.files` 경로 배열로 함께 전달
 * - 오류 발생 시 업로드한 S3 객체 정리 시도
 *
 * Response:
 * - 201 Created: { message: '장례식장 회원가입이 완료되었습니다.', funeral: Object }
 * - 500 Internal Server Error
 */
// 장례식장 회원가입
router.post('/signup', uploadFuneralFile, async (req, res) => {
  try {
    const agreements = JSON.parse(req.body.agreements);

    const params = {
      funeralUsername: req.body.funeralUsername,
      funeralPassword: req.body.funeralPassword,
      funeralName: req.body.funeralName,
      funeralPhoneNumber: req.body.funeralPhoneNumber,
      funeralBankName: req.body.funeralBankName,
      funeralBankNumber: req.body.funeralBankNumber,
      funeralBankHolder: req.body.funeralBankHolder,
      funeralHome: req.body.funeralHome,
      files: req.files || [], // 파일이 없을 경우 빈 배열로 설정
      serviceAgreement: agreements.service,
      personalInfoAgreement: agreements.privacy,
      locationInfoAgreement: agreements.location,
      age14OrOlderAgreement: agreements.age,
      marketingInfoAgreement: agreements.marketing,
      userType: 'funeral',
    };

    const result = await funeralUserService.registerFuneral(params);

    res.status(201).json({
      message: '장례식장 회원가입이 완료되었습니다.',
      funeral: result,
    });
  } catch (error) {
    console.error('회원가입 오류:', error.message);
    if (req.files?.location) {
      await deleteS3Object(req.files.location);
    }
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
});

/**
 * [GET] /funeral/user/checkUsername
 * 아이디 중복 확인 (공개)
 *
 * Query:
 * - username: string (필수)
 *
 * Response:
 * - 200 OK: { message: string, available: boolean }
 * - 500 Internal Server Error
 */
// 아이디 중복 확인
router.get('/checkUsername', async (req, res) => {
  try {
    const { username } = req.query;
    const isAvailable = await funeralUserService.isUsernameAvailable(username);

    res.status(200).json({
      message: isAvailable ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.',
      available: isAvailable,
    });
  } catch (error) {
    console.error('아이디 중복 확인 오류:', error.message);
    res.status(500).json({ message: '아이디 중복 확인 중 오류가 발생했습니다.' });
  }
});

/**
 * [GET] /funeral/user/profile
 * 내 프로필 조회 (인증 필요)
 *
 * Headers:
 * - Authorization: Bearer <JWT>
 *
 * Response:
 * - 200 OK: { message: '프로필 조회 성공', data: Object }
 * - 404 Not Found: 프로필 없음
 * - 500 Internal Server Error
 */
// 내 프로필 조회
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId;
    const profile = await funeralUserService.getMyProfile(funeralId);

    if (!profile) {
      return res.status(404).json({ message: '프로필 정보를 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '프로필 조회 성공', data: profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
