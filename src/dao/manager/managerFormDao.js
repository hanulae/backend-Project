/**
 * 파일명: managerFormDao.js
 * 설명: 상조팀장 견적 신청서 관련 데이터베이스 접근 객체
 */

import ManagerForm from '../../models/manager/managerForm.js';

const managerFormDao = {
  /**
   * 견적 신청 생성
   *
   * 상조팀장이 작성한 견적 신청서를 데이터베이스에 저장합니다.
   * 트랜잭션 내에서 호출될 수 있으며, 생성된 견적 신청서 객체를 반환합니다.
   *
   * @param {Object} managerFormData - 생성할 견적 신청서 데이터 객체
   *   @param {string} managerFormData.managerId - 상조팀장 ID
   *   @param {string} managerFormData.chiefMournerName - 상주 이름
   *   @param {string} managerFormData.deceasedName - 고인 이름
   *   @param {number} managerFormData.numberOfMourners - 상주 인원 수
   *   @param {string} managerFormData.roomSize - 필요한 방 크기
   *   @param {Date} managerFormData.checkInDate - 입실 예정일
   *   @param {Date} managerFormData.checkOutDate - 퇴실 예정일
   *   @param {string} managerFormData.formStatus - 견적서 상태 (기본값: 'pending')
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<ManagerForm>} 생성된 견적 신청서 객체
   * @throws {Error} 견적 신청서 생성 실패 시 발생
   */
  async createManagerForm(managerFormData, options = {}) {
    const result = await ManagerForm.create(managerFormData, options);
    return result;
  },

  /**
   * 상조팀장 견적 신청서 내역 조회
   *
   * 특정 상조팀장이 작성한 모든 견적 신청서 목록을 최신순으로 조회합니다.
   * 페이지네이션은 적용되지 않으며 전체 목록을 반환합니다.
   *
   * @param {string} managerId - 조회할 상조팀장 ID
   * @returns {Promise<Array<ManagerForm>>} 견적 신청서 객체 배열
   * @throws {Error} 조회 실패 시 발생
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
   * 견적서 상세 내용 조회
   *
   * 특정 견적 신청서 ID를 기반으로 견적서의 상세 내용을 조회합니다.
   * 조회 결과는 필요한 필드만 선택적으로 반환합니다.
   *
   * @param {string} managerFormId - 조회할 견적 신청서 ID
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<ManagerForm|null>} 견적 신청서 객체 또는 없을 경우 null
   * @throws {Error} 조회 실패 시 발생
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
   *
   * 특정 견적 신청서의 상태를 업데이트합니다.
   * 상태 값은 'pending', 'processing', 'completed', 'cancelled' 등이 될 수 있습니다.
   *
   * @param {string} managerFormId - 업데이트할 견적 신청서 ID
   * @param {string} status - 변경할 상태 값
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 업데이트 실패 시 발생
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
