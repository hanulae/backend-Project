import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase 서비스 계정 키 파일 경로 (환경변수 우선 사용)
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : path.join(__dirname, '../../config/firebase-service-account.json');

// Firebase Admin SDK 초기화
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    logger.info('Firebase Admin SDK 초기화 완료');
  } catch (error) {
    logger.error('Firebase Admin SDK 초기화 실패', error);
    throw error;
  }
}

export default admin;
