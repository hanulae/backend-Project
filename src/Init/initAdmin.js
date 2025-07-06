import db from '../models/index.js';

export const createDefaultAdmin = async () => {
  const adminEmail = 'admin@hanulae.com';
  const adminPassword = 'Admin1234!'; // 운영 시 .env 사용 권장

  try {
    const exists = await db.Admin.findOne({ where: { adminEmail } });
    if (!exists) {
      await db.Admin.create({
        adminEmail,
        adminPassword, // ⚠️ 해싱하지 않은 평문 비밀번호
        adminName: '슈퍼관리자',
        role: 'admin',
      });
      return `✅ 관리자 계정 생성 완료: ${adminEmail}`;
    } else {
      throw new Error('ℹ️ 이미 관리자 계정이 존재합니다.');
    }
  } catch (error) {
    console.error('🔴 관리자 계정 생성 실패:', error.message);
  }
};
