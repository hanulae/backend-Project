/**
 * 일반 인증 미들웨어 (General Authentication Middleware)
 * - Express.js 애플리케이션에서 모든 보호된 API 엔드포인트에 접근하기 전에 사용자 인증을 수행하는 범용 미들웨어입니다.
 * - 다양한 사용자 유형(상조팀장, 장례식장 직원, 장례식장, 관리자)을 지원하며, JWT 토큰을 통해 사용자 권한을 검증합니다.
 * - JWT 토큰 검증 및 디코딩, 다중 사용자 유형 지원 및 자동 감지, 사용자 정보를 요청 객체에 매핑 등의 기능을 제공합니다.
 * - 통합된 인증 처리 로직을 통해 보안을 강화합니다.
 * - JWT 토큰의 유효성 검증, 사용자 유형별 권한 구분, 적절한 HTTP 상태 코드 반환, 토큰 정보의 무결성 검증 등의 보안 고려사항을 포함합니다.
 *
 * 지원하는 사용자 유형:
 * - manager: 상조팀장 (managerId 기반)
 * - funeralStaff: 장례식장 직원 (funeralId + funeralStaffId 기반)
 * - funeral: 장례식장 (funeralId 기반)
 * - admin: 관리자 (adminId 기반)
 */

import { verifyToken } from '../utils/jwt.js';

/**
 * 일반 인증 미들웨어 함수
 *
 * 입력:
 * - req: Object — Express.js 요청 객체
 *   - req.headers.authorization: string — Authorization 헤더 (Bearer 토큰 포함)
 * - res: Object — Express.js 응답 객체
 * - next: Function — 다음 미들웨어/라우트 핸들러로 제어를 전달하는 함수
 *
 * 동작:
 * 1) Authorization 헤더에서 JWT 토큰 추출
 * 2) 토큰 유효성 검증
 * 3) 사용자 유형 자동 감지 및 매핑
 * 4) 사용자 정보를 요청 객체에 설정
 * 5) 다음 단계로 제어 전달
 * 6) 오류 발생 시 적절한 HTTP 상태 코드와 함께 응답 반환
 *
 * 인증 프로세스:
 * - 1단계: Authorization 헤더에서 "Bearer <token>" 형태의 토큰을 추출
 * - 2단계: verifyToken 함수를 사용하여 토큰의 유효성 검증 및 페이로드 추출
 * - 3단계: JWT 토큰의 페이로드에 포함된 ID 필드를 기반으로 사용자 유형을 판단
 * - 4단계: 유효하지 않은 토큰 정보 처리 및 오류 응답
 * - 5단계: 디코딩된 토큰의 모든 정보와 함께 매핑된 userId, userType을 포함하여 요청 객체에 매핑
 * - 6단계: 인증이 성공적으로 완료되었으므로 다음 미들웨어나 라우트 핸들러 실행
 *
 * 사용자 유형 감지:
 * - manager: managerId 필드가 존재하는 경우 (상조팀장)
 * - funeralStaff: funeralId와 funeralStaffId가 모두 존재하는 경우 (장례식장 직원)
 * - funeral: funeralId만 존재하는 경우 (장례식장)
 * - admin: adminId 필드가 존재하는 경우 (관리자)
 *
 * 반환:
 * - void: 인증 성공 시 next() 호출, 실패 시 응답 반환
 *
 * 오류 처리:
 * - 401 Unauthorized: 토큰이 없거나 유효하지 않은 경우
 *
 * 참고:
 * - 이 함수는 HTTP 요청의 Authorization 헤더에서 JWT 토큰을 추출하고, 토큰의 유효성을 검증한 후 사용자 유형을 자동으로 감지합니다.
 * - 인증이 성공하면 요청 객체(req.user)에 사용자 정보를 매핑하고 다음 미들웨어나 라우트 핸들러로 제어를 전달합니다.
 * - optional chaining(?.)을 사용하여 헤더가 없는 경우 안전하게 처리합니다.
 * - 토큰이 없는 경우 즉시 401 Unauthorized 응답을 반환합니다.
 * - verifyToken 함수를 사용하여 토큰의 유효성을 검증하고 페이로드를 추출합니다.
 * - JWT 토큰의 페이로드에 포함된 ID 필드를 기반으로 사용자 유형을 판단합니다.
 * - 상조팀장은 장례 서비스를 제공하는 업체의 담당자입니다.
 * - 장례식장 직원은 장례식장에서 근무하는 개별 직원을 의미합니다.
 * - 장례식장은 장례식장 자체를 의미하며 직원이 아닌 장례식장 관리자입니다.
 * - 관리자는 시스템 전체를 관리하는 최고 권한자입니다.
 * - 위의 모든 조건에 해당하지 않는 경우 토큰에 유효한 사용자 정보가 없음을 의미합니다.
 * - 디코딩된 토큰의 모든 정보와 함께 매핑된 userId, userType을 포함하여 이후 라우트 핸들러에서 req.user를 통해 사용자 정보에 접근할 수 있도록 합니다.
 * - JWT 검증 실패 시 토큰이 만료되었거나, 서명이 유효하지 않거나, 형식이 잘못된 경우 401 Unauthorized 응답과 함께 일반적인 오류 메시지를 반환합니다.
 * - 보안을 위해 구체적인 오류 내용은 노출하지 않습니다.
 */
export default function authMiddleware(req, res, next) {
  // 1단계: JWT 토큰 추출
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: '토큰이 필요합니다.' });

  try {
    // 2단계: JWT 토큰 검증 및 디코딩
    const decoded = verifyToken(token);

    // 3단계: 사용자 유형 자동 감지 및 매핑
    let userId, userType;

    if (decoded.managerId) {
      userId = decoded.managerId;
      userType = 'manager';
    } else if (decoded.funeralId && decoded.funeralStaffId) {
      userId = decoded.funeralStaffId;
      userType = 'funeralStaff';
    } else if (decoded.funeralId) {
      userId = decoded.funeralId;
      userType = 'funeral';
    } else if (decoded.adminId) {
      userId = decoded.adminId;
      userType = 'admin';
    } else {
      // 4단계: 유효하지 않은 토큰 정보 처리
      return res.status(401).json({ message: '유효하지 않은 토큰 정보입니다.' });
    }

    // 5단계: 사용자 정보를 요청 객체에 매핑
    req.user = {
      ...decoded,
      userId,
      userType,
    };

    // 6단계: 다음 단계로 제어 전달
    next();
  } catch (err) {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}
