/**
 * 상조팀장 SMS 인증 서비스
 * - 상조팀장의 SMS 인증 코드 발송, 인증 코드 검증, 전화번호 조회 등의 SMS 관련 기능을 제공합니다.
 * - CoolSMS API를 사용하여 SMS 인증 코드를 발송하고, Redis를 통해 인증 코드를 관리합니다.
 * - 전화번호 중복 체크, 인증 시도 횟수 제한, 요청 간격 제한 등의 보안 기능을 제공합니다.
 * - 회원가입 시 상조팀장과 장례식장 사용자의 전화번호 중복을 방지합니다.
 * - 5분 만료 시간과 1시간 시도 제한을 통해 보안을 강화합니다.
 */
import coolsms from 'coolsms-node-sdk';
import redis from '../../config/redis.js';
import dotenv from 'dotenv';
//import path from 'path';
import { generateVerificationCode } from '../../utils/codeGenerator.js';
import * as managerUserDao from '../../daos/manager/managerUserDao.js';
import * as funeralUserDao from '../../daos/funeral/funeralUserDao.js';

//dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const mysms = coolsms.default;
const smsClient = new mysms(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

const CODE_EXPIRY = 300; // 5분
const ATTEMPT_LIMIT = 5;
const ATTEMPT_EXPIRY = 3600; // 1시간

/**
 * 전화번호에서 하이픈 제거
 *
 * 입력:
 * - phoneNumber: string — 하이픈이 포함된 전화번호
 *
 * 동작:
 * - 전화번호 문자열에서 모든 하이픈(-) 문자를 제거
 * - null이나 undefined인 경우 원본 값 그대로 반환
 *
 * 정규식 처리:
 * - /-/g: 전역 플래그를 사용하여 모든 하이픈을 찾아 제거
 * - replace() 메서드로 빈 문자열로 대체
 *
 * 반환:
 * - string: 하이픈이 제거된 전화번호
 * - null/undefined: 원본 값 그대로 반환
 *
 * 예외:
 * - 없음: 입력 값이 null이나 undefined인 경우에도 오류 없이 처리
 *
 * 참고:
 * - 이 함수는 전화번호 형식 표준화를 위해 사용됩니다.
 * - 데이터베이스 저장 시 일관된 형식을 유지할 수 있습니다.
 * - 전화번호 검증 전에 호출하여 정규식 테스트를 준비합니다.
 */
export const removeHyphensFromPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return phoneNumber;
  return phoneNumber.replace(/-/g, '');
};

