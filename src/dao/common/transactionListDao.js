import TransactionList from '../../models/common/transactionList.js';

const transactionListDao = {
  /**
   * 새로운 거래 완료 기록 생성
   * @param {*} createData
   * @param {*} options
   * @returns
   */
  async createTransactionList(createData, options = {}) {
    const transactionList = await TransactionList.create(createData, {
      ...options,
    });

    return transactionList;
  },

  /**
   * 출동 신청서 Id를 기반으로 거래 완료 기록 데이터 유무 조회
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
   * @param {*} transactionListId
   * @param {*} updateData
   * @param {*} options
   * @returns
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
   * @param {*} transactionListId
   * @param {*} options
   * @returns
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
   * @param {*} transactionListId
   * @param {*} status
   * @param {*} options
   * @returns
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
