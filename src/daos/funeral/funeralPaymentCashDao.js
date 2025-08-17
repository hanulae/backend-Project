/**
 * 장례식장 결제 및 캐시 관리 DAO (Data Access Object)
 * - 장례식장의 결제 처리와 캐시 잔액 관리를 담당하는 데이터베이스 작업을 처리합니다.
 * - 결제 생성, 조회, 업데이트, 캐시 히스토리 생성 등의 기능을 제공합니다.
 * - Sequelize ORM과 트랜잭션을 사용하여 데이터 일관성을 보장합니다.
 * - 결제 상태에 따른 캐시 잔액 자동 조정을 지원합니다.
 * - 결제 성공/취소 시 캐시 히스토리를 자동으로 생성하여 거래 이력을 추적합니다.
 * - 안전한 결제 처리를 위한 트랜잭션 롤백 기능을 제공합니다.
 */
import db from '../../models/index.js';
import { sequelize } from '../../config/database.js';

/**
 * 대기 중인 결제 정보 생성
 *
 * 입력:
 * - merchantUid: string — 결제 고유 식별자 (상점 주문 ID)
 * - amount: number — 결제 금액
 * - funeralId: string — 결제할 장례식장의 고유 ID
 *
 * 동작:
 * 1) funeralId 유효성 검증 (필수값 확인)
 * 2) 새로운 FuneralPayment 레코드 생성
 * 3) 초기 상태를 'pending'으로 설정
 * 4) impUid는 null로 초기화 (결제 완료 후 설정)
 *
 * 생성 정보:
 * - merchantUid: 결제 식별자
 * - amount: 결제 금액
 * - funeralId: 장례식장 ID
 * - status: 'pending' (대기 중)
 * - impUid: null (결제 완료 후 설정)
 * - 자동 생성: ID, createdAt, updatedAt
 *
 * 반환:
 * - Object: 생성된 결제 정보 객체
 *
 * 예외:
 * - funeralId 누락: 'funeralId는 필수입니다.' 형태로 Error throw
 * - DB 생성 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 결제 요청 시 초기 결제 정보를 생성할 때 사용됩니다.
 * - 결제 상태는 'pending'으로 시작하여 결제 완료 시 'paid'로 변경됩니다.
 * - impUid는 아임포트 결제 완료 후 설정되는 실제 결제 식별자입니다.
 * - 결제 생성과 동시에 결제 상태를 추적할 수 있습니다.
 * - 장례식장 ID는 필수값으로 결제와 장례식장을 연결합니다.
 */
export const createPendingPayment = async ({ merchantUid, amount, funeralId }) => {
  // funeralId가 유효한지 확인
  if (!funeralId) {
    throw new Error('funeralId는 필수입니다.');
  }

  return await db.FuneralPayment.create({
    merchantUid,
    amount,
    funeralId,
    status: 'pending',
    impUid: null,
  });
};

/**
 * 상점 주문 ID로 결제 정보 조회
 *
 * 입력:
 * - merchantUid: string — 조회할 결제의 상점 주문 ID
 *
 * 동작:
 * 1) merchantUid로 특정 결제 정보를 데이터베이스에서 조회
 * 2) findOne을 사용하여 단일 결제 레코드 반환
 * 3) 해당하는 결제가 없으면 null 반환
 *
 * 조회 조건:
 * - merchantUid: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Object|null: 조회된 결제 정보 객체 또는 null (없는 경우)
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 결제 상태 확인이나 결제 정보 업데이트 전 검증에 사용됩니다.
 * - merchantUid는 상점에서 생성하는 고유한 주문 식별자입니다.
 * - 결제가 존재하지 않는 경우 null을 반환하여 안전하게 처리할 수 있습니다.
 * - 결제 상태, 금액, 장례식장 정보 등을 확인할 수 있습니다.
 * - 결제 완료 후 impUid가 설정되어 실제 결제 식별자로 활용됩니다.
 */
export const findByMerchantUid = async (merchantUid) => {
  return await db.FuneralPayment.findOne({
    where: { merchantUid },
  });
};

