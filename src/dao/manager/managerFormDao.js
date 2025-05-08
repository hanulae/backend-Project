import ManagerForm from '../../models/manager/managerForm.js';

const managerFormDao = {
  /**
   * 견적 신청 생성
   * @param {Object} managerFormData
   * @param {Object} options - {transaction : sequelize transaction}
   * @returns {Promise<ManagerForm>}
   */
  async createManagerForm(managerFormData, options = {}) {
    const result = await ManagerForm.create(managerFormData, options);
    return result;
  },

  /**
   * 상조팀장 견적 신청서 내역 조회
   */
  async getManagerFormList(managerId) {
    const result = await ManagerForm.findAll({
      where: {
        managerId: managerId,
      },
      order: [['createdAt', 'DESC']],
    });

    return result;
  },
};

export default managerFormDao;
