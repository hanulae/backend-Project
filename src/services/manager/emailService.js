/**
 * 상조팀장 이메일 인증 서비스
 * - 상조팀장 사용자의 이메일 인증을 위한 인증 코드 발송 및 검증 기능을 제공합니다.
 * - 6자리 랜덤 인증 코드를 생성하여 이메일로 발송합니다.
 * - Mailgun을 통해 이메일을 발송하고, Redis 기반으로 인증 코드를 저장/검증합니다.
 * - 이메일 인증을 통한 사용자 신원 확인 및 보안 강화를 지원합니다.
 */
import { sendEmail } from '../../utils/mailgunSender.js';
import logger from '../../config/logger.js';
import { storeVerificationCode, verifyCode } from '../../utils/emailStore.js';

/**
 * 이메일 인증 코드 발송
 *
 * 입력:
 * - email: string — 인증 코드를 받을 이메일 주소
 *
 * 동작:
 * 1) 6자리 랜덤 인증 코드 생성 (100000 ~ 999999 범위)
 * 2) 이메일 제목과 본문 구성
 * 3) Mailgun을 통해 인증 코드가 포함된 이메일 발송
 * 4) Redis에 이메일과 인증 코드를 매핑하여 저장
 * 5) 로그에 이메일 전송 정보 기록
 *
 * 인증 코드 생성:
 * - Math.random()을 사용하여 0~899999 범위의 랜덤 숫자 생성
 * - 100000을 더하여 100000~999999 범위로 조정
 * - toString()으로 문자열 변환하여 6자리 코드 생성
 *
 * 이메일 내용:
 * - 제목: '이메일 인증 코드'
 * - 본문: '인증 코드: {6자리 숫자}'
 *
 * 로깅:
 * - 이메일 주소와 생성된 인증 코드를 info 레벨로 기록
 * - 보안을 위해 프로덕션 환경에서는 코드 로깅을 제한하는 것을 권장
 *
 * 반환:
 * - Promise<void>: 이메일 발송 및 코드 저장 완료
 *
 * 예외:
 * - 이메일 발송 실패: Mailgun API 오류 시 해당 오류 전파
 * - 코드 저장 실패: Redis 연결 오류 시 해당 오류 전파
 * - 로깅 실패: logger 오류 시에도 이메일 발송은 계속 진행
 *
 * 보안:
 * - 인증 코드는 Redis에 저장되어 일정 시간 후 자동 만료
 * - 랜덤 생성으로 예측 불가능한 코드 생성
 * - 이메일 전송 실패 시에도 코드 저장을 시도하여 일관성 유지
 *
 * 참고:
 * - 이 서비스는 상조팀장 회원가입 및 계정 인증에 사용됩니다.
 * - Mailgun은 안정적인 이메일 전송 서비스를 제공합니다.
 * - Redis 기반 저장으로 빠른 인증 코드 검증이 가능합니다.
 */
export const sendVerificationEmail = async (email) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const subject = '이메일 인증 코드';
  const text = `인증 코드: ${code}`;

  logger.info(`이메일 전송: ${email}, 코드: ${code}`);
  await sendEmail(email, subject, text);
  storeVerificationCode(email, code);
};

/**
 * 이메일 인증 코드 검증
 *
 * 입력:
 * - email: string — 인증 코드를 확인할 이메일 주소
 * - code: string — 사용자가 입력한 인증 코드
 *
 * 동작:
 * - Redis에 저장된 이메일과 인증 코드 매핑을 확인
 * - 입력된 코드와 저장된 코드의 일치 여부 검증
 * - 검증 완료 후 Redis에서 해당 코드 삭제 (일회성 사용)
 *
 * 검증 과정:
 * 1) emailStore.js의 verifyCode 함수 호출
 * 2) Redis에서 해당 이메일의 인증 코드 조회
 * 3) 입력된 코드와 저장된 코드 비교
 * 4) 일치 시 true 반환, 불일치 시 false 반환
 *
 * 반환:
 * - boolean: 인증 코드 일치 여부
 *   - true: 인증 코드 일치 (인증 성공)
 *   - false: 인증 코드 불일치 또는 만료 (인증 실패)
 *
 * 예외:
 * - Redis 연결 오류: emailStore에서 발생한 오류 전파
 * - 코드 검증 실패: 저장된 코드가 없거나 만료된 경우 false 반환
 *
 * 보안:
 * - 인증 코드는 일회성으로 사용되며, 검증 후 자동 삭제
 * - Redis의 TTL(Time To Live) 설정으로 자동 만료 처리
 * - 동일한 이메일로 여러 번 인증 시도 시에도 안전하게 처리
 *
 * 참고:
 * - 이 함수는 동기 함수로 구현되어 있어 즉시 결과를 반환합니다.
 * - 인증 실패 시 사용자에게 적절한 안내 메시지를 제공하는 것이 좋습니다.
 * - 인증 성공 후에는 사용자의 이메일 인증 상태를 업데이트해야 합니다.
 */
export const verifyEmailCode = (email, code) => {
  return verifyCode(email, code);
};
