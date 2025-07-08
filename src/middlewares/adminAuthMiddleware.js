import jwt from 'jsonwebtoken';

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: '인증 토큰이 없습니다.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: '관리자만 접근할 수 있습니다.' });
    }

    // 관리자 정보 매핑
    req.user = {
      ...decoded,
      userId: decoded.adminId,
      userType: 'admin',
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: '토큰 인증 실패: ' + error.message });
  }
};

export default adminAuthMiddleware;
