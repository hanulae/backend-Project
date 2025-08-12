/**
 * 매니저(상조팀장) 캐시 관리 DAO (Data Access Object)
 * - 상조팀장의 캐시 관리 및 거래 내역을 위한 모든 데이터베이스 작업을 담당합니다.
 * - 상조팀장 캐시 잔액 조회 및 업데이트, 캐시 추가/차감 처리 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 캐시 거래 내역 생성 및 조회, 캐시 거래 상태 관리 (승인/거절/대기)를 지원합니다.
 * - 캐시 히스토리 추적을 통한 감사 추적이 가능합니다.
 */
import db from '../../models/index.js';

/**
 * 매니저 ID로 매니저 정보 조회
 *
 * 입력:
 * - managerId: number — 조회할 매니저의 고유 ID
 *
 * 동작:
 * 1) 매니저 ID로 매니저 정보 조회
 * 2) 해당하는 ID가 없으면 null 반환
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - managerId: 입력받은 ID와 정확히 일치 (Primary Key)
 *
 * 반환:
 * - Object|null: 매니저 정보 객체 또는 null (존재하지 않는 경우)
 *
 * 예외:
 * - DB 조회 실패: '매니저 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 캐시 관련 작업 전 매니저의 기본 정보를 확인할 때 사용됩니다.
 * - 캐시 잔액 조회나 업데이트 전 매니저 존재 여부를 검증합니다.
 * - Primary Key를 사용하므로 빠른 조회가 가능합니다.
 * - 반환되는 정보에는 모든 매니저 데이터가 포함됩니다.
 * - 캐시 잔액 확인을 위해 managerCash 필드를 포함합니다.
 */
export const findManagerById = async (managerId) => {
  try {
    return await db.Manager.findByPk(managerId);
  } catch (error) {
    throw new Error('매니저 조회 오류:' + error.message);
  }
};

/**
 * 상조팀장 캐시 완전 교체
 *
 * 입력:
 * - managerId: number — 캐시를 업데이트할 매니저의 고유 ID
 * - newBalance: number — 설정할 새로운 캐시 잔액
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) 기존 잔액과 관계없이 새로운 금액으로 캐시 설정
 * 2) Sequelize 옵션을 포함하여 데이터 일관성 보장
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 업데이트 조건:
 * - managerId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Array: 업데이트된 레코드 수와 업데이트된 레코드 ID 배열
 *
 * 예외:
 * - DB 업데이트 실패: '캐시 업데이트 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 기존 잔액과 관계없이 새로운 금액으로 캐시를 설정합니다.
 * - 주로 초기 설정이나 관리자에 의한 강제 조정 시 사용됩니다.
 * - 트랜잭션을 지원하여 데이터 일관성을 보장할 수 있습니다.
 * - 기존 잔액은 완전히 덮어써지므로 주의가 필요합니다.
 * - 캐시 히스토리와 함께 사용하여 변경 이력을 추적하는 것이 좋습니다.
 */
export const updateManagerCash = async (managerId, newBalance, options = {}) => {
  try {
    return await db.Manager.update(
      { managerCash: newBalance },
      { where: { managerId: managerId }, ...options },
    );
  } catch (error) {
    throw new Error('캐시 업데이트 오류:' + error.message);
  }
};

/**
 * 상조팀장 캐시 금액 추가
 *
 * 입력:
 * - managerId: number — 캐시를 추가할 매니저의 고유 ID
 * - amount: number — 추가할 금액 (양수 값)
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) 현재 잔액 조회
 * 2) 새로운 잔액 계산 (현재 잔액 + 추가 금액)
 * 3) 계산된 잔액으로 데이터베이스 업데이트
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 계산 방식:
 * - newBalance = currentCash + amount
 * - amount는 반드시 양수 값이어야 함
 *
 * 반환:
 * - number: 업데이트된 최종 캐시 잔액
 *
 * 예외:
 * - DB 조회 실패: getCurrentCash 함수에서 발생한 오류 전파
 * - DB 업데이트 실패: '캐시 추가 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 현재 잔액에 지정된 금액을 더하여 새로운 잔액을 계산하고 업데이트합니다.
 * - 포인트 적립, 환급 승인, 보너스 지급 등에 사용됩니다.
 * - 트랜잭션을 지원하여 데이터 일관성을 보장할 수 있습니다.
 * - 추가 금액은 반드시 양수 값이어야 합니다.
 * - 캐시 히스토리와 함께 사용하여 추가 이력을 추적하는 것이 좋습니다.
 */
