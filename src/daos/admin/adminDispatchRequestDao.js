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
