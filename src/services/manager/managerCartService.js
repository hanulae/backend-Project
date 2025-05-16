import ManagerCartDao from '../../dao/manager/managerCartDao.js';

const ManagerCartService = {
  /**
   * 상조팀장 장바구니 추가
   */
  async addManagerCart(addData) {
    const { managerId, funeralListId } = addData;

    // 기존 장바구니 확인 (중복 확인을 위한 기존 장바구니 조회)
    const existingCarts = await ManagerCartDao.getExistingCarts(managerId, funeralListId);

    // 이미 존재하는 장례식장 ID 필터링
    const existingIds = existingCarts.map((cart) => cart.funeralListId);
    const newFuneralListIds = funeralListId.filter((id) => !existingIds.includes(id));

    if (newFuneralListIds.length === 0) {
      return {
        success: true,
        message: '추가하려는 모든 장례식장이 이미 장바구니에 존재',
        addedCount: 0,
      };
    }

    // 새로운 장바구니 목록 생성
    const newCartItems = newFuneralListIds.map((id) => ({
      managerId,
      funeralListId: id,
    }));

    const result = await ManagerCartDao.addManagerCart(newCartItems);

    return {
      success: true,
      message: '장바구니에 추가되었습니다.',
      addedCount: result.length,
    };
  },

  /**
   * 상조팀장 장바구니 조회
   */
  async getManagerCart(managerId) {
    const getManagerCart = await ManagerCartDao.getManagerCart(managerId);

    return {
      success: true,
      data: {
        cartList: getManagerCart,
      },
    };
  },

  /**
   * 상조팀장 장바구니 삭제
   */
  async deleteManagerCart(managerCartId, managerId) {
    // 삭제할 장바구니 확인 (유효한 데이터 존재 확인)
    const existingCart = await ManagerCartDao.getManagerCartsByIds(managerId, managerCartId);

    if (existingCart.length === 0) {
      return {
        success: true,
        message: '해당 장례식장이 장바구니에 존재하지 않습니다.',
        deletedCount: 0,
      };
    }

    const result = await ManagerCartDao.deleteManagerCart(managerId, managerCartId);

    return {
      success: true,
      message: '장바구니 항목이 삭제되었습니다.',
      deletedCount: result,
    };
  },
};

export default ManagerCartService;
