import managerFormBidDao from '../../dao/manager/managerFormBidDao.js';
import managerFormDao from '../../dao/manager/managerFormDao.js';
import { sequelize } from '../../config/database.js';

const managerFormByFuneralService = {
  /**
   * 장례식장 별 상조 팀장의 모든 견적 신청서 조회
   */
  async getManagerForm(funeralId) {
    try {
      // 1. 장례식장 별 상조 팀장의 모든 견적 신청서 조회
      const getAllManagerFormByFuneralId =
        await managerFormBidDao.getAllManagerFormByFuneralId(funeralId);

      return {
        success: true,
        data: getAllManagerFormByFuneralId,
      };
    } catch (error) {
      throw new Error('견적 신청서 조회 실패', error);
    }
  },

  /**
   * 견적서 별 상세 내용 조회
   */
  async getManagerFormDetail(managerFormBidId) {
    try {
      // 1. managerFormId 조회
      const managerFormId =
        await managerFormBidDao.getManagerFormIdByManagerFormBidId(managerFormBidId);

      // 2. 견적서 상세 내용 조회
      const managerFormDetail = await managerFormDao.getManagerFormDetail(managerFormId);

      return {
        success: true,
        data: managerFormDetail,
      };
    } catch (error) {
      throw new Error('견적서 상세 내용 조회 실패', error);
    }
  },

  /**
   * 장례식장 입찰 신청
   */
  async updateManagerFormBid(params) {
    const transaction = await sequelize.transaction();
    try {
      // 1. 기존 입찰 데이터 조회
      const existingBid = await managerFormBidDao.getManagerFormBidById(
        params.managerFormBidId,
        'funeral',
        {
          transaction,
        },
      );

      if (!existingBid) {
        throw new Error('입찰 정보를 찾지 못함');
      }

      // 허용되지 않는 상태 목록
      const INVALID_BID_STATUSES = {
        bid_submitted: '이미 입찰 신청이 완료된 견적서입니다.',
        bid_selected: '이미 입찰 신청이 완료된 견적서입니다.',
        transaction_completed: '이미 거래가 완료된 견적서입니다.',
        rejected: '이미 거절된 견적서입니다.',
        expired: '이미 만료된 견적서입니다.',
      };

      // 현재 상태가 유효하지 않은 경우 해당 오류 메시지 반환
      const errorMessage = INVALID_BID_STATUSES[existingBid.bidStatus];
      if (errorMessage) {
        await transaction.rollback();
        throw new Error(errorMessage);
      }

      // 2. managerFormBid 입찰 신청 처리 및 상태 업데이트
      const result = await managerFormBidDao.updateManagerFormBidStatus(params, 'bid_submitted', {
        transaction,
      });

      // 3. managerForm 상태 업데이트
      await managerFormDao.updateManagerFormStatus(existingBid.managerFormId, 'bid_received', {
        transaction,
      });

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};

export default managerFormByFuneralService;
