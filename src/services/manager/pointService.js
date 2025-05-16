import * as pointDao from '../../daos/manager/pointDao.js';

export const requestPointToCash = async (managerId, amount) => {
  return await pointDao.insertPointToCash(managerId, amount);
};

export const getPointHistory = async (managerId, page, limit) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await pointDao.fetchPointHistory(managerId, offset, limit);
  return {
    data: rows,
    pageInfo: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    },
  };
};
