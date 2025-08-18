/**
 * 장례식장 인증 서비스
 * - 장례식장 사용자의 로그인, 비밀번호 관리, 휴대폰/계좌 정보 변경, 아이디 찾기 기능을 제공합니다.
 * - JWT 토큰 기반 인증, CoolSMS를 통한 SMS 인증, Redis를 통한 인증 코드 관리가 포함됩니다.
 * - 비밀번호 검증, 승인 상태 확인, 중복 정보 검사 등의 비즈니스 로직을 처리합니다.
 */
import * as funeralAuthDao from '../../daos/funeral/funeralAuthDao.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';
import coolsms from 'coolsms-node-sdk';
import redis from '../../config/redis.js';
import dotenv from 'dotenv';
//import path from 'path';
import { generateVerificationCode } from '../../utils/codeGenerator.js';

//dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const mysms = coolsms.default;
const smsClient = new mysms(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

const CODE_EXPIRY = 300; // 5분
const ATTEMPT_LIMIT = 5;
const ATTEMPT_EXPIRY = 3600; // 1시간

/**
 * 장례식장 로그인
 *
 * 입력:
 * - funeralUsername: string — 장례식장 사용자명
 * - funeralPassword: string — 장례식장 비밀번호
 *
 * 동작:
 * 1) 사용자명으로 장례식장 정보 조회
 * 2) 승인 상태 확인 (isApproved === true)
 * 3) 비밀번호 검증 (verifyPassword 메서드 사용)
 * 4) JWT 액세스 토큰 및 리프레시 토큰 생성
 * 5) 로그인 성공 시 토큰과 사용자 정보 반환
 *
 * 반환:
 * - Object: { accessToken, refreshToken, funeral: SafeObject }
 *
 * 예외:
 * - 존재하지 않는 사용자: '존재하지 않는 아이디입니다.'
 * - 미승인 사용자: '관리자의 승인이 필요합니다.'
 * - 비밀번호 불일치: '아이디 또는 비밀번호가 일치하지 않습니다.'
 * - 기타 오류: '로그인 오류: {원인}' 형태로 Error throw
 */
export const login = async ({ funeralUsername, funeralPassword }) => {
  try {
    console.log('🚀 ~ login ~ funeralUsername, funeralPassword:', funeralUsername, funeralPassword);
    const funeral = await funeralAuthDao.findManagerByUsername(funeralUsername);
    if (!funeral) throw new Error('존재하지 않는 아이디입니다.');
    if (!funeral.isApproved) throw new Error('관리자의 승인이 필요합니다.');

    console.log('🚀 ~ login ~ funeral:', funeral.funeralPassword);
    // 비밀번호 비교
    const isPasswordValid = await funeral.verifyPassword(funeralPassword);
    console.log('🚀 ~ login ~ isPasswordValid:', isPasswordValid);
    if (!isPasswordValid) {
      throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    const accessToken = generateToken({ funeralId: funeral.funeralId });
    const refreshToken = generateRefreshToken({ funeralId: funeral.funeralId });

    return {
      accessToken,
      refreshToken,
      funeral: funeral.toSafeObject(),
    };
  } catch (error) {
    throw new Error('로그인 오류: ' + error.message);
  }
};

/**
 * 비밀번호 변경 (로그인 상태)
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 * - newPassword: string — 새로운 비밀번호
 *
 * 동작:
 * 1) 장례식장 ID로 사용자 정보 조회
 * 2) 필수 정보 누락 여부 확인
 * 3) 새 비밀번호가 기존 비밀번호와 동일한지 검증
 * 4) DAO를 통해 비밀번호 업데이트 수행
 *
 * 반환:
 * - Object: 업데이트 결과 (DAO 반환값)
 *
 * 예외:
 * - 사용자 없음: '장례식장을 찾을 수 없습니다.'
 * - 필수 정보 누락: '필수 정보가 누락되었습니다.'
 * - 동일한 비밀번호: '기존 비밀번호와 동일합니다.'
 * - 업데이트 실패: '🔴 비밀번호 변경 오류: {원인}' 형태로 Error throw
 */
export const updatePassword = async (params) => {
  try {
    const { funeralId, newPassword } = params;

    const funeral = await funeralAuthDao.findById(funeralId);
    if (!funeral) throw new Error('장례식장을 찾을 수 없습니다.');

    // 필수 정보 확인
    if (!funeralId || !newPassword) {
      throw new Error('필수 정보가 누락되었습니다.');
    }

    // 비밀번호가 현재 비밀번호와 동일한지 확인
    const isPasswordValid = await funeral.verifyPassword(newPassword);
    if (isPasswordValid) {
      throw new Error('기존 비밀번호와 동일합니다.');
    }

    return await funeralAuthDao.updatePassword(funeralId, newPassword);
  } catch (error) {
    console.error('🔴 비밀번호 변경 오류:' + error.message);
    throw new Error('🔴 비밀번호 변경 오류:' + error.message);
  }
};

/**
 * 비밀번호 찾기 후 변경 (휴대폰 인증 기반)
 *
 * 입력:
 * - phoneNumber: string — 휴대폰 번호 (하이픈 포함 가능)
 * - newPassword: string — 새로운 비밀번호
 *
 * 동작:
 * 1) 필수 정보 누락 여부 확인
 * 2) 휴대폰 번호에서 하이픈 제거
 * 3) 휴대폰 번호로 장례식장 정보 조회
 * 4) 새 비밀번호가 기존 비밀번호와 동일한지 검증
 * 5) DAO를 통해 비밀번호 업데이트 수행
 *
 * 반환:
 * - Object: 업데이트 결과 (DAO 반환값)
 *
 * 예외:
 * - 필수 정보 누락: '필수 정보가 누락되었습니다.'
 * - 사용자 없음: '장례식장을 찾을 수 없습니다.'
 * - 동일한 비밀번호: '기존 비밀번호가 일치 합니다.'
 * - 업데이트 실패: '🔴 비밀번호 변경 오류: {원인}' 형태로 Error throw
 */
export const lostPasswordUpdate = async (params) => {
  try {
    const { phoneNumber, newPassword } = params;
    console.log('🚀 ~ lostPasswordUpdate ~ phoneNumber, newPassword:', phoneNumber, newPassword);

    // 필수정보 확인
    if (!phoneNumber || !newPassword) {
      throw new Error('필수 정보가 누락되었습니다.');
    }
    const cleanedPhoneNumber = removeHyphensFromPhoneNumber(phoneNumber);

    // 상조팀장 정보 조회
    const funeral = await funeralAuthDao.findByPhone(cleanedPhoneNumber);
    console.log('🚀 ~ lostPasswordUpdate ~ funeral:', funeral);
    if (!funeral) throw new Error('장례식장을 찾을 수 없습니다.');

    const isPasswordValid = await funeral.verifyPassword(newPassword);
    if (isPasswordValid) {
      throw new Error('기존 비밀번호가 일치 합니다.');
    }
    const updatedPassword = await funeralAuthDao.lostUpdatePassword(
      cleanedPhoneNumber,
      newPassword,
    );
    return updatedPassword;
  } catch (error) {
    throw new Error('🔴 비밀번호 변경 오류:' + error.message);
  }
};

/**
 * 휴대폰 번호 변경
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 * - newPhone: string — 새로운 휴대폰 번호
 *
 * 동작:
 * 1) 장례식장 ID로 사용자 정보 조회
 * 2) 새 번호가 기존 번호와 동일한지 확인
 * 3) DAO를 통해 휴대폰 번호 업데이트 수행
 * 4) 업데이트된 사용자 정보 반환
 *
 * 반환:
 * - Object: 업데이트된 장례식장 정보
 *
 * 예외:
 * - 사용자 없음: '장례식장을 찾을 수 없습니다.'
 * - 동일한 번호: '기존 휴대폰 번호와 동일합니다.'
 * - 업데이트 실패: '🔴 휴대폰 번호 변경 오류: {원인}' 형태로 Error throw
 */
export const updatePhoneNumber = async (params) => {
  try {
    const { funeralId, newPhone } = params;

    const funeral = await funeralAuthDao.findById(funeralId);

    if (!funeral) throw new Error('장례식장을 찾을 수 없습니다.');

    if (funeral.funeralPhoneNumber === newPhone) {
      throw new Error('기존 휴대폰 번호와 동일합니다.');
    }

    // 전화번호 변경 후 갱신된 유저 정보 리턴
    await funeralAuthDao.updatePhoneNumber(funeralId, newPhone);
    const updatedFuneral = await funeralAuthDao.findById(funeralId);

    return updatedFuneral;
  } catch (error) {
    console.error('🔴 휴대폰 번호 변경 오류:' + error.message);
    throw new Error('🔴 휴대폰 번호 변경 오류:' + error.message);
  }
};

/**
 * 계좌 정보 변경
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 * - funeralBankName: string — 은행명
 * - funeralBankNumber: string — 계좌번호
 * - funeralBacnkHolder: string — 예금주명
 *
 * 동작:
 * 1) 장례식장 ID로 사용자 정보 조회
 * 2) 새 계좌번호가 기존 계좌번호와 동일한지 확인
 * 3) DAO를 통해 계좌 정보 업데이트 수행
 * 4) 업데이트된 사용자 정보 반환
 *
 * 반환:
 * - Object: 업데이트된 장례식장 정보
 *
 * 예외:
 * - 사용자 없음: '장례식장을 찾을 수 없습니다.'
 * - 동일한 계좌번호: '기존 계좌 번호와 동일합니다.'
 * - 업데이트 실패: '🔴 계좌 정보 변경 오류: {원인}' 형태로 Error throw
 */
export const updateBankAccount = async (params) => {
  try {
    const { funeralId, funeralBankName, funeralBankNumber, funeralBacnkHolder } = params;

    const funeral = await funeralAuthDao.findById(funeralId);
    if (!funeral) throw new Error('장례식장을 찾을 수 없습니다.');

    // 기존 정보와 동일한 경우 변경 안함
    if (funeral.funeralBankNumber === funeralBankNumber) {
      throw new Error('기존 계좌 번호와 동일합니다.');
    }

    // 변경 수행
    await funeralAuthDao.updateBankInfo(
      funeralId,
      funeralBankName,
      funeralBankNumber,
      funeralBacnkHolder,
    );

    // 변경 후 정보 반환
    const updatedFuneral = await funeralAuthDao.findById(funeralId);
    return updatedFuneral;
  } catch (error) {
    throw new Error('🔴 계좌 정보 변경 오류:' + error.message);
  }
};

/**
 * 휴대폰 번호 변경 (간단 버전)
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 * - newPhone: string — 새로운 휴대폰 번호
 *
 * 반환:
 * - Object: 업데이트 결과 (DAO 반환값)
 *
 * 예외:
 * - 업데이트 실패: '전화번호 변경 실패: {원인}' 형태로 Error throw
 */
export const updatePhone = async (funeralId, newPhone) => {
  try {
    return await funeralAuthDao.updatePhone(funeralId, newPhone);
  } catch (error) {
    throw new Error('전화번호 변경 실패: ' + error.message);
  }
};

/**
 * 계좌 정보 변경 (간단 버전)
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 * - bankName: string — 은행명
 * - bankNumber: string — 계좌번호
 *
 * 반환:
 * - Object: 업데이트 결과 (DAO 반환값)
 *
 * 예외:
 * - 업데이트 실패: '계좌번호 변경 실패: {원인}' 형태로 Error throw
 */
export const updateAccount = async (funeralId, bankName, bankNumber) => {
  try {
    return await funeralAuthDao.updateAccount(funeralId, bankName, bankNumber);
  } catch (error) {
    throw new Error('계좌번호 변경 실패: ' + error.message);
  }
};

/**
 * 휴대폰 번호로 이메일 찾기
 *
 * 입력:
 * - phoneNumber: string — 휴대폰 번호
 *
 * 반환:
 * - string: 장례식장 이메일 주소
 *
 * 예외:
 * - 사용자 없음: '일치하는 이메일을 찾을 수 없습니다.'
 * - 조회 실패: 원본 오류를 그대로 전파
 */
export const findEmailByPhone = async (phoneNumber) => {
  try {
    const user = await funeralAuthDao.findByPhone(phoneNumber);
    if (!user) throw new Error('일치하는 이메일을 찾을 수 없습니다.');
    return user.funeralEmail;
  } catch (error) {
    console.error('이메일 찾기 오류:', error);
    throw error;
  }
};

/**
 * 아이디 찾기용 SMS 인증번호 발송
 *
 * 입력:
 * - funeralPhoneNumber: string — 휴대폰 번호 (하이픈 포함 가능)
 *
 * 동작:
 * 1) 휴대폰 번호 형식 검증 (정규식)
 * 2) Redis에서 시도 횟수 및 마지막 요청 시간 확인
 * 3) 제한 사항 확인 (시도 횟수 제한, 요청 간격 제한)
 * 4) 6자리 인증번호 생성
 * 5) Redis에 인증번호, 시도 횟수, 마지막 요청 시간 저장
 * 6) CoolSMS를 통해 인증번호 SMS 발송
 *
 * 제한 사항:
 * - 시도 횟수: 1시간 내 최대 5회
 * - 요청 간격: 1분 이상 간격
 * - 인증번호 유효시간: 5분
 *
 * 예외:
 * - 잘못된 전화번호 형식: '유효한 전화번호 형식이 아닙니다.'
 * - 시도 횟수 초과: '인증 시도 횟수 초과. 1시간 후 다시 시도해주세요.'
 * - 요청 간격 미준수: '1분 후 다시 시도해주세요.'
 * - SMS 발송 실패: CoolSMS 오류를 그대로 전파
 */
export const sendVerificationSMS = async (funeralPhoneNumber) => {
  const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
  if (!phoneRegex.test(funeralPhoneNumber)) {
    throw new Error('유효한 전화번호 형식이 아닙니다.');
  }

  const attempts = await redis.get(`attempts:${funeralPhoneNumber}`);
  if (attempts && parseInt(attempts) >= ATTEMPT_LIMIT) {
    throw new Error('인증 시도 횟수 초과. 1시간 후 다시 시도해주세요.');
  }

  const lastRequest = await redis.get(`lastRequest:${funeralPhoneNumber}`);
  if (lastRequest && Date.now() - parseInt(lastRequest) < 60000) {
    throw new Error('1분 후 다시 시도해주세요.');
  }

  const code = generateVerificationCode();
  console.log('🚀 ~ sendVerificationSMS ~ code:', code);

  await Promise.all([
    redis.set(`sms:${funeralPhoneNumber}`, code, 'EX', CODE_EXPIRY),
    redis.set(`lastRequest:${funeralPhoneNumber}`, Date.now(), 'EX', 60),
    redis.incr(`attempts:${funeralPhoneNumber}`),
    redis.expire(`attempts:${funeralPhoneNumber}`, ATTEMPT_EXPIRY),
  ]);

  await smsClient.sendOne({
    to: funeralPhoneNumber,
    from: process.env.COOLSMS_SENDER_NUMBER,
    text: `하늘애 인증번호는 [${code}] 입니다. 5분 내에 입력해주세요.`,
  });
};

/**
 * SMS 인증번호 검증 및 아이디 반환
 *
 * 입력:
 * - funeralPhoneNumber: string — 휴대폰 번호 (하이픈 포함 가능)
 * - inputCode: string — 사용자가 입력한 인증번호
 *
 * 동작:
 * 1) 휴대폰 번호에서 하이픈 제거
 * 2) Redis에서 저장된 인증번호 조회
 * 3) 인증번호 일치 여부 확인
 * 4) 인증 성공 시 Redis 데이터 정리
 * 5) 휴대폰 번호로 등록된 사용자 조회
 * 6) 사용자명 반환
 *
 * 반환:
 * - string: 장례식장 사용자명
 *
 * 예외:
 * - 인증번호 만료/없음: '인증 코드가 만료되었거나 존재하지 않습니다.'
 * - 인증번호 불일치: '인증 코드가 일치하지 않습니다.'
 * - 사용자 없음: '해당 휴대폰 번호로 등록된 아이디가 없습니다.'
 * - 기타 오류: '인증 실패: {원인}' 형태로 Error throw
 */
export const verifyCode = async (funeralPhoneNumber, inputCode) => {
  try {
    // 전화번호에서 하이픈 제거
    const cleanedPhoneNumber = funeralPhoneNumber.replace(/-/g, '');

    const storedCode = await redis.get(`sms:${funeralPhoneNumber}`);

    if (!storedCode) {
      throw new Error('인증 코드가 만료되었거나 존재하지 않습니다.');
    }

    if (storedCode !== inputCode) {
      throw new Error('인증 코드가 일치하지 않습니다.');
    }

    // 인증 성공 시: Redis에서 관련 데이터 제거
    await Promise.all([
      redis.del(`sms:${funeralPhoneNumber}`),
      redis.del(`attempts:${funeralPhoneNumber}`),
      redis.del(`lastRequest:${funeralPhoneNumber}`),
    ]);

    let userCheck = null;
    userCheck = await funeralAuthDao.findByPhone(cleanedPhoneNumber);
    console.log('🚀 ~ verifyCode ~ userCheck:', userCheck);
    if (!userCheck) {
      throw new Error('해당 휴대폰 번호로 등록된 아이디가 없습니다.');
    }
    return userCheck.funeralUsername;
  } catch (error) {
    throw new Error(`인증 실패: ${error.message}`);
  }
};

/**
 * 휴대폰 번호에서 하이픈 제거
 *
 * 입력:
 * - phoneNumber: string — 휴대폰 번호 (하이픈 포함 가능)
 *
 * 반환:
 * - string: 하이픈이 제거된 휴대폰 번호
 *
 * 내부 함수로, 휴대폰 번호 정규화에 사용됩니다.
 */
const removeHyphensFromPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return phoneNumber;
  return phoneNumber.replace(/-/g, '');
};
