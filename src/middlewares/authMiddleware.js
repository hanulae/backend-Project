import { verifyToken } from '../utils/jwt.js';

export default function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '토큰이 필요합니다.' });

  try {
    const decoded = verifyToken(token);

    // JWT 토큰에서 사용자 정보 추출 및 매핑
    let userId, userType;

    if (decoded.managerId) {
      // 상조팀장
      userId = decoded.managerId;
      userType = 'manager';
    } else if (decoded.funeralId && decoded.funeralStaffId) {
      // 장례식장 직원
      userId = decoded.funeralStaffId;
      userType = 'funeralStaff';
    } else if (decoded.funeralId) {
      // 장례식장
      userId = decoded.funeralId;
      userType = 'funeral';
    } else if (decoded.adminId) {
      // 관리자
      userId = decoded.adminId;
      userType = 'admin';
    } else {
      return res.status(401).json({ message: '유효하지 않은 토큰 정보입니다.' });
    }

    // 기존 정보와 매핑된 정보 모두 포함
    req.user = {
      ...decoded,
      userId,
      userType,
    };

    next();
  } catch (err) {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}
