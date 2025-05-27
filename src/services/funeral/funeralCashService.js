import { getPortOneToken, verifyPortOnePayment } from '../../utils/portone.js';
import * as funeralCashDao from '../../daos/funeral/funeralCashHistoryDao.js';
import db from '../../models/index.js';

export const topupCash = async ({ imp_uid, amount, funeralId }) => {
  const transaction = await db.sequelize.transaction();
  try {
    const token = await getPortOneToken();
    const paymentData = await verifyPortOnePayment(token, imp_uid);

    if (paymentData.amount !== amount) {
      throw new Error('결제 금액이 일치하지 않습니다.');
    }

    const funeral = await db.Funeral.findByPk(funeralId, { transaction });
    if (!funeral) throw new Error('장례식장 정보가 존재하지 않습니다.');

    const newBalance = funeral.funeralCash + amount;

    await db.Funeral.update({ funeralCash: newBalance }, { where: { funeralId }, transaction });

    const cashHistory = await funeralCashDao.create(
      {
        funeralId,
        transactionType: 'earn_cash',
        funeralCashAmount: amount,
        funeralCashBalanceAfter: newBalance,
        status: 'completed',
      },
      { transaction },
    );

    await transaction.commit();
    return cashHistory;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
