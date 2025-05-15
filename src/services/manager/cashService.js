import * as cashDao from '../../daos/manager/cashDao.js';

export const requestCashWithdraw = async (managerId, amount) => {
  return await cashDao.insertCashWithdraw(managerId, amount);
};

export const getCashHistory = async (managerId, page, limit) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await cashDao.fetchCashHistory(managerId, offset, limit);
  return {
    data: rows,
    pageInfo: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    },
  };
};
