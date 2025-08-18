/**
 * 관리자 캐시 관리 DAO (Data Access Object)
 * - 상조팀장과 장례식장의 캐시 관련 데이터베이스 작업을 담당합니다.
 * - 캐시 충전 내역 조회, 캐시 잔액 추가, 거래 히스토리 기록 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 트랜잭션을 지원하여 데이터 일관성을 보장합니다.
 * - 관리자가 전체 시스템의 캐시 현황을 모니터링하고 관리할 수 있도록 지원합니다.
 */
import db from '../../models/index.js';
import ManagerCashHistory from '../../models/manager/managerCashHistory.js';
import FuneralCashHistory from '../../models/funeral/funeralCashHistory.js'; // Assuming this model exists

/**
 * 전체 장례식장 캐시 충전 내역 조회
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) 데이터베이스에서 모든 장례식장의 캐시 충전 내역 조회
 * 2) transactionType이 'earn_cash'인 레코드만 필터링
 * 3) 거래 날짜 기준 내림차순 정렬 (최신순)
 * 4) 장례식장 정보(이름, ID)를 포함하여 반환
 *
 * 조회 조건:
 * - transactionType: 'earn_cash' (캐시 획득/충전)
 * - 정렬: transactionDate DESC (최신 거래순)
 *
 * 포함 정보:
 * - 장례식장 이름 (funeralName)
 * - 장례식장 ID (funeralId)
 * - 거래 금액, 날짜, 상태 등
 *
 * 반환:
 * - Array<Object>: 장례식장 캐시 충전 내역 배열
 *
 * 예외:
 * - DB 조회 실패: '전체 캐시 충전 내역 조회 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자 대시보드에서 전체 장례식장의 캐시 충전 현황을 파악하는 데 사용됩니다.
 * - 'earn_cash'는 장례식장이 캐시를 획득하는 모든 거래를 포함합니다.
 * - 대량의 데이터가 있을 경우 페이지네이션 고려가 필요할 수 있습니다.
 */
