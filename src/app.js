import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

// 라우트 임포트
import apiRoutes from './routes/index.js';

// Express 앱 초기화
const app = express();

// 기본 미들웨어 설정
app.use(
  cors({
    origin: 'http://10.0.2.2:8081',
    credentials: true,
  }),
);
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API 라우트 설정
app.use('/api', apiRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'API가 정상적으로 실행 중입니다.' });
});

// 404 처리 미들웨어
app.use((err, req, res, _next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || '서버 오류가 발생했습니다.',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
});

export default app;
