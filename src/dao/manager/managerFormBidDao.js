/**
 * 파일명: managerFormBidDao.js
 * 설명: 상조팀장 견적 입찰 관련 데이터베이스 접근 객체
 */

import ManagerFormBid from '../../models/manager/managerFormBid.js';
import funeralList from '../../models/funeral/funeralList.js';
import managerForm from '../../models/manager/managerForm.js';
import funeral from '../../models/funeral/funeral.js';
import { Op, fn, col } from 'sequelize';

/**
 * 상태별 업데이트 데이터 준비 함수 (중앙화)
 * 입찰 상태에 따라 필요한 업데이트 데이터를 생성합니다.
 *
 * @param {string} status - 업데이트할 상태값
 * @param {Object} additionalData - 추가 데이터 객체
 * @returns {Object} 업데이트에 사용할 데이터 객체
 */
const getBidStatusUpdateData = (status, additionalData = {}) => {
  const statusMap = {
    bid_submitted: {
      bidStatus: status,
      bidSubmittedAt: new Date(),
    },
    bid_selected: {
      bidStatus: status,
      bidSelectedAt: new Date(),
    },
    bid_progress: {
      bidStatus: status,
      bidApprovedAt: new Date(),
    },
    cancel: {
      bidStatus: 'bid_submitted',
      bidSelectedAt: null,
    },
    transaction_completed: {
      bidStatus: status,
      transactionCompletedAt: new Date(),
    },
    rejected: {
      bidStatus: status,
    },
    expired: {
      bidStatus: status,
    },
  };

  return {
    ...(statusMap[status] || { bidStatus: status }),
    ...additionalData,
  };
};

