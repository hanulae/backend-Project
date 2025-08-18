/**
 * 장례식장 캐시 관리 DAO (Data Access Object)
 * - 장례식장의 캐시 잔액 관리, 거래 내역 기록, 환급 요청 처리 등의 데이터베이스 작업을 담당합니다.
 * - 캐시 충전, 사용, 환급 등 모든 금융 거래의 이력을 추적하고 관리합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 트랜잭션 상태 관리(pending, approved, rejected)를 통해 환급 요청의 생명주기를 추적합니다.
 * - 이모지를 사용하여 로그 메시지를 시각적으로 구분하여 디버깅을 용이하게 합니다.
 * - 캐시 히스토리를 통해 장례식장의 재정적 활동을 투명하게 기록합니다.
 */
import db from '../../models/index.js';

/**
 * 장례식장 단건 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) funeralId로 특정 장례식장 조회
 * 2) findByPk를 사용하여 기본 키 기반 빠른 조회
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Object: 장례식장 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '장례식장 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 장례식장의 기본 정보와 함께 현재 캐시 잔액을 확인할 때 사용됩니다.
 * - findByPk를 사용하여 빠른 조회 성능을 제공합니다.
 * - 반환값이 null인 경우 해당 ID의 장례식장이 존재하지 않음을 의미합니다.
 * - 캐시 관리나 장례식장 정보 확인에 활용됩니다.
 * - 장례식장의 모든 정보에 접근할 수 있어 종합적인 관리에 활용됩니다.
 */
export const findFuneralById = async (funeralId) => {
  try {
    return await db.Funeral.findByPk(funeralId);
  } catch (error) {
    throw new Error('장례식장 조회 오류: ' + error.message);
  }
};

/**
 * 장례식장 캐시 업데이트
 *
 * 입력:
 * - funeralId: string — 캐시를 업데이트할 장례식장의 고유 ID
 * - newBalance: number — 새로운 캐시 잔액
 *
 * 동작:
 * 1) funeralId로 특정 장례식장의 캐시 잔액을 새로운 값으로 업데이트
 * 2) 기본 update 옵션 사용
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Array: Sequelize update 결과 배열 [업데이트된 행 수]
 *
 * 예외:
 * - DB 업데이트 실패: '장례식장 캐시 업데이트 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 장례식장의 캐시 잔액을 변경할 때 사용됩니다.
 * - 반환값의 첫 번째 요소는 업데이트된 행의 수를 나타냅니다.
 * - 캐시 충전, 사용, 환급 등 모든 캐시 관련 거래에 활용됩니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 * - 캐시 잔액은 음수가 될 수 없도록 비즈니스 로직에서 검증해야 합니다.
 */
export const updateFuneralCash = async (funeralId, newBalance) => {
  try {
    return await db.Funeral.update({ funeralCash: newBalance }, { where: { funeralId } });
  } catch (error) {
    throw new Error('장례식장 캐시 업데이트 오류: ' + error.message);
  }
};

/**
 * 장례식장 캐시 히스토리 생성
 *
 * 입력:
 * - funeralId: string — 캐시 거래를 수행한 장례식장의 고유 ID
 * - transactionType: string — 거래 유형 (예: 'charge', 'use', 'refund', 'withdrawal')
 * - funeralCashAmount: number — 거래 금액 (양수: 충전/적립, 음수: 사용/차감)
 * - funeralCashBalanceAfter: number — 거래 후 잔액
 * - funeralListId: string — 관련 장례식 목록 ID (선택사항, 기본값: null)
 * - managerFormBidId: string — 관련 상조팀장 견적 ID (선택사항, 기본값: null)
 * - bankTransactionId: string — 은행 거래 ID (선택사항, 기본값: null)
 * - status: string — 거래 상태 (기본값: 'pending')
 *
 * 동작:
 * 1) 입력받은 정보로 새로운 캐시 히스토리 레코드 생성
 * 2) transactionDate를 현재 시간으로 자동 설정
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 생성 정보:
 * - 거래 기본 정보 (장례식장 ID, 거래 유형, 금액, 잔액)
 * - 관련 엔티티 ID (장례식 목록, 견적 등)
 * - 거래 시간, 은행 거래 ID, 상태 등 메타데이터
 * - 자동 생성: 히스토리 ID, createdAt, updatedAt
 *
 * 반환:
 * - Object: 생성된 캐시 히스토리 정보
 *
 * 예외:
 * - DB 생성 실패: '장례식장 캐시 히스토리 생성 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 모든 캐시 관련 거래의 이력을 기록할 때 사용됩니다.
 * - 거래 유형에 따라 금액의 부호가 달라집니다 (충전: 양수, 사용: 음수).
 * - 관련 엔티티 ID를 통해 거래의 맥락을 추적할 수 있습니다.
 * - 상태 필드를 통해 거래의 진행 상황을 관리할 수 있습니다.
 * - 은행 거래 ID를 통해 외부 결제 시스템과의 연동을 추적할 수 있습니다.
 * - 거래 시간은 자동으로 현재 시간으로 설정되어 정확한 시점을 기록합니다.
 */
