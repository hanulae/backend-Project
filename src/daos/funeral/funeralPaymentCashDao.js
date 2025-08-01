import db from '../../models/index.js';
import { sequelize } from '../../config/database.js';

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

export const findByMerchantUid = async (merchantUid) => {
  return await db.FuneralPayment.findOne({
    where: { merchantUid },
  });
};

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
