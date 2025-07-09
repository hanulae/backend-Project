import { getPortOneToken, verifyPortOnePayment } from '../../utils/portone.js';
import * as funeralCashHistoryDao from '../../daos/funeral/funeralCashHistoryDao.js';
import * as funeralCashDao from '../../daos/funeral/funeralCashDao.js';
import db from '../../models/index.js';
import logger from '../../config/logger.js';
import fcmService from '../common/fcmService.js';

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

    const cashHistory = await funeralCashHistoryDao.create(
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

// 캐시 환급 요청
export const requestCashRefund = async ({ funeralId, amountCash }) => {
  try {
    if (!amountCash || amountCash <= 0) {
      throw new Error('환급 요청 금액이 올바르지 않습니다.');
    }

    const funeral = await funeralCashHistoryDao.findFuneralById(funeralId);
    if (!funeral) throw new Error('장례식장 정보를 찾을 수 없습니다.');

    if (funeral.funeralCash < amountCash) {
      throw new Error(
        `환급 요청 금액이 보유 캐시보다 많습니다. 현재 보유 캐시: ${funeral.funeralCash}원`,
      );
    }

    const refundRequest = await funeralCashHistoryDao.createCashHistory({
      funeralId,
      transactionType: 'withdraw_cash',
      funeralCashAmount: amountCash,
      funeralCashBalanceAfter: funeral.funeralCash - amountCash,
      status: 'pending',
    });

    // 관리자에게 환급 요청 알림 전송
    try {
      // 관리자 계정 ID는 환경변수나 고정값으로 설정
      const adminId = process.env.ADMIN_USER_ID || 'admin';

      await fcmService.sendNotificationToUser({
        receiverId: adminId,
        receiverType: 'admin',
        notificationType: 'cash_refund_requested',
        data: {
          requestId: refundRequest.id,
          funeralId: funeralId,
          funeralName: funeral.funeralName,
          amount: amountCash,
          requestType: 'funeral',
        },
        senderId: funeralId,
        senderType: 'funeral',
      });
      logger.info(`장례식장 환급 요청 알림 전송 성공: 관리자 ${adminId}`);
    } catch (notificationError) {
      logger.error('장례식장 환급 요청 알림 전송 실패', notificationError);
      // 알림 전송 실패해도 환급 요청 자체는 성공으로 처리
    }

    return refundRequest;
  } catch (error) {
    throw new error('🔴 장례식장 환급 요청 실패:', error.message);
  }
};

// 캐시 히스토리 조회
export const getCashHistory = async (funeralId) => {
  try {
    return await funeralCashDao.findCashHistoryByFuneralId(funeralId);
  } catch (error) {
    console.error('캐시 내역 조회 오류:', error.message);
    throw error;
  }
};

// 현재 캐시 잔액 조회
export const getCurrentCash = async (funeralId) => {
  return await funeralCashDao.getCurrentCash(funeralId);
};
