/**
 * 상조팀장 캐시 히스토리 관리 DAO (Data Access Object)
 * - 상조팀장의 캐시 거래 내역을 관리하는 데이터베이스 작업을 담당합니다.
 * - 상조팀장 캐시 히스토리 생성, 캐시 잔액 업데이트 및 히스토리 기록 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 트랜잭션 타입별 캐시 거래 내역 관리 및 감사 추적을 지원합니다.
 */

// dao/manager/managerCashHistoryDao.js
import ManagerCashHistory from '../../models/manager/managerCashHistory.js'; // 상조팀장 캐시 히스토리 모델
import Manager from '../../models/manager/manager.js'; // 상조팀장 모델
import db from '../../models/index.js'; // 데이터베이스 연결 및 모델 인덱스

/**
 * 기본 캐시 히스토리 생성
 *
 * 입력:
 * - cashData: Object — 생성할 캐시 히스토리 데이터
 * - options: Object — 데이터베이스 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) 입력받은 데이터로 새로운 캐시 히스토리 레코드 생성
 * 2) Sequelize 옵션을 포함하여 데이터 일관성 보장
 * 3) 오류 발생 시 콘솔에 로그 출력 후 Error throw
 *
 * 생성 정보:
 * - 입력받은 모든 캐시 히스토리 데이터
 * - 자동 생성: ID, createdAt, updatedAt
 * - 트랜잭션을 통한 안전한 데이터 저장
 *
 * 반환:
 * - Object: 생성된 캐시 히스토리 객체
 *
 * 예외:
 * - DB 생성 실패: 콘솔에 오류 로그 출력 후 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 ManagerCashHistory 모델을 사용하여 새로운 캐시 히스토리 레코드를 생성합니다.
 * - options를 통해 트랜잭션 등의 데이터베이스 옵션을 전달할 수 있습니다.
 * - 기본적인 캐시 히스토리 생성에 사용됩니다.
 * - 오류 발생 시 콘솔에 상세한 로그가 출력됩니다.
 * - 트랜잭션을 지원하여 데이터 일관성을 보장할 수 있습니다.
 */
export const create = async (cashData, options = {}) => {
  try {
    // ManagerCashHistory 모델을 사용하여 새로운 캐시 히스토리 레코드 생성
    // options를 통해 트랜잭션 등의 데이터베이스 옵션 전달 가능
    const result = await db.ManagerCashHistory.create(cashData, options);
    return result;
  } catch (error) {
    console.error('캐시 히스토리 생성 오류:', error.message);
    throw error;
  }
};

/**
 * 상조팀장 캐시 히스토리 생성 및 잔액 업데이트
 *
 * 입력:
 * - cashHistoryData: Object — 캐시 히스토리 데이터
 *   - managerId: number — 상조팀장 ID
 *   - managerCashAmount: number — 거래 금액 (양수: 충전, 음수: 차감)
 *   - status: string — 거래 상태 (기본값: 'pending')
 *   - 기타 필요한 필드들
 * - transactionType: string — 거래 타입 (예: 'charge', 'refund', 'payment' 등)
 * - options: Object — 데이터베이스 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) 현재 상조팀장의 캐시 잔액 조회 (findByPk 사용)
 * 2) 새로운 잔액 계산 (현재 잔액 + 거래 금액)
 * 3) 거래 내역을 히스토리에 기록
 * 4) 오류 발생 시 콘솔에 로그 출력 후 Error throw
 *
 * 처리 과정:
 * - 1단계: managerId로 상조팀장 정보 조회 및 존재 여부 확인
 * - 2단계: 현재 잔액에 거래 금액을 더하여 새로운 잔액 계산
 * - 3단계: 거래 후 잔액과 거래 타입을 포함하여 히스토리 기록
 *
 * 계산 방식:
 * - balanceAfter = currentBalance + managerCashAmount
 * - currentBalance가 null인 경우 기본값 0으로 설정
 * - managerCashAmount는 양수(충전) 또는 음수(차감) 가능
 *
 * 반환:
 * - Object: 생성된 캐시 히스토리 객체
 *
 * 예외:
 * - 상조팀장 없음: '상조팀장을 찾을 수 없습니다.' 형태로 Error throw
 * - DB 생성 실패: 콘솔에 오류 로그 출력 후 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 상조팀장의 캐시 거래가 발생할 때 호출됩니다.
 * - findByPk를 사용하여 기본키(managerId)로 상조팀장 정보를 조회합니다.
 * - 현재 잔액(managerCash)에 거래 금액(managerCashAmount)을 더하여 새로운 잔액을 계산합니다.
 * - 거래 후 잔액(managerCashBalanceAfter)과 거래 타입(transactionType)을 포함하여 히스토리를 기록합니다.
 * - status가 제공되지 않은 경우 기본값 'pending'으로 설정됩니다.
 * - 트랜잭션을 지원하여 데이터 일관성을 보장할 수 있습니다.
 * - 오류 발생 시 콘솔에 상세한 로그가 출력됩니다.
 */
export const createManagerCashHistory = async (cashHistoryData, transactionType, options = {}) => {
  try {
    // 1단계: 현재 상조팀장의 캐시 잔액 조회
    // findByPk를 사용하여 기본키(managerId)로 상조팀장 정보 조회
    const manager = await Manager.findByPk(cashHistoryData.managerId);
    if (!manager) {
      throw new Error('상조팀장을 찾을 수 없습니다.');
    }

    // 2단계: 새로운 잔액 계산
    // 현재 잔액(managerCash)에 거래 금액(managerCashAmount)을 더하여 새로운 잔액 계산
    // managerCash가 null인 경우를 대비해 기본값 0 설정
    const currentBalance = manager.managerCash || 0;
    const balanceAfter = currentBalance + cashHistoryData.managerCashAmount;

    // 3단계: 캐시 히스토리 생성
    // 거래 후 잔액(managerCashBalanceAfter)과 거래 타입(transactionType)을 포함하여 히스토리 기록
    // status가 제공되지 않은 경우 기본값 'pending'으로 설정
    return await ManagerCashHistory.create(
      {
        ...cashHistoryData, // 기존 데이터 확장
        managerCashBalanceAfter: balanceAfter, // 거래 후 잔액
        transactionType, // 거래 타입 (충전, 환불, 결제 등)
        status: cashHistoryData.status || 'pending', // 거래 상태 (기본값: pending)
      },
      { ...options }, // 트랜잭션 등의 데이터베이스 옵션 전달
    );
  } catch (error) {
    console.error('캐시 히스토리 생성 오류:', error.message);
    throw error;
  }
};
