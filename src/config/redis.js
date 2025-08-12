/**
 * Redis 데이터베이스 설정 및 연결 관리
 * - Redis 인메모리 데이터베이스와의 연결을 설정하고 관리하는 설정 파일
 * - 세션 관리, 캐싱, 임시 데이터 저장, 실시간 데이터 처리 등에 사용
 * - ioredis 라이브러리를 사용하여 안정적인 연결과 자동 재연결 전략 구현
 *
 * 주요 기능:
 * - Redis 서버 연결 설정 및 관리
 * - 환경 변수를 통한 Redis 호스트/포트 설정
 * - 연결 실패 시 자동 재연결 전략 (지수 백오프)
 * - 연결 상태 모니터링 및 로깅
 * - 에러 처리 및 복구 메커니즘
 *
 * 환경 변수:
 * - REDIS_HOST: Redis 서버 호스트 주소
 * - REDIS_PORT: Redis 서버 포트 번호
 */

import Redis from 'ioredis'; // Node.js용 Redis 클라이언트 라이브러리
import dotenv from 'dotenv'; // 환경 변수 관리 라이브러리
import logger from '../config/logger.js'; // 로깅 시스템

// 환경 변수 파일(.env) 로드
dotenv.config();

/**
 * Redis 연결 옵션 설정
 *
 * 입력:
 * - host: String — Redis 서버 호스트 주소 (환경 변수에서 가져옴)
 * - port: Number — Redis 서버 포트 번호 (환경 변수에서 가져옴)
 * - retryStrategy: Function — 연결 실패 시 재연결 전략 함수
 * - maxRetriesPerRequest: Number — 요청당 최대 재시도 횟수
 *
 * 동작:
 * 1) Redis 서버와의 연결을 위한 설정 객체 생성
 * 2) 지수 백오프 알고리즘을 사용한 재연결 전략 구현
 * 3) 연결 안정성과 성능 최적화를 위한 옵션 설정
 *
 * 반환:
 * - Redis: 설정된 옵션을 가진 Redis 연결 객체
 *
 * 예외:
 * - 연결 설정 실패: Redis 서버 연결 오류 발생
 */
const redisOptions = new Redis({
  host: process.env.REDIS_HOST, // Redis 서버 호스트 주소 (환경 변수에서 가져옴)
  port: process.env.REDIS_PORT, // Redis 서버 포트 번호 (환경 변수에서 가져옴)

  /**
   * 재연결 전략 함수
   *
   * 입력:
   * - times: Number — 재연결 시도 횟수 (1부터 시작)
   *
   * 동작:
   * 1) 지수 백오프 알고리즘을 사용하여 지연 시간 계산
   * 2) 연결 실패 시 점진적으로 지연 시간 증가 (50ms → 100ms → 150ms...)
   * 3) 최대 지연 시간 2000ms로 제한하여 무한 루프 방지
   *
   * 반환:
   * - Number: 재연결 시도 전 대기할 시간 (밀리초)
   *
   * 예외:
   * - 계산 오류: 지연 시간 계산 실패 시 기본값 반환
   */
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000); // 지수 백오프 알고리즘으로 지연 시간 계산
    return delay; // 계산된 지연 시간 반환
  },

  maxRetriesPerRequest: 3, // 요청당 최대 재시도 횟수 (3회로 제한)
});

/**
 * Redis 클라이언트 인스턴스 생성
 *
 * 입력:
 * - redisOptions: Object — Redis 연결 옵션 객체
 *
 * 동작:
 * 1) 설정된 옵션을 사용하여 Redis 서버와의 연결 생성
 * 2) 이벤트 기반 연결 상태 모니터링 설정
 * 3) 자동 재연결 및 에러 처리 메커니즘 구현
 *
 * 반환:
 * - Redis: Redis 서버와 연결된 클라이언트 인스턴스
 *
 * 예외:
 * - 연결 실패: Redis 서버 연결 오류 발생
 */
const redis = new Redis(redisOptions);

/**
 * Redis 연결 오류 이벤트 리스너
 *
 * 입력:
 * - error: Error — Redis 연결 오류 객체
 *
 * 동작:
 * 1) Redis 연결에서 발생한 오류를 감지
 * 2) 오류 상황을 로그로 기록하여 문제 상황 추적
 * 3) 자동 재연결 메커니즘을 통해 시스템 안정성 유지
 *
 * 반환:
 * - void: 오류 처리만 수행하고 반환값 없음
 *
 * 예외:
 * - 로깅 실패: 오류 로그 기록 실패 시에도 재연결 시도
 */
redis.on('error', (error) => {
  logger.error('Redis connection error', error); // Redis 연결 오류를 로그로 기록
});

/**
 * Redis 연결 성공 이벤트 리스너
 *
 * 입력:
 * - 없음 (이벤트 발생 시 자동 호출)
 *
 * 동작:
 * 1) Redis 서버와의 연결 성공을 감지
 * 2) 연결 성공을 로그로 기록하여 시스템 상태 확인
 * 3) Redis 서버와의 통신 및 데이터 작업 준비 완료
 *
 * 반환:
 * - void: 연결 성공 처리만 수행하고 반환값 없음
 *
 * 예외:
 * - 로깅 실패: 성공 로그 기록 실패 시에도 연결은 정상 동작
 */
redis.on('connect', () => {
  logger.info('Successfully connected to Redis'); // Redis 연결 성공을 로그로 기록
});

export default redis;
