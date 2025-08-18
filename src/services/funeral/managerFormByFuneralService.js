/**
 * 파일명: managerFormByFuneralService.js
 * 설명: 장례식장 관점에서의 견적서 관련 비즈니스 로직 처리 서비스
 * 역할: 장례식장이 상조팀장의 견적 신청을 조회하고 입찰하는 기능 제공
 */
import managerFormBidDao from '../../dao/manager/managerFormBidDao.js';
import managerFormDao from '../../dao/manager/managerFormDao.js';
import { sequelize } from '../../config/database.js';
import logger from '../../config/logger.js';
import fcmService from '../common/fcmService.js';
import funeralListDao from '../../dao/funeral/funeralListDao.js';
import coolsms from 'coolsms-node-sdk';
// import { getCurrentCash } from '../../daos/funeral/funeralCashDao.js';

const client = new coolsms.default(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

const managerFormByFuneralService = {
  /**
   * 장례식장 별 상조 팀장의 모든 견적 신청서 조회
   *
   * 특정 장례식장에 요청된 모든 견적 신청서를 조회합니다.
   *
   * @param {string} funeralId - 장례식장 ID
   * @returns {Promise<Object>} 견적 신청서 목록
   * @throws {Error} 조회 실패 시 오류 발생
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
   * 관리자용 장례식장 별 상조 팀장의 모든 견적 신청서 조회
   *
   * 관리자 페이지에서 특정 장례식장에 요청된 모든 견적 신청서를 조회합니다.
   *
   * @param {string} funeralId - 장례식장 ID
   * @returns {Promise<Object>} 견적 신청서 목록
   * @throws {Error} 조회 실패 시 오류 발생
   */
  async getManagerFormByFuneralId(funeralId) {
    try {
      const getAllManagerFormByFuneralId =
        await managerFormBidDao.getAdminManagerFormByFuneralId(funeralId);

      return {
        success: true,
        data: getAllManagerFormByFuneralId,
      };
    } catch (error) {
      throw new Error('견적 신청서 조회 실패', error);
    }
  },

  /**
   * 견적서 상세 내용 조회
   *
   * 특정 입찰 ID에 해당하는 견적서의 상세 내용을 조회합니다.
   *
   * @param {string} managerFormBidId - 입찰 ID
   * @returns {Promise<Object>} 견적서 상세 정보
   * @throws {Error} 조회 실패 시 오류 발생
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
   *
   * 처리 과정:
   * 1. 기존 입찰 데이터 조회 및 상태 확인
   * 2. 입찰 신청 처리 및 상태 업데이트
   * 3. 견적서 상태 업데이트
   * 4. 상조팀장에게 알림 전송 (FCM, SMS)
   *
   * @param {Object} params - 입찰 정보
   * @param {string} params.managerFormBidId - 입찰 ID
   * @param {string} params.funeralId - 장례식장 ID
   * @param {string} params.funeralHallName - 호실 이름
   * @param {number} params.funeralHallSize - 호실 평수
   * @param {number} params.funeralHallNumberOfMourners - 수용 가능 인원
   * @param {number} params.funeralHallPrice - 호실 가격
   * @param {Object} params.funeralHallDetailPrice - 호실 상세 가격 정보
   * @param {number} params.proponentMoney - 제안 금액
   * @param {number} params.discount - 할인율
   * @returns {Promise<Object>} 입찰 신청 결과
   * @throws {Error} 입찰 신청 실패 시 오류 발생
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

      // 4. 트랜잭션 커밋 후 상조팀장에게 알림 전송
      try {
        await fcmService.sendNotificationToUser({
          receiverId: existingBid.managerForm.managerId,
          receiverType: 'manager',
          notificationType: 'bid_submitted',
          data: {
            managerFormId: existingBid.managerFormId,
            managerFormBidId: params.managerFormBidId,
            funeralName: existingBid.funeralList?.funeral_name || '장례식장',
            bidAmount: params.proponentMoney,
            discount: params.discount,
          },
          senderId: params.funeralId,
          senderType: 'funeral',
        });

        // 상조팀장에게 문자 전송
        const manager = await funeralListDao.getManagerPhoneNumber(
          existingBid.managerForm.managerId,
        );
        await client.sendOne({
          to: manager.dataValues.managerPhoneNumber,
          from: process.env.COOLSMS_SENDER_NUMBER,
          text: '장례식장님이 입찰 제안 하였습니다. 입찰 확인을 해주세요.',
        });

        logger.info(`입찰 제안 알림 전송 성공: 상조팀장 ${existingBid.managerId}`);
      } catch (notificationError) {
        logger.error(
          `입찰 제안 알림 전송 실패: 상조팀장 ${existingBid.managerId}`,
          notificationError,
        );
        // 알림 전송 실패해도 입찰 자체는 성공으로 처리
      }

      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * 장례식장 입찰 상세 내용 조회
   *
   * 장례식장 관점에서 특정 입찰의 상세 내용을 조회합니다.
   *
   * @param {string} managerFormBidId - 입찰 ID
   * @returns {Promise<Object>} 입찰 상세 정보
   * @throws {Error} 입찰 정보를 찾을 수 없을 경우 오류 발생
   */
  async getManagerFormBidDetail(managerFormBidId) {
    const managerFormBidDetail = await managerFormBidDao.getManagerFormBidById(
      managerFormBidId,
      'funeral',
    );

    if (!managerFormBidDetail) {
      throw new Error('입찰 정보를 찾지 못함');
    }

    return managerFormBidDetail;
  },

  /**
   * 장례식장 입찰 시 현재 입찰 내역과 캐시 비교 후 입찰 가능여부 판단
   * (현재 사용하지 않는 주석 처리된 메서드)
   *
   * @param {string} funeralId - 장례식장 ID
   * @returns {Promise<Object|boolean>} 입찰 가능 여부 및 메시지
   */
  // async checkAboutCashAmount(funeralId) {
  //   // 1. 입찰 하려는 장례식장의 현재 보유 캐시 조회
  //   const cashAmount = await getCurrentCash(funeralId);

  //   // 1-1. 입찰 최소 캐시보다 적을 경우 처리
  //   if (cashAmount < process.env.TOTAL_AMOUNT) {
  //     return {
  //       success: false,
  //       message: '입찰을 위한 캐시가 부족합니다.',
  //     };
  //   }

  //   // 2. 입찰 하려는 장례식장의 현재 입찰 내역 조회 ( 입찰 제출 및 거래 진행중인 내역만 조회 )
  //   // 현재 입찰 제출 ( bid_submitted ), 상조팀장 입찰 선택 및 출동 신청 (bid_selected), 출동승인 및 거래중 ( bid_progress )
  //   // 현재 보유 캐시 - managerFormBid 갯수 x TOTAL_AMOUNT가 0 미만일경우 입찰 불가
  //   const getBids = await managerFormBidDao.getManagerFormBidSpecificStatus(funeralId);

  //   const bidsCount = getBids.length;

  //   if (cashAmount - bidsCount * process.env.TOTAL_AMOUNT < process.env.TOTAL_AMOUNT) {
  //     return {
  //       success: false,
  //       message: '입찰 갯수에 대비해 캐시가 부족합니다.',
  //     };
  //   }

  //   return true;
  // },
};

export default managerFormByFuneralService;
