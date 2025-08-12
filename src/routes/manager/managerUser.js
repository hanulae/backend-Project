/**
 * 상조팀장 사용자 관리 라우터
 * - 회원가입(파일 업로드 포함), 아이디 중복 확인, 내 프로필 조회 API 제공
 * - 회원가입은 파일 업로드 미들웨어 사용(S3 업로드), 프로필 조회는 인증 필요
 */
import express from 'express';
import uploadManagerFile from '../../middlewares/uploadManagerFile.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import * as managerUserService from '../../services/manager/managerUserService.js';
import { deleteS3Object } from '../../config/s3.js'; // AWS S3 연결 모듈

const router = express.Router();

/**
 * [POST] /manager/user/signup
 * 상조팀장 회원가입 (파일 업로드 지원)
 *
 * 미들웨어:
 * - uploadManagerFile: 제출 파일 업로드(S3)
 *
 * Body(Form-Data):
 * - managerUsername: string (필수)
 * - managerPassword: string (필수)
 * - managerName: string (필수)
 * - managerPhone: string (필수)
 * - managerBankName: string (필수)
 * - managerBankNumber: string (필수)
 * - files?: File[] (선택)
 *
 * 동작:
 * - 업로드된 파일 정보는 `req.files`로 전달되며, 오류 시 업로드된 S3 객체를 정리 시도합니다.
 *
 * Response:
 * - 201 Created: { message: '상조팀장 회원가입이 완료되었습니다.', manager: Object }
 * - 500 Internal Server Error
 */
router.post('/signup', uploadManagerFile, async (req, res) => {
  try {
    const params = {
      managerUsername: req.body.managerUsername,
      managerPassword: req.body.managerPassword,
      managerName: req.body.managerName,
      managerPhoneNumber: req.body.managerPhone,
      managerBankName: req.body.managerBankName,
      managerBankNumber: req.body.managerBankNumber,
      files: req.files,
    };
    console.log('🚀 ~ router.post ~ params:', params);

    const result = await managerUserService.registerManager(params);
    res.status(201).json({
      message: '상조팀장 회원가입이 완료되었습니다.',
      manager: result,
    });
  } catch (error) {
    console.error('회원가입 오류:', error.message);
    // ✅ 실패 시 S3에 업로드된 파일 삭제
    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.location) {
          await deleteS3Object(file.location);
          console.log('🗑️ S3 삭제 완료:', file.location);
        }
      }
    }
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
});

/**
 * [GET] /manager/user/checkUsername
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
    const isAvailable = await managerUserService.isUsernameAvailable(username);

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
 * [GET] /manager/user/profile
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
    const managerId = req.user.managerId;
    const profile = await managerUserService.getMyProfile(managerId);

    if (!profile) {
      return res.status(404).json({ message: '프로필 정보를 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '프로필 조회 성공', data: profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
