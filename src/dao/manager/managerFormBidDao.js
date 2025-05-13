import ManagerFormBid from '../../models/manager/managerFormBid.js';
import funeralList from '../../models/funeral/funeralList.js';
import funeralHallInfo from '../../models/funeral/funeralHallInfo.js';
import { Op, fn, col } from 'sequelize';

const managerFormBidDao = {
  /**
   * 입찰 신청서 생성
   */
  async createManagerFormBid(managerFormBidData, options = {}) {
    const result = await ManagerFormBid.bulkCreate(managerFormBidData, options);
    return result;
  },

  /**
   * 각각의 견적신청서 마다 입찰 신청서 갯수 조회
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
   * 견적신청서 ID를 기반으로 생성된 입찰 리스트 조회
   * 한명의 상주님의 입찰 리스트 조회
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
          attributes: ['funeral_name', 'funeral_address'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    return result;
  },

  /**
   * 장례식장 ID를 통한 모든 상조팀장의 견적서 리스트 조회
   */
  async getAllManagerFormByFuneralId(funeralId) {
    const result = await ManagerFormBid.findAll({
      where: {
        funeralId: funeralId,
      },
      attributes: ['managerFormBidId', 'managerFormCreatedAt', 'bidSubmittedAt', 'bidStatus'],
    });

    return result;
  },

  /**
   * managerFormBidId를 기반으로 managerFormId 조회
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
   */
  async getManagerFormBidById(managerFormBidId, type = 'funeral', options = {}) {
    if (type === 'funeral') {
      const bid = await ManagerFormBid.findByPk(managerFormBidId, options);
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
            attributes: ['funeral_name'],
          },
          {
            model: funeralHallInfo,
            as: 'funeralHallInfo',
            attributes: [
              'funeralHallName',
              'funeralHallSize',
              'funeralHallNumberOfMourners',
              'funeralHallPrice',
              'funeralHallDetailPrice',
            ],
          },
        ],
      });
      return bid;
    }
  },

  /**
   * 장례식장 입찰 신청
   */
  async updateManagerFormBid(params, options = {}) {
    const result = await ManagerFormBid.update(
      {
        ...params,
        bidStatus: 'bid_submitted',
        bidSubmittedAt: new Date(),
      },
      {
        where: {
          managerFormBidId: params.managerFormBidId,
        },
        ...options,
      },
    );

    return result;
  },
};

export default managerFormBidDao;