/**
 * SMS 인증 코드 발송
 *
 * 입력:
 * - phoneNumber: string — 인증 코드를 받을 전화번호
 * - status: string — 인증 목적 ('signup' 등)
 *
 * 동작:
 * 1) 전화번호 형식 유효성 검증 (한국 휴대폰 번호 형식)
 * 2) 하이픈 제거하여 정리된 전화번호 생성
 * 3) 회원가입 시 전화번호 중복 체크 (상조팀장, 장례식장 모두)
 * 4) 인증 시도 횟수 제한 확인 (1시간 내 5회)
 * 5) 요청 간격 제한 확인 (1분 간격)
 * 6) 6자리 랜덤 인증 코드 생성
 * 7) Redis에 인증 코드, 마지막 요청 시간, 시도 횟수 저장
 * 8) CoolSMS API를 통해 SMS 발송
 *
 * 전화번호 형식 검증:
 * - 정규식: /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/
 * - 010, 011, 016, 017, 018, 019로 시작
 * - 하이픈은 선택적으로 허용
 * - 총 11자리 숫자
 *
 * 중복 체크:
 * - status가 'signup'인 경우에만 수행
 * - 상조팀장과 장례식장 테이블 모두에서 전화번호 검색
 * - 이미 등록된 전화번호가 있으면 오류 발생
 *
 * 보안 제한:
 * - 인증 시도 횟수: 1시간 내 최대 5회
 * - 요청 간격: 최소 1분 간격
 * - 코드 만료: 5분 후 자동 만료
 *
 * Redis 저장:
 * - sms:{phoneNumber}: 인증 코드 (5분 만료)
 * - lastRequest:{phoneNumber}: 마지막 요청 시간 (1분 만료)
 * - attempts:{phoneNumber}: 시도 횟수 (1시간 만료)
 *
 * SMS 내용:
 * - 발신번호: 환경변수에서 설정된 번호
 * - 수신번호: 입력된 전화번호
 * - 메시지: "하늘애 인증번호는 [코드] 입니다. 5분 내에 입력해주세요."
 *
 * 반환:
 * - Promise<void>: SMS 발송 및 코드 저장 완료
 *
 * 예외:
 * - 전화번호 형식 오류: '유효한 전화번호 형식이 아닙니다.'
 * - 전화번호 중복: '이미 등록된 전화번호입니다.'
 * - 시도 횟수 초과: '인증 시도 횟수 초과. 1시간 후 다시 시도해주세요.'
 * - 요청 간격 미달: '1분 후 다시 시도해주세요.'
 * - SMS 발송 실패: CoolSMS API 오류 메시지
 * - Redis 저장 실패: Redis 연결 오류
 *
 * 보안:
 * - 인증 코드는 6자리 랜덤 숫자로 생성
 * - Redis TTL을 통한 자동 만료 처리
 * - 시도 횟수와 요청 간격 제한으로 무차별 대입 공격 방지
 * - 전화번호 중복 체크로 계정 도용 방지
 *
 * 참고:
 * - 이 서비스는 상조팀장 회원가입 및 계정 인증에 사용됩니다.
 * - CoolSMS는 한국의 주요 SMS 발송 서비스 제공업체입니다.
 * - Redis를 사용하여 빠른 인증 코드 검증과 보안 제한을 구현합니다.
 */
export const sendVerificationSMS = async (phoneNumber, status) => {
  console.log('🚀 ~ sendVerificationSMS ~ phoneNumber, status:', phoneNumber, status);
  try {
    const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('유효한 전화번호 형식이 아닙니다.');
    }

    const cleanedPhoneNumber = removeHyphensFromPhoneNumber(phoneNumber);

    // 회원가입 시 전화번호 중복 체크 (상조팀장, 장례식장 모두)
    if (status === 'signup') {
      const managerUser = await managerUserDao.findByPhone(cleanedPhoneNumber);
      const funeralUser = await funeralUserDao.findByPhone(cleanedPhoneNumber);

      if (managerUser || funeralUser) {
        throw new Error('이미 등록된 전화번호입니다.');
      }
    }

    const attempts = await redis.get(`attempts:${phoneNumber}`);
    if (attempts && parseInt(attempts) >= ATTEMPT_LIMIT) {
      throw new Error('인증 시도 횟수 초과. 1시간 후 다시 시도해주세요.');
    }

    const lastRequest = await redis.get(`lastRequest:${phoneNumber}`);
    if (lastRequest && Date.now() - parseInt(lastRequest) < 60000) {
      throw new Error('1분 후 다시 시도해주세요.');
    }

    const code = generateVerificationCode();
    console.log('🚀 ~ sendVerificationSMS ~ code:', code);

    await Promise.all([
      redis.set(`sms:${phoneNumber}`, code, 'EX', CODE_EXPIRY),
      redis.set(`lastRequest:${phoneNumber}`, Date.now(), 'EX', 60),
      redis.incr(`attempts:${phoneNumber}`),
      redis.expire(`attempts:${phoneNumber}`, ATTEMPT_EXPIRY),
    ]);

    await smsClient.sendOne({
      to: phoneNumber,
      from: process.env.COOLSMS_SENDER_NUMBER,
      text: `하늘애 인증번호는 [${code}] 입니다. 5분 내에 입력해주세요.`,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * SMS 인증 코드 검증
 *
 * 입력:
 * - phoneNumber: string — 인증 코드를 확인할 전화번호
 * - inputCode: string — 사용자가 입력한 인증 코드
 *
 * 동작:
 * 1) Redis에서 해당 전화번호의 저장된 인증 코드 조회
 * 2) 저장된 코드와 입력된 코드 비교 검증
 * 3) 인증 성공 시 Redis에서 관련 데이터 모두 삭제
 * 4) 인증 성공 여부 반환
 *
 * 검증 과정:
 * - Redis 키 'sms:{phoneNumber}'에서 인증 코드 조회
 * - 저장된 코드가 없으면 만료 또는 존재하지 않음
 * - 코드 일치 여부를 정확히 비교
 * - 인증 성공 시 모든 관련 Redis 데이터 삭제
 *
 * Redis 데이터 삭제:
 * - sms:{phoneNumber}: 인증 코드
 * - attempts:{phoneNumber}: 시도 횟수
 * - lastRequest:{phoneNumber}: 마지막 요청 시간
 *
 * 반환:
 * - boolean: true — 인증 성공, false — 인증 실패
 *
 * 예외:
 * - 코드 만료: '인증 코드가 만료되었거나 존재하지 않습니다.'
 * - 코드 불일치: '인증 코드가 일치하지 않습니다.'
 * - Redis 오류: Redis 연결 오류 시 해당 오류 전파
 *
 * 보안:
 * - 인증 코드는 일회성으로 사용되며, 검증 후 자동 삭제
 * - Redis TTL을 통한 자동 만료 처리
 * - 인증 성공 시 모든 관련 데이터를 즉시 삭제하여 보안 강화
 *
 * 참고:
 * - 이 함수는 동기 함수로 구현되어 있어 즉시 결과를 반환합니다.
 * - 인증 실패 시 사용자에게 적절한 안내 메시지를 제공하는 것이 좋습니다.
 * - 인증 성공 후에는 사용자의 전화번호 인증 상태를 업데이트해야 합니다.
 * - Redis 데이터 삭제는 Promise.all을 사용하여 병렬로 처리됩니다.
 */
