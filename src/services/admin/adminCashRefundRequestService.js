/**
 * 관리자 캐시 환급 요청 서비스
 * - 환급 요청(상조팀장/장례식장) 목록·히스토리 조회, 승인/거절 처리, 알림/문자 발송을 담당합니다.
 * - 승인/거절 처리 시 트랜잭션으로 상태 일관성을 보장하며, 처리 완료 후 FCM 알림 및 CoolSMS 문자 발송을 수행합니다.
 */
import db from '../../models/index.js';
import * as cashRefundDao from '../../daos/admin/adminCashRefundDao.js'; // 수정된 파일명
import * as managerUserDao from '../../daos/manager/managerUserDao.js';
import * as funeralUserDao from '../../daos/funeral/funeralUserDao.js';
import * as managerCashDao from '../../daos/manager/managerCashDao.js';
import * as funeralCashDao from '../../daos/funeral/funeralCashDao.js';
import fcmService from '../common/fcmService.js';
import logger from '../../config/logger.js';
import * as adminUserDao from '../../daos/admin/adminUserDao.js';
import coolsms from 'coolsms-node-sdk';

// CoolSMS 클라이언트 (문자 발송)
const client = new coolsms.default(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

/**
 * 상조팀장 환급 요청 목록(상태별 그룹) 조회
 *
 * 반환:
 * - { requested: Refund[], approved: Refund[], rejected: Refund[] }
 */
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

/**
 * 환급 요청 승인/거절 처리
 *
 * 입력:
 * - type: 'manager' | 'funeral'
 * - requestId: string
 * - action: 'approve' | 'reject'
 * - reason?: string (거절 사유 등)
 *
 * 동작:
 * - 트랜잭션 시작 → 환급요청 valid 체크 → 상태 갱신
 * - approve: 캐시 히스토리 상태를 pending → completed로 변경 (잔액 원복 없음)
 * - reject: 캐시 재지급 및 히스토리 상태를 pending → cancelled로 변경 (잔액 원복)
 * - 커밋 후 FCM 알림 전송, 필요 시 CoolSMS 문자 발송(상위 레벨에서 호출)
 *
 * 반환:
 * - { success: true, message, refundRequest }
 *
 * 오류:
 * - 처리 불가 상태, 대상 없음, DB 오류 시 예외 throw (롤백)
 */
export const processRefundApproval = async ({ type, requestId, action, reason = null }) => {
  const transaction = await db.sequelize.transaction();

  try {
    const isManager = type === 'manager';

    const refundRequest = isManager
      ? await cashRefundDao.findManagerRefundById(requestId)
      : await cashRefundDao.findFuneralRefundById(requestId);

    if (!refundRequest) throw new Error('환급 요청을 찾을 수 없습니다.');
    if (refundRequest.status !== 'requested') throw new Error('이미 처리된 요청입니다.');

    const status = action === 'approve' ? 'approved' : 'rejected';

    // 상태 업데이트
    await refundRequest.update({ status }, { transaction });
    console.log('🚀 ~ processRefundApproval ~ refundRequest:', refundRequest);

    if (action === 'approve') {
      // 승인 시 → 캐시 히스토리 상태만 'completed'로 변경
      if (isManager) {
        const manager = await managerUserDao.findById(refundRequest.managerId);
        const currentCash = Number(manager.managerCash) || 0;
        const newBalance = currentCash;
        await managerCashDao.updateCashHistoryStatusApprove(
          refundRequest.managerId,
          'withdraw_cash',
          'pending',
          'completed',
          { transaction },
          newBalance,
        );
      } else {
        const funeral = await funeralUserDao.findById(refundRequest.funeralId);
        const currentCash = Number(funeral.funeralCash) || 0;
        const newBalance = currentCash;
        await funeralCashDao.updateCashHistoryStatusApprove(
          refundRequest.funeralId,
          'withdraw_cash',
          'pending',
          'completed',
          { transaction },
          newBalance,
        );
      }
    } else {
      // 거절 시 → 캐시 다시 지급
      if (isManager) {
        try {
          // 현재 매니저 캐시 잔액 조회
          const manager = await managerUserDao.findById(refundRequest.managerId);
          if (!manager) throw new Error('매니저를 찾을 수 없습니다.');

          // 값 검증 및 안전한 변환
          const currentCash = Number(manager.managerCash) || 0;
          const refundAmount = Number(refundRequest.amount || refundRequest.refundAmount) || 0;

          if (refundAmount <= 0) {
            throw new Error('환급 금액이 유효하지 않습니다.');
          }

          // 캐시 다시 지급
          const newBalance = currentCash + refundAmount;
          logger.log('🚀 ~ processRefundApproval ~ newBalance:', newBalance);

          await managerCashDao.updateManagerCash(refundRequest.managerId, newBalance, {
            transaction,
          });

          // 캐시 히스토리 상태를 'cancelled'로 업데이트하고 잔액도 원래대로 되돌림
          await managerCashDao.updateCashHistoryStatusReject(
            refundRequest.managerId,
            'withdraw_cash',
            'pending',
            'cancelled', // 수정: rejected → cancelled
            { transaction },
            newBalance, // 추가: 잔액 업데이트
          );
        } catch (managerError) {
          console.error('매니저 캐시 환급 처리 중 오류:', managerError.message);
          throw new Error(`매니저 캐시 환급 처리 실패: ${managerError.message}`);
        }
      } else {
        try {
          // 현재 장례식장 캐시 잔액 조회
          const funeral = await funeralUserDao.findById(refundRequest.funeralId);
          if (!funeral) throw new Error('장례식장을 찾을 수 없습니다.');

          // 값 검증 및 안전한 변환
          const currentCash = Number(funeral.funeralCash) || 0;
          const refundAmount = Number(refundRequest.amount || refundRequest.refundAmount) || 0;

          if (refundAmount <= 0) {
            throw new Error('환급 금액이 유효하지 않습니다.');
          }

          // 캐시 다시 지급
          const newBalance = currentCash + refundAmount;
          await funeralCashDao.updateFuneralCash(refundRequest.funeralId, newBalance, {
            transaction,
          });

          // 캐시 히스토리 상태를 'cancelled'로 업데이트 (rejected → cancelled)
          await funeralCashDao.updateCashHistoryStatusReject(
            refundRequest.funeralId,
            'withdraw_cash',
            'pending',
            'cancelled', // 수정: rejected → cancelled
            { transaction },
            newBalance, // 추가: 잔액 업데이트
          );
        } catch (funeralError) {
          console.error('장례식장 캐시 환급 처리 중 오류:', funeralError.message);
          throw new Error(`장례식장 캐시 환급 처리 실패: ${funeralError.message}`);
        }
      }
    }

    // 트랜잭션 커밋
    await transaction.commit();

    // 신청자에게 환급 결과 알림 전송 (트랜잭션 외부에서 실행)
    const receiverId = isManager ? refundRequest.managerId : refundRequest.funeralId;
    const receiverType = isManager ? 'manager' : 'funeral';
    const notificationType = action === 'approve' ? 'cash_refund_approved' : 'cash_refund_rejected';
    const adminUser = await adminUserDao.findById();

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
        senderId: adminUser.adminId,
        senderType: 'admin',
      });

      logger.info(`환급 ${status} 알림 전송 성공: ${receiverType} ${receiverId}`);
    } catch (notificationError) {
      logger.error(
        `환급 ${status} 알림 전송 실패: ${receiverType} ${receiverId}`,
        notificationError,
      );
      // 알림 전송 실패해도 환급 처리 자체는 성공으로 처리
    }

    return {
      success: true,
      message: action === 'approve' ? '환급 요청이 승인되었습니다.' : '환급 요청이 거절되었습니다.',
      refundRequest,
    };
  } catch (error) {
    // 트랜잭션 롤백
    await transaction.rollback();
    console.error('환급 승인/거절 처리 중 오류:', error.message);
    throw new Error(`환급 승인/거절 처리 실패: ${error.message}`);
  }
};

