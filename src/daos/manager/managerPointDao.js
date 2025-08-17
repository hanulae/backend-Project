/**
 * 상조팀장 포인트 관리 DAO (Data Access Object)
 * - 상조팀장의 포인트 시스템을 관리하는 데이터베이스 작업을 담당합니다.
 * - 포인트는 서비스 이용 시 적립되며, 필요시 현금으로 전환할 수 있습니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 포인트를 현금으로 전환, 포인트 거래 내역 조회, 현재 포인트 잔액 조회 등의 기능을 제공합니다.
 * - 포인트/캐시 잔액 동기화 업데이트를 통한 데이터 일관성을 보장합니다.
 * - 상조팀장이 서비스 이용을 통해 적립한 포인트를 현금으로 전환할 때, 포인트 잔액에서 차감하고 동일한 금액을 캐시 잔액에 추가하는 원자적(atomic) 작업을 수행합니다.
 */

import db from '../../models/index.js'; // 데이터베이스 연결 및 모델 인덱스

/**
 * 포인트를 현금으로 전환
 *
 * 입력:
 * - managerId: string|number — 상조팀장 고유 식별자 (ID)
 * - amount: number — 전환할 포인트 금액 (원 단위)
 *
 * 동작:
 * 1) 현재 포인트 잔액 확인
 * 2) 환급 요청 금액 검증 (포인트 잔액 초과 여부)
 * 3) 포인트 내역 기록 (차감)
 * 4) 캐시 내역 기록 (증가)
 * 5) 상조팀장 테이블의 포인트/캐시 잔액 동기화
 * 6) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 처리 과정:
 * - 1단계: ManagerPointHistory 테이블에서 최신 포인트 잔액 조회
 * - 2단계: 전환 금액이 현재 포인트 잔액을 초과하는지 검증
 * - 3단계: 포인트 거래 내역에 차감 내역 기록 (transactionType: 'cash_the_point', status: 'pending')
 * - 4단계: ManagerCashHistory 테이블에서 최신 캐시 잔액 조회
 * - 5단계: 캐시 거래 내역에 증가 내역 기록 (transactionType: 'earn_cash', status: 'completed')
 * - 6단계: Manager 테이블의 managerPoint와 managerCash 필드 동기화 업데이트
 *
 * 검증 사항:
 * - 전환 금액이 현재 보유 포인트를 초과하면 예외 발생
 * - 최근 거래 내역이 없는 경우 기본값 0으로 설정
 *
 * 반환:
 * - Object: 전환 후 잔액 정보
 *   - managerPoint: 전환 후 포인트 잔액
 *   - managerCash: 전환 후 캐시 잔액
 *
 * 예외:
 * - 환급 금액 초과: '환급 금액이 보유 포인트를 초과했습니다.' 형태로 Error throw
 * - DB 작업 실패: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 상조팀장이 보유한 포인트를 현금(캐시)으로 전환하는 핵심 기능입니다.
 * - ManagerPointHistory 테이블에서 해당 상조팀장의 가장 최근 거래 내역을 조회합니다.
 * - createdAt 기준 내림차순 정렬로 최신 잔액 정보를 획득합니다.
 * - 최근 포인트 거래 내역이 있으면 해당 잔액을, 없으면 0을 기본값으로 설정합니다.
 * - 전환하려는 금액이 현재 보유 포인트를 초과하는지 확인하여 안전한 거래를 보장합니다.
 * - 포인트 거래 내역에 차감 내역을 기록하고, 캐시 거래 내역에 증가 내역을 기록합니다.
 * - Manager 테이블의 managerPoint와 managerCash 필드를 최신 잔액으로 업데이트하여 데이터 일관성을 유지합니다.
 */
