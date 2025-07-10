import * as adminUserDao from '../../daos/admin/adminUserDao.js';

export const getUsersByType = async (type) => {
  if (type === 'all') {
    const [managers, funerals] = await Promise.all([
      adminUserDao.findAllManagers(),
      adminUserDao.findAllFunerals(),
    ]);
    return { managers, funerals };
  }

  if (type === 'manager') {
    const managers = await adminUserDao.findAllManagers();
    return { managers };
  }

  if (type === 'funeral') {
    const funerals = await adminUserDao.findAllFunerals();
    return { funerals };
  }

  throw new Error('유효하지 않은 타입입니다. (all, manager, funeral 중 하나)');
};

export const getUserById = async (userId, type) => {
  try {
    if (type === 'manager') {
      const manager = await adminUserDao.findManagerById(userId);
      if (!manager) {
        throw new Error('상조팀장을 찾을 수 없습니다.');
      }
      return { type: 'manager', manager };
    }

    if (type === 'funeral') {
      const funeral = await adminUserDao.findFuneralById(userId);
      if (!funeral) {
        throw new Error('장례식장을 찾을 수 없습니다.');
      }
      return { type: 'funeral', funeral };
    }

    throw new Error('유효하지 않은 타입입니다. (manager, funeral 중 하나)');
  } catch (error) {
    console.error('특정 유저 정보 조회 오류:', error.message);
    throw new Error(`유저 정보 조회 실패: ${error.message}`);
  }
};
