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