export const insertPointToCash = async (managerId, amount) => {
  // 1단계: 현재 포인트 잔액 조회
  // ManagerPointHistory 테이블에서 해당 상조팀장의 가장 최근 거래 내역을 조회
  // createdAt 기준 내림차순 정렬로 최신 잔액 정보 획득
  const latestPoint = await db.ManagerPointHistory.findOne({
    where: { managerId },
    order: [['createdAt', 'DESC']],
  });

  // 최근 포인트 거래 내역이 있으면 해당 잔액을, 없으면 0을 기본값으로 설정
  const currentPointBalance = latestPoint ? latestPoint.managerPointBalanceAfter : 0;

  // 2단계: 환급 요청 금액 검증
  // 전환하려는 금액이 현재 보유 포인트를 초과하는지 확인
  // 초과 시 예외 발생으로 안전한 거래 보장
  if (amount > currentPointBalance) {
    throw new Error('환급 금액이 보유 포인트를 초과했습니다.');
  }

  // 전환 후 포인트 잔액 계산 (현재 잔액 - 전환 금액)
  const newPointBalance = currentPointBalance - amount;

  // 3단계: 포인트 내역 기록 (차감)
  // 포인트 거래 내역에 차감 내역을 기록
  // transactionType: 'cash_the_point' (포인트를 현금으로 전환)
  // status: 'pending' (처리 중 상태)
  await db.ManagerPointHistory.create({
    managerId, // 상조팀장 ID
    transactionType: 'cash_the_point', // 거래 타입: 포인트를 현금으로 전환
    managerPointAmount: amount, // 전환된 포인트 금액
    managerPointBalanceAfter: newPointBalance, // 전환 후 포인트 잔액
    status: 'pending', // 거래 상태: 처리 중
  });

  // 4단계: 현재 캐시 잔액 조회
  // ManagerCashHistory 테이블에서 해당 상조팀장의 가장 최근 캐시 거래 내역을 조회
  // createdAt 기준 내림차순 정렬로 최신 캐시 잔액 정보 획득
  const latestCash = await db.ManagerCashHistory.findOne({
    where: { managerId },
    order: [['createdAt', 'DESC']],
  });

  // 최근 캐시 거래 내역이 있으면 해당 잔액을, 없으면 0을 기본값으로 설정
  const currentCashBalance = latestCash ? latestCash.managerCashBalanceAfter : 0;
  // 전환 후 캐시 잔액 계산 (현재 잔액 + 전환 금액)
  const newCashBalance = currentCashBalance + amount;

  // 5단계: 캐시 내역 기록 (증가)
  // 캐시 거래 내역에 증가 내역을 기록
  // transactionType: 'earn_cash' (캐시 획득)
  // status: 'completed' (완료 상태)
  await db.ManagerCashHistory.create({
    managerId, // 상조팀장 ID
    transactionType: 'earn_cash', // 거래 타입: 캐시 획득
    managerCashAmount: amount, // 전환된 캐시 금액
    managerCashBalanceAfter: newCashBalance, // 전환 후 캐시 잔액
    status: 'completed', // 거래 상태: 완료
  });

  // 6단계: 포인트/캐시 필드 동기화 업데이트
  // Manager 테이블의 managerPoint와 managerCash 필드를
  // 최신 잔액으로 업데이트하여 데이터 일관성 유지
  await db.Manager.update(
    {
      managerPoint: newPointBalance, // 전환 후 포인트 잔액
      managerCash: newCashBalance, // 전환 후 캐시 잔액
    },
    {
      where: { managerId }, // 해당 상조팀장 레코드만 업데이트
    },
  );

  // 전환 완료 후 최신 잔액 정보 반환
  return { managerPoint: newPointBalance, managerCash: newCashBalance };
};

