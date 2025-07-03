import * as funeralListDao from '../../daos/funeral/funeralListDao.js';

export const getFuneralList = async () => {
  const funeralList = await funeralListDao.getFuneralList();
  return funeralList;
};
