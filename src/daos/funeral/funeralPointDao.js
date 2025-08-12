/**
 * 장례식장 포인트 관리 DAO (Data Access Object)
 * - 장례식장의 포인트 시스템과 관련된 모든 데이터베이스 작업을 담당합니다.
 * - 포인트를 캐시로 환급하는 요청 처리, 장례식장 정보 조회 및 업데이트, 포인트 잔액 조회 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 이모지를 사용하여 로그 메시지를 시각적으로 구분하여 디버깅을 용이하게 합니다.
 * - 포인트와 캐시 간의 환급 시스템을 체계적으로 관리합니다.
 */
import db from '../../models/index.js';

/**
 * 포인트를 캐시로 환급하는 요청 기록 생성
 *
 * 입력:
 * - funeralId: number — 환급할 장례식장의 고유 ID
 * - funeralPointAmount: number — 환급할 포인트 금액 (차감될 금액)
 * - funeralPointBalanceAfter: number — 환급 후 포인트 잔액
 * - funeralCashAmount: number — 환급받을 캐시 금액 (증가될 금액)
 * - funeralCashBalanceAfter: number — 환급 후 캐시 잔액
 *
 * 동작:
 * 1) 입력받은 환급 정보로 새로운 포인트 히스토리 레코드 생성
 * 2) 거래 유형을 'point_to_cash'로 설정
 * 3) 거래 상태를 'completed'로 설정
 * 4) 거래 발생 시간을 현재 시간으로 자동 설정
 * 5) 오류 발생 시 이모지와 함께 상세한 오류 메시지 전달
 *
 * 생성 정보:
 * - 장례식장 ID, 포인트 금액, 포인트 잔액
 * - 캐시 금액, 캐시 잔액
 * - 거래 유형: 'point_to_cash' (포인트 → 캐시 환급)
 * - 거래 상태: 'completed' (완료됨)
 * - 거래 발생 시간: 현재 시간
 * - 자동 생성: ID, createdAt, updatedAt
 *
 * 반환:
 * - Object: 생성된 포인트 히스토리 레코드
 *
 * 예외:
 * - DB 생성 실패: '🔴 포인트 환급 기록 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 장례식장이 보유한 포인트를 현금으로 환급할 때 사용됩니다.
 * - 🔴 이모지를 통해 포인트 환급 관련 오류를 시각적으로 구분할 수 있습니다.
 * - 포인트 차감과 캐시 증가를 동시에 기록하여 거래 이력을 추적할 수 있습니다.
 * - 거래 상태가 'completed'로 설정되어 즉시 처리 완료를 의미합니다.
 * - 거래 발생 시간을 통해 환급 요청의 정확한 시점을 기록합니다.
 */
export const createPointToCashRequest = async ({
  funeralId,
  funeralPointAmount,
  funeralPointBalanceAfter,
  funeralCashAmount,
  funeralCashBalanceAfter,
}) => {
  try {
    return await db.FuneralPointHistory.create({
      funeralId,
      transactionType: 'point_to_cash', // 거래 유형: 포인트 → 캐시 환급
      funeralPointAmount,
      funeralPointBalanceAfter,
      funeralCashAmount,
      funeralCashBalanceAfter,
      status: 'completed', // 거래 상태: 완료됨
      transactionDate: new Date(), // 거래 발생 시간
    });
  } catch (error) {
    throw new Error('🔴 포인트 환급 기록 실패: ' + error.message);
  }
};

/**
 * 장례식장 ID로 장례식장 정보 조회
 *
 * 입력:
 * - funeralId: number — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) funeralId로 특정 장례식장 조회
 * 2) findByPk를 사용하여 기본 키 기반 빠른 조회
 * 3) 해당하는 장례식장이 없으면 null 반환
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Object|null: 조회된 장례식장 정보 객체 또는 null (존재하지 않는 경우)
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 장례식장의 기본 정보를 조회할 때 사용됩니다.
 * - findByPk를 사용하여 빠른 조회 성능을 제공합니다.
 * - 반환값이 null인 경우 해당 ID의 장례식장이 존재하지 않음을 의미합니다.
 * - 장례식장 정보 확인, 업데이트 전 검증 등에 활용됩니다.
 * - 장례식장의 모든 정보에 접근할 수 있어 종합적인 관리에 활용됩니다.
 */
export const findFuneralById = async (funeralId) => {
  return await db.Funeral.findByPk(funeralId);
};

/**
 * 장례식장의 포인트와 캐시 잔액을 동시에 업데이트
 *
 * 입력:
 * - funeralId: number — 업데이트할 장례식장의 고유 ID
 * - newPoint: number — 새로운 포인트 잔액
 * - newCash: number — 새로운 캐시 잔액
 *
 * 동작:
 * 1) funeralId로 특정 장례식장의 포인트와 캐시 잔액을 새로운 값으로 업데이트
 * 2) 기본 update 옵션 사용
 * 3) 오류 발생 시 원본 오류를 그대로 전파
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Array: Sequelize update 결과 배열 [업데이트된 행 수]
 *
 * 예외:
 * - DB 업데이트 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 포인트 환급이나 다른 거래로 인해 포인트와 캐시가 동시에 변경될 때 사용됩니다.
 * - 반환값의 첫 번째 요소는 업데이트된 행의 수를 나타냅니다.
 * - 포인트 적립, 차감, 캐시 충전, 사용 등에 활용됩니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 * - 포인트와 캐시의 동기화된 업데이트를 통해 데이터 일관성을 보장합니다.
 */
export const updatePointAndCash = async (funeralId, newPoint, newCash) => {
  return await db.Funeral.update(
    { funeralPoint: newPoint, funeralCash: newCash },
    { where: { funeralId } },
  );
};

/**
 * 특정 장례식장의 현재 포인트 잔액 조회
 *
 * 입력:
 * - funeralId: number — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) funeralId로 특정 장례식장 조회
 * 2) 필요한 속성만 선택하여 반환 (성능 최적화)
 * 3) 장례식장이 존재하지 않으면 오류 발생
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환 속성:
 * - funeralPoint: 현재 포인트 잔액
 *
 * 반환:
 * - number: 현재 포인트 잔액
 *
 * 예외:
 * - 장례식장 없음: '장례식장을 찾을 수 없습니다.' 형태로 Error throw
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 포인트 잔액 확인이 필요한 모든 비즈니스 로직에서 사용됩니다.
 * - 필요한 속성만 반환하여 네트워크 트래픽과 메모리 사용량을 줄입니다.
 * - 장례식장 존재 여부를 먼저 확인하여 안전한 조회를 보장합니다.
 * - 포인트 잔액 확인, 결제 가능 여부 판단 등에 활용됩니다.
 * - 성능 최적화를 위해 최소한의 데이터만 조회합니다.
 * - 반환값은 숫자 타입으로 포인트 잔액을 직접 사용할 수 있습니다.
 */
export const getCurrentPoint = async (funeralId) => {
  const funeral = await db.Funeral.findByPk(funeralId, {
    attributes: ['funeralPoint'], // 포인트 필드만 조회하여 성능 최적화
  });

  if (!funeral) {
    throw new Error('장례식장을 찾을 수 없습니다.');
  }

  return funeral.funeralPoint;
};
