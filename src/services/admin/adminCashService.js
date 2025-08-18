/**
 * 관리자 캐시 서비스
 * - 상조팀장/장례식장 캐시 충전 내역 조회, 특정 사용자 내역 조회, 관리자 캐시 지급 기능 제공
 * - 지급은 트랜잭션으로 잔액 갱신과 히스토리 기록을 원자적으로 처리
 */
import * as adminCashDao from '../../daos/admin/adminCashDao.js';
import db from '../../models/index.js'; // Sequelize 인스턴스

/**
 * 상조팀장 캐시 충전 내역 전체 조회
 *
 * 반환:
 * - Array: 상조팀장 캐시 충전 히스토리 목록
 *
 * 예외:
 * - DAO 호출 실패 시 Error throw
 */
export const getAllManagerCashChargeHistory = async () => {
  try {
    return await adminCashDao.findAllManagerCashChargeHistory();
  } catch (error) {
    throw new Error('상조팀장 전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

/**
 * 전체 유저 캐시 충전 내역 조회
 *
 * 입력:
 * - type: 'manager' | 'funeral' | 기타(모두 반환)
 *
 * 반환:
 * - type === 'manager' → { managers: ManagerChargeHistory[] }
 * - type === 'funeral' → { funerals: FuneralChargeHistory[] }
 * - 그 외 → { managers: [], funerals: [] }
 *
 * 예외:
 * - DAO 호출 실패 시 Error throw
 */
export const getAllUserCashChargeHistory = async (type) => {
  try {
    const managerCashCharges = await adminCashDao.findAllManagerCashChargeHistory();
    const funeralCashCharges = await adminCashDao.findAllFuneralCashChargeHistory();

    if (type === 'manager') {
      return { managers: managerCashCharges };
    } else if (type === 'funeral') {
      return { funerals: funeralCashCharges };
    } else {
      return {
        managers: managerCashCharges,
        funerals: funeralCashCharges,
      };
    }
  } catch (error) {
    throw new Error('전체 유저 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

/**
 * 특정 장례식장 캐시 충전 내역 조회
 *
 * 입력:
 * - funeralId: string
 *
 * 반환:
 * - Array: 해당 장례식장의 캐시 충전 히스토리
 *
 * 예외:
 * - DAO 호출 실패 시 Error throw
 */
export const getFuneralCashChargeHistoryById = async (funeralId) => {
  try {
    return await adminCashDao.findFuneralCashChargeHistoryById(funeralId);
  } catch (error) {
    throw new Error('장례식장 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

/**
 * 특정 유저(상조팀장/장례식장) 캐시 충전 내역 조회
 *
 * 입력:
 * - userId: string
 * - type: 'manager' | 'funeral'
 *
 * 반환:
 * - Array: 해당 사용자의 캐시 충전 히스토리
 *
 * 예외:
 * - DAO 호출 실패 시 Error throw
 */
export const getUserCashChargeHistoryById = async (userId, type) => {
  try {
    return await adminCashDao.findUserCashChargeHistoryById(userId, type);
  } catch (error) {
    throw new Error('유저 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

/**
 * 캐시 지급(관리자 수동 지급)
 *
 * 입력:
 * - userId: string — 지급 대상 사용자 ID
 * - amount: number — 지급할 캐시 금액(양수)
 * - userType: 'manager' | 'funeral' — 사용자 유형
 *
 * 동작:
 * - 트랜잭션 시작
 * - userType에 따라 대상 잔액 증가
 * - 'service_cash' 유형으로 지급 히스토리 기록
 * - 커밋(성공 시)
 * - 오류 발생 시 롤백 후 예외 throw
 *
 * 반환:
 * - Object: DAO가 반환하는 갱신 결과(예: 업데이트된 레코드/행 수 등)
 *
 * 예외:
 * - 유효하지 않은 userType, DAO/DB 오류 시 Error throw
 */
export const giveCashToUser = async (userId, amount, userType) => {
  const transaction = await db.sequelize.transaction();
  try {
    let result;
    if (userType === 'manager') {
      result = await adminCashDao.addCashToManager(userId, amount, transaction);
      await adminCashDao.recordManagerCashHistory(userId, amount, 'service_cash', transaction);
    } else if (userType === 'funeral') {
      result = await adminCashDao.addCashToFuneral(userId, amount, transaction);
      await adminCashDao.recordFuneralCashHistory(userId, amount, 'service_cash', transaction);
    } else {
      throw new Error('유효하지 않은 사용자 타입입니다.');
    }
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    console.error('캐시 지급 오류:', error.message);
    throw new Error('캐시 지급에 실패했습니다.');
  }
};

/**
 * 전체 캐시 충전 내역 조회
 *
 * 반환:
 * - Array: 모든 사용자(상조팀장/장례식장)의 캐시 충전 히스토리
 *
 * 예외:
 * - DAO 호출 실패 시 Error throw
 */
export const getAllCashChargeHistory = async () => {
  try {
    return await adminCashDao.findAllCashChargeHistory();
  } catch (error) {
    throw new Error('전체 캐시 충전 내역 서비스 오류: ' + error.message);
  }
};