/**
 * 전체 환급 요청 목록(상태별 그룹) 조회
 *
 * 입력:
 * - type: 'manager' | 'funeral' | 'all' (기본값 all)
 *
 * 반환:
 * - { requested, approved, rejected }
 */
export const getAllRefundRequests = async (type = 'all') => {
  try {
    const managerRefunds = await cashRefundDao.findManagerRefundRequests();
    const funeralRefunds = await cashRefundDao.findFuneralRefundRequests();

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

/**
 * 캐시 환급 처리 히스토리 조회
 *
 * 입력:
 * - type: 'manager' | 'funeral' | 'all'
 *
 * 반환:
 * - 환급 히스토리 배열
 */
export const getCashRefundHistory = async (type = 'all') => {
  const managerHistory = await cashRefundDao.getManagerCashRefundHistory();
  const funeralHistory = await cashRefundDao.getFuneralCashRefundHistory();

  if (type === 'manager') return managerHistory;
  if (type === 'funeral') return funeralHistory;
  return [...managerHistory, ...funeralHistory];
};

/**
 * 특정 유저의 환급 신청 내역 조회
 *
 * 입력:
 * - userId: string
 * - type: 'manager' | 'funeral'
 *
 * 반환:
 * - { type, refundRequests }
 */
export const getRefundRequestsByUserId = async (userId, type) => {
  try {
    if (type === 'manager') {
      const refundRequests = await cashRefundDao.findManagerRefundsByUserId(userId);
      return { type: 'manager', refundRequests };
    }

    if (type === 'funeral') {
      const refundRequests = await cashRefundDao.findFuneralRefundsByUserId(userId);
      return { type: 'funeral', refundRequests };
    }

    throw new Error('유효하지 않은 타입입니다. (manager, funeral 중 하나)');
  } catch (error) {
    console.error('특정 유저 환급 신청 내역 조회 오류:', error.message);
    throw new Error(`환급 신청 내역 조회 실패: ${error.message}`);
  }
};

/**
 * 특정 유저의 승인된 환급 신청 내역 조회
 *
 * 입력:
 * - userId: string
 * - type: 'manager' | 'funeral'
 *
 * 반환:
 * - { type, refundRequests: approvedOnly[] }
 */
export const getApprovedRefundRequestsByUserId = async (userId, type) => {
  try {
    if (type === 'manager') {
      const refundRequests = await cashRefundDao.findManagerRefundsByUserId(userId);
      const approvedRequests = refundRequests.filter((req) => req.status === 'approved');
      return { type: 'manager', refundRequests: approvedRequests };
    }

    if (type === 'funeral') {
      const refundRequests = await cashRefundDao.findFuneralRefundsByUserId(userId);
      const approvedRequests = refundRequests.filter((req) => req.status === 'approved');
      return { type: 'funeral', refundRequests: approvedRequests };
    }

    throw new Error('유효하지 않은 타입입니다. (manager, funeral 중 하나)');
  } catch (error) {
    console.error('특정 유저 승인된 환급 신청 내역 조회 오류:', error.message);
    throw new Error(`승인된 환급 신청 내역 조회 실패: ${error.message}`);
  }
};

/**
 * 승인 안내 SMS 발송 (CoolSMS)
 * - 실패 시 에러 로깅만 수행하며 서비스 흐름에 영향 주지 않음
 */
export const sendApprovalSMS = async (phoneNumber, message) => {
  try {
    await client.sendOne({
      to: phoneNumber,
      from: process.env.COOLSMS_SENDER_NUMBER,
      text: message,
    });
  } catch (error) {
    console.error('승인 SMS 전송 실패:', error);
  }
};

/**
 * 거절 안내 SMS 발송 (CoolSMS)
 * - 실패 시 에러 로깅만 수행하며 서비스 흐름에 영향 주지 않음
 */
export const sendRejectionSMS = async (phoneNumber, message) => {
  try {
    await client.sendOne({
      to: phoneNumber,
      from: process.env.COOLSMS_SENDER_NUMBER,
      text: message,
    });
  } catch (error) {
    console.error('거절 SMS 전송 실패:', error);
  }
};

/**
 * 환급 요청 ID로 대상 사용자(매니저/장례식장) 정보 조회
 * - 알림/SMS 발송에 필요한 전화번호 조회 등 보조 기능
 */
export const getRefundRequestById = async (requestId, type) => {
  const refundRequest = await cashRefundDao.findManagerRefundById(requestId);
  console.log('🚀 ~ getRefundRequestById ~ refundRequest:', refundRequest);
  if (type === 'manager') {
    const manager = await cashRefundDao.findManagerById(refundRequest.managerId);
    console.log('🚀 ~ getRefundRequestById ~ manager:', manager);
    return manager;
  } else if (type === 'funeral') {
    const funeral = await cashRefundDao.findFuneralById(refundRequest.funeralId);
    console.log('🚀 ~ getRefundRequestById ~ funeral:', funeral);
    return funeral;
  }
};
