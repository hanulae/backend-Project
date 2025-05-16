import * as funeralInfoDao from '../../daos/manager/funeralInfoDao.js';

export const getFuneralList = async ({ page, limit }) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await funeralInfoDao.fetchFuneralList(offset, limit);

  return {
    funerals: rows,
    pageInfo: {
      currentPage: Number(page),
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

export const getFuneralDetail = async (funeralId) => {
  const funeral = await funeralInfoDao.fetchFuneralDetail(funeralId);
  if (!funeral) throw new Error('해당 장례식장을 찾을 수 없습니다.');
  return funeral;
};

export const searchFuneralDetail = async ({
  keyword,
  location,
  capacityMin,
  capacityMax,
  page,
  limit,
}) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await funeralInfoDao.searchFuneralDetail({
    keyword,
    location,
    capacityMin,
    capacityMax,
    offset,
    limit,
  });

  return {
    funerals: rows,
    pageInfo: {
      currentPage: Number(page),
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};
