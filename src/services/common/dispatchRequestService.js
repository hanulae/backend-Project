import { sequelize } from '../../config/database.js';
import dispatchRequestDao from '../../dao/common/dispatchRequestDao.js';
import managerFormDao from '../../dao/manager/managerFormDao.js';
import managerFormBidDao from '../../dao/manager/managerFormBidDao.js';
import transactionListDao from '../../dao/common/transactionListDao.js';
import {
  getFuneralPhoneNumber,
  getFuneralPointAndCash,
  updateFuneralPointAndCash,
} from '../../daos/funeral/funeralAuthDao.js';
import { updateManagerCash } from '../../daos/manager/managerCashDao.js';
import { createFuneralPointHistory } from '../../daos/funeral/funeralPointHistoryDao.js';
import { createFuneralCashHistory } from '../../daos/funeral/funeralCashHistoryDao.js';
import { createManagerCashHistory } from '../../daos/manager/managerCashHistoryDao.js';
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

      // 2. 하나의 견적서를 가지고 다중 출동 신청 방지
      const checkSameManagerForm = await dispatchRequestDao.existingDispatchRequest(
        {
          managerId: params.managerId,
          managerFormId: params.managerFormId,
        },
        { transaction },
      );

      if (checkSameManagerForm) {
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

      await transaction.commit();
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

  // 거래완료 처리
  static async completeDispatchRequest(dispatchRequestId, userType) {
    const totalAmount = process.env.TOTAL_AMOUNT;

    const transaction = await sequelize.transaction();
    try {
      const now = new Date();
      // 1. 거래 확정할 출동요청서의 상태가 approved 상태인지 확인
      const getDispatchRequest = await dispatchRequestDao.getDispatchRequestDetail(
        dispatchRequestId,
        { transaction },
      );

      if (!getDispatchRequest) {
        throw new Error('실패: 존재하지 않는 출동 신청 내역');
      }

      if (getDispatchRequest.isApproved !== 'approved') {
        throw new Error('실패: 거래완료 처리 가능한 상태가 아님');
      }

      // 2. transactionList에 데이터가 있는지 확인
      const getTransactionList = await transactionListDao.getTransactionListByDispatchRequestId(
        dispatchRequestId,
        { transaction },
      );

      // 2-1. transactionList에 데이터가 있을경우(장례식장이 이미 거래완료를 눌렀을 경우)
      if (getTransactionList) {
        // 상조팀장 || 장례식장 거래완료 상태 업데이트
        const updateData = {};

        if (userType === 'funeral' && !getTransactionList.funeralTransactionCompletedAt) {
          updateData.funeralTransactionCompletedAt = now;
        } else if (userType === 'manager' && !getTransactionList.managerTransactionCompletedAt) {
          updateData.managerTransactionCompletedAt = now;
        } else {
          // 이미 자신이 완료 처리를 했을 경우
          await transaction.commit();
          return {
            success: false,
            message: '이미 거래완료 처리를 했습니다. 상대방의 확인이 필요합니다.',
            status: 'already_completed',
          };
        }

        // 기존의 transactionList의 completedAt 업데이트
        await transactionListDao.updateTransactionList(
          getTransactionList.transactionId,
          updateData,
          { transaction },
        );

        // 업데이트된 transactionList 데이터 조회
        const updatedTransactionList =
          await transactionListDao.getTransactionListByTransactionListId(
            getTransactionList.transactionId,
            { transaction },
          );

        // 상조팀장, 장례식장 모두 completedAt이 not null일 경우 관련 견적서, 입찰서, 출동신청서 완료 처리
        if (
          updatedTransactionList.managerTransactionCompletedAt &&
          updatedTransactionList.funeralTransactionCompletedAt
        ) {
          // 2-1-1. dispatchRequest의 isApproved를 completed로 변경
          await dispatchRequestDao.updateDispatchRequestStatus(dispatchRequestId, 'completed', {
            transaction,
          });
          // 2-1-2. managerForm의 formStatus를 completed로 변경
          await managerFormDao.updateManagerFormStatus(
            getDispatchRequest.managerFormId,
            'completed',
            { transaction },
          );
          // 2-1-3. managerFormBid의 bidStatus를 completed로 변경
          await managerFormBidDao.updateManagerFormBidStatus(
            {
              managerFormBidId: getDispatchRequest.managerFormBidId,
            },
            'completed',
            { transaction },
          );

          // 포인트 및 캐시 처리 (장례식장 회원이 최종 거래완료를 하는 경우)
          if (userType === 'funeral') {
            // 2-1-5. 장례식장의 포인트 및 캐쉬 차감 + 상조팀장의 포인트 및 캐쉬 증가
            // 장례식장 현재 포인트 및 캐쉬 조회
            const FuneralPointAndCash = await getFuneralPointAndCash(getDispatchRequest.funeralId, {
              transaction,
            });

            const { funeralPoint, funeralCash } = FuneralPointAndCash;

            if (funeralPoint + funeralCash < totalAmount) {
              throw new Error('거래완료 실패: 장례식장의 포인트 및 캐쉬 부족 확인');
            }

            // 장례식장의 포인트를 우선적으로 모두 소모 + 남은 금액은 캐시로 처리
            const pointAmount = Math.min(totalAmount, funeralPoint);
            const cashAmount = totalAmount - pointAmount;

            // TransactionList의 PointAmount와 CashAmount 업데이트
            await transactionListDao.updateTransactionList(
              getTransactionList.transactionId,
              {
                pointAmount: pointAmount,
                cashAmount: cashAmount,
              },
              { transaction },
            );

            // 장례식장 회원의 point및 cash 업데이트
            const updateFuneralPoint = funeralPoint - pointAmount;
            const updateFuneralCash = funeralCash - cashAmount;
            await updateFuneralPointAndCash(
              getDispatchRequest.funeralId,
              updateFuneralPoint,
              updateFuneralCash,
              {
                transaction,
              },
            );

            // 상조팀장의 캐시 업데이트
            const managerCash = parseInt(process.env.AMOUNT_OF_CASH_MANAGER, 10);
            await updateManagerCash(getDispatchRequest.managerId, managerCash, {
              transaction,
            });

            // 장례식장 포인트 및 캐시 히스토리 반영 (포인트 사용의 경우)
            if (pointAmount > 0) {
              const pointHistoryData = {
                funeralId: getDispatchRequest.funeralId,
                funeralPointAmount: pointAmount,
                funeralPointBalanceAfter: updateFuneralPoint,
                managerId: getDispatchRequest.managerId,
                managerFormBidId: getDispatchRequest.managerFormBidId,
                status: 'completed',
              };
              // 포인트 히스토리 생성
              await createFuneralPointHistory(pointHistoryData, 'use_point', { transaction });

              // 캐시 히스토리 생성
              const cashHistoryData = {
                funeralId: getDispatchRequest.funeralId,
                funeralCashAmount: cashAmount,
                funeralCashBalanceAfter: updateFuneralCash,
                managerId: getDispatchRequest.managerId,
                managerFormBidId: getDispatchRequest.managerFormBidId,
                status: 'completed',
              };
              await createFuneralCashHistory(cashHistoryData, 'use_cash', { transaction });
            } else {
              // 캐시 히스토리 생성
              const cashHistoryData = {
                funeralId: getDispatchRequest.funeralId,
                funeralCashAmount: cashAmount,
                funeralCashBalanceAfter: updateFuneralCash,
                managerId: getDispatchRequest.managerId,
                managerFormBidId: getDispatchRequest.managerFormBidId,
                status: 'completed',
              };
              await createFuneralCashHistory(cashHistoryData, 'use_cash', { transaction });
            }

            // 상조팀장 포인트 및 캐시 히스토리 반영
            const managerCashHistoryData = {
              managerId: getDispatchRequest.managerId,
              managerCashAmount: managerCash,
              funeralId: getDispatchRequest.funeralId,
              managerFormBidId: getDispatchRequest.managerFormBidId,
              status: 'completed',
            };
            await createManagerCashHistory(managerCashHistoryData, 'earn_cash', { transaction });

            // 최종 transactionList status를 completed로 변경 및 transactionCompletedAt 업데이트
            await transactionListDao.updateTransactionListStatus(
              getTransactionList.transactionId,
              'completed',
              { transaction },
            );
          } else {
            // 상조팀장이 최종 거래완료를 하는 경우
          }
        }
      } else {
        // 2-2. transactionList에 데이터가 없을경우
        // 2-2-1.상조 팀장의 경우
        if (userType === 'manager') {
          // 2-2-2. 새로운 데이터를 생성
          const createData = {
            dispatchRequestId: dispatchRequestId,
            totalAmount: totalAmount,
            pointAmount: 0,
            cashAmount: 0,
            funeralId: getDispatchRequest.funeralId,
            managerId: getDispatchRequest.managerId,
            status: 'pending',
            managerTransactionCompletedAt: now,
          };

          await transactionListDao.createTransactionList(createData, {
            transaction,
          });

          await transaction.commit();
          return {
            success: true,
            message: '거래완료 처리가 완료되었습니다. 장례식장의 거래완료 확인이 필요합니다.',
            status: 'waiting_counterpart',
          };
        } else {
          // 2-2-3. 장례식장의 경우
          // 포인트 및 캐시 충분한지 확인 및 차감
          const FuneralPointAndCash = await getFuneralPointAndCash(getDispatchRequest.funeralId, {
            transaction,
          });

          const { funeralPoint, funeralCash } = FuneralPointAndCash;

          if (funeralPoint + funeralCash < totalAmount) {
            throw new Error('거래완료처리실패: 장례식장의 포인트 및 캐쉬 부족 확인');
          }

          // totalAmount에 사용가능한 포인트 전부 사용 남은 금액은 캐시로 처리
          // const pointAmount = Math.min(totalAmount, funeralPoint);

          // const createData = {
          //   dispatchRequestId: dispatchRequestId,
          //   totalAmount: totalAmount,
          // };
        }

        await transaction.commit();
        return {
          success: true,
          message: `${userType === 'funeral' ? '장례식장' : '상조팀장'} 거래완료 처리가 완료되었습니다. 상대방의 확인이 필요합니다.`,
          status: 'waiting_counterpart',
        };
      }
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default DispatchRequestService;