/**
 * 결제 정보 업데이트 및 캐시 히스토리 생성
 *
 * 입력:
 * - merchantUid: string — 업데이트할 결제의 상점 주문 ID
 * - impUid: string — 아임포트 결제 완료 ID
 * - status: string — 결제 상태 ('paid', 'cancelled' 등)
 * - funeralId: string — 장례식장 ID
 * - amount: number — 결제 금액
 * - buyerName: string — 구매자 이름
 *
 * 동작:
 * 1) 트랜잭션 시작
 * 2) 결제 정보 업데이트 (impUid, status, buyerName, paymentDate)
 * 3) 결제 상태에 따른 캐시 잔액 조정:
 *    - 'paid': 캐시 잔액 증가 (+amount)
 *    - 'cancelled': 캐시 잔액 감소 (-amount)
 * 4) 캐시 히스토리 생성 (거래 이력 추적)
 * 5) 트랜잭션 커밋 또는 롤백
 *
 * 업데이트 정보:
 * - impUid: 실제 결제 식별자
 * - status: 최종 결제 상태
 * - buyerName: 구매자 정보
 * - paymentDate: 결제 완료 시 현재 시간 (status가 'paid'인 경우)
 *
 * 캐시 처리:
 * - 결제 성공: 장례식장 캐시 잔액 증가
 * - 결제 취소: 장례식장 캐시 잔액 감소
 * - 히스토리: 모든 거래를 기록하여 추적 가능
 *
 * 반환:
 * - Object: 업데이트된 결제 정보 객체
 *
 * 예외:
 * - 결제 정보 없음: '업데이트할 결제 정보를 찾을 수 없습니다.' 형태로 Error throw
 * - 장례식장 정보 없음: '장례식장 정보를 찾을 수 없습니다.' 형태로 Error throw
 * - 트랜잭션 실패: 자동 롤백 후 원본 오류 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 결제 완료 또는 취소 시 호출되어 결제 상태를 최종 처리합니다.
 * - 트랜잭션을 사용하여 결제 업데이트와 캐시 조정을 원자적으로 처리합니다.
 * - 결제 성공 시 자동으로 장례식장의 캐시 잔액이 증가합니다.
 * - 결제 취소 시 자동으로 장례식장의 캐시 잔액이 감소합니다.
 * - 모든 거래는 캐시 히스토리에 기록되어 추적이 가능합니다.
 * - 오류 발생 시 자동으로 롤백되어 데이터 일관성이 보장됩니다.
 * - paymentDate는 결제 완료 시에만 설정되어 결제 시점을 정확히 기록합니다.
 * - buyerName을 통해 결제자 정보를 추적할 수 있습니다.
 */
export const updatePaymentAndCreateHistory = async ({
  merchantUid,
  impUid,
  status,
  funeralId,
  amount,
  buyerName,
}) => {
  const transaction = await sequelize.transaction();
  try {
    // 1. 결제 정보 업데이트
    const [affectedRows] = await db.FuneralPayment.update(
      {
        impUid: impUid,
        status: status,
        buyerName: buyerName,
        paymentDate: status === 'paid' ? new Date() : null,
      },
      {
        where: { merchantUid },
        transaction,
      },
    );

    if (affectedRows === 0) {
      throw new Error('업데이트할 결제 정보를 찾을 수 없습니다.');
    }

    // 2. status에 따라 캐시 증감 및 히스토리 생성
    const funeral = await db.Funeral.findByPk(funeralId, { transaction });
    if (!funeral) throw new Error('장례식장 정보를 찾을 수 없습니다.');
    let newBalance = funeral.funeralCash;

    if (status === 'paid') {
      newBalance += amount;
      await db.Funeral.update({ funeralCash: newBalance }, { where: { funeralId }, transaction });
      await db.FuneralCashHistory.create(
        {
          funeralId,
          transactionType: 'earn_cash',
          funeralCashAmount: amount,
          funeralCashBalanceAfter: newBalance,
          funeralPaymentId: impUid,
          merchantUid: merchantUid,
          status: 'completed',
        },
        { transaction },
      );
    } else if (status === 'cancelled') {
      newBalance -= amount;
      await db.Funeral.update({ funeralCash: newBalance }, { where: { funeralId }, transaction });
      await db.FuneralCashHistory.create(
        {
          funeralId,
          transactionType: 'earn_cash',
          funeralCashAmount: -amount,
          funeralCashBalanceAfter: newBalance,
          funeralPaymentId: impUid,
          merchantUid: merchantUid,
          status: 'cancelled',
        },
        { transaction },
      );
    }

    await transaction.commit();
    return await db.FuneralPayment.findOne({ where: { merchantUid } });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
