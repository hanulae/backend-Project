/**
 * 파일명: managerFormService.js
 * 설명: 상조팀장 견적 관련 비즈니스 로직 처리 서비스
 * 역할: 견적 신청, 조회, 입찰 관련 등의 비즈니스 로직 처리
 */
import { sequelize } from '../../config/database.js';
import logger from '../../config/logger.js';
import managerFormDao from '../../dao/manager/managerFormDao.js';
import managerFormBidDao from '../../dao/manager/managerFormBidDao.js';
import funeralListDao from '../../dao/funeral/funeralListDao.js';
// import fcmService from '../common/fcmService.js';
// import coolsms from 'coolsms-node-sdk';
import { sendNotificationToFuneralGroupBasedOnSettings } from '../../utils/notificationHelper.js';

// const client = new coolsms.default(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

const managerFormService = {
  /**
   * 견적 신청서 생성 및 장례식장에 알림 전송
   *
   * 처리 과정:
   * 1. 견적 신청서 생성
   * 2. 선택된 장례식장 정보 조회
   * 3. 장례식장별 입찰 데이터 생성
   * 4. 트랜잭션 커밋
   * 5. 알림 전송 (FCM, SMS)
   *    - 회원가입한 장례식장에만 알림 전송
   *    - 장례식장 및 소속 직원들에게 FCM, SMS 알림 전송
   *
   * @param {Object} managerFormData
   * @param {string} managerFormData.managerId - 상조팀장 ID
   * @param {string} managerFormData.chiefMournerName - 상주 이름
   * @param {string} [managerFormData.deceasedName] - 고인 이름 (선택)
   * @param {number} [managerFormData.numberOfMourners] - 예상 조문객 수
   * @param {number} [managerFormData.roomSize] - 평수 (선택)
   * @param {string} managerFormData.checkInDate - 입실일자
   * @param {string} managerFormData.checkOutDate - 퇴실일자
   * @param {Array<string>} funeralListIds - 견적을 요청할 장례식장 ID 목록
   *
   * @returns {Promise<Object>} 견적 신청 결과
   * @returns {boolean} success - 성공 여부
   * @returns {string} message - 결과 메시지
   *
   * @throws {Error} 견적 신청서 생성 실패 시 오류 발생
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

      await transaction.commit();

      // 트랜잭션 커밋 후 비동기 알림 전송
      try {
        const notificationPromises = funeralData
          .filter((item) => item.funeralId) // 회원가입한 장례식장만 알림 전송
          .map(async (item) => {
            try {
              // 장례식장funeral + 장례식장에 등록된 직원들 funeralStaff에게 알림을 전송
              await sendNotificationToFuneralGroupBasedOnSettings({
                funeralId: item.funeralId,
                notificationType: 'manager_form_created',
                data: {
                  managerFormId: managerForm.managerFormId,
                  chiefMournerName: managerFormData.chiefMournerName,
                },
                senderId: managerFormData.managerId,
                senderType: 'manager',
                smsParams: {
                  message: '상조팀장님이 견적 신청을 하였습니다.',
                },
              });

              logger.info(`견적 신청 그룹 알림 전송 성공: 장례식장 ${item.funeralId}`);
            } catch (notificationError) {
              logger.error(
                `견적 신청 그룹 알림 전송 실패: 장례식장 ${item.funeralId}`,
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
   *
   * 처리 과정:
   * 1. 상조팀장이 작성한 모든 견적서 조회
   * 2. 견적서 별 입찰 갯수 조회
   * 3. 견적서 목록에 입찰 수 정보 추가
   *
   * @param {string} managerId - 상조팀장 ID
   * @returns {Promise<Object>} 견적 신청서 내역 조회 결과
   * @returns {boolean} success - 성공 여부
   * @returns {Object} data - 견적 신청서 내역 데이터
   * @returns {Array} managerFormList - 견적 신청서 목록
   *
   * @throws {Error} 견적 신청서 내역 조회 실패 시 오류 발생
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
   *
   * 처리 과정:
   * 1. 견적 신청서 ID를 기반으로 생성된 입찰 리스트 조회
   * 2. 데이터 포멧팅
   *
   * @param {string} managerFormId - 견적 신청서 ID
   * @returns {Promise<Object>} 견적 신청서 내역 조회 결과
   * @returns {boolean} success - 성공 여부
   * @returns {Object} data - 견적 신청서 내역 데이터
   * @returns {Array} managerFormDetail - 견적 신청서 목록
   *
   * @throws {Error} 견적 신청서 내역 조회 실패 시 오류 발생
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
          funeralName: plain.funeralList.funeralName,
          funeralAddress: plain.funeralList.funeralAddress,
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
   *
   * 처리 과정:
   * 1. managerFormBid 조회
   * 2. 입찰 상태 확인
   * 3. 데이터 포멧팅
   *
   * @param {string} managerFormBidId - 입찰 ID
   * @returns {Promise<Object>} 입찰 상세 내역 조회 결과
   * @returns {boolean} success - 성공 여부
   * @returns {Object} data - 입찰 상세 내역 데이터
   * @returns {Array} managerFormBidDetail - 입찰 상세 내역 목록
   *
   * @throws {Error} 입찰 상세 내역 조회 실패 시 오류 발생
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
      funeralName: managerFormBid.funeralList.funeralName,
      funeralHallName: managerFormBid.funeralHallName,
      funeralHallSize: managerFormBid.funeralHallSize,
      funeralHallNumberOfMourners: managerFormBid.funeralHallNumberOfMourners,
      funeralHallPrice: managerFormBid.funeralHallPrice,
      funeralHallDetailPrice: managerFormBid.funeralHallDetailPrice,
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
