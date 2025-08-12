/**
 * 장례식장 SMS 인증 서비스
 * - 장례식장 직원과 장례식장 등록을 위한 SMS 인증 기능을 제공합니다.
 * - CoolSMS API를 사용하여 인증번호를 발송하고, Redis를 통해 인증 코드를 관리합니다.
 * - 직원 인증과 장례식장 등록 인증을 구분하여 처리합니다.
 * - 인증번호는 5분간 유효하며, 일회성으로 사용됩니다.
 */
import coolsms from 'coolsms-node-sdk';
import redis from '../../config/redis.js';
import * as funeralAuthDao from '../../daos/funeral/funeralAuthDao.js';
import { generateVerificationCode } from '../../utils/codeGenerator.js';
import * as funeralUserDao from '../../daos/funeral/funeralUserDao.js'; // 실제 경로에 맞게 import
import * as managerUserDao from '../../daos/manager/managerUserDao.js';

const client = new coolsms.default(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);
const EXPIRE_TIME = 300; // 5분

/**
 * 장례식장 직원용 SMS 인증번호 발송
 *
 * 입력:
 * - phoneNumber: string — 인증번호를 받을 휴대폰 번호
 * - funeralId: string — 장례식장 ID
 *
 * 동작:
 * 1) 장례식장 ID로 장례식장 정보 조회
 * 2) 입력된 휴대폰 번호가 해당 장례식장의 대표자 번호와 일치하는지 검증
 * 3) 6자리 랜덤 인증번호 생성
 * 4) Redis에 휴대폰 번호와 인증번호를 매핑하여 저장 (5분 유효)
 * 5) CoolSMS를 통해 인증번호 SMS 발송
 *
 * 검증 사항:
 * - phoneNumber === verifyFuneralId.funeralPhoneNumber: 입력된 번호가 장례식장 대표자 번호와 일치해야 함
 *
 * SMS 내용:
 * - 제목: 없음
 * - 본문: '하늘애 인증번호는 [6자리 숫자] 입니다. 5분 내에 입력해주세요.'
 *
 * 반환:
 * - Promise<void>: SMS 발송 및 코드 저장 완료
 *
 * 예외:
 * - 대표자 번호 불일치: '대표자 번호가 아닙니다.'
 * - 장례식장 정보 없음: DAO에서 발생한 오류 전파
 * - SMS 발송 실패: CoolSMS API 오류 시 해당 오류 전파
 * - Redis 저장 실패: Redis 연결 오류 시 해당 오류 전파
 *
 * 보안:
 * - 인증번호는 Redis에 5분간만 저장되며, 자동으로 만료됩니다.
 * - 대표자 번호 검증을 통해 권한이 있는 사용자만 인증번호를 발송받을 수 있습니다.
 */
export const sendVerificationSMSStaff = async (phoneNumber, funeralId) => {
  try {
    const verifyFuneralId = await funeralAuthDao.findByUserInfo(funeralId);

    if (verifyFuneralId.funeralPhoneNumber !== phoneNumber) {
      throw new Error('대표자 번호가 아닙니다.');
    }

    const code = generateVerificationCode();
    await redis.set(`sms:${phoneNumber}`, code, 'EX', EXPIRE_TIME);

    await client.sendOne({
      to: phoneNumber,
      from: process.env.COOLSMS_SENDER_NUMBER,
      text: `하늘애 인증번호는 [${code}] 입니다. 5분 내에 입력해주세요.`,
    });
  } catch (error) {
    console.error('Error in sendVerificationSMS:', error.message);
    throw new Error(error.message);
  }
};

/**
 * 장례식장 직원용 SMS 인증번호 검증
 *
 * 입력:
 * - phoneNumber: string — 검증할 휴대폰 번호
 * - code: string — 사용자가 입력한 인증번호
 *
 * 동작:
 * 1) Redis에서 저장된 휴대폰 번호의 인증번호 조회
 * 2) 저장된 인증번호와 사용자 입력 인증번호 비교
 * 3) 일치하는 경우 Redis에서 인증번호 삭제 (일회성 사용)
 * 4) 검증 결과 반환
 *
 * 검증 과정:
 * - storedCode 존재 여부 확인
 * - storedCode === code 일치 여부 확인
 * - 인증 성공 시 Redis 데이터 정리
 *
 * 반환:
 * - boolean: 인증 성공 시 true, 실패 시 Error throw
 *
 * 예외:
 * - 인증번호 없음: '인증 실패' (저장된 코드가 없는 경우)
 * - 인증번호 불일치: '인증 실패' (코드가 일치하지 않는 경우)
 * - Redis 오류: Redis 연결 오류 시 해당 오류 전파
 *
 * 보안:
 * - 인증번호는 일회성으로 사용되며, 검증 완료 후 즉시 삭제됩니다.
 * - 5분이 지나면 인증번호가 자동으로 만료됩니다.
 */
