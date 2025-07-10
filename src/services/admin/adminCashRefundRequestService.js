import * as cashRefundDao from '../../daos/admin/adminCashRefundDao.js';
import * as managerCashDao from '../../daos/manager/managerCashDao.js';
import * as funeralCashDao from '../../daos/funeral/funeralCashDao.js';
import logger from '../../config/logger.js';
import fcmService from '../common/fcmService.js';

export const getGroupedManagerRefundRequests = async () => {
  const all = await cashRefundDao.findManagerRefundRequests();

  return {
    requested: all.filter((req) => req.status === 'requested'),
    approved: all.filter((req) => req.status === 'approved'),
    rejected: all.filter((req) => req.status === 'rejected'),
  };
};

export const getGroupedFuneralRefundRequests = async () => {
  const all = await cashRefundDao.findFuneralRefundRequests();

  return {
    requested: all.filter((req) => req.status === 'requested'),
    approved: all.filter((req) => req.status === 'approved'),
    rejected: all.filter((req) => req.status === 'rejected'),
  };
};

export const processRefundApproval = async ({ type, requestId, action, reason = null }) => {
  const isManager = type === 'manager';

  const refundRequest = isManager
    ? await cashRefundDao.findManagerRefundById(requestId)
    : await cashRefundDao.findFuneralRefundById(requestId);

  if (!refundRequest) throw new Error('환급 요청을 찾을 수 없습니다.');
  if (refundRequest.status !== 'requested') throw new Error('이미 처리된 요청입니다.');

  const status = action === 'approve' ? 'approved' : 'rejected';

  // 상태 업데이트
  await refundRequest.update({ status });

  // 승인 시 → 실제 캐시 차감
  if (action === 'approve') {
    if (isManager) {
      await managerCashDao.updateManagerCash(
        refundRequest.managerId,
        refundRequest.managerCashBalanceAfter,
      );
    } else {
      await funeralCashDao.updateFuneralCash(
        refundRequest.funeralId,
        refundRequest.funeralCashBalanceAfter,
      );
    }
  }

  // 신청자에게 환급 결과 알림 전송
  const receiverId = isManager ? refundRequest.managerId : refundRequest.funeralId;
  const receiverType = isManager ? 'manager' : 'funeral';
  const notificationType = action === 'approve' ? 'cash_refund_approved' : 'cash_refund_rejected';

  try {
    await fcmService.sendNotificationToUser({
      receiverId: receiverId,
      receiverType: receiverType,
      notificationType: notificationType,
      data: {
        requestId: requestId,
        amount: refundRequest.amount,
        reason: reason,
        processedAt: new Date().toISOString(),
      },
      senderId: 'admin',
      senderType: 'admin',
    });

    logger.info(`환급 ${status} 알림 전송 성공: ${receiverType} ${receiverId}`);
  } catch (notificationError) {
    logger.error(`환급 ${status} 알림 전송 실패: ${receiverType} ${receiverId}`, notificationError);
    // 알림 전송 실패해도 환급 처리 자체는 성공으로 처리
  }

  return refundRequest;
};

export const getAllRefundRequests = async (type = 'all') => {
  try {
    console.log('🚀 ~ getAllRefundRequests ~ type:', type);
    const managerRefunds = await cashRefundDao.findManagerRefundRequests();
    console.log('🚀 ~ getAllRefundRequests ~ managerRefunds:', managerRefunds);
    const funeralRefunds = await cashRefundDao.findFuneralRefundRequests();
    console.log('🚀 ~ getAllRefundRequests ~ funeralRefunds:', funeralRefunds);

    const managerRefundsWithType = managerRefunds.map((item) => ({
      ...(item.toJSON ? item.toJSON() : item),
      userType: 'manager',
    }));
    const funeralRefundsWithType = funeralRefunds.map((item) => ({
      ...(item.toJSON ? item.toJSON() : item),
      userType: 'funeral',
    }));

    let combined = [];
    if (type === 'manager') {
      combined = managerRefundsWithType;
    } else if (type === 'funeral') {
      combined = funeralRefundsWithType;
    } else {
      combined = [...managerRefundsWithType, ...funeralRefundsWithType];
    }

    return {
      requested: combined.filter((req) => req.status === 'requested'),
      approved: combined.filter((req) => req.status === 'approved'),
      rejected: combined.filter((req) => req.status === 'rejected'),
    };
  } catch (error) {
    throw new Error('전체 환급 요청 목록 조회 실패: ' + error.message);
  }
};

export const getCashRefundHistory = async (type = 'all') => {
  const managerHistory = await cashRefundDao.getManagerCashRefundHistory();
  const funeralHistory = await cashRefundDao.getFuneralCashRefundHistory();

  if (type === 'manager') return managerHistory;
  if (type === 'funeral') return funeralHistory;
  return [...managerHistory, ...funeralHistory];
};
