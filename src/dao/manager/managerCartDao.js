import ManagerCart from '../../models/manager/managerCart.js';
import FuneralList from '../../models/funeral/funeralList.js';
import { Op } from 'sequelize';

const ManagerCartDao = {
  /**
   * 상조팀장 장바구니 추가
   */
  async addManagerCart(newCartItems) {
    if (newCartItems.length === 0) {
      return 0;
    }

    return await ManagerCart.bulkCreate(newCartItems);
  },

  /**
   * 상조 팀장 장바구니 조회
   */
  async getManagerCart(managerId) {
    const result = await ManagerCart.findAll({
      where: {
        managerId: managerId,
      },
      include: [
        {
          model: FuneralList,
          as: 'funeralList',
        },
      ],
    });

    return result;
  },

  /**
   * 상조 팀장 장바구니 삭제
   */
  async deleteManagerCart(managerId, managerCartId) {
    const result = await ManagerCart.destroy({
      where: {
        managerId: managerId,
        managerCartId: {
          [Op.in]: managerCartId,
        },
      },
    });

    return result;
  },

  /**
   * 기존 장바구니 항목 조회 (장바구니 추가 시 중복 확인)
   */
  async getExistingCarts(managerId, funeralListId) {
    return await ManagerCart.findAll({
      where: {
        managerId: managerId,
        funeralListId: {
          [Op.in]: funeralListId,
        },
      },
    });
  },

  /**
   * 장바구니 삭제 시 유효한 데이터 확인
   */
  async getManagerCartsByIds(managerId, managerCartId) {
    return await ManagerCart.findAll({
      where: {
        managerId: managerId,
        managerCartId: {
          [Op.in]: managerCartId,
        },
      },
    });
  },
};

export default ManagerCartDao;