export const addManagerCash = async (managerId, amount, options = {}) => {
  try {
    // 현재 잔액 조회
    const currentCash = await getCurrentCash(managerId);

    // 새로운 잔액 계산
    const newBalance = currentCash + amount;

    // 업데이트 실행
    await db.Manager.update(
      { managerCash: newBalance },
      { where: { managerId: managerId }, ...options },
    );

    return newBalance;
  } catch (error) {
    throw new Error('캐시 추가 오류:' + error.message);
  }
};

/**
 * 매니저 캐시 거래 내역 생성
 *
 * 입력:
 * - managerId: number — 거래를 수행한 매니저의 고유 ID
 * - transactionType: string — 거래 유형 (예: 'charge', 'refund', 'payment', 'bonus')
 * - managerCashAmount: number — 거래 금액 (양수: 증가, 음수: 감소)
 * - managerCashBalanceAfter: number — 거래 후 잔액
 * - funeralListId: number|null — 관련 장례식 목록 ID (선택사항)
 * - managerFormBidId: number|null — 관련 견적서 입찰 ID (선택사항)
 * - bankTransactionId: string|null — 은행 거래 ID (선택사항)
 * - status: string — 거래 상태 (기본값: 'pending')
 *
 * 동작:
 * 1) 입력받은 파라미터로 캐시 히스토리 레코드 생성
 * 2) 거래 발생 시간을 현재 시간으로 자동 설정
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 생성 정보:
 * - 거래 기본 정보 (매니저 ID, 거래 유형, 금액, 잔액)
 * - 관련 ID 정보 (장례식 목록, 견적서 입찰, 은행 거래)
 * - 거래 상태 및 발생 시간
 * - 자동 생성: ID, createdAt, updatedAt
 *
 * 반환:
 * - Object: 생성된 캐시 히스토리 레코드
 *
 * 예외:
 * - DB 생성 실패: '캐시 내역 생성 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 캐시의 모든 변동사항을 추적하기 위한 히스토리 레코드를 생성합니다.
 * - 거래 유형, 금액, 잔액, 관련 ID 등을 기록하여 감사 추적이 가능합니다.
 * - 거래 금액은 양수(증가) 또는 음수(감소)로 입력할 수 있습니다.
 * - 관련 ID는 선택사항이므로 null로 설정 가능합니다.
 * - 거래 상태는 기본적으로 'pending'으로 설정됩니다.
 * - 거래 발생 시간은 자동으로 현재 시간이 설정됩니다.
 */
export const createCashHistory = async ({
  managerId,
  transactionType,
  managerCashAmount,
  managerCashBalanceAfter,
  funeralListId = null,
  managerFormBidId = null,
  bankTransactionId = null,
  status = 'pending',
}) => {
  try {
    return await db.ManagerCashHistory.create({
      managerId,
      transactionType,
      managerCashAmount,
      managerCashBalanceAfter,
      funeralListId,
      managerFormBidId,
      transactionDate: new Date(), // 거래 발생 시간
      bankTransactionId,
      status,
    });
  } catch (error) {
    throw new Error('캐시 내역 생성 오류:' + error.message);
  }
};