export const createCashHistory = async ({
  funeralId,
  transactionType,
  funeralCashAmount,
  funeralCashBalanceAfter,
  funeralListId = null,
  managerFormBidId = null,
  bankTransactionId = null,
  status = 'pending',
}) => {
  try {
    return await db.FuneralCashHistory.create({
      funeralId,
      transactionType,
      funeralCashAmount,
      funeralCashBalanceAfter,
      funeralListId,
      managerFormBidId,
      transactionDate: new Date(),
      bankTransactionId,
      status,
    });
  } catch (error) {
    throw new Error('장례식장 캐시 히스토리 생성 오류: ' + error.message);
  }
};

/**
 * 장례식장 캐시 히스토리 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) funeralId로 특정 장례식장의 모든 캐시 히스토리 조회
 * 2) 생성일 기준 내림차순 정렬 (최신 거래 순)
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 정렬:
 * - createdAt DESC (최신 거래 순)
 *
 * 반환:
 * - Array<Object>: 해당 장례식장의 모든 캐시 히스토리 배열
 *
 * 예외:
 * - DB 조회 실패: '장례식장 캐시 내역 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 장례식장의 캐시 거래 내역을 확인할 때 사용됩니다.
 * - 최신 거래가 먼저 표시되어 최근 활동을 우선적으로 확인할 수 있습니다.
 * - 반환값이 빈 배열인 경우 해당 장례식장의 캐시 거래 내역이 없음을 의미합니다.
 * - 거래 유형, 금액, 상태 등을 통해 캐시 사용 패턴을 분석할 수 있습니다.
 * - 장례식장의 재정적 활동을 투명하게 추적할 수 있습니다.
 * - 대량의 거래 내역이 있을 경우 페이지네이션이나 필터링 기능을 고려해야 할 수 있습니다.
 */
