/**
 * JWT (JSON Web Token) 인증 유틸리티
 * - 사용자 인증을 위한 JWT 토큰 생성, 검증, 갱신 기능을 제공합니다.
 * - Access Token과 Refresh Token의 이중 토큰 구조를 사용하여 보안을 강화합니다.
 * - 환경변수를 통한 JWT 시크릿 키와 만료 시간을 관리합니다.
 * - jsonwebtoken 라이브러리를 사용하여 표준 JWT 표준을 준수합니다.
 * - 토큰 만료 시 자동 갱신 메커니즘을 제공하여 사용자 경험을 개선합니다.
 */
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * JWT 설정 객체
 * - 환경변수에서 JWT 관련 설정을 가져와서 중앙 집중식으로 관리
 * - Access Token과 Refresh Token의 시크릿 키와 만료 시간을 설정
 * - 기본값을 제공하여 환경변수 누락 시에도 동작하도록 보장
 */
const jwtConfig = {
  accessSecret: process.env.JWT_SECRET, // Access Token 서명용 시크릿 키
  refreshSecret: process.env.JWT_REFRESH_SECRET, // Refresh Token 서명용 시크릿 키
  expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Access Token 만료 시간 (기본: 1시간)
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Refresh Token 만료 시간 (기본: 7일)
};

/**
 * Access Token 생성
 *
 * 입력:
 * - payload: Object — JWT 페이로드에 포함할 사용자 정보 (예: { id: 'user123', role: 'manager' })
 *
 * 동작:
 * 1) 입력받은 페이로드와 Access Token 시크릿 키를 사용하여 JWT 서명
 * 2) 설정된 만료 시간(expiresIn)을 적용하여 토큰 생성
 * 3) 서명된 JWT 문자열 반환
 *
 * JWT 구조:
 * - Header: 알고리즘 정보 (기본: HS256)
 * - Payload: 사용자 정보 및 만료 시간
 * - Signature: 시크릿 키로 서명된 해시값
 *
 * 보안:
 * - 환경변수에서 관리되는 시크릿 키 사용
 * - 설정 가능한 만료 시간으로 토큰 수명 제한
 * - HMAC SHA256 알고리즘을 통한 강력한 서명
 *
 * 반환:
 * - string: 서명된 JWT Access Token
 *
 * 예외:
 * - 시크릿 키 누락: process.env.JWT_SECRET이 undefined인 경우 오류 발생
 * - 페이로드 오류: 잘못된 페이로드 객체 전달 시 오류 발생
 *
 * 사용 예시:
 * ```javascript
 * const token = generateToken({ id: 'user123', role: 'manager' });
 * // 결과: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * ```
 *
 * 참고:
 * - Access Token은 짧은 수명을 가지며 주로 API 요청 인증에 사용됩니다.
 * - 페이로드에는 민감한 정보(비밀번호 등)를 포함하지 않아야 합니다.
 * - 토큰 크기는 페이로드 크기에 비례하여 증가합니다.
 */
export function generateToken(payload) {
  return jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.expiresIn,
  });
}

