import ManagerFormBid from '../../models/manager/managerFormBid.js';
import funeralList from '../../models/funeral/funeralList.js';
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
  async getManagerFormDetail(managerFormId) {
    const result = await ManagerFormBid.findAll({
      where: {
        managerFormId: managerFormId,
      },
      attributes: ['bid_status'],
      include: [
        {
          model: funeralList,
          as: 'funeralList',
          attributes: ['funeral_name', 'funeral_address'],
        },
      ],
    });

    return result;
  },
};

export default managerFormBidDao;
