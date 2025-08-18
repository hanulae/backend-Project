/**
 * 장례식장 이메일 인증 서비스
 * - 장례식장 사용자의 이메일 인증을 위한 인증 코드 발송 및 검증 기능을 제공합니다.
 * - 6자리 랜덤 인증 코드를 생성하여 이메일로 발송합니다.
 * - Mailgun을 통해 이메일을 발송하고, Redis 기반으로 인증 코드를 저장/검증합니다.
 * - 현재 사용하지 않는 기능이지만, 향후 이메일 인증이 필요할 때를 대비해 보존되어 있습니다.
 */
import { storeVerificationCode, verifyCode } from '../../utils/emailStore.js';
import { sendEmail } from '../../utils/mailgunSender.js';

/**
 * 이메일 인증 코드 발송
 *
 * 입력:
 * - email: string — 인증 코드를 받을 이메일 주소
 *
 * 동작:
 * 1) 6자리 랜덤 인증 코드 생성 (100000 ~ 999999 범위)
 * 2) Mailgun을 통해 인증 코드가 포함된 이메일 발송
 * 3) Redis에 이메일과 인증 코드를 매핑하여 저장
 *
 * 인증 코드 생성:
 * - Math.random()을 사용하여 0~899999 범위의 랜덤 숫자 생성
 * - 100000을 더하여 100000~999999 범위로 조정
 * - toString()으로 문자열 변환
 *
 * 이메일 내용:
 * - 제목: '이메일 인증 코드'
 * - 본문: '인증 코드: {6자리 숫자}'
 *
 * 반환:
 * - Promise<void>: 이메일 발송 및 코드 저장 완료
 *
 * 예외:
 * - 이메일 발송 실패: Mailgun API 오류 시 해당 오류 전파
 * - 코드 저장 실패: Redis 연결 오류 시 해당 오류 전파
 *
 * 참고:
 * - 현재 사용하지 않는 기능이지만, 향후 이메일 인증 시스템 구현 시 활용할 수 있습니다.
 * - 인증 코드는 Redis에 저장되어 일정 시간 후 자동 만료됩니다.
 */
export const sendVerificationEmail = async (email) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await sendEmail(email, '이메일 인증 코드', `인증 코드: ${code}`);
  storeVerificationCode(email, code);
};

/**
 * 이메일 인증 코드 검증
 *
 * 입력:
 * - email: string — 검증할 이메일 주소
 * - code: string — 사용자가 입력한 인증 코드
 *
 * 동작:
 * - Redis에 저장된 이메일과 인증 코드를 매핑하여 일치 여부를 확인합니다.
 * - emailStore.js의 verifyCode 함수를 호출하여 실제 검증을 수행합니다.
 *
 * 검증 과정:
 * 1) 입력받은 이메일로 Redis에서 저장된 인증 코드 조회
 * 2) 저장된 코드와 사용자 입력 코드 비교
 * 3) 일치 여부에 따른 boolean 값 반환
 *
 * 반환:
 * - boolean: 인증 코드 일치 시 true, 불일치 시 false
 *
 * 예외:
 * - Redis 연결 오류: emailStore.js에서 발생한 오류를 그대로 전파
 * - 이메일이 존재하지 않는 경우: false 반환
 *
 * 참고:
 * - 현재 사용하지 않는 기능이지만, 향후 이메일 인증 시스템 구현 시 활용할 수 있습니다.
 * - 인증 코드는 일회성으로 사용되며, 검증 완료 후 Redis에서 자동으로 제거됩니다.
 */
export const verifyEmailCode = (email, code) => {
  return verifyCode(email, code);
};