const managerFormBidDao = {
  /**
   * 입찰 신청서 생성
   *
   * 상조팀장이 작성한 견적 신청서에 대한 입찰 신청서를 생성합니다.
   * 다수의 입찰 신청서를 한번에 생성할 수 있습니다(bulkCreate).
   *
   * @param {Array<Object>} managerFormBidData - 생성할 입찰 신청서 데이터 객체 배열
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<Array<ManagerFormBid>>} 생성된 입찰 신청서 객체 배열
   * @throws {Error} 입찰 신청서 생성 실패 시 발생
   */
  async createManagerFormBid(managerFormBidData, options = {}) {
    const result = await ManagerFormBid.bulkCreate(managerFormBidData, {
      ...options,
    });
    return result;
  },

  /**
   * 각각의 견적신청서 마다 입찰 신청서 갯수 조회
   *
   * 견적신청서 ID 배열을 기반으로 각 견적신청서에 대한 입찰 신청서 갯수를 조회합니다.
   * 중복된 견적신청서 ID가 있는 경우 중복된 견적신청서 ID는 한번만 계산됩니다.
   *
   * @param {Array<string>} managerFormIdArr - 견적신청서 ID 배열
   * @returns {Object} 견적신청서 ID를 키로 하고 입찰 신청서 갯수를 값으로 하는 객체
   * @throws {Error} 조회 실패 시 발생
   */
  async getBidCountByFormIds(managerFormIdArr) {
    const result = await ManagerFormBid.findAll({
      attributes: ['managerFormId', [fn('COUNT', col('manager_form_bid_id')), 'bidCount']],
      where: {
        managerFormId: {
          [Op.in]: managerFormIdArr,
        },
      },
      group: ['managerFormId'],
    });

    // 결과를 {managerFormId: count} 형태로 변환
    return result.reduce((acc, row) => {
      acc[row.managerFormId] = parseInt(row.get('bidCount'), 10);
      return acc;
    }, {});
  },

  /**
   * managerFormBidId를 기반으로 조회
   * 장례식장 거래 완료 페이지에서 제안한 호실 정보 조회 시 사용을 위한 DAO로 만들어짐
   *
   * @param {string} managerFormBidId - 입찰 신청서 ID
   * @returns {Promise<ManagerFormBid>} 입찰 신청서 객체
   * @throws {Error} 조회 실패 시 발생
   */
  async getManagerFormBidByManagerFormBidId(managerFormBidId) {
    const result = await ManagerFormBid.findOne({
      where: {
        managerFormBidId: managerFormBidId,
      },
      // attributes: ['proponentMoney', 'discount'],
      // include: [
      //   {
      //     model: funeralHallInfo,
      //     as: 'funeralHallInfo',
      //     attributes: [
      //       'funeralHallName',
      //       'funeralHallSize',
      //       'funeralHallNumberOfMourners',
      //       'funeralHallPrice',
      //       'funeralHallDetailPrice',
      //     ],
      //   },
      // ],
    });

    return result;
  },

  /**
   * 견적신청서 ID를 기반으로 생성된 입찰 리스트 조회
   * 한명의 상주님의 입찰 리스트 조회
   *
   * @param {string} managerFormId - 견적신청서 ID
   * @returns {Promise<Array<ManagerFormBid>>} 입찰 신청서 객체 배열
   * @throws {Error} 조회 실패 시 발생
   */
  async getManagerFormBidStatusList(managerFormId) {
    const result = await ManagerFormBid.findAll({
      where: {
        managerFormId: managerFormId,
      },
      attributes: ['managerFormBidId', 'bid_status'],
      include: [
        {
          model: funeralList,
          as: 'funeralList',
          attributes: ['funeralName', 'funeralAddress'], // 모델 필드명 사용
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    return result;
  },

  /**
   * 장례식장 ID를 통한 모든 상조팀장의 견적서 리스트 조회
   *
   * @param {string} funeralId - 장례식장 ID
   * @returns {Promise<Array<ManagerFormBid>>} 입찰 신청서 객체 배열
   * @throws {Error} 조회 실패 시 발생
   */
  async getAllManagerFormByFuneralId(funeralId) {
    const result = await ManagerFormBid.findAll({
      where: {
        funeralId: funeralId,
      },
      attributes: ['managerFormBidId', 'managerFormCreatedAt', 'bidSubmittedAt', 'bidStatus'],
      include: [
        {
          model: managerForm,
          as: 'managerForm',
          attributes: ['chiefMournerName'],
        },
      ],
      order: [['managerFormCreatedAt', 'DESC']],
    });

    return result;
  },

  /**
   * 장례식장 ID를 기반으로 해당 장례식장의 입찰 내역 조회 (추후 개발)
   * 조건: 'bid_submitted', // 장례식장이 입찰 제출
   *      'bid_selected', // 상조팀장이 입찰 선택 및 출동 신청
   *      'bid_progress' // 장례식장 + 상조팀장 출동요청 및 출동 승인 후 거래 진행중 상태
   */
  // async getManagerFormBidSpecificStatus(funeralId) {
  //   const result = await ManagerFormBid.findAll({
  //     where: {
  //       funeralId: funeralId,
  //       bidStatus: {
  //         [Op.in]: ['bid_submitted', 'bid_selected', 'bid_progress'],
  //       },
  //     },
  //   });

  //   return result;
  // },

  /**
   * 관리자 장례식장 별 상조 팀장의 모든 견적 신청서 조회
   *
   * @param {string} funeralId - 장례식장 ID
   * @returns {Promise<Array<ManagerFormBid>>} 입찰 신청서 객체 배열
   * @throws {Error} 조회 실패 시 발생
   */
  async getAdminManagerFormByFuneralId(funeralId) {
    const result = await ManagerFormBid.findAll({
      where: {
        funeralId: funeralId,
      },
      include: [
        {
          model: managerForm,
          as: 'managerForm',
          attributes: ['chiefMournerName'],
        },
      ],
      order: [['managerFormCreatedAt', 'DESC']],
    });

    return result;
  },

  /**
   * managerFormBidId를 기반으로 managerFormId 조회
   *
   * @param {string} managerFormBidId - 입찰 신청서 ID
   * @returns {Promise<string>} 견적신청서 ID
   * @throws {Error} 조회 실패 시 발생
   */
  async getManagerFormIdByManagerFormBidId(managerFormBidId) {
    const result = await ManagerFormBid.findOne({
      where: {
        managerFormBidId: managerFormBidId,
      },
      attributes: ['managerFormId'],
    });

    return result.managerFormId;
  },

  /**
   * managerFormBidId를 기반으로 입찰 신청서 조회
   *
   * @param {string} managerFormBidId - 입찰 신청서 ID
   * @param {string} type - 조회 타입 ('funeral', 'manager')
   * @param {Object} options - 추가 옵션 객체
   * @returns {Promise<ManagerFormBid>} 입찰 신청서 객체
   * @throws {Error} 조회 실패 시 발생
   */
  async getManagerFormBidById(managerFormBidId, type, options = {}) {
    if (type === 'funeral') {
      const bid = await ManagerFormBid.findOne({
        where: {
          managerFormBidId: managerFormBidId,
        },
        include: [
          {
            model: managerForm,
            as: 'managerForm',
            attributes: ['managerId'],
          },
        ],
        ...options,
      });
      return bid;
    } else if (type === 'manager') {
      const bid = await ManagerFormBid.findOne({
        where: {
          managerFormBidId: managerFormBidId,
        },
        include: [
          {
            model: funeralList,
            as: 'funeralList',
            attributes: ['funeralName'], // 모델 필드명 사용
          },
          {
            model: funeral,
            as: 'funeral',
            attributes: ['funeralName'],
          },
        ],
      });

      return bid;
    }
  },

  /**
   * 장례식장 입찰 신청, 상조팀장 출동 신청 시 상태 업데이트
   *
   * @param {Object} params - 업데이트할 데이터 객체
   * @param {string} status - 업데이트할 상태값
   * @param {Object} options - 추가 옵션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 업데이트 실패 시 발생
   */
  async updateManagerFormBidStatus(params, status, options = {}) {
    const updateData = {
      ...params,
      ...getBidStatusUpdateData(status),
    };

    const result = await ManagerFormBid.update(updateData, {
      where: {
        managerFormBidId: params.managerFormBidId,
      },
      ...options,
    });

    return result;
  },

  /**
   * 특정 견적서에 대한 다른 입찰제안서들 조회 (특정 입찰제안서 제외)
   * @param {string} managerFormId
   * @param {string} excludeBidId 제외할 입찰제안서 ID
   * @param {Object} options
   * @returns {Promise<Array<ManagerFormBid>>} 입찰 신청서 객체 배열
   * @throws {Error} 조회 실패 시 발생
   */
  async getOtherManagerFormBidByManagerFormId(managerFormId, excludeBidId, options = {}) {
    const bids = await ManagerFormBid.findAll({
      where: {
        managerFormId: managerFormId,
        managerFormBidId: {
          [Op.ne]: excludeBidId,
        },
      },
      ...options,
    });

    return bids;
  },
};

export default managerFormBidDao;
