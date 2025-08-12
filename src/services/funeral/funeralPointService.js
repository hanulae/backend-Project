/**
 * 장례식장 포인트 관리 서비스
 * - 장례식장의 포인트를 캐시로 환급하는 기능을 제공합니다.
 * - 포인트 잔액 조회, 포인트-캐시 환급, 환급 이력 관리 기능을 수행합니다.
 * - 최소 환급 금액(10만 포인트) 제한을 통해 효율적인 포인트 관리를 지원합니다.
 * - 포인트 차감과 캐시 증가를 동시에 처리하여 데이터 정합성을 보장합니다.
 */
import * as funeralPointDao from '../../daos/funeral/funeralPointDao.js';

/**
 * 포인트를 캐시로 환급
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 * - amount: number — 환급할 포인트 금액
 *
 * 동작:
 * 1) 환급 금액 유효성 검증 (10만 포인트 이상)
 * 2) 장례식장 정보 조회 및 존재 여부 확인
 * 3) 보유 포인트 잔액과 환급 요청 금액 비교 검증
 * 4) 포인트 차감 및 캐시 증가 동시 처리
 * 5) 환급 이력 기록 (포인트 차감, 캐시 증가 정보 포함)
 *
 * 검증 사항:
 * - amount >= 100000: 최소 환급 금액은 10만 포인트
 * - funeral.funeralPoint >= amount: 보유 포인트가 환급 요청 금액보다 많아야 함
 *
 * 포인트-캐시 변환:
 * - 포인트 차감: funeral.funeralPoint - amount
 * - 캐시 증가: funeral.funeralCash + amount
 * - 두 작업을 동시에 수행하여 데이터 정합성 보장
 *
 * 반환:
 * - Object: 생성된 환급 이력 레코드
 *
 * 예외:
 * - 최소 금액 미달: '10만 포인트 이상부터 환급이 가능합니다.'
 * - 장례식장 없음: '장례식장 정보를 찾을 수 없습니다.'
 * - 포인트 부족: '보유 포인트가 부족합니다. 현재 보유 포인트: {금액}원'
 * - 환급 처리 실패: '🔴 포인트 환급 오류: {원인}' 형태로 Error throw
 *
 * 환급 이력 정보:
 * - funeralId: 장례식장 ID
 * - funeralPointAmount: 환급된 포인트 금액
 * - funeralPointBalanceAfter: 환급 후 포인트 잔액
 * - funeralCashAmount: 증가된 캐시 금액
 * - funeralCashBalanceAfter: 환급 후 캐시 잔액
 *
 * 참고:
 * - 포인트와 캐시는 1:1 비율로 환급됩니다.
 * - 환급 후 포인트는 영구적으로 차감되며 복구되지 않습니다.
 * - 최소 환급 금액 제한으로 인해 소액 포인트는 환급할 수 없습니다.
 */
export const convertPointToCash = async ({ funeralId, amount }) => {
  try {
    if (!amount || amount < 100000) {
      throw new Error('10만 포인트 이상부터 환급이 가능합니다.');
    }

    const funeral = await funeralPointDao.findFuneralById(funeralId);
    if (!funeral) throw new Error('장례식장 정보를 찾을 수 없습니다.');

    if (funeral.funeralPoint < amount) {
      throw new Error(`보유 포인트가 부족합니다. 현재 보유 포인트: ${funeral.funeralPoint}원`);
    }

    const newPoint = funeral.funeralPoint - amount;
    const newCash = funeral.funeralCash + amount;

    // 포인트 차감 및 캐시 증가
    await funeralPointDao.updatePointAndCash(funeralId, newPoint, newCash);

    // 환급 이력 기록
    const result = await funeralPointDao.createPointToCashRequest({
      funeralId,
      funeralPointAmount: amount,
      funeralPointBalanceAfter: newPoint,
      funeralCashAmount: amount,
      funeralCashBalanceAfter: newCash,
    });

    return result;
  } catch (error) {
    throw new Error('🔴 포인트 환급 오류:', error.message);
  }
};

/**
 * 현재 포인트 잔액 조회
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 *
 * 동작:
 * - DAO를 통해 해당 장례식장의 현재 포인트 잔액을 조회합니다.
 *
 * 반환:
 * - number: 현재 포인트 잔액
 *
 * 예외:
 * - 조회 실패 시 DAO에서 발생한 오류를 그대로 전파합니다.
 *
 * 참고:
 * - 포인트 잔액은 실시간으로 조회됩니다.
 * - 포인트는 장례식장별로 독립적으로 관리됩니다.
 */
export const getCurrentPoint = async (funeralId) => {
  return await funeralPointDao.getCurrentPoint(funeralId);
};