export const verifyCode = async (phoneNumber, inputCode) => {
  const storedCode = await redis.get(`sms:${phoneNumber}`);

  if (!storedCode) {
    throw new Error('인증 코드가 만료되었거나 존재하지 않습니다.');
  }

  if (storedCode !== inputCode) {
    throw new Error('인증 코드가 일치하지 않습니다.');
  }

  await Promise.all([
    redis.del(`sms:${phoneNumber}`),
    redis.del(`attempts:${phoneNumber}`),
    redis.del(`lastRequest:${phoneNumber}`),
  ]);

  return true;
};

/**
 * 상조팀장 전화번호 조회
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 *
 * 동작:
 * - managerId로 상조팀장 정보 조회
 * - 상조팀장의 전체 정보 반환 (전화번호 포함)
 *
 * 조회 과정:
 * 1) managerUserDao.findById()를 통해 상조팀장 정보 조회
 * 2) 상조팀장 존재 여부 확인
 * 3) 존재하지 않는 경우 오류 발생
 * 4) 존재하는 경우 전체 상조팀장 정보 반환
 *
 * 반환:
 * - Object: 상조팀장의 전체 정보 (ID, 이름, 전화번호, 기타 정보 등)
 *
 * 예외:
 * - 상조팀장 없음: '해당 ID의 상조팀장 정보를 찾을 수 없습니다.'
 * - DB 조회 실패: '전화번호 조회 실패: {원인}' 형태로 Error throw
 * - 기타 오류: 원본 오류를 포함한 상세 메시지
 *
 * 로깅:
 * - 오류 발생 시 콘솔에 '🔴 getUserPhone 에러:' 형태로 기록
 * - 오류 메시지와 원인을 함께 기록
 *
 * 참고:
 * - 이 함수는 상조팀장의 전화번호뿐만 아니라 전체 정보를 반환합니다.
 * - 전화번호만 필요한 경우 클라이언트에서 phone 필드를 추출하여 사용합니다.
 * - 상조팀장이 존재하지 않는 경우 적절한 오류 처리가 필요합니다.
 * - DB 연결 오류나 기타 시스템 오류에 대한 예외 처리가 포함되어 있습니다.
 */
export const getUserPhone = async (managerId) => {
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
