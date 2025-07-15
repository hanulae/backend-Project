import db from '../../models/index.js';

// 상조팀장 환급 요청 전체 조회
export const findManagerRefundRequests = async () => {
  try {
    return await db.ManagerCashRefundRequest.findAll({
      include: [
        {
          model: db.Manager,
          as: 'manager',
        },
      ],
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
      include: [
        {
          model: db.Funeral,
          as: 'funeral',
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('장례식장 환급 요청 DAO 오류: ' + error.message);
  }
};

// 단건 조회
export const findManagerRefundById = async (requestId) => {
  try {
    return await db.ManagerCashRefundRequest.findByPk(requestId);
  } catch (error) {
    throw new Error('상조팀장 환급 요청 조회 오류: ' + error.message);
  }
};

//매니저 조회
export const findManagerById = async (managerId) => {
  try {
    return await db.Manager.findByPk(managerId);
  } catch (error) {
    throw new Error('상조팀장 조회 오류: ' + error.message);
  }
};

export const findFuneralRefundById = async (id) => {
  try {
    return await db.FuneralCashRefundRequest.findByPk(id);
  } catch (error) {
    throw new Error('장례식장 환급 요청 조회 오류: ' + error.message);
  }
};

// 상조팀장 환급 완료 내역
export const getManagerCashRefundHistory = async () => {
  return await db.ManagerCashRefundRequest.findAll({
    where: { status: 'approved' },
    order: [['updatedAt', 'DESC']],
    include: [
      {
        model: db.Manager,
        as: 'manager',
        // attributes: { exclude: ['managerPassword'] }, // 필요시
      },
    ],
  });
};

// 장례식장 환급 완료 내역
export const getFuneralCashRefundHistory = async () => {
  return await db.FuneralCashRefundRequest.findAll({
    where: { status: 'approved' },
    order: [['updatedAt', 'DESC']],
    include: [
      {
        model: db.Funeral,
        as: 'funeral',
        // attributes: { exclude: ['funeralPassword'] }, // 필요시
      },
    ],
  });
};

export const findManagerRefundsByUserId = async (managerId) => {
  try {
    return await db.ManagerCashRefundRequest.findAll({
      where: { managerId },
      include: [
        {
          model: db.Manager,
          as: 'manager', // 관계 설정 시 사용한 별칭
          attributes: { exclude: ['managerPassword'] }, // 비밀번호 제외
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('상조팀장 환급 신청 내역 조회 오류: ' + error.message);
  }
};

export const findFuneralRefundsByUserId = async (funeralId) => {
  try {
    return await db.FuneralCashRefundRequest.findAll({
      where: { funeralId },
      include: [
        {
          model: db.Funeral,
          as: 'funeral', // 관계 설정 시 사용한 별칭
          attributes: { exclude: ['funeralPassword'] }, // 비밀번호 제외
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('장례식장 환급 신청 내역 조회 오류: ' + error.message);
  }
};
