import { sequelize } from '../../config/database.js';
import logger from '../../config/logger.js';
import dispatchRequestDao from '../../dao/common/dispatchRequestDao.js';
import managerFormDao from '../../dao/manager/managerFormDao.js';
import managerFormBidDao from '../../dao/manager/managerFormBidDao.js';
import transactionListDao from '../../dao/common/transactionListDao.js';
import {
  getFuneralPointAndCash,
  updateFuneralPointAndCash,
  getFuneralPhoneNumber,
} from '../../daos/funeral/funeralAuthDao.js';
import { updateManagerCash } from '../../daos/manager/managerCashDao.js';
import {
  createFuneralPointHistory,
  updateFuneralPointHistoryStatus,
} from '../../daos/funeral/funeralPointHistoryDao.js';
import {
  createFuneralCashHistory,
  updateFuneralCashHistoryStatus,
} from '../../daos/funeral/funeralCashHistoryDao.js';
import { createManagerCashHistory } from '../../daos/manager/managerCashHistoryDao.js';
import fcmService from '../common/fcmService.js';

class DispatchRequestService {
  // 상조 팀장 출동 신청 생성
  static async createDispatchRequest(params) {
    const transaction = await sequelize.transaction();
    try {
      // 1. 중복 신청 방지를 위한 확인
      const dispatchRequestCheckData = {
        managerId: params.managerId,
        funeralId: params.funeralId,
        managerFormId: params.managerFormId,
        managerFormBidId: params.managerFormBidId,
      };

      const checkDispatchRequest = await dispatchRequestDao.existingDispatchRequest(
        dispatchRequestCheckData,
        { transaction },
      );

      if (checkDispatchRequest) {
        throw new Error('실패: 중복된 정보의 출동 신청이 존재');
      }

      // 2. 문어발식 출동 신청 방지
      const managerFormStatus = await managerFormDao.getManagerFormDetail(params.managerFormId, {
        transaction,
      });

      if (
        managerFormStatus.formStatus === 'bid_selected' ||
        managerFormStatus.formStatus === 'bid_progress'
      ) {
        throw new Error('실패: 이미 다른 장례식에 출동 신청을 진행중');
      }

      // 3. 해당하는 managerForm의 formStatus를 bid_selected(출동 신청 승인 대기 상태)로 변경
      const managerForm = await managerFormDao.updateManagerFormStatus(
        params.managerFormId,
        'bid_selected',
        { transaction },
      );

      if (managerForm[0] === 0) {
        throw new Error(
          '실패: 출동 신청을 위해 입력받은 managerFormId로 등록된 견적서가 DB에서 확인되지 않거나 업데이트할 수 없습니다.',
        );
      }

      // 4. managerFormBid의 bidStatus를 bid_selected로 변경
      const managerFormBid = await managerFormBidDao.updateManagerFormBidStatus(
        {
          managerFormBidId: params.managerFormBidId,
        },
        'bid_selected',
        { transaction },
      );

      if (managerFormBid[0] === 0) {
        throw new Error(
          '실패: 출동 신청을 위해 입력받은 managerFormBidId로 등록된 견적서가 DB에서 확인되지 않거나 업데이트할 수 없습니다.',
        );
      }

      // 5. 출동 신청 생성
      const dispatchRequest = await dispatchRequestDao.createDispatchRequest(params, transaction);

      await transaction.commit();

      // 6. 트랜잭션 커밋 후 장례식장에게 알림 전송
      try {
        await fcmService.sendNotificationToUser({
          receiverId: params.funeralId,
          receiverType: 'funeral',
          notificationType: 'dispatch_requested',
          data: {
            dispatchRequestId: dispatchRequest.dispatchRequestId,
            managerFormId: params.managerFormId,
            managerFormBidId: params.managerFormBidId,
            chiefMournerName: managerFormStatus.chiefMournerName,
            funeralDate: managerFormStatus.funeralDate,
            funeralLocation: managerFormStatus.funeralLocation,
          },
          senderId: params.managerId,
          senderType: 'manager',
        });
        logger.info(`출동 신청 알림 전송 성공: 장례식장 ${params.funeralId}`);
      } catch (notificationError) {
        logger.error(`출동 신청 알림 전송 실패: 장례식장 ${params.funeralId}`, notificationError);
        // 알림 전송 실패해도 출동 신청 자체는 성공으로 처리
      }

      return dispatchRequest;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // (공통) manager, funeral 출동 신청 내역 리스트 조회
  static async getDispatchRequestList(userId) {
    const dispatchRequestList = await dispatchRequestDao.getDispatchRequestList(userId);

    return dispatchRequestList.map((item) => {
      const plainItem = item.get({ plain: true });
      const result = {
        dispatchRequestId: plainItem.dispatchRequestId,
        chiefMournerName: plainItem.managerForm?.chiefMournerName || null,
        isApproved: plainItem.isApproved,
        createdAt: plainItem.createdAt,
      };

      return result;
    });
  }

  // (공통) manager, funeral 출동 신청 내역 상세 조회
  static async getDispatchRequestDetail(dispatchRequestId) {
    const dispatchRequestDetail =
      await dispatchRequestDao.getDispatchRequestDetail(dispatchRequestId);

    return dispatchRequestDetail;
  }

  // 상조 팀장 출동 신청 취소
  static async cancelDispatchRequest(dispatchRequestId) {
    const transaction = await sequelize.transaction();
    try {
      // 1. 취소할 출동 요청서 상태 확인
      const getDispatchRequest = await dispatchRequestDao.getDispatchRequestDetail(
        dispatchRequestId,
        { transaction },
      );

      if (!getDispatchRequest) {
        throw new Error('실패: 존재하지 않는 출동 신청 내역');
      }

      if (
        getDispatchRequest.isApproved !== 'pending' &&
        getDispatchRequest.isApproved !== 'approved'
      ) {
        throw new Error('실패: 출동 신청 취소를 할 수 있는 상태가 아닙니다.');
      }
      // 2. 출동 요청서 상태를 canceled로 변경 및 softDelete 처리
      const cancelDispatchRequest = await dispatchRequestDao.updateDispatchRequestStatus(
        dispatchRequestId,
        'canceled',
        { transaction },
      );

      if (cancelDispatchRequest[0] === 0) {
        throw new Error('실패: 출동 취소 처리하려는 출동 신청 내역이 DB에서 찾을 수 없습니다.');
      }

      const destroyDispatchRequest = await dispatchRequestDao.destroyDispatchRequest(
        dispatchRequestId,
        { transaction },
      );

      if (destroyDispatchRequest[0] === 0) {
        throw new Error('실패: 출동 신청 취소 중 출동 신청 내역 삭제 처리 중 오류 발생');
      }

      // 3. managerForm의 formStatus를 bid_received로 변경
      const updateManagerFormStatus = await managerFormDao.updateManagerFormStatus(
        getDispatchRequest.managerFormId,
        'bid_received',
        { transaction },
      );

      if (updateManagerFormStatus[0] === 0) {
        throw new Error(
          '실패: 출동 신청 취소 중 처리하려는 견적서 내역이 DB에서 찾을 수 없습니다.',
        );
      }

      // 4. managerFormBid의 bidStatus를 bid_submitted로 변경
      const updateManagerFormBidStatus = await managerFormBidDao.updateManagerFormBidStatus(
        {
          managerFormBidId: getDispatchRequest.managerFormBidId,
        },
        'cancel',
        { transaction },
      );

      if (updateManagerFormBidStatus[0] === 0) {
        throw new Error('실패: 출동 신청 취소 중 처리하려는 입찰 내역이 DB에서 찾을 수 없습니다.');
      }

      await transaction.commit();

      // 5. 트랜잭션 커밋 후 장례식장에게 출동 취소 알림 전송
      try {
        await fcmService.sendNotificationToUser({
          receiverId: getDispatchRequest.funeralId,
          receiverType: 'funeral',
          notificationType: 'dispatch_cancelled',
          data: {
            dispatchRequestId: dispatchRequestId,
            managerFormId: getDispatchRequest.managerFormId,
            managerFormBidId: getDispatchRequest.managerFormBidId,
            chiefMournerName: getDispatchRequest.chiefMournerName || '상조팀장',
          },
          senderId: getDispatchRequest.managerId,
          senderType: 'manager',
        });
        logger.info(`출동 취소 알림 전송 성공: 장례식장 ${getDispatchRequest.funeralId}`);
      } catch (notificationError) {
        logger.error(
          `출동 취소 알림 전송 실패: 장례식장 ${getDispatchRequest.funeralId}`,
          notificationError,
        );
        // 알림 전송 실패해도 출동 취소 자체는 성공으로 처리
      }

      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // 장례식장 출동 신청 승인
  static async approveDispatchRequest(dispatchRequestId) {
    const transaction = await sequelize.transaction();
    try {
      // 1. 출동 신청서 상태 확인
      const getDispatchRequest = await dispatchRequestDao.getDispatchRequestDetail(
        dispatchRequestId,
        { transaction },
      );

      if (!getDispatchRequest) {
        throw new Error('실패: 존재하지 않는 출동 신청 내역');
      }

      if (getDispatchRequest.isApproved === 'approved') {
        throw new Error('실패: 이미 승인된 출동 신청 내역');
      } else if (getDispatchRequest.isApproved !== 'pending') {
        throw new Error('실패: 승인 가능한 상태가 아님');
      }

      // 2. 출동 신청서 상태를 approve로 변경
      const updateDispatchRequestStatus = await dispatchRequestDao.updateDispatchRequestStatus(
        dispatchRequestId,
        'approved',
        { transaction },
      );

      if (updateDispatchRequestStatus[0] === 0) {
        throw new Error('실패: 출동 신청서 상태 변경 중 오류 발생');
      }

      // 3. 견적서의 상태를 bid_progress로 변경
      const updateManagerFormStatus = await managerFormDao.updateManagerFormStatus(
        getDispatchRequest.managerFormId,
        'bid_progress',
        { transaction },
      );

      if (updateManagerFormStatus[0] === 0) {
        throw new Error('실패: 견적서 상태 변경 중 오류 발생');
      }

      // 4. 입찰서의 상태를 bid_progress로 변경
      const updateManagerFormBidStatus = await managerFormBidDao.updateManagerFormBidStatus(
        {
          managerFormBidId: getDispatchRequest.managerFormBidId,
        },
        'bid_progress',
        { transaction },
      );

      if (updateManagerFormBidStatus[0] === 0) {
        throw new Error('실패: 입찰서 상태 변경 중 오류 발생');
      }

      // 5. 다른 견적신청서들의 상태를 변경 ( 입찰제안한 장례식장: rejected, 입찰제안을 하지않은 장례식장: expired )

      // 5-1. 같은 견적서에 대한 모든 입찰제안서 조회 (현재 승인된 입찰제안서 제외)
      const otherManagerFormBid = await managerFormBidDao.getOtherManagerFormBidByManagerFormId(
        getDispatchRequest.managerFormId,
        getDispatchRequest.managerFormBidId, // 현재 승인된 입찰제안서 제외
        { transaction },
      );

      // 5-2. 각 입찰제안서의 상태에 따른 status 업데이트
      for (const managerFormBid of otherManagerFormBid) {
        let newStatus = '';

        // 입찰 제안 자체를 했는지 status로 확인
        if (managerFormBid.bidStatus === 'bid_submitted') {
          // 입찰 제안을 했지만 선택받지 못했을경우
          newStatus = 'rejected';
        } else if (managerFormBid.bidStatus === 'pending') {
          // 입찰 제안을 하지 않은 경우
          newStatus = 'expired';
        }

        await managerFormBidDao.updateManagerFormBidStatus(
          {
            managerFormBidId: managerFormBid.managerFormBidId,
          },
          newStatus,
          { transaction },
        );

        if (updateManagerFormBidStatus[0] === 0) {
          throw new Error('실패: 입찰서 상태 변경 중 오류 발생');
        }
      }

      await transaction.commit();

      // 6. 트랜잭션 커밋 후 상조팀장에게 출동 승인 알림 전송
      try {
        await fcmService.sendNotificationToUser({
          receiverId: getDispatchRequest.managerId,
          receiverType: 'manager',
          notificationType: 'dispatch_approved',
          data: {
            dispatchRequestId: dispatchRequestId,
            managerFormId: getDispatchRequest.managerFormId,
            managerFormBidId: getDispatchRequest.managerFormBidId,
            funeralName: getDispatchRequest.funeralName || '장례식장',
          },
          senderId: getDispatchRequest.funeralId,
          senderType: 'funeral',
        });
        logger.info(`출동 승인 알림 전송 성공: 상조팀장 ${getDispatchRequest.managerId}`);
      } catch (notificationError) {
        logger.error(
          `출동 승인 알림 전송 실패: 상조팀장 ${getDispatchRequest.managerId}`,
          notificationError,
        );
        // 알림 전송 실패해도 출동 승인 자체는 성공으로 처리
      }

      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // 장례식장 전화번호 불러오기
  static async getFuneralPhoneNumber(funeralId) {
    const funeralPhoneNumber = await getFuneralPhoneNumber(funeralId);

    return funeralPhoneNumber.funeralPhoneNumber;
  }

  // 장례식장 호실 정보 조회 by managerFormBidId
  static async getFuneralHallInfoByBidId(managerFormBidId) {
    // 1. managerFormBid 조회
    const managerFormBid =
      await managerFormBidDao.getManagerFormBidByManagerFormBidId(managerFormBidId);

    if (!managerFormBid) {
      throw new Error('실패: 존재하지 않는 입찰 내역');
    }

    const InfoData = {
      funeralHallName: managerFormBid.funeralHallName,
      funeralHallPrice: managerFormBid.funeralHallPrice,
      funeralHallDetailPrice: managerFormBid.funeralHallDetailPrice,
      proponentMoney: managerFormBid.proponentMoney,
      discount: managerFormBid.discount,
    };

    return InfoData;
  }

  // 거래완료 처리 - 메인 메서드
  static async completeDispatchRequest(dispatchRequestId, userType) {
    const transaction = await sequelize.transaction();

    try {
      // 1. 기본 검증
      const dispatchRequest = await this.validateDispatchRequest(dispatchRequestId, userType, {
        transaction,
      });

      // 2. 거래 상태 업데이트
      const transactionResult = await this.updateTransactionStatus(
        dispatchRequestId,
        userType,
        dispatchRequest,
        { transaction },
      );

      // 3. 양쪽 모두 완료시 최종 처리
      if (transactionResult.bothCompleted) {
        await this.processCompleteTransaction(dispatchRequest, transactionResult.transactionId, {
          transaction,
        });
      }

      await transaction.commit();
      return transactionResult.response;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // 1. 기본 검증
  static async validateDispatchRequest(dispatchRequestId, userType, options = {}) {
    const dispatchRequest = await dispatchRequestDao.getDispatchRequestDetail(
      dispatchRequestId,
      options,
    );

    if (!dispatchRequest) {
      throw new Error('실패: 존재하지 않는 출동 신청 내역');
    }

    if (dispatchRequest.isApproved !== 'approved') {
      throw new Error('실패: 거래완료 처리 가능한 상태가 아님');
    }

    return dispatchRequest;
  }

  // 2. 거래 상태 업데이트
  static async updateTransactionStatus(dispatchRequestId, userType, dispatchRequest, options = {}) {
    const now = new Date();
    const totalAmount = parseInt(process.env.TOTAL_AMOUNT);

    // 기존 거래 기록 조회
    const existingTransaction = await transactionListDao.getTransactionListByDispatchRequestId(
      dispatchRequestId,
      options,
    );

    if (!existingTransaction) {
      // 장례식장이 먼저 거래완료 시 - 포인트/캐시 예약 처리
      if (userType === 'funeral') {
        const reservationResult = await this.reserveFuneralBalance(
          dispatchRequest,
          totalAmount,
          options,
        );

        // 예약된 금액 정보를 TransactionList에 저장
        const createData = {
          dispatchRequestId,
          totalAmount,
          pointAmount: reservationResult.pointAmount,
          cashAmount: reservationResult.cashAmount,
          funeralId: dispatchRequest.funeralId,
          managerId: dispatchRequest.managerId,
          status: 'reserved', // 장례식장 거래완료 예약 상태
          [`${userType}TransactionCompletedAt`]: now,
        };

        await transactionListDao.createTransactionList(createData, options);
      } else {
        // 상조팀장이 먼저 완료하는 경우 (기존 로직)
        const createData = {
          dispatchRequestId,
          totalAmount,
          pointAmount: 0,
          cashAmount: 0,
          funeralId: dispatchRequest.funeralId,
          managerId: dispatchRequest.managerId,
          status: 'pending',
          [`${userType}TransactionCompletedAt`]: now,
        };

        await transactionListDao.createTransactionList(createData, options);
      }

      // 첫 번째 거래완료 요청자 - 상대방에게 알림 전송
      const counterpartType = userType === 'manager' ? 'funeral' : 'manager';
      const counterpartId =
        userType === 'manager' ? dispatchRequest.funeralId : dispatchRequest.managerId;

      // 알림 전송 (비동기로 처리하여 거래 로직에 영향 없음)
      setTimeout(async () => {
        try {
          await fcmService.sendNotificationToUser({
            receiverId: counterpartId,
            receiverType: counterpartType,
            notificationType: 'transaction_completed_requested',
            data: {
              dispatchRequestId: dispatchRequestId,
              requesterType: userType,
              requesterName: userType === 'manager' ? '상조팀장' : '장례식장',
            },
            senderId:
              userType === 'manager' ? dispatchRequest.managerId : dispatchRequest.funeralId,
            senderType: userType,
          });
          logger.info(`거래완료 요청 알림 전송 성공: ${counterpartType} ${counterpartId}`);
        } catch (notificationError) {
          logger.error(
            `거래완료 요청 알림 전송 실패: ${counterpartType} ${counterpartId}`,
            notificationError,
          );
        }
      }, 100);

      return {
        bothCompleted: false,
        response: {
          success: true,
          message: '거래완료 처리가 완료되었습니다. 상대방의 거래완료 확인이 필요합니다.',
          status: 'waiting_counterpart',
        },
      };
    } else {
      // 두 번째 완료자 - 기존 거래 업데이트
      const alreadyCompleted = existingTransaction[`${userType}TransactionCompletedAt`];

      if (alreadyCompleted) {
        return {
          bothCompleted: false,
          response: {
            success: false,
            message: '이미 거래완료 처리를 했습니다. 상대방의 확인이 필요합니다.',
            status: 'already_completed',
          },
        };
      }

      // 상태 업데이트
      const updateData = { [`${userType}TransactionCompletedAt`]: now };
      await transactionListDao.updateTransactionList(
        existingTransaction.transactionId,
        updateData,
        options,
      );

      return {
        bothCompleted: true,
        transactionId: existingTransaction.transactionId,
        response: {
          success: true,
          message: '거래가 완료되었습니다.',
          status: 'completed',
        },
      };
    }
  }

  // 3. 포인트/캐시 검증 및 처리
  static async validateAndProcessPayment(funeralId, totalAmount, options = {}) {
    // 현재 포인트/캐시 조회
    const { funeralPoint, funeralCash } = await getFuneralPointAndCash(funeralId, options);

    // 잔액 부족 검증
    if (funeralPoint + funeralCash < totalAmount) {
      throw new Error('거래완료 실패: 장례식장의 포인트 및 캐시 부족');
    }

    // 포인트 우선 사용, 부족분은 캐시로 처리
    const pointAmount = Math.min(totalAmount, funeralPoint);
    const cashAmount = totalAmount - pointAmount;

    // 업데이트된 잔액 계산
    const updatedFuneralPoint = funeralPoint - pointAmount;
    const updatedFuneralCash = funeralCash - cashAmount;

    return {
      pointAmount,
      cashAmount,
      originalPoint: funeralPoint,
      originalCash: funeralCash,
      updatedPoint: updatedFuneralPoint,
      updatedCash: updatedFuneralCash,
    };
  }

  // 4. 최종 거래 완료 처리
  static async processCompleteTransaction(dispatchRequest, transactionId, options = {}) {
    const managerCashAmount = parseInt(process.env.AMOUNT_OF_CASH_MANAGER, 10);

    // TransactionList에서 이미 예약된 포인트/캐시 정보 조회 (장례식장이 먼저 거래완료를 수행한 경우)
    const transactionData = await transactionListDao.getTransactionListByTransactionListId(
      transactionId,
      options,
    );

    let paymentResult;

    if (transactionData.status === 'reserved') {
      // case1: 장례식장이 먼저 완료하여 이미 예약된 경우 (포인트 이미 차감됨, 장례식장 히스토리 이미 생성)
      paymentResult = {
        pointAmount: transactionData.pointAmount,
        cashAmount: transactionData.cashAmount,
      };

      // 히스토리의 상태만 pending => completed로 업데이트
      await this.updateHistoryStatus(dispatchRequest, 'completed', options);
    } else {
      // case 2: 상조팀장이 거래완료를 먼저 수행한 경우 (포인트/캐시 차감 필요, 히스토리 생성 필요)
      paymentResult = await this.validateAndProcessPayment(
        dispatchRequest.funeralId,
        parseInt(process.env.TOTAL_AMOUNT),
        options,
      );

      // 장례식장 포인트/캐시 차감
      await updateFuneralPointAndCash(
        dispatchRequest.funeralId,
        paymentResult.updatedPoint,
        paymentResult.updatedCash,
        options,
      );

      // 장례식장 히스토리 생성
      await this.createFuneralPointAndCashHistory(
        dispatchRequest,
        paymentResult.pointAmount,
        paymentResult.cashAmount,
        paymentResult.updatedPoint,
        paymentResult.updatedCash,
        'completed',
        options,
      );
    }

    // 공통처리: 모든 상태를 완료로 업데이트
    await this.updateAllStatusToCompleted(dispatchRequest, options);

    // 공통처리: 상조팀장 캐시 증가 (항상 필요)
    await updateManagerCash(dispatchRequest.managerId, managerCashAmount, options);

    // 공통처리: 상조팀장 캐시 히스토리 생성 (항상 필요)
    await this.createManagerCashHistory(dispatchRequest, managerCashAmount, options);

    // 공통처리: TransactionList 최종 업데이트
    await transactionListDao.updateTransactionList(
      transactionId,
      {
        pointAmount: paymentResult.pointAmount,
        cashAmount: paymentResult.cashAmount,
      },
      options,
    );

    await transactionListDao.updateTransactionListStatus(transactionId, 'completed', options);

    // 최종 거래 완료 알림을 양쪽 모두에게 전송 (비동기로 처리)
    setTimeout(async () => {
      try {
        const totalAmount = parseInt(process.env.TOTAL_AMOUNT);

        // 상조팀장에게 거래 완료 알림
        await fcmService.sendNotificationToUser({
          receiverId: dispatchRequest.managerId,
          receiverType: 'manager',
          notificationType: 'transaction_completed',
          data: {
            dispatchRequestId: dispatchRequest.dispatchRequestId,
            amount: managerCashAmount,
            transactionId: transactionId,
          },
          senderType: 'system',
        });

        // 장례식장에게 거래 완료 알림
        await fcmService.sendNotificationToUser({
          receiverId: dispatchRequest.funeralId,
          receiverType: 'funeral',
          notificationType: 'transaction_completed',
          data: {
            dispatchRequestId: dispatchRequest.dispatchRequestId,
            amount: totalAmount,
            transactionId: transactionId,
          },
          senderType: 'system',
        });

        logger.info(
          `거래 완료 알림 전송 성공: 상조팀장 ${dispatchRequest.managerId}, 장례식장 ${dispatchRequest.funeralId}`,
        );
      } catch (notificationError) {
        logger.error('거래 완료 알림 전송 실패', notificationError);
      }
    }, 100);
  }

  // 5. 모든 상태를 완료로 업데이트
  static async updateAllStatusToCompleted(dispatchRequest, options = {}) {
    // 출동신청서 상태 업데이트
    await dispatchRequestDao.updateDispatchRequestStatus(
      dispatchRequest.dispatchRequestId,
      'completed',
      options,
    );

    // 견적서 상태 업데이트
    await managerFormDao.updateManagerFormStatus(
      dispatchRequest.managerFormId,
      'completed',
      options,
    );

    // 입찰서 상태 업데이트
    await managerFormBidDao.updateManagerFormBidStatus(
      { managerFormBidId: dispatchRequest.managerFormBidId },
      'transaction_completed',
      options,
    );
  }

  // 8. 장례식장 선 거래완료 시 포인트/캐시 예약 메서드
  static async reserveFuneralBalance(dispatchRequest, totalAmount, options = {}) {
    const { funeralPoint, funeralCash } = await getFuneralPointAndCash(
      dispatchRequest.funeralId,
      options,
    );

    if (funeralPoint + funeralCash < totalAmount) {
      throw new Error('거래완료 처리 실패: 장례식장의 포인트 및 캐시가 부족합니다.');
    }

    // 포인트를 우선적으로 사용 후 나머지는 캐시로 처리
    const pointAmount = Math.min(totalAmount, funeralPoint);
    const cashAmount = totalAmount - pointAmount;

    // 장례식장의 실제 잔액에서 예약금만큼 차감 (미리 차감하는 형식)
    const updatedPoint = funeralPoint - pointAmount;
    const updatedCash = funeralCash - cashAmount;

    // 장례식장 실제 잔액 차감 업데이트
    await updateFuneralPointAndCash(dispatchRequest.funeralId, updatedPoint, updatedCash, options);

    // 장례식장이 먼저 거래완료 시 포인트 + 캐시 사용 히스토리 생성 (status: pending)
    await this.createFuneralPendingPointAndCashHistory(
      dispatchRequest,
      pointAmount,
      cashAmount,
      updatedPoint,
      updatedCash,
      options,
    );

    return { pointAmount, cashAmount };
  }

  // 장례식장이 먼저 거래완료 처리 시 포인트/캐시 사용 히스토리 생성
  static async createFuneralPendingPointAndCashHistory(
    dispatchRequest,
    pointAmount,
    cashAmount,
    updatedPoint,
    updatedCash,
    options = {},
  ) {
    await this.createFuneralPointAndCashHistory(
      dispatchRequest,
      pointAmount,
      cashAmount,
      updatedPoint,
      updatedCash,
      'pending',
      options,
    );
  }

  // 9. 장례식장이 먼저 거래완료를 했을경우 최종 거래완료시 기존의 포인트/캐시 히스토리 status 'completed'로 업데이트
  static async updateHistoryStatus(dispatchRequest, status, options = {}) {
    // 포인트 히스토리 상태 업데이트
    await updateFuneralPointHistoryStatus(
      {
        funeralId: dispatchRequest.funeralId,
        managerFormBidId: dispatchRequest.managerFormBidId,
        status: 'pending',
      },
      status,
      options,
    );

    // 캐시 히스토리 상태 업데이트
    await updateFuneralCashHistoryStatus(
      {
        funeralId: dispatchRequest.funeralId,
        managerFormBidId: dispatchRequest.managerFormBidId,
        status: 'pending',
      },
      status,
      options,
    );
  }

  // 공통 장례식장 히스토리 생성
  static async createFuneralPointAndCashHistory(
    dispatchRequest,
    pointAmount,
    cashAmount,
    updatedPoint,
    updatedCash,
    status,
    options = {},
  ) {
    const baseHistoryData = {
      funeralId: dispatchRequest.funeralId,
      managerId: dispatchRequest.managerId,
      managerFormBidId: dispatchRequest.managerFormBidId,
      status,
    };

    // 포인트 히스토리 생성
    if (pointAmount > 0) {
      const pointHistoryData = {
        ...baseHistoryData,
        funeralPointAmount: pointAmount,
        funeralPointBalanceAfter: updatedPoint,
      };
      await createFuneralPointHistory(pointHistoryData, 'use_point', options);
    }

    // 캐시 히스토리 생성
    if (cashAmount > 0) {
      const cashHistoryData = {
        ...baseHistoryData,
        funeralCashAmount: cashAmount,
        funeralCashBalanceAfter: updatedCash,
      };
      await createFuneralCashHistory(cashHistoryData, 'use_cash', options);
    }
  }

  // 상조팀장 캐시 히스토리 생성
  static async createManagerCashHistory(dispatchRequest, managerCashAmount, options = {}) {
    const managerCashHistoryData = {
      managerId: dispatchRequest.managerId,
      managerCashAmount: managerCashAmount,
      funeralId: dispatchRequest.funeralId,
      managerFormBidId: dispatchRequest.managerFormBidId,
      status: 'completed',
    };

    await createManagerCashHistory(managerCashHistoryData, 'earn_cash', options);
  }

  // 거래 흐름 상태 조회
  static async getTransactionStatus(dispatchRequestId) {
    const transactionsList =
      await transactionListDao.getTransactionListByDispatchRequestId(dispatchRequestId);

    if (transactionsList === null) {
      return null;
    } else {
      return transactionsList;
    }
  }
}

export default DispatchRequestService;
