import { sequelize } from '../../config/database.js';
import dispatchRequestDao from '../../dao/common/dispatchRequestDao.js';
import managerFormDao from '../../dao/manager/managerFormDao.js';
import managerFormBidDao from '../../dao/manager/managerFormBidDao.js';

class DispatchRequestService {
  // 출동 신청
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

  // 출동 신청 내역 리스트 조회
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

  // 출동 신청 내역 상세 조회
  static async getDispatchRequestDetail(dispatchRequestId) {
    const dispatchRequestDetail =
      await dispatchRequestDao.getDispatchRequestDetail(dispatchRequestId);

    return dispatchRequestDetail;
  }

  // 출동 신청 취소
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
}

export default DispatchRequestService;