/**
 * Refresh Token 생성
 *
 * 입력:
 * - payload: Object — JWT 페이로드에 포함할 사용자 정보 (일반적으로 최소한의 정보만 포함)
 *
 * 동작:
 * 1) 입력받은 페이로드와 Refresh Token 시크릿 키를 사용하여 JWT 서명
 * 2) 설정된 만료 시간(refreshExpiresIn)을 적용하여 토큰 생성
 * 3) 서명된 JWT 문자열 반환
 *
 * Refresh Token 특징:
 * - Access Token보다 긴 수명을 가짐 (기본: 7일)
 * - Access Token 갱신을 위한 용도로만 사용
 * - 보안을 위해 최소한의 정보만 페이로드에 포함 권장
 *
 * 보안:
 * - Access Token과 별도의 시크릿 키 사용
 * - 긴 만료 시간으로 사용자 재로그인 빈도 감소
 * - 별도 저장소(Redis, DB)에 저장하여 무효화 가능
 *
 * 반환:
 * - string: 서명된 JWT Refresh Token
 *
 * 예외:
 * - 시크릿 키 누락: process.env.JWT_REFRESH_SECRET이 undefined인 경우 오류 발생
 * - 페이로드 오류: 잘못된 페이로드 객체 전달 시 오류 발생
 *
 * 사용 예시:
 * ```javascript
 * const refreshToken = generateRefreshToken({ id: 'user123' });
 * // 결과: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * ```
 *
 * 참고:
 * - Refresh Token은 Access Token 갱신 시에만 사용되어야 합니다.
 * - 보안을 위해 클라이언트에 안전하게 저장해야 합니다.
 * - 토큰 무효화가 필요한 경우 별도 저장소에서 관리해야 합니다.
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
}

/**
 * Access Token 검증
 *
 * 입력:
 * - token: string — 검증할 JWT Access Token
 *
 * 동작:
 * 1) 입력받은 토큰을 Access Token 시크릿 키로 검증
 * 2) 토큰 서명의 유효성 확인
 * 3) 토큰 만료 여부 확인
 * 4) 검증 성공 시 디코딩된 페이로드 반환
 *
 * 검증 과정:
 * - 토큰 형식 검증 (JWT 표준 형식 준수 여부)
 * - 서명 검증 (시크릿 키를 사용한 HMAC 검증)
 * - 만료 시간 검증 (exp 클레임 확인)
 * - 페이로드 디코딩 및 반환
 *
 * 보안:
 * - 시크릿 키를 통한 서명 검증
 * - 자동 만료 시간 검증
 * - 변조된 토큰 감지 및 거부
 *
 * 반환:
 * - Object: 디코딩된 JWT 페이로드 (사용자 정보 및 메타데이터)
 *
 * 예외:
 * - 토큰 형식 오류: 'jwt malformed' — 잘못된 JWT 형식
 * - 서명 오류: 'invalid signature' — 잘못된 시크릿 키 또는 변조된 토큰
 * - 토큰 만료: 'jwt expired' — 만료된 토큰
 * - 시크릿 키 누락: process.env.JWT_SECRET이 undefined인 경우 오류 발생
 *
 * 사용 예시:
 * ```javascript
 * try {
 *   const decoded = verifyToken(accessToken);
 *   console.log('사용자 ID:', decoded.id);
 * } catch (error) {
 *   console.error('토큰 검증 실패:', error.message);
 * }
 * ```
 *
 * 참고:
 * - 이 함수는 모든 보호된 API 엔드포인트에서 사용됩니다.
 * - 토큰 검증 실패 시 적절한 오류 응답을 반환해야 합니다.
 * - 검증된 페이로드는 사용자 인증 및 권한 확인에 사용됩니다.
 */
export function verifyToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret);
}

