// 메모리 기반 저장소 (임시)
const codeStore = new Map();
const CODE_EXPIRATION_MINUTES = 5;

// 코드 저장
export const storeVerificationCode = (email, code) => {
  const expiresAt = Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000;
  codeStore.set(email, { code, expiresAt });
};

// 코드 검증
export const verifyCode = (email, inputCode) => {
  const data = codeStore.get(email);
  if (!data) return false;

  const now = Date.now();
  const isValid = data.code === inputCode && now < data.expiresAt;

  if (isValid) {
    codeStore.delete(email); // 사용 후 제거
  }

  return isValid;
};
