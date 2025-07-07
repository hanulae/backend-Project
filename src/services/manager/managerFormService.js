import { sequelize } from '../../config/database.js';
import logger from '../../config/logger.js';
import managerFormDao from '../../dao/manager/managerFormDao.js';
import managerFormBidDao from '../../dao/manager/managerFormBidDao.js';
import funeralListDao from '../../dao/funeral/funeralListDao.js';
import fcmService from '../common/fcmService.js';

const managerFormService = {
  /**
   * 견적 신청서 생성
   * @param {Object} managerFormData {Array} uniqueFuneralListIds
   * @returns {Promise<ManagerForm>}
   */
  async createManagerForm(managerFormData, funeralListIds) {
    const transaction = await sequelize.transaction();
    try {
      // 1. 견적 신청서 생성
      const managerForm = await managerFormDao.createManagerForm(managerFormData, { transaction });

      // 2. funeralListIds에 해당하는 funeralId 조회
      const funeralData = await funeralListDao.getFuneralIdByFuneralListId(funeralListIds, {
        transaction,
      });

      // 3. 선택한 장례식장들에게 견적신청서 전송 (입찰 리스트 테이블에 데이터 생성)
      const bidDataArr = funeralData.map((funeralData) => ({
        managerFormId: managerForm.managerFormId,
        funeralListId: funeralData.funeralListId,
        funeralId: funeralData.funeralId, // 회원가입 하지 않은 장례식장의 경우 null 값 배치
        managerFormCreatedAt: managerForm.createdAt,
      }));

      await managerFormBidDao.createManagerFormBid(bidDataArr, { transaction });

      // 4. 각각의 장례식장에 알림 전송
      await transaction.commit();

      // 트랜잭션 커밋 후 비동기 알림 전송
      try {
        const notificationPromises = funeralData
          .filter((item) => item.funeralId) // 회원가입한 장례식장만 알림 전송
          .map(async (item) => {
            try {
              await fcmService.sendNotificationToUser({
                receiverId: item.funeralId,
                receiverType: 'funeral',
                notificationType: 'estimate_request',
                data: {
                  managerFormId: managerForm.managerFormId,
                  chiefMournerName: managerFormData.chiefMournerName,
                  funeralDate: managerFormData.funeralDate,
                  funeralLocation: managerFormData.funeralLocation,
                },
                senderId: managerFormData.managerId,
                senderType: 'manager',
              });
              logger.info(`견적 신청 알림 전송 성공: 장례식장 ${item.funeralId}`);
            } catch (notificationError) {
              logger.error(
                `견적 신청 알림 전송 실패: 장례식장 ${item.funeralId}`,
                notificationError,
              );
            }
          });

        await Promise.allSettled(notificationPromises);
      } catch (error) {
        logger.error('견적 신청 알림 전송 중 오류 발생', error);
        // 알림 전송 실패해도 견적 신청 자체는 성공으로 처리
      }

      return {
        success: true,
        message: '견적 신청서 작성 완료',
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('견적 신청서 생성 실패_Service Error', error);
      throw new Error('견적 신청서 생성 실패_Service Error', error);
    }
  },

  /**
   * 상조팀장 견적 신청서 내역 조회
   */
  async getManagerFormList(managerId) {
    try {
      // 1. 상조 팀장 견적서 조회
      const managerFormList = await managerFormDao.getManagerFormList(managerId);
      const managerFormIdArr = managerFormList.map((managerForm) => managerForm.managerFormId);

      // 2. 입찰 신청서 갯수 조회
      const bidCountMap = await managerFormBidDao.getBidCountByFormIds(managerFormIdArr);

      // 3. managerFormList에 bidCount 추가
      const resultList = managerFormList.map((form) => ({
        ...form.dataValues,
        bidCount: bidCountMap[form.managerFormId] || 0,
      }));

      return {
        success: true,
        data: {
          managerFormList: resultList,
        },
      };
    } catch (error) {
      logger.error('견적 신청서 내역 조회 실패', error);
      throw new Error('견적 신청서 내역 조회 실패_Service Error', error);
    }
  },

  /**
   * 한명의 상주님 견적 리스트 조회
   */
  async getManagerFormBidList(managerFormId) {
    try {
      // 1. 견적 신청서 ID를 기반으로 생성된 입찰 리스트 조회
      const managerFormDetail = await managerFormBidDao.getManagerFormBidStatusList(managerFormId);

      // 2. 데이터 포멧팅
      const formattedDetail = managerFormDetail.map((item) => {
        const plain = item.get({ plain: true });
        return {
          managerFormBidId: plain.managerFormBidId,
          bidStatus: plain.bid_status,
          funeralName: plain.funeralList.funeral_name,
          funeralAddress: plain.funeralList.funeral_address,
        };
      });

      return {
        success: true,
        data: {
          managerFormDetail: formattedDetail,
        },
      };
    } catch (error) {
      logger.error('단일 상주님 견적서 리스트 조회 실패', error);
      throw new Error('단일 상주님 견적서 리스트 조회 실패_Service Error', error);
    }
  },

  /**
   * 단일 견적서 관련 입찰 상세 내용 조회
   */
  async getManagerFormBidDetail(managerFormBidId) {
    // 1. managerFormBid 조회
    const managerFormBid = await managerFormBidDao.getManagerFormBidById(
      managerFormBidId,
      'manager',
    );

    if (!managerFormBid) {
      throw new Error('입찰 정보를 찾지 못함');
    }

    if (!managerFormBid.bidSubmittedAt || managerFormBid.bidStatus === 'pending') {
      throw new Error('입찰이 진행되지 않은 견적 신청서');
    }

    // 2. managerFormBid 데이터 포멧팅
    const formattedBid = {
      managerFormBidId: managerFormBid.managerFormBidId,
      managerFormId: managerFormBid.managerFormId,
      funeralId: managerFormBid.funeralId,
      funeralName: managerFormBid.funeralList.funeral_name,
      funeralHallName: managerFormBid.funeralHallInfo.funeralHallName,
      funeralHallSize: managerFormBid.funeralHallInfo.funeralHallSize,
      funeralHallNumberOfMourners: managerFormBid.funeralHallInfo.funeralHallNumberOfMourners,
      funeralHallPrice: managerFormBid.funeralHallInfo.funeralHallPrice,
      funeralHallDetailPrice: managerFormBid.funeralHallInfo.funeralHallDetailPrice,
      funeralProponentMoney: managerFormBid.proponentMoney,
      funeralDiscount: managerFormBid.discount,
      bidStatus: managerFormBid.bidStatus,
      bidSubmittedAt: managerFormBid.bidSubmittedAt,
      bidAcceptedAt: managerFormBid.bidAcceptedAt,
    };

    return formattedBid;
  },
};

export default managerFormService;
