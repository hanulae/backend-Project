import db from '../../models/index.js';
import logger from '../../config/logger.js'; // 없으면 console.error로 대체 가능

export const findAllPending = async () => {
  try {
    return await db.Manager.findAll({
      where: { isApproved: false },
      order: [['createdAt', 'DESC']],
      attributes: {
        exclude: ['managerPassword'],
      },
    });
  } catch (error) {
    logger.error('🔴 findAllPending 오류:', error);
    throw error;
  }
};

export const updateApproval = async (managerId, isApproved) => {
  try {
    return await db.Manager.update(
      {
        isApproved,
        approvedAt: isApproved ? new Date() : null,
      },
      {
        where: { managerId },
        returning: true,
      },
    );
  } catch (error) {
    logger.error('🔴 updateApproval 오류:', error);
    throw error;
  }
};

export const findByApprovalStatus = async (isApproved = false) => {
  try {
    return await db.Manager.findAll({
      where: { isApproved },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['managerPassword'] },
    });
  } catch (error) {
    logger.error('🔴 findByApprovalStatus 오류:', error);
    throw error;
  }
};