/**
 * 특정 매니저의 모든 캐시 거래 내역 조회
 *
 * 입력:
 * - managerId: number — 조회할 매니저의 고유 ID
 *
 * 동작:
 * 1) 매니저 ID로 모든 캐시 거래 내역 조회
 * 2) 생성일 기준 내림차순으로 정렬 (최신순)
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - managerId: 입력받은 ID와 정확히 일치
 *
 * 정렬 방식:
 * - createdAt: DESC (생성일 기준 내림차순)
 * - 최신 거래가 먼저 표시됨
 *
 * 반환:
 * - Array: 캐시 거래 내역 배열 (최신순)
 *
 * 예외:
 * - DB 조회 실패: '캐시 내역 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 매니저의 캐시 변동 이력을 시간순으로 정렬하여 반환합니다.
 * - 최신 거래가 먼저 표시되도록 내림차순으로 정렬됩니다.
 * - 반환되는 각 내역에는 거래 유형, 금액, 잔액, 상태 등의 정보가 포함됩니다.
 * - 거래 내역이 없는 경우 빈 배열이 반환됩니다.
 * - 감사 추적이나 정산 작업에 활용할 수 있습니다.
 * - 대량의 거래 내역이 있는 경우 페이징 처리를 고려해야 합니다.
 */
export const findCashHistoryByManagerId = async (managerId) => {
  try {
    return await db.ManagerCashHistory.findAll({
      where: { managerId },
      order: [['createdAt', 'DESC']], // 생성일 기준 내림차순 정렬
    });
  } catch (error) {
    throw new Error('캐시 내역 조회 오류:' + error.message);
  }
};

/**
 * 매니저 캐시 히스토리 생성 (기본 함수)
 *
 * 입력:
 * - data: Object — 생성할 캐시 히스토리 데이터
 *   - managerId: number — 매니저 ID
 *   - transactionType: string — 거래 유형
 *   - managerCashAmount: number — 거래 금액
 *   - managerCashBalanceAfter: number — 거래 후 잔액
 *   - transactionDate: Date — 거래 발생 시간
 *   - status: string — 거래 상태
 *   - 기타 필요한 필드들
 *
 * 동작:
 * 1) 입력받은 데이터로 캐시 히스토리 레코드 생성
 * 2) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 생성 정보:
 * - 입력받은 모든 데이터 필드
 * - 자동 생성: ID, createdAt, updatedAt
 *
 * 반환:
 * - Object: 생성된 캐시 히스토리 레코드
 *
 * 예외:
 * - DB 생성 실패: '🔴 환급 요청 DAO 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 기본적인 캐시 히스토리 생성 함수로, 모든 필드를 직접 지정할 수 있습니다.
 * - 기존 createCashHistory 함수와 유사하지만 더 유연한 데이터 입력이 가능합니다.
 * - 모든 필수 필드를 포함하여 데이터를 전달해야 합니다.
 * - 거래 발생 시간도 직접 지정할 수 있습니다.
 * - 환급 요청 관련 오류 메시지를 사용합니다.
 * - 데이터 유효성 검증이 필요할 수 있습니다.
 */
export const create = async (data) => {
  try {
    return await db.ManagerCashHistory.create(data);
  } catch (error) {
    throw new Error('🔴 환급 요청 DAO 오류:' + error.message);
  }
};

/**
 * 매니저의 현재 캐시 잔액 조회
 *
 * 입력:
 * - managerId: number — 조회할 매니저의 고유 ID
 *
 * 동작:
 * 1) 매니저 ID로 캐시 잔액만 조회
 * 2) 매니저가 존재하지 않으면 Error throw
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - managerId: 입력받은 ID와 정확히 일치 (Primary Key)
 *
 * 조회 속성:
 * - managerCash: 캐시 잔액만 조회 (성능 최적화)
 *
 * 반환:
 * - number: 현재 캐시 잔액
 *
 * 예외:
 * - 매니저 없음: '상조팀장을 찾을 수 없습니다.' 형태로 Error throw
 * - DB 조회 실패: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 매니저 테이블에서 현재 보유한 캐시 금액만을 반환합니다.
 * - 다른 함수에서 잔액 계산이나 검증 시 사용됩니다.
 * - 캐시 잔액만 조회하여 성능을 최적화합니다.
 * - 매니저가 존재하지 않는 경우 명확한 오류 메시지를 제공합니다.
 * - 반환값은 숫자 타입입니다.
 * - 잔액이 0인 경우에도 정상적으로 반환됩니다.
 */