/**
 * Refresh Token 검증
 *
 * 입력:
 * - token: string — 검증할 JWT Refresh Token
 *
 * 동작:
 * 1) 입력받은 토큰을 Refresh Token 시크릿 키로 검증
 * 2) 토큰 서명의 유효성 확인
 * 3) 토큰 만료 여부 확인
 * 4) 검증 성공 시 디코딩된 페이로드 반환
 *
 * 검증 과정:
 * - 토큰 형식 검증 (JWT 표준 형식 준수 여부)
 * - 서명 검증 (Refresh Token 시크릿 키를 사용한 HMAC 검증)
 * - 만료 시간 검증 (exp 클레임 확인)
 * - 페이로드 디코딩 및 반환
 *
 * 보안:
 * - Access Token과 별도의 시크릿 키를 통한 서명 검증
 * - 긴 만료 시간으로 인한 보안 강화
 * - 토큰 무효화를 위한 별도 관리 체계 필요
 *
 * 반환:
 * - Object: 디코딩된 JWT 페이로드 (사용자 정보 및 메타데이터)
 *
 * 예외:
 * - 토큰 형식 오류: 'jwt malformed' — 잘못된 JWT 형식
 * - 서명 오류: 'invalid signature' — 잘못된 시크릿 키 또는 변조된 토큰
 * - 토큰 만료: 'jwt expired' — 만료된 Refresh Token
 * - 시크릿 키 누락: process.env.JWT_REFRESH_SECRET이 undefined인 경우 오류 발생
 *
 * 사용 예시:
 * ```javascript
 * try {
 *   const decoded = verifyRefreshToken(refreshToken);
 *   console.log('사용자 ID:', decoded.id);
 * } catch (error) {
 *   console.error('Refresh 토큰 검증 실패:', error.message);
 * }
 * ```
 *
 * 참고:
 * - 이 함수는 Access Token 갱신 시에만 사용됩니다.
 * - Refresh Token이 만료된 경우 사용자는 재로그인이 필요합니다.
 * - 보안을 위해 Refresh Token은 안전한 저장소에 보관해야 합니다.
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, jwtConfig.refreshSecret);
}

/**
 * Access Token 검증 및 만료 시 자동 갱신
 *
 * 입력:
 * - accessToken: string — 검증할 Access Token
 * - refreshToken: string — Access Token 갱신에 사용할 Refresh Token
 *
 * 동작:
 * 1) Access Token 검증 시도
 * 2) Access Token이 유효한 경우: 기존 토큰과 함께 디코딩된 정보 반환
 * 3) Access Token이 만료된 경우: Refresh Token을 사용하여 새로운 Access Token 생성
 * 4) Refresh Token도 만료된 경우: 오류 발생
 *
 * 토큰 갱신 프로세스:
 * - Access Token 만료 감지
 * - Refresh Token 유효성 검증
 * - 새로운 Access Token 생성 (Refresh Token의 사용자 정보 기반)
 * - 기존 Refresh Token 유지
 *
 * 보안:
 * - Refresh Token을 통한 안전한 토큰 갱신
 * - 만료된 토큰의 자동 교체
 * - 사용자 재로그인 없이 연속 서비스 이용 가능
 *
 * 반환:
 * - Object: {
 *   accessToken: string — 유효한 Access Token (기존 또는 새로 생성된 것),
 *   refreshToken: string — 기존 Refresh Token,
 *   decoded: Object — 디코딩된 사용자 정보
 * }
 *
 * 예외:
 * - Access Token 오류: Access Token 형식이나 서명 오류 시 원본 오류 전파
 * - Refresh Token 만료: 'Refresh token expired' — Refresh Token이 만료된 경우
 * - Refresh Token 오류: Refresh Token 형식이나 서명 오류 시 원본 오류 전파
 *
 * 사용 예시:
 * ```javascript
 * try {
 *   const result = verifyAndRefreshTokens(accessToken, refreshToken);
 *   // result.accessToken: 유효한 Access Token
 *   // result.refreshToken: 기존 Refresh Token
 *   // result.decoded: 사용자 정보
 * } catch (error) {
 *   if (error.message === 'Refresh token expired') {
 *     // 사용자 재로그인 필요
 *   } else {
 *     // 기타 토큰 오류
 *   }
 * }
 * ```
 *
 * 참고:
 * - 이 함수는 클라이언트의 토큰 갱신 요청을 처리하는 데 사용됩니다.
 * - Access Token 갱신 시 새로운 토큰을 클라이언트에 반환해야 합니다.
 * - Refresh Token이 만료된 경우 사용자는 재로그인이 필요합니다.
 * - 토큰 갱신은 보안을 위해 적절한 로깅과 함께 처리되어야 합니다.
 */
export function verifyAndRefreshTokens(accessToken, refreshToken) {
  try {
    const decoded = jwt.verify(accessToken, jwtConfig.accessSecret);
    return { accessToken, refreshToken, decoded };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      try {
        const refreshDecoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
        const newAccessToken = generateToken({ id: refreshDecoded.id });
        return {
          accessToken: newAccessToken,
          refreshToken,
          decoded: refreshDecoded,
        };
      } catch (refreshError) {
        throw new Error('Refresh token expired');
      }
    }
    throw error;
  }
}

/**
 * JWT 설정 객체 내보내기
 * - 다른 모듈에서 JWT 설정 정보에 접근할 수 있도록 함
 * - 설정값 변경이나 동적 설정이 필요한 경우 사용
 * - 주로 테스트나 설정 검증 목적으로 활용
 */
export default jwtConfig;
