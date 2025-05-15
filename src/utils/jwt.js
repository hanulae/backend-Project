import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const jwtConfig = {
  accessSecret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

// Access Token 생성
export function generateToken(payload) {
  return jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.expiresIn,
  });
}

// Refresh Token 생성
export function generateRefreshToken(payload) {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
}

// Access Token 검증
export function verifyToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret);
}

// Refresh Token 검증
export function verifyRefreshToken(token) {
  return jwt.verify(token, jwtConfig.refreshSecret);
}

// Access 만료 시 Refresh로 재발급
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

export default jwtConfig;