export const getCurrentCash = async (managerId) => {
  const manager = await db.Manager.findByPk(managerId, {
    attributes: ['managerCash'], // 캐시 잔액만 조회
  });

  if (!manager) {
    throw new Error('상조팀장을 찾을 수 없습니다.');
  }

  return manager.managerCash;
};

/**
 * 캐시 거절 시 히스토리 상태 업데이트 및 잔액 조정
 *
 * 입력:
 * - managerId: number — 거절된 거래의 매니저 ID
 * - transactionType: string — 거래 유형
 * - oldStatus: string — 이전 상태 (예: 'pending')
 * - newStatus: string — 새로운 상태 (예: 'rejected')
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 * - newBalance: number|null — 조정된 새로운 잔액 (선택사항)
 *
 * 동작:
 * 1) 거래 상태를 새로운 상태로 업데이트
 * 2) 새로운 잔액이 제공된 경우 잔액도 함께 업데이트
 * 3) 콘솔에 새로운 잔액 로그 출력 (디버깅용)
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 업데이트 조건:
 * - managerId: 입력받은 ID와 정확히 일치
 * - transactionType: 입력받은 거래 유형과 정확히 일치
 * - status: 이전 상태와 정확히 일치
 *
 * 반환:
 * - Array: 업데이트된 레코드 수와 업데이트된 레코드 ID 배열
 *
 * 예외:
 * - DB 업데이트 실패: '캐시 히스토리 상태 업데이트 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 캐시 환급 요청이 거절되었을 때 호출됩니다.
 * - 상태를 'rejected'로 변경하고 필요시 잔액을 이전 상태로 되돌립니다.
 * - 트랜잭션을 지원하여 데이터 일관성을 보장할 수 있습니다.
 * - 새로운 잔액은 선택사항이므로 null로 설정 가능합니다.
 * - 디버깅을 위한 로그가 콘솔에 출력됩니다.
 * - 거절 처리 후 관련 알림을 전송하는 것이 좋습니다.
 */
export const updateCashHistoryStatusReject = async (
  managerId,
  transactionType,
  oldStatus,
  newStatus,
  options = {},
  newBalance = null,
) => {
  try {
    console.log('🚀 ~ updateCashHistoryStatus ~ newBalance:', newBalance);
    return await db.ManagerCashHistory.update(
      { status: newStatus, managerCashBalanceAfter: newBalance },
      {
        where: {
          managerId,
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
 * 캐시 승인 시 히스토리 상태 업데이트
 *
 * 입력:
 * - managerId: number — 승인된 거래의 매니저 ID
 * - transactionType: string — 거래 유형
 * - oldStatus: string — 이전 상태 (예: 'pending')
 * - newStatus: string — 새로운 상태 (예: 'approved', 'completed')
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) 거래 상태를 새로운 상태로 업데이트
 * 2) 잔액은 이미 조정된 상태이므로 추가 변경 없음
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 업데이트 조건:
 * - managerId: 입력받은 ID와 정확히 일치
 * - transactionType: 입력받은 거래 유형과 정확히 일치
 * - status: 이전 상태와 정확히 일치
 *
 * 반환:
 * - Array: 업데이트된 레코드 수와 업데이트된 레코드 ID 배열
 *
 * 예외:
 * - DB 업데이트 실패: '캐시 히스토리 상태 업데이트 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 캐시 환급 요청이 승인되었을 때 호출됩니다.
 * - 상태를 'approved' 또는 'completed'로 변경합니다.
 * - 잔액은 이미 조정된 상태이므로 추가 변경 없이 상태만 업데이트합니다.
 * - 트랜잭션을 지원하여 데이터 일관성을 보장할 수 있습니다.
 * - 승인 처리 후 관련 알림을 전송하는 것이 좋습니다.
 * - 승인된 거래는 추후 취소가 어려우므로 신중하게 처리해야 합니다.
 */
export const updateCashHistoryStatusApprove = async (
  managerId,
  transactionType,
  oldStatus,
  newStatus,
  options = {},
) => {
  try {
    return await db.ManagerCashHistory.update(
      { status: newStatus },
      {
        where: {
          managerId,
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