export const verifyCodeStaff = async (phoneNumber, code) => {
  const storedCode = await redis.get(`sms:${phoneNumber}`);
  if (!storedCode || storedCode !== code) throw new Error('인증 실패');
  await redis.del(`sms:${phoneNumber}`);
  return true;
};

/**
 * 장례식장 등록용 SMS 인증번호 발송
 *
 * 입력:
 * - phoneNumber: string — 인증번호를 받을 휴대폰 번호
 *
 * 동작:
 * 1) 입력된 휴대폰 번호의 중복 등록 여부 확인
 *    - 상조팀장 테이블에서 휴대폰 번호 검색
 *    - 장례식장 테이블에서 휴대폰 번호 검색
 * 2) 중복이 없는 경우 6자리 랜덤 인증번호 생성
 * 3) Redis에 휴대폰 번호와 인증번호를 매핑하여 저장 (5분 유효)
 * 4) CoolSMS를 통해 인증번호 SMS 발송
 *
 * 중복 검사:
 * - managerUserDao.findByPhone(phoneNumber): 상조팀장 테이블에서 중복 확인
 * - funeralUserDao.findByPhone(phoneNumber): 장례식장 테이블에서 중복 확인
 * - 두 테이블 모두에서 중복이 없어야 인증번호 발송 가능
 *
 * SMS 내용:
 * - 제목: 없음
 * - 본문: '하늘애 인증번호는 [6자리 숫자] 입니다. 5분 내에 입력해주세요.'
 *
 * 반환:
 * - Promise<void>: SMS 발송 및 코드 저장 완료
 *
 * 예외:
 * - 중복 등록: '이미 등록된 전화번호입니다.'
 * - DAO 조회 실패: 각 DAO에서 발생한 오류 전파
 * - SMS 발송 실패: CoolSMS API 오류 시 해당 오류 전파
 * - Redis 저장 실패: Redis 연결 오류 시 해당 오류 전파
 *
 * 참고:
 * - 이 함수는 새로운 장례식장 등록 시에만 사용됩니다.
 * - 기존에 등록된 휴대폰 번호는 인증번호 발송이 불가능합니다.
 */
export const sendVerificationSMSFuneral = async (phoneNumber) => {
  try {
    // 1. 중복 체크
    const existingManager = await managerUserDao.findByPhone(phoneNumber);
    const existingFuneral = await funeralUserDao.findByPhone(phoneNumber);
    if (existingManager || existingFuneral) {
      throw new Error('이미 등록된 전화번호입니다.');
    }

    // 2. 인증번호 생성 및 저장
    const code = generateVerificationCode();
    await redis.set(`sms:${phoneNumber}`, code, 'EX', EXPIRE_TIME);

    // 3. SMS 발송
    await client.sendOne({
      to: phoneNumber,
      from: process.env.COOLSMS_SENDER_NUMBER,
      text: `하늘애 인증번호는 [${code}] 입니다. 5분 내에 입력해주세요.`,
    });
  } catch (error) {
    console.error('Error in sendVerificationSMS:', error.message);
    throw new Error(error.message);
  }
};

/**
 * 장례식장 등록용 SMS 인증번호 검증
 *
 * 입력:
 * - phoneNumber: string — 검증할 휴대폰 번호
 * - code: string — 사용자가 입력한 인증번호
 *
 * 동작:
 * 1) Redis에서 저장된 휴대폰 번호의 인증번호 조회
 * 2) 저장된 인증번호와 사용자 입력 인증번호 비교
 * 3) 일치하는 경우 Redis에서 인증번호 삭제 (일회성 사용)
 * 4) 검증 결과 반환
 *
 * 검증 과정:
 * - storedCode 존재 여부 확인
 * - storedCode === code 일치 여부 확인
 * - 인증 성공 시 Redis 데이터 정리
 *
 * 반환:
 * - boolean: 인증 성공 시 true, 실패 시 Error throw
 *
 * 예외:
 * - 인증번호 없음: '인증 실패' (저장된 코드가 없는 경우)
 * - 인증번호 불일치: '인증 실패' (코드가 일치하지 않는 경우)
 * - Redis 오류: Redis 연결 오류 시 해당 오류 전파
 *
 * 보안:
 * - 인증번호는 일회성으로 사용되며, 검증 완료 후 즉시 삭제됩니다.
 * - 5분이 지나면 인증번호가 자동으로 만료됩니다.
 *
 * 참고:
 * - verifyCodeStaff와 동일한 로직을 사용하지만, 장례식장 등록용으로 구분됩니다.
 * - 향후 코드 정리를 위해 공통 함수로 통합하는 것을 고려해볼 수 있습니다.
 */
export const verifyCodeFuneral = async (phoneNumber, code) => {
  const storedCode = await redis.get(`sms:${phoneNumber}`);
  if (!storedCode || storedCode !== code) throw new Error('인증 실패');
  await redis.del(`sms:${phoneNumber}`);
  return true;
};
