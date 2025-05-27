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

export const findByManagerId = async (managerId) => {
  try {
    return await db.ManagerAddDocument.findOne({
      where: { managerId },
      attributes: ['fileUrl', 'createdAt'],
    });
  } catch (error) {
    throw new Error('상조팀장 파일 조회 오류: ' + error.message);
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

export const findManagerFile = async (managerId) => {
  try {
    return await db.ManagerAddDocument.findAll({
      where: { managerId },
      attributes: ['managerDocPath', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    logger.error('🔴 findManagerFile 오류:', error);
    throw error;
  }
};
