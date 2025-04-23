import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
// __dirname 획득 기본적으로 __dirname을 제공하지 않음 (ES6 기준)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  silly: 5,
};

// 로그 저장 경로
const logDir = process.env.LOG_DIR || 'logs';
const logPath = path.join(process.cwd(), logDir);

// 로그 디렉토리가 없으면 생성
if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true });
}

// 환경에 따른 로그 레벨 설정
const getLevel = () => {
  // 환경 변수에서 로그 레벨 가져오기
  const logLevel = process.env.LOG_LEVEL;
  // 유효한 로그 레벨이 있으면 사용, 없으면 환경에 따라 기본값 사용
  if (logLevel && Object.keys(levels).includes(logLevel)) {
    return logLevel;
  }

  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

// 로그 출력 형식 정의
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);

// 개발 환경용 컬러 로그 형식
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);

// 트랜스포트 설정
const transports = [
  // 콘솔 출력
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'development' ? developmentFormat : format,
  }),
];

// 프로덕션 환경에서는 파일에도 로깅
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // 에러 로그 파일
    new winston.transports.File({
      filename: path.join(logPath, 'error.log'),
      level: 'error',
    }),
    // 전체 로그 파일
    new winston.transports.File({
      filename: path.join(logPath, 'combined.log'),
    }),
  );
}

// 로그 로테이션 트랜스포트 생성
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logPath, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  maxSize: '20m',
});

// 프로덕션 환경에서는 로그 로테이션 사용
if (process.env.NODE_ENV === 'production') {
  transports.push(fileRotateTransport);
}

// 로거 생성
const logger = winston.createLogger({
  level: getLevel(),
  levels,
  format,
  transports,
});

// ES6 export 구문
export default logger;
