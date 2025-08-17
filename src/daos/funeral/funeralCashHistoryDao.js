/**
 * 장례식장 캐시 히스토리 관리 DAO (Data Access Object)
 * - 장례식장의 캐시 거래 내역을 생성하고 관리하는 데이터베이스 작업을 담당합니다.
 * - 캐시 충전, 사용, 환급 등 모든 금융 거래의 상세한 이력을 기록합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 트랜잭션 지원을 통해 데이터 일관성을 보장합니다.
 * - 이모지를 사용하여 로그 메시지를 시각적으로 구분하여 디버깅을 용이하게 합니다.
 * - 캐시 거래의 투명성과 추적 가능성을 제공합니다.
 */
import db from '../../models/index.js';

/**
 * 캐시 히스토리 생성 (기본)
 *
 * 입력:
 * - cashData: Object — 생성할 캐시 히스토리 정보 객체
 *   - funeralId: string — 장례식장 ID
 *   - transactionType: string — 거래 유형
 *   - funeralCashAmount: number — 거래 금액
 *   - funeralCashBalanceAfter: number — 거래 후 잔액
 *   - 기타 필요한 필드들
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) 입력받은 캐시 데이터로 새로운 히스토리 레코드 생성
 * 2) 트랜잭션 옵션을 포함하여 데이터 일관성 보장
 * 3) 오류 발생 시 이모지와 함께 상세한 오류 메시지 전달
 *
 * 생성 정보:
 * - 캐시 거래 기본 정보 (장례식장 ID, 거래 유형, 금액, 잔액)
 * - 자동 생성: ID, createdAt, updatedAt
 * - 기타 메타데이터 (거래 시간, 상태 등)
 *
 * 반환:
 * - Object: 생성된 캐시 히스토리 정보
 *
 * 예외:
 * - DB 생성 실패: '⚠️ 캐시 히스토리 생성 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 기본적인 캐시 히스토리 생성을 위해 사용됩니다.
 * - ⚠️ 이모지를 통해 캐시 히스토리 관련 오류를 시각적으로 구분할 수 있습니다.
 * - 트랜잭션 옵션을 통해 데이터 일관성을 보장할 수 있습니다.
 * - 모든 캐시 관련 거래의 이력을 체계적으로 기록합니다.
 * - 거래 추적과 감사를 위한 필수적인 기능입니다.
 */
export const create = async (cashData, options = {}) => {
  try {
    const result = await db.FuneralCashHistory.create(cashData, options);
    return result;
  } catch (error) {
    throw new Error('⚠️ 캐시 히스토리 생성 오류:' + error.message);
  }
};

/**
 * 장례식장 캐시 히스토리 생성 (확장)
 *
 * 입력:
 * - cashHistoryData: Object — 생성할 캐시 히스토리 기본 정보
 *   - funeralId: string — 장례식장 ID
 *   - funeralCashAmount: number — 거래 금액
 *   - funeralCashBalanceAfter: number — 거래 후 잔액
 *   - 기타 필요한 필드들
 * - transactionType: string — 거래 유형 (예: 'charge', 'use', 'refund')
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) 기본 캐시 히스토리 데이터에 거래 유형과 상태 정보 추가
 * 2) 상태가 제공되지 않은 경우 'pending'으로 기본 설정
 * 3) 트랜잭션 옵션을 포함하여 데이터 일관성 보장
 * 4) 오류 발생 시 상세한 로그와 함께 원본 오류 전파
 *
 * 생성 정보:
 * - 기본 캐시 거래 정보
 * - transactionType: 명시적으로 지정된 거래 유형
 * - status: 'pending' (기본값) 또는 지정된 상태
 * - 자동 생성: ID, createdAt, updatedAt
 *
 * 반환:
 * - Object: 생성된 캐시 히스토리 정보
 *
 * 예외:
 * - DB 생성 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 * - 로그: '캐시 히스토리 생성 오류: {오류메시지}' 형태로 콘솔 출력
 *

 *
 * 참고:
 * - 이 함수는 거래 유형을 명시적으로 지정하여 캐시 히스토리를 생성할 때 사용됩니다.
 * - create 함수보다 더 구조화된 방식으로 캐시 히스토리를 생성합니다.
 * - 상태 정보를 자동으로 설정하여 데이터 일관성을 보장합니다.
 * - 트랜잭션 옵션을 통해 데이터 일관성을 보장할 수 있습니다.
 * - 거래 유형별로 체계적인 캐시 히스토리 관리가 가능합니다.
 * - 로그를 통해 오류 발생 시 디버깅이 용이합니다.
 */
export const createFuneralCashHistory = async (cashHistoryData, transactionType, options = {}) => {
  try {
    return await db.FuneralCashHistory.create(
      {
        ...cashHistoryData,
        transactionType,
        status: cashHistoryData.status || 'pending',
      },
      { ...options },
    );
  } catch (error) {
    console.error('캐시 히스토리 생성 오류:', error.message);
    throw error;
  }
};

/**
 * 캐시 히스토리 상태 업데이트
 *
 * 입력:
 * - whereCondition: Object — 업데이트할 레코드를 식별하는 조건
 *   - funeralId: string — 장례식장 ID
 *   - transactionType: string — 거래 유형
 *   - status: string — 현재 상태
 *   - 기타 식별 조건들
 * - status: string — 업데이트할 새로운 상태값
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) whereCondition에 맞는 캐시 히스토리 레코드의 상태를 새로운 상태로 업데이트
 * 2) 트랜잭션 옵션을 포함하여 데이터 일관성 보장
 * 3) 오류 발생 시 원본 오류를 그대로 전파
 *
 * 조회 조건:
 * - whereCondition: 입력받은 조건과 정확히 일치
 *
 * 반환:
 * - Array: Sequelize update 결과 배열 [업데이트된 행 수]
 *
 * 예외:
 * - DB 업데이트 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 캐시 히스토리의 상태를 변경할 때 사용됩니다.
 * - whereCondition을 통해 업데이트할 레코드를 정확히 식별합니다.
 * - 트랜잭션 옵션을 통해 데이터 일관성을 보장할 수 있습니다.
 * - 반환값의 첫 번째 요소는 업데이트된 행의 수를 나타냅니다.
 * - 상태 변경 시 updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 * - 환급 요청의 승인/거절, 거래 완료 등의 상태 변경에 활용됩니다.
 * - 조건을 정확히 지정하여 원하는 레코드만 업데이트할 수 있습니다.
 * - 유연한 조건 설정을 통해 다양한 업데이트 시나리오를 지원합니다.
 */
export const updateFuneralCashHistoryStatus = async (whereCondition, status, options = {}) => {
  const result = await db.FuneralCashHistory.update(
    { status },
    {
      where: whereCondition,
      ...options,
    },
  );

  return result;
};
