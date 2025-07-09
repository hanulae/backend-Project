import app from './app.js';
import { connectToDatabase } from './config/database.js';
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
import EnvValidator from './middleware/envValidator.js';
import logger from './config/logger.js';
import { createDefaultAdmin } from './Init/initAdmin.js';

//dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    logger.info('서버 시작 중...');
    // 환경변수 검증
    EnvValidator.validateTransactionEnvs();

    // db 연결
    await connectToDatabase();
    await createDefaultAdmin(); // 관리자 계정 생성

    // 서버 시작
    const server = app.listen(PORT, HOST, () => {
      logger.info(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });

    // 정상적이지 않은 종료 처리
    process.on('unhandledRejection', (reason, _promise) => {
      logger.error('처리되지 않은 Promise 거부: ', reason);
    });

    // 정상적인 종료 처리
    process.on('SIGINT', () => {
      logger.info('서버 종료 중...');
      server.close(() => {
        logger.info('서버가 정상적으로 종료되었습니다.');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('서버 시작 실패: ', error);
    process.exit(1);
  }
}

startServer();
