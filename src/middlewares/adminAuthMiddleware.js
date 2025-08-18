/**
 * 관리자 인증 미들웨어 (Admin Authentication Middleware)
 * - Express.js 애플리케이션에서 관리자 권한이 필요한 API 엔드포인트에 접근하기 전에 사용자 인증과 권한 검증을 수행하는 미들웨어입니다.
 * - JWT 토큰 검증 및 디코딩, 관리자 권한 확인 (role === 'admin'), 인증된 사용자 정보를 요청 객체에 매핑 등의 기능을 제공합니다.
 * - 보안 강화를 위한 접근 제어를 수행합니다.
 * - JWT 토큰의 유효성 검증, 관리자 역할(role) 검증, 적절한 HTTP 상태 코드 반환, 민감한 오류 정보 노출 방지 등의 보안 고려사항을 포함합니다.
 */

import jwt from 'jsonwebtoken';

/**
 * 관리자 인증 미들웨어 함수
 *
 * 입력:
 * - req: Object — Express.js 요청 객체
 *   - req.headers.authorization: string — Authorization 헤더 (Bearer 토큰 포함)
 * - res: Object — Express.js 응답 객체
 * - next: Function — 다음 미들웨어/라우트 핸들러로 제어를 전달하는 함수
 *
 * 동작:
 * 1) Authorization 헤더 확인
 * 2) JWT 토큰 추출 및 검증
 * 3) 관리자 역할(role) 확인
 * 4) 사용자 정보를 요청 객체에 매핑
 * 5) 다음 단계로 제어 전달
 * 6) 오류 발생 시 적절한 HTTP 상태 코드와 함께 응답 반환
 *
 * 인증 프로세스:
 * - 1단계: Authorization 헤더 확인 및 토큰 존재 여부 검증
 * - 2단계: JWT 토큰 추출 및 JWT_SECRET 환경변수를 사용한 서명 검증
 * - 3단계: 디코딩된 토큰에서 role 필드를 확인하여 'admin'인지 검증
 * - 4단계: 인증이 성공한 경우 디코딩된 토큰 정보를 req.user 객체에 매핑
 * - 5단계: 인증이 성공적으로 완료되었으므로 다음 미들웨어나 라우트 핸들러 실행
 *
 * 보안 검증:
 * - Authorization 헤더 존재 여부 확인
 * - JWT 토큰 형식 및 서명 검증
 * - 관리자 역할(role === 'admin') 검증
 * - 토큰 만료, 서명 무효, 형식 오류 등에 대한 처리
 *
 * 반환:
 * - void: 인증 성공 시 next() 호출, 실패 시 응답 반환
 *
 * 오류 처리:
 * - 401 Unauthorized: 토큰이 없거나 유효하지 않은 경우
 * - 403 Forbidden: 관리자 권한이 없는 경우
 *
 * 참고:
 * - 이 함수는 HTTP 요청의 Authorization 헤더에서 JWT 토큰을 추출하고, 토큰의 유효성을 검증한 후 관리자 권한을 확인합니다.
 * - 인증이 성공하면 요청 객체(req.user)에 사용자 정보를 매핑하고 다음 미들웨어나 라우트 핸들러로 제어를 전달합니다.
 * - 클라이언트가 요청과 함께 JWT 토큰을 전송했는지 확인하며, Authorization 헤더는 "Bearer <token>" 형태로 전송됩니다.
 * - "Bearer " 접두사를 제거하여 실제 토큰 값만 추출하고, JWT_SECRET 환경변수를 사용하여 토큰 서명을 검증합니다.
 * - 디코딩된 토큰에서 role 필드를 확인하여 'admin'인지 검증하고, 관리자가 아닌 사용자의 접근을 차단하여 보안을 강화합니다.
 * - 인증이 성공한 경우 디코딩된 토큰 정보를 req.user 객체에 매핑하여 이후 라우트 핸들러에서 req.user를 통해 사용자 정보에 접근할 수 있도록 합니다.
 * - JWT 검증 실패 시 토큰이 만료되었거나, 서명이 유효하지 않거나, 형식이 잘못된 경우 401 Unauthorized 응답과 함께 구체적인 오류 메시지를 반환합니다.
 */
const adminAuthMiddleware = async (req, res, next) => {
  try {
    // 1단계: Authorization 헤더 확인
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: '인증 토큰이 없습니다.' });
    }

    // 2단계: JWT 토큰 추출 및 검증
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3단계: 관리자 권한 확인
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: '관리자만 접근할 수 있습니다.' });
    }

    // 4단계: 관리자 정보 매핑
    req.user = {
      ...decoded,
      userId: decoded.adminId,
      userType: 'admin',
    };

    // 5단계: 다음 단계로 제어 전달
    next();
  } catch (error) {
    return res.status(401).json({ message: '토큰 인증 실패: ' + error.message });
  }
};

export default adminAuthMiddleware;
