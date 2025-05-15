import db from '../../models/index.js';
import logger from '../../config/logger.js'; // 없으면 console.error 사용 가능
import { validate as isUUID } from 'uuid';

export const findAllPending = async () => {
  try {
    return await db.Funeral.findAll({
      where: { isApproved: false },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['funeralPassword'] },
    });
  } catch (error) {
    logger.error('🔴 findAllPending 오류:', error);
    throw error;
  }
};

export const updateApproval = async (funeralId, isApproved) => {
  try {
    // ✅ 1. UUID 형식 검증
    if (!isUUID(funeralId)) {
      return 'invalid_uuid';
    }

    // ✅ 2. 존재 여부 확인
    const funeral = await db.Funeral.findByPk(funeralId);
    if (!funeral) {
      return null;
    }

    // ✅ 3. 승인/거절 처리
    funeral.isApproved = isApproved;
    funeral.approvedAt = isApproved ? new Date() : null;
    await funeral.save();

    return funeral;
  } catch (error) {
    logger.error('🔴 updateApproval 오류:', error);
    throw error;
  }
};

export const findByApprovalStatus = async (isApproved = false) => {
  try {
    return await db.Funeral.findAll({
      where: { isApproved },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['funeralPassword'] },
    });
  } catch (error) {
    logger.error('🔴 findByApprovalStatus 오류:', error);
    throw error;
  }
};
