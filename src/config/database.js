import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE_ENV = process.env.NODE_ENV;

dotenv.config({
  path: path.join(__dirname, `../../.env.${NODE_ENV}`),
});

// 환경 변수에서 데이터베이스 설정 가져오기
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? (msg) => logger.info(msg) : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl:
      NODE_ENV === 'production'
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
  },
});

/**
 * 데이터베이스 연결을 설정하고 테스트 합니다.
 * @returns {Promise<Sequelize>}
 * @throws {Error} 데이터베이스 연결 실패 시 예외 발생
 */
export async function connectToDatabase() {
  try {
    // 연결 테스트
    await sequelize.authenticate();
    logger.info('데이터베이스 연결 성공');

    // 개발 환경에서는 모델 동기화
    if (NODE_ENV === 'development') {
      // force: true는 모든 테이블을 지우고 재생성합니다 유의해주세요 (데이터 손실됨)
      // alter: true는 테이블 구조만 변경합니다.
      await sequelize.sync({ alter: true });
      logger.info('데이터베이스 모델 동기화 완료');
    }

    return sequelize;
  } catch (error) {
    logger.error('데이터베이스 연결 실패: ', error);
    throw error;
  }
}

export { sequelize };
