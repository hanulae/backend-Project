/**
 * Mailgun 이메일 발송 유틸리티
 * - Mailgun API를 사용하여 자동화된 이메일 발송 기능을 제공합니다.
 * - 환경변수를 통한 API 키, 도메인, 발신자 이메일 관리로 보안을 강화합니다.
 * - 이메일 발송 전 필수 파라미터 검증 및 환경변수 유효성 검사를 수행합니다.
 * - Mailgun Sandbox 환경을 사용하여 개발 및 테스트 환경에서 안전하게 이메일 발송을 테스트할 수 있습니다.
 * - 상세한 로깅을 통해 이메일 발송 과정을 추적하고 디버깅을 지원합니다.
 */
// src/utils/sendEmail.js
import dotenv from 'dotenv';
import path from 'path';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 현재 Node.js 환경 설정
 * - NODE_ENV 환경변수를 통해 개발/스테이징/프로덕션 환경을 구분
 * - 환경별로 다른 .env 파일을 로드하여 설정값 관리
 */
const NODE_ENV = process.env.NODE_ENV;

/**
 * 환경변수 설정
 * - __dirname을 기준으로 상대 경로에서 .env.{NODE_ENV} 파일 로드
 * - 프로젝트 루트 디렉토리의 환경별 설정 파일을 우선적으로 로드
 * - 추가적으로 현재 작업 디렉토리의 환경별 설정 파일도 로드 (백업용)
 */
dotenv.config({
  path: path.join(__dirname, `../../.env.${NODE_ENV}`),
});
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

/**
 * Mailgun 클라이언트 초기화
 * - FormData를 사용하여 Mailgun API와의 통신 준비
 * - username은 'api'로 고정 (Mailgun 표준)
 * - API 키는 환경변수에서 가져와 보안 강화
 * - EU 리전 API 사용 시 주석 처리된 url 옵션 활용 가능
 */
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  // url: "https://api.eu.mailgun.net" // EU 리전 사용 시 활성화
});

/**
 * 이메일 발송 함수
 *
 * 입력:
 * - email: string — 수신자 이메일 주소
 * - subject: string — 이메일 제목
 * - text: string — 이메일 본문 내용 (텍스트 형식)
 *
 * 동작:
 * 1) 환경변수에서 Mailgun 도메인과 발신자 이메일 주소 조회
 * 2) 필수 환경변수(API_KEY, DOMAIN, FROM_EMAIL) 존재 여부 검증
 * 3) 입력 파라미터(email, subject, text) 유효성 검증
 * 4) Mailgun API를 통해 이메일 발송 요청
 * 5) 발송 결과 로깅 및 반환
 *
 * 환경변수 검증:
 * - MAILGUN_API_KEY: Mailgun에서 발급받은 API 키
 * - MAILGUN_DOMAIN: Mailgun에서 설정한 도메인
 * - MAILGUN_FROM_EMAIL: 발신자 이메일 주소
 *
 * 파라미터 검증:
 * - email: 수신자 이메일 주소 (필수)
 * - subject: 이메일 제목 (필수)
 * - text: 이메일 본문 (필수)
 *
 * Mailgun API 호출:
 * - messages.create() 메서드를 사용하여 이메일 발송
 * - from: "Mailgun Sandbox <{발신자이메일}>" 형식으로 발신자 표시
 * - to: 수신자 이메일 주소 배열
 * - subject: 이메일 제목
 * - text: 이메일 본문 (텍스트 형식)
 *
 * 로깅:
 * - 발송 시작: 수신자, 제목, 본문 정보 로깅
 * - 환경변수 값: 도메인과 발신자 이메일 확인 로깅
 * - Mailgun 클라이언트: 클라이언트 객체 상태 확인
 * - 발송 성공: Mailgun API 응답 데이터 로깅
 * - 발송 실패: 오류 메시지 상세 로깅
 *
 * 보안:
 * - API 키는 환경변수로 관리하여 코드에 노출되지 않음
 * - Mailgun Sandbox 환경 사용으로 테스트 환경에서 안전한 발송
 * - 발신자 이메일 주소 검증으로 스푸핑 방지
 *
 * 반환:
 * - Object: Mailgun API 응답 데이터 (메시지 ID, 상태 등)
 *
 * 예외:
 * - 환경변수 누락: '🔑 환경변수(API_KEY, DOMAIN, FROM_EMAIL)가 누락되었습니다.'
 * - 파라미터 누락: '📨 to, subject, text는 모두 필수입니다.'
 * - API 호출 실패: Mailgun API에서 발생한 오류 (네트워크, 인증, 권한 등)
 * - 기타 오류: 예상치 못한 시스템 오류
 *
 * 사용 예시:
 * ```javascript
 * try {
 *   const result = await sendEmail(
 *     'user@example.com',
 *     '회원가입 완료',
 *     '안녕하세요! 회원가입이 완료되었습니다.'
 *   );
 *   console.log('이메일 발송 성공:', result.id);
 * } catch (error) {
 *   console.error('이메일 발송 실패:', error.message);
 * }
 * ```
 *
 * 참고:
 * - 이 함수는 현재 Mailgun Sandbox 환경을 사용합니다.
 * - 프로덕션 환경에서는 실제 도메인을 사용해야 합니다.
 * - 이메일 발송 실패 시 적절한 오류 처리와 사용자 안내가 필요합니다.
 * - Mailgun API 호출 제한과 요금 정책을 확인해야 합니다.
 * - HTML 형식 이메일 발송이 필요한 경우 별도 함수 구현이 필요합니다.
 */
export async function sendEmail(email, subject, text) {
  try {
    const domain = process.env.MAILGUN_DOMAIN;
    console.log('🚀 ~ sendEmail ~ domain:', domain);
    const fromEmail = process.env.MAILGUN_FROM_EMAIL;
    console.log('🚀 ~ sendEmail ~ fromEmail:', fromEmail);
    console.log('메일 전송 시작:', { email, subject, text });

    // ✅ 환경 변수 검증
    if (!process.env.MAILGUN_API_KEY || !domain || !fromEmail) {
      throw new Error('🔑 환경변수(API_KEY, DOMAIN, FROM_EMAIL)가 누락되었습니다.');
    }

    // ✅ 필수 파라미터 검증
    if (!email || !subject || !text) {
      throw new Error('📨 to, subject, text는 모두 필수입니다.');
    }

    console.log('메일 mgmgmgmgmg:', { mg });
    const data = await mg.messages.create(domain, {
      from: `Mailgun Sandbox <${fromEmail}>`,
      to: [email],
      subject,
      text,
    });

    console.log('✅ 메일 전송 성공:', data);
    return data;
  } catch (error) {
    console.error('❌ 메일 전송 실패:', error.message);
    throw error;
  }
}
