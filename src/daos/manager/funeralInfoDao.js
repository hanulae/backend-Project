import { Op } from 'sequelize';
import db from '../../models/index.js';
const { FuneralHallInfo } = db;

export const fetchFuneralList = async (offset, limit) => {
  return await FuneralHallInfo.findAndCountAll({
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  });
};

export const fetchFuneralDetail = async (funeralId) => {
  return await FuneralHallInfo.findOne({
    where: { id: funeralId },
  });
};

export const searchFuneralDetail = async ({
  keyword,
  location,
  capacityMin,
  capacityMax,
  offset,
  limit,
}) => {
  const where = {};

  if (keyword) {
    where.name = { [Op.iLike]: `%${keyword}%` };
  }

  if (location) {
    where.location = { [Op.iLike]: `%${location}%` };
  }

  if (capacityMin) {
    where.capacity = { ...(where.capacity || {}), [Op.gte]: capacityMin };
  }

  if (capacityMax) {
    where.capacity = { ...(where.capacity || {}), [Op.lte]: capacityMax };
  }

  return await FuneralHallInfo.findAndCountAll({
    where,
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  });
};
