/**
 * 관리자 인증 서비스
 * - 관리자 로그인(토큰 발급), 관리자 계정 생성 기능 제공
 * - 토큰 발급은 utils/jwt 모듈을 사용합니다.
 */
import db from '../../models/index.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js'; // 유틸 파일 위치에 맞게 수정

/**
 * 관리자 로그인
 *
 * 입력:
 * - adminEmail: string
 * - adminPassword: string
 *
 * 동작:
 * 1) 이메일로 관리자 조회
 * 2) 모델 인스턴스 메서드(admin.verifyPassword)로 비밀번호 검증
 * 3) 액세스/리프레시 토큰 생성 후 관리자 객체와 함께 반환
 *
 * 출력:
 * - { accessToken: string, refreshToken: string, admin: Admin }
 *
 * 오류:
 * - 존재하지 않는 계정, 비밀번호 불일치, 내부 오류 시 Error throw
 */
// 관리자 로그인
export const loginAdmin = async ({ adminEmail, adminPassword }) => {
  try {
    // 1. 관리자 정보 조회
    const admin = await db.Admin.findOne({ where: { adminEmail } });

    if (!admin) {
      throw new Error('존재하지 않는 관리자 계정입니다.');
    }

    // 2. 비밀번호 검증 (Admin 모델에 정의된 인스턴스 메서드 사용)
    const isValidPassword = await admin.verifyPassword(adminPassword);
    if (!isValidPassword) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }

    // 3. 토큰 발급
    const payload = {
      adminId: admin.adminId,
      adminEmail: admin.adminEmail,
      role: admin.role || 'admin',
    };

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 4. 결과 반환
    return {
      accessToken,
      refreshToken,
      admin,
    };
  } catch (error) {
    console.error('관리자 로그인 실패:', error.message);
    throw new Error('관리자 로그인 실패: ' + error.message);
  }
};

/**
 * 관리자 계정 생성
 *
 * 입력:
 * - adminEmail: string
 * - adminPassword: string
 * - adminName: string
 *
 * 동작:
 * 1) 이메일 중복 확인
 * 2) 새 관리자 생성
 *
 * 보안 유의:
 * - 현재 평문 비밀번호 저장(해싱 미적용). 운영용으로 사용 금지!
 * - 반드시 해싱(bcrypt 등) 적용 후 사용해야 합니다.
 *
 * 출력:
 * - 생성된 Admin 객체
 *
 * 오류:
 * - 중복/DB 오류 시 Error throw
 */
// 관리자 계정 생성
export const createAdmin = async ({ adminEmail, adminPassword, adminName }) => {
  try {
    // 이메일 중복 확인
    const existing = await db.Admin.findOne({ where: { adminEmail } });
    if (existing) {
      throw new Error('이미 존재하는 관리자 이메일입니다.');
    }

    // ⚠️ 비밀번호를 해싱하지 않고 저장
    const admin = await db.Admin.create({
      adminEmail,
      adminPassword, // 평문 비밀번호 저장 (주의)
      adminName,
      role: 'admin',
    });

    return admin;
  } catch (error) {
    console.error('🔴 관리자 생성 실패:', error.message);
    throw new Error('관리자 생성 실패: ' + error.message);
  }
};