export const findAllFuneralCashChargeHistory = async () => {
  try {
    return await db.FuneralCashHistory.findAll({
      where: { transactionType: 'earn_cash' }, // 충전 내역만
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Funeral,
          as: 'funeral',
          attributes: ['funeralName', 'funeralId'],
        },
      ],
    });
  } catch (error) {
    throw new Error('전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

/**
 * 
 * @returns 이제 프로젝트를 완료하고 업체에게 이관 작업을 진행하고 있어. 
주석으로 무슨 기능인지 설명을 해줘야해. 
주석으로 기능설명 작성해줘 자세하게

주석으로 기능설명 작성해줘 자세하게
 */

/**
 * 전체 상조팀장 캐시 충전 내역 조회
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) 데이터베이스에서 모든 상조팀장의 캐시 충전 내역 조회
 * 2) transactionType이 'charge_cash'인 레코드만 필터링
 * 3) 거래 날짜 기준 내림차순 정렬 (최신순)
 * 4) 상조팀장 정보(아이디, ID)를 포함하여 반환
 *
 * 조회 조건:
 * - transactionType: 'charge_cash' (캐시 충전)
 * - 정렬: transactionDate DESC (최신 거래순)
 *
 * 포함 정보:
 * - 상조팀장 아이디 (managerUsername)
 * - 상조팀장 ID (managerId)
 * - 거래 금액, 날짜, 상태 등
 *
 * 반환:
 * - Array<Object>: 상조팀장 캐시 충전 내역 배열
 *
 * 예외:
 * - DB 조회 실패: '상조팀장 전체 캐시 충전 내역 조회 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자 대시보드에서 전체 상조팀장의 캐시 충전 현황을 파악하는 데 사용됩니다.
 * - 'charge_cash'는 상조팀장이 캐시를 충전하는 모든 거래를 포함합니다.
 * - 상조팀장의 캐시 사용 내역과는 별도로 충전 내역만 조회합니다.
 */
export const findAllManagerCashChargeHistory = async () => {
  try {
    return await db.ManagerCashHistory.findAll({
      where: { transactionType: 'charge_cash' }, // 충전 내역만
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Manager,
          as: 'manager',
          attributes: ['managerUsername', 'managerId'],
        },
      ],
    });
  } catch (error) {
    throw new Error('상조팀장 전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

/**
 * 특정 장례식장의 캐시 충전 내역 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) 특정 장례식장 ID로 캐시 충전 내역 조회
 * 2) transactionType이 'earn_cash'인 레코드만 필터링
 * 3) 거래 날짜 기준 내림차순 정렬 (최신순)
 * 4) 장례식장 정보(이름, ID)를 포함하여 반환
 *
 * 조회 조건:
 * - funeralId: 입력받은 장례식장 ID와 일치
 * - transactionType: 'earn_cash' (캐시 획득/충전)
 * - 정렬: transactionDate DESC (최신 거래순)
 *
 * 포함 정보:
 * - 장례식장 이름 (funeralName)
 * - 장례식장 ID (funeralId)
 * - 거래 금액, 날짜, 상태 등
 *
 * 반환:
 * - Array<Object>: 특정 장례식장의 캐시 충전 내역 배열
 *
 * 예외:
 * - DB 조회 실패: '전체 캐시 충전 내역 조회 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 장례식장의 캐시 충전 이력을 상세히 조회하는 데 사용됩니다.
 * - 관리자가 특정 장례식장의 캐시 현황을 파악할 때 활용됩니다.
 * - 빈 배열이 반환되는 경우 해당 장례식장의 충전 내역이 없음을 의미합니다.
 */
export const findFuneralCashChargeHistoryById = async (funeralId) => {
  try {
    return await db.FuneralCashHistory.findAll({
      where: {
        transactionType: 'earn_cash', // 충전 내역만
        funeralId: funeralId, // Use the funeralId to filter
      },
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Funeral,
          as: 'funeral',
          attributes: ['funeralName', 'funeralId'],
        },
      ],
    });
  } catch (error) {
    throw new Error('전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

/**
 * 특정 상조팀장의 캐시 충전 내역 조회
 *
 * 입력:
 * - managerId: string — 조회할 상조팀장의 고유 ID
 *
 * 동작:
 * 1) 특정 상조팀장 ID로 캐시 충전 내역 조회
 * 2) transactionType이 'charge_cash'인 레코드만 필터링
 * 3) 거래 날짜 기준 내림차순 정렬 (최신순)
 * 4) 상조팀장 정보(아이디, ID)를 포함하여 반환
 *
 * 조회 조건:
 * - managerId: 입력받은 상조팀장 ID와 일치
 * - transactionType: 'charge_cash' (캐시 충전)
 * - 정렬: transactionDate DESC (최신 거래순)
 *
 * 포함 정보:
 * - 상조팀장 아이디 (managerUsername)
 * - 상조팀장 ID (managerId)
 * - 거래 금액, 날짜, 상태 등
 *
 * 반환:
 * - Array<Object>: 특정 상조팀장의 캐시 충전 내역 배열
 *
 * 예외:
 * - DB 조회 실패: '상조팀장 전체 캐시 충전 내역 조회 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 상조팀장의 캐시 충전 이력을 상세히 조회하는 데 사용됩니다.
 * - 관리자가 특정 상조팀장의 캐시 현황을 파악할 때 활용됩니다.
 * - 빈 배열이 반환되는 경우 해당 상조팀장의 충전 내역이 없음을 의미합니다.
 */
export const findManagerCashChargeHistoryById = async (managerId) => {
  try {
    return await db.ManagerCashHistory.findAll({
      where: {
        transactionType: 'charge_cash', // 충전 내역만
        managerId: managerId, // Use the managerId to filter
      },
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Manager,
          as: 'manager',
          attributes: ['managerUsername', 'managerId'],
        },
      ],
    });
  } catch (error) {
    throw new Error('상조팀장 전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

/**
 * 상조팀장에게 캐시 추가
 *
 * 입력:
 * - managerId: string — 캐시를 추가할 상조팀장의 고유 ID
 * - amount: number — 추가할 캐시 금액
 * - transaction: Object — Sequelize 트랜잭션 객체
 *
 * 동작:
 * 1) managerId로 상조팀장 정보 조회
 * 2) 상조팀장 존재 여부 확인
 * 3) 기존 캐시 잔액에 추가 금액을 더함
 * 4) 변경된 정보를 데이터베이스에 저장
 * 5) 업데이트된 상조팀장 정보 반환
 *
 * 트랜잭션 처리:
 * - 입력받은 트랜잭션 객체를 사용하여 데이터 일관성 보장
 * - 오류 발생 시 자동 롤백
 *
 * 보안:
 * - 상조팀장 존재 여부 검증
 * - 트랜잭션을 통한 원자적 처리
 *
 * 반환:
 * - Object: 업데이트된 상조팀장 정보 (캐시 잔액 포함)
 *
 * 예외:
 * - 상조팀장 없음: '상조팀장을 찾을 수 없습니다.'
 * - DB 저장 실패: '상조팀장 캐시 추가에 실패했습니다.' 형태로 Error throw
 * - 트랜잭션 오류: Sequelize 트랜잭션 관련 오류
 *

 *
 * 참고:
 * - 이 함수는 관리자가 상조팀장에게 캐시를 지급할 때 사용됩니다.
 * - 트랜잭션을 사용하여 데이터 일관성을 보장합니다.
 * - 캐시 추가 후 반드시 히스토리 기록이 필요합니다.
 * - 음수 금액 입력 시 잔액이 감소할 수 있으므로 주의가 필요합니다.
 */
export const addCashToManager = async (managerId, amount, transaction) => {
  try {
    const manager = await db.Manager.findByPk(managerId, { transaction });
    if (!manager) {
      throw new Error('상조팀장을 찾을 수 없습니다.');
    }
    manager.managerCash += amount;
    await manager.save({ transaction });
    return manager;
  } catch (error) {
    console.error('상조팀장 캐시 추가 오류:', error.message);
    throw new Error('상조팀장 캐시 추가에 실패했습니다.');
  }
};

/**
 * 장례식장에게 캐시 추가
 *
 * 입력:
 * - funeralId: string — 캐시를 추가할 장례식장의 고유 ID
 * - amount: number — 추가할 캐시 금액
 * - transaction: Object — Sequelize 트랜잭션 객체
 *
 * 동작:
 * 1) funeralId로 장례식장 정보 조회
 * 2) 장례식장 존재 여부 확인
 * 3) 기존 캐시 잔액에 추가 금액을 더함
 * 4) 변경된 정보를 데이터베이스에 저장
 * 5) 업데이트된 장례식장 정보 반환
 *
 * 트랜잭션 처리:
 * - 입력받은 트랜잭션 객체를 사용하여 데이터 일관성 보장
 * - 오류 발생 시 자동 롤백
 *
 * 보안:
 * - 장례식장 존재 여부 검증
 * - 트랜잭션을 통한 원자적 처리
 *
 * 반환:
 * - Object: 업데이트된 장례식장 정보 (캐시 잔액 포함)
 *
 * 예외:
 * - 장례식장 없음: '장례식장을 찾을 수 없습니다.'
 * - DB 저장 실패: '장례식장 캐시 추가에 실패했습니다.' 형태로 Error throw
 * - 트랜잭션 오류: Sequelize 트랜잭션 관련 오류
 *

 *
 * 참고:
 * - 이 함수는 관리자가 장례식장에게 캐시를 지급할 때 사용됩니다.
 * - 트랜잭션을 사용하여 데이터 일관성을 보장합니다.
 * - 캐시 추가 후 반드시 히스토리 기록이 필요합니다.
 * - 음수 금액 입력 시 잔액이 감소할 수 있으므로 주의가 필요합니다.
 */
export const addCashToFuneral = async (funeralId, amount, transaction) => {
  try {
    const funeral = await db.Funeral.findByPk(funeralId, { transaction });
    if (!funeral) {
      throw new Error('장례식장을 찾을 수 없습니다.');
    }
    funeral.funeralCash += amount;
    await funeral.save({ transaction });
    return funeral;
  } catch (error) {
    console.error('장례식장 캐시 추가 오류:', error.message);
    throw new Error('장례식장 캐시 추가에 실패했습니다.');
  }
};

/**
 * 상조팀장 캐시 거래 히스토리 기록
 *
 * 입력:
 * - managerId: string — 상조팀장의 고유 ID
 * - amount: number — 거래 금액
 * - transactionType: string — 거래 유형 (예: 'charge_cash', 'service_cash' 등)
 * - transaction: Object — Sequelize 트랜잭션 객체
 *
 * 동작:
 * 1) managerId로 상조팀장 정보 조회
 * 2) 상조팀장 존재 여부 확인
 * 3) ManagerCashHistory 테이블에 거래 기록 생성
 * 4) 거래 후 잔액, 거래 날짜, 상태 등을 포함하여 저장
 *
 * 기록되는 정보:
 * - managerId: 상조팀장 ID
 * - transactionType: 거래 유형
 * - managerCashAmount: 거래 금액
 * - managerCashBalanceAfter: 거래 후 잔액
 * - transactionDate: 거래 날짜 (현재 시간)
 * - status: 'completed' (완료 상태)
 *
 * 트랜잭션 처리:
 * - 입력받은 트랜잭션 객체를 사용하여 데이터 일관성 보장
 * - 오류 발생 시 자동 롤백
 *
 * 보안:
 * - 상조팀장 존재 여부 검증
 * - 트랜잭션을 통한 원자적 처리
 *
 * 반환:
 * - 없음 (void)
 *
 * 예외:
 * - 상조팀장 없음: '상조팀장을 찾을 수 없습니다.'
 * - 히스토리 기록 실패: '상조팀장 캐시 히스토리 기록에 실패했습니다.' 형태로 Error throw
 * - 트랜잭션 오류: Sequelize 트랜잭션 관련 오류
 *

 *
 * 참고:
 * - 이 함수는 상조팀장의 모든 캐시 거래를 추적하기 위해 사용됩니다.
 * - 거래 유형은 비즈니스 로직에 따라 정의되어야 합니다.
 * - 거래 후 잔액은 거래 전 잔액에 거래 금액을 반영한 값입니다.
 * - 히스토리 기록은 캐시 추가/차감과 함께 트랜잭션으로 처리되어야 합니다.
 */
export const recordManagerCashHistory = async (managerId, amount, transactionType, transaction) => {
  try {
    const manager = await db.Manager.findByPk(managerId, { transaction });
    if (!manager) {
      throw new Error('상조팀장을 찾을 수 없습니다.');
    }
    await ManagerCashHistory.create(
      {
        managerId,
        transactionType,
        managerCashAmount: amount,
        managerCashBalanceAfter: manager.managerCash,
        transactionDate: new Date(),
        status: 'completed',
      },
      { transaction },
    );
  } catch (error) {
    console.error('상조팀장 캐시 히스토리 기록 오류:', error.message);
    throw new Error('상조팀장 캐시 히스토리 기록에 실패했습니다.');
  }
};

/**
 * 장례식장 캐시 거래 히스토리 기록
 *
 * 입력:
 * - funeralId: string — 장례식장의 고유 ID
 * - amount: number — 거래 금액
 * - transactionType: string — 거래 유형 (예: 'earn_cash', 'service_cash' 등)
 * - transaction: Object — Sequelize 트랜잭션 객체
 *
 * 동작:
 * 1) funeralId로 장례식장 정보 조회
 * 2) 장례식장 존재 여부 확인
 * 3) FuneralCashHistory 테이블에 거래 기록 생성
 * 4) 거래 후 잔액, 거래 날짜, 상태 등을 포함하여 저장
 *
 * 기록되는 정보:
 * - funeralId: 장례식장 ID
 * - transactionType: 거래 유형
 * - funeralCashAmount: 거래 금액
 * - funeralCashBalanceAfter: 거래 후 잔액
 * - transactionDate: 거래 날짜 (현재 시간)
 * - status: 'completed' (완료 상태)
 *
 * 트랜잭션 처리:
 * - 입력받은 트랜잭션 객체를 사용하여 데이터 일관성 보장
 * - 오류 발생 시 자동 롤백
 *
 * 보안:
 * - 장례식장 존재 여부 검증
 * - 트랜잭션을 통한 원자적 처리
 *
 * 반환:
 * - 없음 (void)
 *
 * 예외:
 * - 장례식장 없음: '장례식장을 찾을 수 없습니다.'
 * - 히스토리 기록 실패: '장례식장 캐시 히스토리 기록에 실패했습니다.' 형태로 Error throw
 * - 트랜잭션 오류: Sequelize 트랜잭션 관련 오류
 *

 *
 * 참고:
 * - 이 함수는 장례식장의 모든 캐시 거래를 추적하기 위해 사용됩니다.
 * - 거래 유형은 비즈니스 로직에 따라 정의되어야 합니다.
 * - 거래 후 잔액은 거래 전 잔액에 거래 금액을 반영한 값입니다.
 * - 히스토리 기록은 캐시 추가/차감과 함께 트랜잭션으로 처리되어야 합니다.
 */
export const recordFuneralCashHistory = async (funeralId, amount, transactionType, transaction) => {
  try {
    const funeral = await db.Funeral.findByPk(funeralId, { transaction });
    if (!funeral) {
      throw new Error('장례식장을 찾을 수 없습니다.');
    }
    await FuneralCashHistory.create(
      {
        funeralId,
        transactionType,
        funeralCashAmount: amount,
        funeralCashBalanceAfter: funeral.funeralCash,
        transactionDate: new Date(),
        status: 'completed',
      },
      { transaction },
    );
  } catch (error) {
    console.error('장례식장 캐시 히스토리 기록 오류:', error.message);
    throw new Error('장례식장 캐시 히스토리 기록에 실패했습니다.');
  }
};

/**
 * 전체 캐시 충전 내역 통합 조회
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) 상조팀장과 장례식장의 캐시 충전 내역을 각각 조회
 * 2) 각각의 결과를 객체로 구성하여 반환
 * 3) 거래 날짜 기준 내림차순 정렬 (최신순)
 *
 * 조회 조건:
 * - 상조팀장: transactionType = 'charge_cash'
 * - 장례식장: transactionType = 'earn_cash'
 * - 정렬: transactionDate DESC (최신 거래순)
 *
 * 포함 정보:
 * - 상조팀장: managerUsername, managerId
 * - 장례식장: funeralName, funeralId
 * - 거래 금액, 날짜, 상태 등
 *
 * 반환:
 * - Object: {
 *   managerCash: Array<Object> — 상조팀장 캐시 충전 내역,
 *   funeralCash: Array<Object> — 장례식장 캐시 충전 내역
 * }
 *
 * 예외:
 * - DB 조회 실패: '전체 캐시 충전 내역 조회 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자 대시보드에서 전체 시스템의 캐시 충전 현황을 한 번에 파악하는 데 사용됩니다.
 * - 상조팀장과 장례식장의 충전 내역을 구분하여 반환합니다.
 * - 대량의 데이터가 있을 경우 각각에 대해 페이지네이션 고려가 필요할 수 있습니다.
 * - 통합 조회로 인한 성능 최적화가 필요할 수 있습니다.
 */
export const findAllCashChargeHistory = async () => {
  try {
    // 상조팀장 캐시 충전 내역
    const managerCash = await db.ManagerCashHistory.findAll({
      where: { transactionType: 'charge_cash' },
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Manager,
          as: 'manager',
          attributes: ['managerUsername', 'managerId'],
        },
      ],
    });

    // 장례식장 캐시 충전 내역
    const funeralCash = await db.FuneralCashHistory.findAll({
      where: { transactionType: 'earn_cash' }, // 충전 내역만
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Funeral,
          as: 'funeral',
          attributes: ['funeralName', 'funeralId'],
        },
      ],
    });

    return { managerCash, funeralCash };
  } catch (error) {
    throw new Error('전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

/**
 * 특정 사용자의 캐시 충전 내역 조회
 *
 * 입력:
 * - userId: string — 조회할 사용자의 고유 ID
 * - type: string — 사용자 타입 ('manager' 또는 'funeral')
 *
 * 동작:
 * 1) 사용자 타입에 따라 적절한 테이블에서 내역 조회
 * 2) 상조팀장인 경우 ManagerCashHistory 테이블 조회
 * 3) 장례식장인 경우 FuneralCashHistory 테이블 조회
 * 4) 해당 사용자의 모든 캐시 관련 내역 반환
 *
 * 사용자 타입별 처리:
 * - 'manager': 상조팀장 캐시 히스토리 조회
 * - 'funeral': 장례식장 캐시 히스토리 조회
 * - 기타 타입: 오류 발생
 *
 * 조회 조건:
 * - managerId 또는 funeralId가 입력받은 userId와 일치
 * - 거래 유형 제한 없음 (모든 거래 내역 포함)
 *
 * 반환:
 * - type이 'manager'인 경우: Array<Object> — 상조팀장 캐시 히스토리
 * - type이 'funeral'인 경우: Object — { funeralCashHistory: Array<Object> }
 *
 * 예외:
 * - 잘못된 타입: '유효하지 않은 타입입니다. manager, funeral 중 하나를 선택하세요.'
 * - DB 조회 실패: '유저 캐시 충전 내역 조회 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 사용자의 전체 캐시 거래 내역을 조회하는 데 사용됩니다.
 * - 충전 내역뿐만 아니라 사용 내역도 포함됩니다.
 * - 사용자 타입에 따라 반환 형식이 다르므로 클라이언트에서 적절히 처리해야 합니다.
 * - 현재 장례식장의 경우 FuneralPayment와의 연동이 주석 처리되어 있습니다.
 * - 향후 결제 정보와의 연동이 필요할 수 있습니다.
 */
export const findUserCashChargeHistoryById = async (userId, type) => {
  console.log('🚀 ~ findUserCashChargeHistoryById ~ userId, type:', userId, type);
  try {
    if (type === 'manager') {
      return await db.ManagerCashHistory.findAll({ where: { managerId: userId } });
    } else if (type === 'funeral') {
      //const funeralPayment = await db.FuneralPayment.findAll({ where: { funeralId: userId } });
      const funeralCashHistory = await db.FuneralCashHistory.findAll({
        where: { funeralId: userId },
        // include: [
        //   {
        //     model: db.FuneralPayment,
        //     as: 'funeralPayment',
        //     attributes: ['merchantUid', 'impUid'],
        //   },
        // ],
      });
      return { funeralCashHistory };
    } else {
      throw new Error('유효하지 않은 타입입니다. manager, funeral 중 하나를 선택하세요.');
    }
  } catch (error) {
    throw new Error('유저 캐시 충전 내역 조회 실패: ' + error.message);
  }
};
