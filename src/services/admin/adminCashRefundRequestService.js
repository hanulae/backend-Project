import * as cashRefundDao from '../../daos/admin/adminCashRefundDao.js';
import * as managerCashDao from '../../daos/manager/managerCashDao.js';
import * as funeralCashDao from '../../daos/funeral/funeralCashDao.js';

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

export const processRefundApproval = async ({ type, requestId, action }) => {
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

  return refundRequest;
};
