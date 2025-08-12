/**
 * 상조팀장 인증 서비스
 * - 상조팀장의 로그인, 로그아웃, 비밀번호 관리, 개인정보 변경 등의 인증 관련 기능을 제공합니다.
 * - SMS 인증을 통한 아이디 찾기, 비밀번호 재설정, 휴대폰 번호 변경, 계좌 정보 변경을 지원합니다.
 * - CoolSMS API를 사용하여 SMS 인증번호를 발송하고, Redis를 통해 인증 코드를 관리합니다.
 * - JWT 토큰 기반의 인증 시스템으로 보안을 강화합니다.
 * - 인증 시도 횟수 제한과 요청 간격 제한을 통해 보안 공격을 방지합니다.
 */
import * as managerAuthDao from '../../daos/manager/managerAuthDao.js';
import coolsms from 'coolsms-node-sdk';
import redis from '../../config/redis.js';
import dotenv from 'dotenv';
//import path from 'path';
import { generateVerificationCode } from '../../utils/codeGenerator.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';
import logger from '../../config/logger.js';
import * as managerUserDao from '../../daos/manager/managerUserDao.js';

//dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const mysms = coolsms.default;
const smsClient = new mysms(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

const CODE_EXPIRY = 300; // 5분
const ATTEMPT_LIMIT = 5;
const ATTEMPT_EXPIRY = 3600; // 1시간

/**
 * 상조팀장 로그인
 *
 * 입력:
 * - managerUsername: string — 상조팀장 사용자명
 * - managerPassword: string — 상조팀장 비밀번호
 *
 * 동작:
 * 1) 사용자명으로 상조팀장 정보 조회
 * 2) 계정 존재 여부 및 승인 상태 확인
 * 3) 비밀번호 검증 (bcrypt 해시 비교)
 * 4) JWT 액세스 토큰 및 리프레시 토큰 생성
 * 5) 민감한 정보를 제외한 상조팀장 정보와 함께 토큰 반환
 *
 * 검증 사항:
 * - 계정 존재 여부: '존재하지 않는 아이디입니다.'
 * - 승인 상태: '관리자의 승인이 필요합니다.'
 * - 비밀번호 일치: '아이디 또는 비밀번호가 일치하지 않습니다.'
 *
 * 보안:
 * - bcrypt를 사용한 안전한 비밀번호 검증
 * - JWT 토큰 기반 인증으로 세션 관리
 * - 민감한 정보는 toSafeObject()를 통해 필터링
 *
 * 반환:
 * - Object: { accessToken, refreshToken, manager }
 *   - accessToken: string — JWT 액세스 토큰
 *   - refreshToken: string — JWT 리프레시 토큰
 *   - manager: Object — 민감한 정보가 제거된 상조팀장 정보
 *
 * 예외:
 * - 계정 없음: '존재하지 않는 아이디입니다.'
 * - 미승인 계정: '관리자의 승인이 필요합니다.'
 * - 비밀번호 불일치: '아이디 또는 비밀번호가 일치하지 않습니다.'
 * - 기타 오류: '🔴 로그인 오류: {원인}' 형태로 Error throw
 */
export const loginManager = async ({ managerUsername, managerPassword }) => {
  try {
    const manager = await managerAuthDao.findManagerByUsername(managerUsername);
    if (!manager) throw new Error('존재하지 않는 아이디입니다.');
    if (!manager.isApproved) throw new Error('관리자의 승인이 필요합니다.');

    console.log('🚀 ~ loginManager ~ manager:', manager.managerPassword);
    // 비밀번호 비교
    const isPasswordValid = await manager.verifyPassword(managerPassword);
    console.log('🚀 ~ loginManager ~ isPasswordValid:', isPasswordValid);
    if (!isPasswordValid) {
      throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    const accessToken = generateToken({ managerId: manager.managerId });
    const refreshToken = generateRefreshToken({ managerId: manager.managerId });

    return {
      accessToken,
      refreshToken,
      manager: manager.toSafeObject(),
    };
  } catch (error) {
    console.error('🚀 ~ loginManager ~ error:', error);
    throw new Error('🔴 로그인 오류:' + error.message);
  }
};

/**
 * 상조팀장 로그아웃
 *
 * 입력:
 * - 없음 (현재는 단순한 메시지 반환만 수행)
 *
 * 동작:
 * - 로그아웃 처리 로그 기록
 * - 성공 메시지 반환
 *
 * 참고:
 * - 현재는 단순한 메시지 반환만 수행합니다.
 * - 향후 JWT 토큰 블랙리스트 처리나 세션 무효화 로직을 추가할 수 있습니다.
 *
 * 반환:
 * - Object: { message: string } — 로그아웃 성공 메시지
 *
 * 예외:
 * - 로깅 실패: '🔴 로그아웃 오류: {원인}' 형태로 Error throw
 */
export const logoutManager = async () => {
  try {
    logger.info('상조팀장 로그아웃 처리');
    return { message: '로그아웃 성공' };
  } catch (error) {
    throw new Error('🔴 로그아웃 오류:' + error.message);
  }
};

/**
 * 상조팀장 비밀번호 변경
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 * - newPassword: string — 새로운 비밀번호
 *
 * 동작:
 * 1) 필수 정보 누락 여부 검증
 * 2) managerId로 상조팀장 정보 조회
 * 3) 새 비밀번호가 기존 비밀번호와 동일한지 검증
 * 4) 비밀번호 업데이트 수행
 * 5) 업데이트된 정보 반환
 *
 * 검증 사항:
 * - 필수 정보: managerId, newPassword 모두 필요
 * - 계정 존재: '상조팀장을 찾을 수 없습니다.'
 * - 비밀번호 중복: '기존 비밀번호가 일치 합니다.'
 *
 * 보안:
 * - 새 비밀번호가 기존 비밀번호와 동일한 경우 변경을 방지
 * - bcrypt를 사용한 안전한 비밀번호 해싱
 *
 * 반환:
 * - Object: 업데이트된 상조팀장 정보
 *
 * 예외:
 * - 필수 정보 누락: '필수 정보가 누락되었습니다.'
 * - 계정 없음: '상조팀장을 찾을 수 없습니다.'
 * - 비밀번호 중복: '기존 비밀번호가 일치 합니다.'
 * - 기타 오류: '🔴 비밀번호 변경 오류: {원인}' 형태로 Error throw
 */
export const updatePassword = async (params) => {
  try {
    const { managerId, newPassword } = params;

    // 필수정보 확인
    if (!managerId || !newPassword) {
      throw new Error('필수 정보가 누락되었습니다.');
    }
    // 상조팀장 정보 조회
    const manager = await managerAuthDao.findById(managerId);
    if (!manager) throw new Error('상조팀장을 찾을 수 없습니다.');

    const isPasswordValid = await manager.verifyPassword(newPassword);
    if (isPasswordValid) {
      throw new Error('기존 비밀번호가 일치 합니다.');
    }
    const updatedPassword = await managerAuthDao.updatePassword(managerId, newPassword);
    return updatedPassword;
  } catch (error) {
    throw new Error('🔴 비밀번호 변경 오류:' + error.message);
  }
};

/**
 * 상조팀장 비밀번호 분실 시 재설정
 *
 * 입력:
 * - phoneNumber: string — 상조팀장 휴대폰 번호
 * - newPassword: string — 새로운 비밀번호
 *
 * 동작:
 * 1) 필수 정보 누락 여부 검증
 * 2) 휴대폰 번호에서 하이픈 제거
 * 3) 휴대폰 번호로 상조팀장 정보 조회
 * 4) 새 비밀번호가 기존 비밀번호와 동일한지 검증
 * 5) 비밀번호 업데이트 수행
 * 6) 업데이트된 정보 반환
 *
 * 검증 사항:
 * - 필수 정보: phoneNumber, newPassword 모두 필요
 * - 계정 존재: '상조팀장을 찾을 수 없습니다.'
 * - 비밀번호 중복: '기존 비밀번호가 일치 합니다.'
 *
 * 휴대폰 번호 처리:
 * - removeHyphensFromPhoneNumber() 함수로 하이픈 제거
 * - 데이터베이스 저장 형태와 일치하도록 정규화
 *
 * 반환:
 * - Object: 업데이트된 상조팀장 정보
 *
 * 예외:
 * - 필수 정보 누락: '필수 정보가 누락되었습니다.'
 * - 계정 없음: '상조팀장을 찾을 수 없습니다.'
 * - 비밀번호 중복: '기존 비밀번호가 일치 합니다.'
 * - 기타 오류: '🔴 비밀번호 변경 오류: {원인}' 형태로 Error throw
 */
export const lostPasswordUpdate = async (params) => {
  try {
    const { phoneNumber, newPassword } = params;

    // 필수정보 확인
    if (!phoneNumber || !newPassword) {
      throw new Error('필수 정보가 누락되었습니다.');
    }
    const cleanedPhoneNumber = removeHyphensFromPhoneNumber(phoneNumber);
    // 상조팀장 정보 조회
    const manager = await managerAuthDao.findByPhone(cleanedPhoneNumber);
    if (!manager) throw new Error('상조팀장을 찾을 수 없습니다.');

    const isPasswordValid = await manager.verifyPassword(newPassword);
    if (isPasswordValid) {
      throw new Error('기존 비밀번호가 일치 합니다.');
    }
    const updatedPassword = await managerAuthDao.lostUpdatePassword(
      cleanedPhoneNumber,
      newPassword,
    );
    return updatedPassword;
  } catch (error) {
    throw new Error('🔴 비밀번호 변경 오류:' + error.message);
  }
};

/**
 * 상조팀장 휴대폰 번호 변경
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 * - newPhone: string — 새로운 휴대폰 번호
 *
 * 동작:
 * 1) managerId로 상조팀장 정보 조회
 * 2) 새 번호가 기존 번호와 동일한지 검증
 * 3) 휴대폰 번호 업데이트 수행
 * 4) 업데이트된 상조팀장 정보 반환
 *
 * 검증 사항:
 * - 계정 존재: '상조팀장을 찾을 수 없습니다.'
 * - 번호 중복: '새로운 번호가 기존 번호와 동일합니다.'
 *
 * 참고:
 * - 기존 번호 검증 로직은 주석 처리되어 있습니다.
 * - 향후 보안 강화를 위해 기존 번호 확인 로직을 활성화할 수 있습니다.
 *
 * 반환:
 * - Object: 업데이트된 상조팀장 정보
 *
 * 예외:
 * - 계정 없음: '상조팀장을 찾을 수 없습니다.'
 * - 번호 중복: '새로운 번호가 기존 번호와 동일합니다.'
 * - 기타 오류: '🔴 휴대폰 번호 변경 오류: {원인}' 형태로 Error throw
 */
export const updatePhoneNumber = async (params) => {
  try {
    const { managerId, /*currentPhone,*/ newPhone } = params;

    const manager = await managerAuthDao.findById(managerId);
    if (!manager) throw new Error('상조팀장을 찾을 수 없습니다.');

    // if (manager.managerPhoneNumber !== currentPhone) {
    //   throw new Error('기존 휴대폰 번호가 일치하지 않습니다.');
    // }

    if (manager.managerPhoneNumber === newPhone) {
      throw new Error('새로운 번호가 기존 번호와 동일합니다.');
    }

    // 전화번호 변경 후 갱신된 유저 정보 리턴
    await managerAuthDao.updatePhoneNumber(managerId, newPhone);
    const updatedManager = await managerAuthDao.findById(managerId);

    return updatedManager;
  } catch (error) {
    throw new Error('🔴 휴대폰 번호 변경 오류:' + error.message);
  }
};

/**
 * 상조팀장 계좌 정보 변경
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 * - managerBankName: string — 은행명
 * - managerBankNumber: string — 계좌번호
 * - managerBankHolder: string — 예금주명
 *
 * 동작:
 * 1) managerId로 상조팀장 정보 조회
 * 2) 새 계좌번호가 기존 계좌번호와 동일한지 검증
 * 3) 계좌 정보 업데이트 수행
 * 4) 업데이트된 상조팀장 정보 반환
 *
 * 검증 사항:
 * - 계정 존재: '상조팀장을 찾을 수 없습니다.'
 * - 계좌번호 중복: '기존 계좌 번호와 동일합니다.'
 *
 * 보안:
 * - 동일한 계좌번호로의 변경을 방지하여 불필요한 업데이트 차단
 * - 은행명, 예금주명은 중복 검증 없이 변경 가능
 *
 * 반환:
 * - Object: 업데이트된 상조팀장 정보
 *
 * 예외:
 * - 계정 없음: '상조팀장을 찾을 수 없습니다.'
 * - 계좌번호 중복: '기존 계좌 번호와 동일합니다.'
 * - 기타 오류: '🔴 계좌 정보 변경 오류: {원인}' 형태로 Error throw
 */
export const updateBankAccount = async (params) => {
  try {
    const { managerId, managerBankName, managerBankNumber, managerBankHolder } = params;

    const manager = await managerAuthDao.findById(managerId);
    if (!manager) throw new Error('상조팀장을 찾을 수 없습니다.');

    // 기존 정보와 동일한 경우 변경 안함
    if (manager.managerBankNumber === managerBankNumber) {
      throw new Error('기존 계좌 번호와 동일합니다.');
    }

    // 변경 수행
    await managerAuthDao.updateBankInfo(
      managerId,
      managerBankName,
      managerBankNumber,
      managerBankHolder,
    );

    // 변경 후 정보 반환
    const updatedManager = await managerAuthDao.findById(managerId);
    return updatedManager;
  } catch (error) {
    throw new Error('🔴 계좌 정보 변경 오류:' + error.message);
  }
};

/**
 * 상조팀장 아이디 찾기용 SMS 인증번호 발송
 *
 * 입력:
 * - managerPhoneNumber: string — 상조팀장 휴대폰 번호
 *
 * 동작:
 * 1) 휴대폰 번호 형식 검증 (정규식)
 * 2) 인증 시도 횟수 제한 확인 (최대 5회)
 * 3) 요청 간격 제한 확인 (1분)
 * 4) 6자리 랜덤 인증번호 생성
 * 5) Redis에 인증 코드 및 제한 정보 저장
 * 6) CoolSMS를 통해 인증번호 SMS 발송
 *
 * 보안 제한:
 * - 인증 시도 횟수: 최대 5회 (1시간 동안 유지)
 * - 요청 간격: 최소 1분 간격
 * - 인증 코드 유효시간: 5분
 *
 * 휴대폰 번호 검증:
 * - 정규식: /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/
 * - 010, 011, 016, 017, 018, 019로 시작하는 번호만 허용
 * - 하이픈 포함/미포함 모두 허용
 *
 * Redis 저장:
 * - sms:{phoneNumber}: 인증 코드 (5분 유효)
 * - lastRequest:{phoneNumber}: 마지막 요청 시간 (1분 유효)
 * - attempts:{phoneNumber}: 시도 횟수 (1시간 유효)
 *
 * SMS 내용:
 * - 제목: 없음
 * - 본문: '하늘애 인증번호는 [6자리 숫자] 입니다. 5분 내에 입력해주세요.'
 *
 * 반환:
 * - Promise<void>: SMS 발송 및 코드 저장 완료
 *
 * 예외:
 * - 번호 형식 오류: '유효한 전화번호 형식이 아닙니다.'
 * - 시도 횟수 초과: '인증 시도 횟수 초과. 1시간 후 다시 시도해주세요.'
 * - 요청 간격 미달: '1분 후 다시 시도해주세요.'
 * - SMS 발송 실패: CoolSMS API 오류 시 해당 오류 전파
 * - Redis 저장 실패: Redis 연결 오류 시 해당 오류 전파
 */
export const sendVerificationSMS = async (managerPhoneNumber) => {
  const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
  if (!phoneRegex.test(managerPhoneNumber)) {
    throw new Error('유효한 전화번호 형식이 아닙니다.');
  }

  const attempts = await redis.get(`attempts:${managerPhoneNumber}`);
  if (attempts && parseInt(attempts) >= ATTEMPT_LIMIT) {
    throw new Error('인증 시도 횟수 초과. 1시간 후 다시 시도해주세요.');
  }

  const lastRequest = await redis.get(`lastRequest:${managerPhoneNumber}`);
  if (lastRequest && Date.now() - parseInt(lastRequest) < 60000) {
    throw new Error('1분 후 다시 시도해주세요.');
  }

  const code = generateVerificationCode();

  await Promise.all([
    redis.set(`sms:${managerPhoneNumber}`, code, 'EX', CODE_EXPIRY),
    redis.set(`lastRequest:${managerPhoneNumber}`, Date.now(), 'EX', 60),
    redis.incr(`attempts:${managerPhoneNumber}`),
    redis.expire(`attempts:${managerPhoneNumber}`, ATTEMPT_EXPIRY),
  ]);

  await smsClient.sendOne({
    to: managerPhoneNumber,
    from: process.env.COOLSMS_SENDER_NUMBER,
    text: `하늘애 인증번호는 [${code}] 입니다. 5분 내에 입력해주세요.`,
  });
};

/**
 * SMS 인증번호 검증 및 아이디 반환
 *
 * 입력:
 * - managerPhoneNumber: string — 상조팀장 휴대폰 번호
 * - inputCode: string — 사용자가 입력한 인증 코드
 *
 * 동작:
 * 1) 휴대폰 번호에서 하이픈 제거
 * 2) Redis에서 저장된 인증 코드 조회
 * 3) 인증 코드 존재 여부 및 일치 여부 검증
 * 4) 인증 성공 시 Redis에서 관련 데이터 제거
 * 5) 휴대폰 번호로 등록된 상조팀장 정보 조회
 * 6) 상조팀장 사용자명 반환
 *
 * 검증 과정:
 * - 코드 존재: '인증 코드가 만료되었거나 존재하지 않습니다.'
 * - 코드 일치: '인증 코드가 일치하지 않습니다.'
 * - 계정 존재: '해당 휴대폰 번호로 등록된 아이디가 없습니다.'
 *
 * Redis 정리:
 * - sms:{phoneNumber}: 인증 코드 삭제
 * - attempts:{phoneNumber}: 시도 횟수 삭제
 * - lastRequest:{phoneNumber}: 마지막 요청 시간 삭제
 *
 * 보안:
 * - 인증 성공 시 모든 관련 데이터를 즉시 삭제
 * - 일회성 인증 코드 사용
 * - 휴대폰 번호 정규화로 데이터 일관성 보장
 *
 * 반환:
 * - string: 상조팀장 사용자명
 *
 * 예외:
 * - 코드 만료/없음: '인증 코드가 만료되었거나 존재하지 않습니다.'
 * - 코드 불일치: '인증 코드가 일치하지 않습니다.'
 * - 계정 없음: '해당 휴대폰 번호로 등록된 아이디가 없습니다.'
 * - 기타 오류: '인증 실패: {원인}' 형태로 Error throw
 */
export const verifyCode = async (managerPhoneNumber, inputCode) => {
  try {
    // 전화번호에서 하이픈 제거
    const cleanedPhoneNumber = managerPhoneNumber.replace(/-/g, '');
    console.error('🚀 ~ verifyCode ~ cleanedPhoneNumber:', cleanedPhoneNumber);

    const storedCode = await redis.get(`sms:${managerPhoneNumber}`);

    if (!storedCode) {
      throw new Error('인증 코드가 만료되었거나 존재하지 않습니다.');
    }

    if (storedCode !== inputCode) {
      throw new Error('인증 코드가 일치하지 않습니다.');
    }

    // 인증 성공 시: Redis에서 관련 데이터 제거
    await Promise.all([
      redis.del(`sms:${managerPhoneNumber}`),
      redis.del(`attempts:${managerPhoneNumber}`),
      redis.del(`lastRequest:${managerPhoneNumber}`),
    ]);
    // 인증 성공 후, 해당 휴대폰 번호로 가입한 아이디 조회
    const manager = await managerAuthDao.findByPhone(cleanedPhoneNumber);
    if (!manager) {
      throw new Error('해당 휴대폰 번호로 등록된 아이디가 없습니다.');
    }
    console.log('🚀 ~ verifyCode ~ manager:', manager);

    return manager.managerUsername;
  } catch (error) {
    throw new Error(`인증 실패: ${error.message}`);
  }
};

/**
 * 상조팀장 정보 조회 (비밀번호 포함)
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 *
 * 동작:
 * - managerId로 상조팀장 정보 조회
 * - 비밀번호를 포함한 전체 정보 반환
 *
 * 주의:
 * - 이 함수는 비밀번호를 포함한 민감한 정보를 반환합니다.
 * - 보안이 중요한 상황에서는 사용을 자제해야 합니다.
 * - 주로 관리자 기능이나 내부 검증 목적으로 사용됩니다.
 *
 * 반환:
 * - Object: 상조팀장 전체 정보 (비밀번호 포함)
 *
 * 예외:
 * - 계정 없음: '해당 ID의 상조팀장 정보를 찾을 수 없습니다.'
 * - 기타 오류: '전화번호 조회 실패: {원인}' 형태로 Error throw
 */
export const getUserPassword = async (managerId) => {
  try {
    const manager = await managerUserDao.findById(managerId);
    if (!manager) {
      throw new Error('해당 ID의 상조팀장 정보를 찾을 수 없습니다.');
    }
    return manager;
  } catch (error) {
    console.error('🔴 getUserPhone 에러:', error.message);
    throw new Error('전화번호 조회 실패: ' + error.message);
  }
};

/**
 * 휴대폰 번호에서 하이픈 제거
 *
 * 입력:
 * - phoneNumber: string — 하이픈이 포함된 휴대폰 번호
 *
 * 동작:
 * - 정규식을 사용하여 하이픈(-) 문자 제거
 * - null이나 undefined인 경우 원본 값 반환
 *
 * 정규식:
 * - /-/g: 모든 하이픈 문자를 찾아 빈 문자열로 대체
 * - g 플래그로 전역 검색 수행
 *
 * 반환:
 * - string: 하이픈이 제거된 휴대폰 번호
 * - null/undefined: 입력값이 null/undefined인 경우 원본 값 반환
 *
 * 예시:
 * - '010-1234-5678' → '01012345678'
 * - '010-1234-5678' → '01012345678'
 * - null → null
 * - undefined → undefined
 */
export const removeHyphensFromPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return phoneNumber;
  return phoneNumber.replace(/-/g, '');
};
