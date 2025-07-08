import db from '../../models/index.js';

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
