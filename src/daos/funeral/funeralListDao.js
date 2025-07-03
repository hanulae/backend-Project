import db from '../../models/index.js';

export const getFuneralList = async () => {
  const funeralList = await db.FuneralList.findAll();
  return funeralList;
};