export const findCashHistoryByFuneralId = async (funeralId) => {
  try {
    return await db.FuneralCashHistory.findAll({
      where: { funeralId },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('장례식장 캐시 내역 조회 오류: ' + error.message);
  }
};

/**
 * 환급 요청 생성 (기본값 상태는 pending)
 *
 * 입력:
 * - data: Object — 생성할 환급 요청 정보 객체
 *   - funeralId: string — 환급을 요청한 장례식장의 고유 ID
 *   - transactionType: string — 거래 유형 (보통 'refund' 또는 'withdrawal')
 *   - funeralCashAmount: number — 환급 요청 금액
 *   - 기타 필요한 필드들
 *
 * 동작:
 * 1) 입력받은 데이터로 새로운 환급 요청 레코드 생성
 * 2) 기본 상태는 'pending'으로 설정
 * 3) 오류 발생 시 이모지와 함께 상세한 오류 메시지 전달
 *
 * 생성 정보:
 * - 환급 요청 기본 정보 (장례식장 ID, 거래 유형, 금액 등)
 * - 자동 생성: ID, createdAt, updatedAt
 * - 기본 상태: 'pending' (승인 대기 중)
 *
 * 반환:
 * - Object: 생성된 환급 요청 정보
 *
 * 예외:
 * - DB 생성 실패: '🔴 장례식장 환급 요청 DAO 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 장례식장이 캐시 환급을 요청할 때 사용됩니다.
 * - 🔴 이모지를 통해 환급 요청 관련 오류를 시각적으로 구분할 수 있습니다.
 * - 기본 상태는 'pending'으로 설정되어 관리자의 승인을 기다립니다.
 * - 환급 요청은 별도의 승인 과정을 거쳐 처리됩니다.
 * - 환급 요청의 이력은 캐시 히스토리에 기록되어 추적 가능합니다.
 * - 환급 요청 시 관련 서류나 사유를 description 필드에 기록할 수 있습니다.
 */
export const create = async (data) => {
  try {
    return await db.FuneralCashHistory.create(data);
  } catch (error) {
    throw new Error('🔴 장례식장 환급 요청 DAO 오류: ' + error.message);
  }
};

/**
 * 장례식장 현재 캐시 잔액 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) funeralId로 특정 장례식장 조회
 * 2) 필요한 속성만 선택하여 반환 (성능 최적화)
 * 3) 장례식장이 존재하지 않으면 오류 발생
 * 4) 오류 발생 시 원본 오류를 그대로 전파
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환 속성:
 * - funeralCash: 현재 캐시 잔액
 *
 * 반환:
 * - number: 현재 캐시 잔액
 *
 * 예외:
 * - 장례식장 없음: '장례식장을 찾을 수 없습니다.' 형태로 Error throw
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 장례식장의 현재 캐시 잔액만 필요한 경우에 사용됩니다.
 * - 필요한 속성만 반환하여 네트워크 트래픽과 메모리 사용량을 줄입니다.
 * - 장례식장 존재 여부를 먼저 확인하여 안전한 조회를 보장합니다.
 * - 캐시 잔액 확인, 결제 가능 여부 판단 등에 활용됩니다.
 * - 성능 최적화를 위해 최소한의 데이터만 조회합니다.
 * - 반환값은 숫자 타입으로 캐시 잔액을 직접 사용할 수 있습니다.
 */
export const getCurrentCash = async (funeralId) => {
  const funeral = await db.Funeral.findByPk(funeralId, {
    attributes: ['funeralCash'],
  });

  if (!funeral) {
    throw new Error('장례식장을 찾을 수 없습니다.');
  }

  return funeral.funeralCash;
};

/**
 * 캐시 히스토리 상태 업데이트 (일반)
 *
 * 입력:
 * - funeralId: string — 상태를 업데이트할 장례식장의 고유 ID
 * - transactionType: string — 거래 유형
 * - oldStatus: string — 현재 상태 (업데이트할 레코드 식별용)
 * - newStatus: string — 새로운 상태
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 * - newBalance: number — 새로운 잔액 (선택사항, 기본값: null)
 *
 * 동작:
 * 1) 조건에 맞는 캐시 히스토리 레코드의 상태를 새로운 상태로 업데이트
 * 2) newBalance가 제공된 경우 잔액도 함께 업데이트
 * 3) 트랜잭션 옵션을 포함하여 데이터 일관성 보장
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 * - transactionType: 입력받은 거래 유형과 정확히 일치
 * - status: oldStatus와 정확히 일치
 *
 * 반환:
 * - Array: Sequelize update 결과 배열 [업데이트된 행 수]
 *
 * 예외:
 * - DB 업데이트 실패: '장례식장 캐시 히스토리 상태 업데이트 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 캐시 히스토리의 상태를 변경할 때 사용됩니다.
 * - 조건을 정확히 지정하여 원하는 레코드만 업데이트합니다.
 * - 트랜잭션 옵션을 통해 데이터 일관성을 보장할 수 있습니다.
 * - 반환값의 첫 번째 요소는 업데이트된 행의 수를 나타냅니다.
 * - newBalance 파라미터를 통해 거래 후 잔액을 정확하게 기록할 수 있습니다.
 * - 상태 변경 시 updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 * - 환급 요청의 승인/거절, 거래 완료 등의 상태 변경에 활용됩니다.
 */
export const updateCashHistoryStatus = async (
  funeralId,
  transactionType,
  oldStatus,
  newStatus,
  options = {},
  newBalance = null,
) => {
  try {
    return await db.FuneralCashHistory.update(
      { status: newStatus, funeralCashBalanceAfter: newBalance },
      { where: { funeralId, transactionType, status: oldStatus }, ...options },
    );
  } catch (error) {
    throw new Error('장례식장 캐시 히스토리 상태 업데이트 오류: ' + error.message);
  }
};

/**
 * 캐시 거절 히스토리 상태 업데이트
 *
 * 입력:
 * - funeralId: string — 상태를 업데이트할 장례식장의 고유 ID
 * - transactionType: string — 거래 유형
 * - oldStatus: string — 현재 상태 (업데이트할 레코드 식별용)
 * - newStatus: string — 새로운 상태 (보통 'rejected')
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 * - newBalance: number — 새로운 잔액 (선택사항, 기본값: null)
 *
 * 동작:
 * 1) 조건에 맞는 캐시 히스토리 레코드의 상태를 새로운 상태로 업데이트
 * 2) newBalance가 제공된 경우 잔액도 함께 업데이트
 * 3) 트랜잭션 옵션을 포함하여 데이터 일관성 보장
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 * - transactionType: 입력받은 거래 유형과 정확히 일치
 * - status: oldStatus와 정확히 일치
 *
 * 반환:
 * - Array: Sequelize update 결과 배열 [업데이트된 행 수]
 *
 * 예외:
 * - DB 업데이트 실패: '캐시 히스토리 상태 업데이트 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 캐시 히스토리의 상태를 거절 상태로 변경할 때 사용됩니다.
 * - updateCashHistoryStatus와 유사하지만 거절 처리에 특화되어 있습니다.
 * - 조건을 정확히 지정하여 원하는 레코드만 업데이트합니다.
 * - 트랜잭션 옵션을 통해 데이터 일관성을 보장할 수 있습니다.
 * - 반환값의 첫 번째 요소는 업데이트된 행의 수를 나타냅니다.
 * - newBalance 파라미터를 통해 거절 시 잔액 상태를 정확하게 기록할 수 있습니다.
 * - 상태 변경 시 updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 * - 환급 요청 거절, 거래 취소 등의 상태 변경에 활용됩니다.
 */
export const updateCashHistoryStatusReject = async (
  funeralId,
  transactionType,
  oldStatus,
  newStatus,
  options = {},
  newBalance = null,
) => {
  try {
    return await db.FuneralCashHistory.update(
      { status: newStatus, funeralCashBalanceAfter: newBalance },
      {
        where: {
          funeralId,
          transactionType,
          status: oldStatus,
        },
        ...options,
      },
    );
  } catch (error) {
    throw new Error('캐시 히스토리 상태 업데이트 오류:' + error.message);
  }
};

/**
 * 캐시 승인 히스토리 상태 업데이트
 *
 * 입력:
 * - funeralId: string — 상태를 업데이트할 장례식장의 고유 ID
 * - transactionType: string — 거래 유형
 * - oldStatus: string — 현재 상태 (업데이트할 레코드 식별용)
 * - newStatus: string — 새로운 상태 (보통 'approved' 또는 'completed')
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) 조건에 맞는 캐시 히스토리 레코드의 상태를 새로운 상태로 업데이트
 * 2) 잔액은 업데이트하지 않음 (승인 시에는 잔액 변경이 필요 없을 수 있음)
 * 3) 트랜잭션 옵션을 포함하여 데이터 일관성 보장
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 * - transactionType: 입력받은 거래 유형과 정확히 일치
 * - status: oldStatus와 정확히 일치
 *
 * 반환:
 * - Array: Sequelize update 결과 배열 [업데이트된 행 수]
 *
 * 예외:
 * - DB 업데이트 실패: '캐시 히스토리 상태 업데이트 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 캐시 히스토리의 상태를 승인 상태로 변경할 때 사용됩니다.
 * - updateCashHistoryStatus와 달리 잔액은 업데이트하지 않습니다.
 * - 조건을 정확히 지정하여 원하는 레코드만 업데이트합니다.
 * - 트랜잭션 옵션을 통해 데이터 일관성을 보장할 수 있습니다.
 * - 반환값의 첫 번째 요소는 업데이트된 행의 수를 나타냅니다.
 * - 승인 시에는 상태만 변경하고 잔액은 별도로 처리할 수 있습니다.
 * - 상태 변경 시 updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 * - 환급 요청 승인, 거래 완료 등의 상태 변경에 활용됩니다.
 * - 승인 후 실제 잔액 변경은 별도의 함수를 통해 처리할 수 있습니다.
 */
export const updateCashHistoryStatusApprove = async (
  funeralId,
  transactionType,
  oldStatus,
  newStatus,
  options = {},
) => {
  try {
    return await db.FuneralCashHistory.update(
      { status: newStatus },
      {
        where: {
          funeralId,
          transactionType,
          status: oldStatus,
        },
        ...options,
      },
    );
  } catch (error) {
    throw new Error('캐시 히스토리 상태 업데이트 오류:' + error.message);
  }
};
