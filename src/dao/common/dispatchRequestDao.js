/**
 * 파일명: dispatchRequestDao.js
 * 설명: 출동 신청 관련 데이터베이스 접근 객체
 * 상조팀장과 장례식장 간의 출동 신청서 처리를 담당합니다.
 */

import DispatchRequest from '../../models/common/dispatchRequest.js';
import ManagerForm from '../../models/manager/managerForm.js';
import Funeral from '../../models/funeral/funeral.js';
import { Op } from 'sequelize';

const dispatchRequestDao = {
  /**
   * 출동 신청 생성
   *
   * 상조팀장이 장례식장에 출동 신청서를 생성합니다.
   *
   * @param {Object} params - 출동 신청 데이터 객체
   *   @param {string} params.managerId - 상조팀장 ID
   *   @param {string} params.funeralId - 장례식장 ID
   *   @param {string} params.managerFormId - 견적 신청서 ID
   *   @param {string} [params.managerFormBidId] - 입찰 신청서 ID
   *   @param {string} [params.isApproved] - 승인 상태 (기본값: 'pending')
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<DispatchRequest>} 생성된 출동 신청서 객체
   * @throws {Error} 출동 신청서 생성 실패 시 발생
   */
  async createDispatchRequest(params, options = {}) {
    const dispatchRequest = await DispatchRequest.create(params, options);
    return dispatchRequest;
  },

  /**
   * 출동신청서 중복 확인
   *
   * 이미 동일한 조건의 출동 신청서가 존재하는지 확인합니다.
   * 중복 신청 방지를 위해 사용됩니다.
   *
   * @param {Object} params - 조회 조건 객체 (managerId, funeralId, managerFormId 등)
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<DispatchRequest|null>} 중복된 출동 신청서 객체 또는 없을 경우 null
   * @throws {Error} 조회 실패 시 발생
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
   *
   * 특정 사용자(장례식장 또는 상조팀장)의 출동 신청 내역 리스트를 조회합니다.
   * 상주 이름 정보를 포함하여 가장 최근에 신청된 순서로 정렬합니다.
   *
   * @param {string} userId - 사용자 ID (funeralId 또는 managerId)
   * @returns {Promise<Array<DispatchRequest>>} 출동 신청서 객체 배열
   * @throws {Error} 조회 실패 시 발생
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
   *
   * 특정 출동 신청서의 상세 내용을 조회합니다.
   * 상주 이름과 장례식장 이름 정보를 포함합니다.
   *
   * @param {string} dispatchRequestId - 출동 신청서 ID
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<DispatchRequest|null>} 출동 신청서 상세 객체 또는 없을 경우 null
   * @throws {Error} 조회 실패 시 발생
   */
  async getDispatchRequestDetail(dispatchRequestId, options = {}) {
    const dispatchRequestDetail = await DispatchRequest.findOne({
      where: {
        dispatchRequestId: dispatchRequestId,
      },
      include: [
        {
          model: ManagerForm,
          as: 'managerForm',
          attributes: ['chiefMournerName'],
        },
        {
          model: Funeral,
          as: 'funeral',
          attributes: ['funeralName'],
        },
      ],
      ...options,
    });
    return dispatchRequestDetail;
  },

  /**
   * 출동 신청서 상태(isApproved) 변경
   *
   * 출동 신청서의 승인 상태를 변경합니다.
   * 상태는 'pending', 'approved', 'rejected' 등이 될 수 있습니다.
   *
   * @param {string} dispatchRequestId - 출동 신청서 ID
   * @param {string} status - 변경할 상태값
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 업데이트 실패 시 발생
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
   *
   * 특정 출동 신청서를 삭제합니다.
   * 실제 데이터베이스에서 삭제되며, 복구가 불가능합니다.
   *
   * @param {string} dispatchRequestId - 출동 신청서 ID
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<number>} 삭제된 행 수
   * @throws {Error} 삭제 실패 시 발생
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
