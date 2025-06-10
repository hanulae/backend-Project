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

  /**
   * 장례식장 managerFormId를 기반으로 견적서 상세 내용 조회
   */
  async getManagerFormDetail(managerFormId, options = {}) {
    const result = await ManagerForm.findOne({
      where: { managerFormId: managerFormId },
      ...options,
      attributes: [
        'chiefMournerName',
        'deceasedName',
        'numberOfMourners',
        'roomSize',
        'checkInDate',
        'checkOutDate',
        'formStatus',
      ],
    });

    return result;
  },

  /**
   * 견적서 상태 업데이트
   */
  async updateManagerFormStatus(managerFormId, status, options = {}) {
    const result = await ManagerForm.update(
      {
        formStatus: status,
      },
      {
        where: { managerFormId: managerFormId },
        ...options,
      },
    );

    return result;
  },
};

export default managerFormDao;
