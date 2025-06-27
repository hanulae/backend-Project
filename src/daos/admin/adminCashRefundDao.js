import db from '../../models/index.js';

// 상조팀장 환급 요청 전체 조회
export const findManagerRefundRequests = async () => {
  try {
    return await db.ManagerCashRefundRequest.findAll({
      include: [{ model: db.Manager, as: 'manager', attributes: ['managerName', 'managerEmail'] }],
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('상조팀장 환급 요청 DAO 오류: ' + error.message);
  }
};

// 장례식장 환급 요청 전체 조회
export const findFuneralRefundRequests = async () => {
  try {
    return await db.FuneralCashRefundRequest.findAll({
      include: [{ model: db.Funeral, as: 'funeral', attributes: ['funeralName', 'funeralEmail'] }],
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('장례식장 환급 요청 DAO 오류: ' + error.message);
  }
};

// 단건 조회
export const findManagerRefundById = async (id) => {
  try {
    return await db.ManagerCashRefundRequest.findByPk(id);
  } catch (error) {
    throw new Error('상조팀장 환급 요청 조회 오류: ' + error.message);
  }
};

export const findFuneralRefundById = async (id) => {
  try {
    return await db.FuneralCashRefundRequest.findByPk(id);
  } catch (error) {
    throw new Error('장례식장 환급 요청 조회 오류: ' + error.message);
  }
};
