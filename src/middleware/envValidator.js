import dotenv from 'dotenv';
import logger from '../config/logger.js';

dotenv.config();

/**
 * 환경변수 검증 유틸리티
 */
class EnvValidator {
  static validateTransactionEnvs() {
    const requiredEnvs = ['TOTAL_AMOUNT', 'AMOUNT_OF_CASH_MANAGER'];

    const missingEnvs = [];
    const invalidEnvs = [];

    for (const envName of requiredEnvs) {
      const value = process.env[envName];

      if (!value) {
        missingEnvs.push(envName);
      } else if (isNaN(parseInt(value)) || parseInt(value) <= 0) {
        invalidEnvs.push(`${envName}=${value} (숫자가 아니거나 0 이하)`);
      }
    }

    if (missingEnvs.length > 0 || invalidEnvs.length > 0) {
      const errorMessages = [];

      if (missingEnvs.length > 0) {
        errorMessages.push(`누락된 환경변수: ${missingEnvs.join(', ')}`);
      }

      if (invalidEnvs.length > 0) {
        errorMessages.push(`잘못된 환경변수: ${invalidEnvs.join(', ')}`);
      }

      throw new Error(`환경변수 검증 실패: ${errorMessages.join(' / ')}`);
    }

    // 검증 성공시 로그
    logger.info('✅ 거래 관련 환경변수 검증 완료', {
      TOTAL_AMOUNT: process.env.TOTAL_AMOUNT,
      AMOUNT_OF_CASH_MANAGER: process.env.AMOUNT_OF_CASH_MANAGER,
    });
  }

  static validateAllEnvs() {
    // 필요에 따라 다른 환경변수 검증도 추가 가능
    this.validateTransactionEnvs();
  }
}

export default EnvValidator;