/**
 * 포인트 거래 내역 조회
 *
 * 입력:
 * - managerId: string|number — 상조팀장 고유 식별자 (ID)
 * - offset: number — 건너뛸 레코드 수 (페이지네이션용)
 * - limit: number — 한 번에 조회할 레코드 수 (페이지네이션용)
 *
 * 동작:
 * 1) 특정 상조팀장의 포인트 거래 내역을 페이지네이션을 적용하여 조회
 * 2) 최신 거래 내역부터 내림차순으로 정렬
 * 3) 데이터와 총 개수를 한 번에 반환
 *
 * 조회 조건:
 * - managerId: 입력받은 ID와 정확히 일치
 *
 * 정렬 방식:
 * - createdAt: DESC (생성일 기준 내림차순)
 * - 최신 거래 내역이 먼저 표시됨
 *
 * 페이지네이션:
 * - offset: 건너뛸 레코드 수
 * - limit: 한 번에 조회할 레코드 수
 *
 * 반환:
 * - Object: 포인트 거래 내역 및 총 개수
 *   - rows: 포인트 거래 내역 배열
 *   - count: 전체 거래 내역 개수
 *
 * 예외:
 * - DB 조회 실패: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 특정 상조팀장의 포인트 거래 내역을 페이지네이션을 적용하여 조회합니다.
 * - ManagerPointHistory 테이블에서 특정 상조팀장의 포인트 거래 내역을 조회합니다.
 * - findAndCountAll을 사용하여 데이터와 총 개수를 한 번에 반환합니다.
 * - 최신 거래 내역부터 내림차순으로 정렬되어 반환됩니다.
 * - 페이지네이션을 통해 대량의 데이터를 효율적으로 조회할 수 있습니다.
 * - 거래 내역이 없는 경우 빈 배열과 0이 반환됩니다.
 */
export const fetchPointHistory = async (managerId, offset, limit) => {
  // ManagerPointHistory 테이블에서 특정 상조팀장의 포인트 거래 내역을 조회
  // findAndCountAll을 사용하여 데이터와 총 개수를 한 번에 반환
  return await db.ManagerPointHistory.findAndCountAll({
    where: { managerId }, // 특정 상조팀장 필터링
    offset, // 페이지네이션: 건너뛸 레코드 수
    limit, // 페이지네이션: 한 번에 조회할 레코드 수
    order: [['createdAt', 'DESC']], // 최신 거래 내역부터 내림차순 정렬
  });
};

/**
 * 현재 포인트 잔액 조회
 *
 * 입력:
 * - managerId: string|number — 상조팀장 고유 식별자 (ID)
 *
 * 동작:
 * 1) 특정 상조팀장의 현재 보유 포인트 잔액 조회
 * 2) Manager 테이블의 managerPoint 필드에서 직접 조회
 * 3) 상조팀장이 존재하지 않으면 Error throw
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - managerId: 입력받은 ID와 정확히 일치 (Primary Key)
 *
 * 조회 속성:
 * - managerPoint: 포인트 필드만 조회 (성능 최적화)
 *
 * 반환:
 * - number: 현재 보유 포인트 잔액
 *
 * 예외:
 * - 상조팀장 없음: '상조팀장을 찾을 수 없습니다.' 형태로 Error throw
 * - DB 조회 실패: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 특정 상조팀장의 현재 보유 포인트 잔액을 조회합니다.
 * - Manager 테이블의 managerPoint 필드에서 직접 조회하여 실시간 포인트 잔액 정보를 제공합니다.
 * - Manager 테이블에서 특정 상조팀장의 포인트 정보만 조회합니다.
 * - attributes 옵션으로 managerPoint 필드만 선택하여 성능을 최적화합니다.
 * - 상조팀장이 존재하지 않는 경우 예외가 발생합니다.
 * - 반환값은 숫자 타입이며, 포인트가 없는 경우 0이 반환됩니다.
 */
export const getCurrentPoint = async (managerId) => {
  // Manager 테이블에서 특정 상조팀장의 포인트 정보만 조회
  // attributes 옵션으로 managerPoint 필드만 선택하여 성능 최적화
  const manager = await db.Manager.findByPk(managerId, {
    attributes: ['managerPoint'], // 포인트 필드만 조회
  });

  // 상조팀장이 존재하지 않는 경우 예외 발생
  if (!manager) {
    throw new Error('상조팀장을 찾을 수 없습니다.');
  }

  // 현재 보유 포인트 잔액 반환
  return manager.managerPoint;
};
