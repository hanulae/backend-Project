/**
 * 파일명: transactionListDao.js
 * 설명: 거래 완료 기록 관련 데이터베이스 접근 객체
 * 상조팀장과 장례식장 간의 거래 완료 기록을 관리합니다.
 */

import TransactionList from '../../models/common/transactionList.js';

const transactionListDao = {
  /**
   * 새로운 거래 완료 기록 생성
   *
   * 새로운 거래 완료 기록을 생성합니다.
   * 상조팀장과 장례식장 간의 거래가 완료되었을 때 호출됩니다.
   *
   * @param {Object} createData - 거래 완료 기록 데이터 객체
   *   @param {string} createData.dispatchRequestId - 출동 신청서 ID
   *   @param {string} createData.managerId - 상조팀장 ID
   *   @param {string} createData.funeralId - 장례식장 ID
   *   @param {string} [createData.status] - 거래 상태 (기본값: 'pending')
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<Object>} 생성된 거래 완료 기록 객체
   * @throws {Error} 거래 완료 기록 생성 실패 시 발생
   */
  async createTransactionList(createData, options = {}) {
    const transactionList = await TransactionList.create(createData, {
      ...options,
    });

    return transactionList;
  },

  /**
   * 출동 신청서 Id를 기반으로 거래 완료 기록 데이터 유무 조회
   *
   * 특정 출동 신청서 ID를 기반으로 거래 완료 기록이 존재하는지 조회합니다.
   * 중복 거래 완료 처리를 방지하기 위해 사용됩니다.
   *
   * @param {string} dispatchRequestId - 출동 신청서 ID
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<Object|null>} 거래 완료 기록 객체 또는 없을 경우 null
   * @throws {Error} 조회 실패 시 발생
   */
  async getTransactionListByDispatchRequestId(dispatchRequestId, options = {}) {
    const transactionList = await TransactionList.findOne({
      where: {
        dispatchRequestId: dispatchRequestId,
      },
      ...options,
    });

    return transactionList;
  },

  /**
   * 거래 완료 기록 업데이트
   *
   * 특정 거래 완료 기록의 정보를 업데이트합니다.
   *
   * @param {string} transactionId - 거래 ID
   * @param {Object} updateData - 업데이트할 데이터 객체
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 업데이트 실패 시 발생
   */
  async updateTransactionList(transactionId, updateData, options = {}) {
    const updateTransactionList = await TransactionList.update(updateData, {
      where: {
        transactionId: transactionId,
      },
      ...options,
    });

    return updateTransactionList;
  },

  /**
   * TransactionListId를 통해 거래 완료 기록 조회
   *
   * 특정 거래 ID를 통해 거래 완료 기록을 조회합니다.
   *
   * @param {string} transactionId - 거래 ID
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<Object|null>} 거래 완료 기록 객체 또는 없을 경우 null
   * @throws {Error} 조회 실패 시 발생
   */
  async getTransactionListByTransactionListId(transactionId, options = {}) {
    const transactionList = await TransactionList.findOne({
      where: {
        transactionId: transactionId,
      },
      ...options,
    });

    return transactionList;
  },

  /**
   * 거래 완료 처리
   *
   * 특정 거래의 상태를 변경하고 거래 완료 시간을 기록합니다.
   * 거래가 완료되었을 때 호출됩니다.
   *
   * @param {string} transactionId - 거래 ID
   * @param {string} status - 변경할 상태값 ('completed', 'cancelled' 등)
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 상태 변경 실패 시 발생
   */
  async updateTransactionListStatus(transactionId, status, options = {}) {
    const updateTransactionList = await TransactionList.update(
      {
        status: status,
        transactionCompletedAt: new Date(),
      },
      {
        where: {
          transactionId: transactionId,
        },
        ...options,
      },
    );

    return updateTransactionList;
  },
};

export default transactionListDao;
