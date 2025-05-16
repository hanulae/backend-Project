import DispatchRequest from '../../models/common/dispatchRequest.js';
import ManagerForm from '../../models/manager/managerForm.js';
import { Op } from 'sequelize';

const dispatchRequestDao = {
  /**
   * 출동 신청 생성
   * @param {Object} params
   * @param {Object} options
   * @returns {Promise<DispatchRequest>}
   */
  async createDispatchRequest(params, options = {}) {
    const dispatchRequest = await DispatchRequest.create(params, options);
    return dispatchRequest;
  },

  /**
   * 출동신청서 중복 확인
   * @param {Object} params
   * @param {Object} options
   * @returns {Promise<DispatchRequest>}
   */
  async existingDispatchRequest(params, options = {}) {
    const dispatchRequest = await DispatchRequest.findOne({
      where: params,
      ...options,
    });
    return dispatchRequest;
  },

  /**
   * 출동 신청 내역 리스트 조회
   * @param {Object} userId (funeralId or managerId)
   * @returns {Promise<DispatchRequest>}
   */
  async getDispatchRequestList(userId) {
    const dispatchRequestList = await DispatchRequest.findAll({
      where: {
        [Op.or]: [
          {
            funeralId: userId,
          },
          {
            managerId: userId,
          },
        ],
      },
      include: [
        {
          model: ManagerForm,
          as: 'managerForm',
          attributes: ['chiefMournerName'],
        },
      ],
      attributes: ['dispatchRequestId', 'isApproved', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    return dispatchRequestList;
  },

  /**
   * 출동 신청 내역 상세 조회
   * @param {Object} dispatchRequestId
   * @returns {Promise<DispatchRequest>}
   */
  async getDispatchRequestDetail(dispatchRequestId, options = {}) {
    const dispatchRequestDetail = await DispatchRequest.findByPk(dispatchRequestId, options);
    return dispatchRequestDetail;
  },

  /**
   * 출동 신청서 상태(isApproved) 변경
   * @param {Object} dispatchRequestId
   * @param {Object} options
   * @returns {Promise<DispatchRequest>}
   */
  async updateDispatchRequestStatus(dispatchRequestId, status, options = {}) {
    const updateDispatchRequestStatus = await DispatchRequest.update(
      { isApproved: status },
      {
        where: {
          dispatchRequestId: dispatchRequestId,
        },
        ...options,
      },
    );
    return updateDispatchRequestStatus;
  },

  /**
   * 출동 신청서 삭제
   * @param {Object} dispatchRequestId
   * @param {Object} options
   * @returns {Promise<DispatchRequest>}
   */
  async destroyDispatchRequest(dispatchRequestId, options = {}) {
    const destroyDispatchRequest = await DispatchRequest.destroy({
      where: {
        dispatchRequestId: dispatchRequestId,
      },
      ...options,
    });
    return destroyDispatchRequest;
  },
};

export default dispatchRequestDao;
