// src/daos/admin/adminDispatchRequestDao.js
import db from '../../models/index.js';

export const findDispatchRequestsByAdminId = async (adminId) => {
  try {
    return await db.DispatchRequest.findAll({
      where: { adminId },
      include: [
        {
          model: db.Admin,
          attributes: ['adminName', 'adminEmail'],
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching dispatch requests:', error);
    throw error;
  }
};

export const findDispatchRequestsByManagerId = async (managerId) => {
  try {
    return await db.DispatchRequest.findAll({
      where: { managerId },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('상조팀장 출동 요청 조회 오류: ' + error.message);
  }
};

export const findDispatchRequestsByFuneralId = async (funeralId) => {
  try {
    return await db.DispatchRequest.findAll({
      where: { funeralId },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('장례식장 출동 요청 조회 오류: ' + error.message);
  }
};
