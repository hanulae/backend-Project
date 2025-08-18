/**
 * 파일명: accountDeletionService.js
 * 설명: 회원탈퇴 관련 서비스
 * 역할: 회원(장례식장, 상조팀장)의 탈퇴 처리 및 관련 데이터 정리
 */
import db from '../../models/index.js';
import fcmService from './fcmService.js';
import logger from '../../config/logger.js';

class AccountDeletionService {
  /**
   * 회원탈퇴 가능 여부 확인
   *
   * 탈퇴 가능 조건:
   * 1. 사용자가 존재해야 함
   * 2. 진행 중인 거래가 없어야 함
   * 3. 상조팀장의 경우 보유 캐시가 0원이어야 함
   *
   * 처리 과정:
   * 1. 사용자 정보 조회
   * 2. 진행 중인 거래 확인
   * 3. 캐시 상태 확인
   * 4. 탈퇴 가능 여부 확인
   *
   * @param {Object} params - 회원탈퇴 가능 여부 확인 파라미터
   * @param {string} params.userId - 사용자 ID
   * @param {string} params.userType - 사용자 타입 (manager, funeral)
   * @returns {Promise<Object>} - 회원탈퇴 가능 여부 확인 결과
   * @throws {Error} - 사용자를 찾을 수 없거나 진행 중인 거래가 있을 경우 오류 발생
   */
  async checkDeletionEligibility({ userId, userType }) {
    try {
      // 1. 사용자 정보 조회
      const user = await this.getUserInfo(userId, userType);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      // 2. 진행 중인 거래 확인
      const activeTransactions = await this.checkActiveTransactions(userId, userType);
      if (activeTransactions.length > 0) {
        return {
          canDelete: false,
          reason: 'active_transactions',
          message: '진행 중인 거래가 있어 탈퇴할 수 없습니다. 거래 완료 후 다시 시도해주세요.',
          activeCount: activeTransactions.length,
        };
      }

      // 3. 캐시 상태 확인 보유한 캐시가 있는지 확인
      const cashInfo = this.getCashInfo(user, userType);
      if (userType === 'manager' && cashInfo.hasCash) {
        return {
          canDelete: false,
          reason: 'has_cash',
          message: `보유 캐시 ${cashInfo.amount.toLocaleString()}원이 있습니다. 환급 후 탈퇴를 진행해주세요.`,
          cashAmount: cashInfo.amount,
        };
      }

      return {
        canDelete: true,
        message: '탈퇴 가능합니다.',
        cashInfo,
      };
    } catch (error) {
      logger.error('Deletion eligibility check failed', error);
      throw error;
    }
  }

  /**
   * 회원탈퇴 처리
   *
   * 처리 과정:
   * 1. 트랜잭션 시작
   * 2. 사용자 정보 재확인
   * 3. Funeral인 경우 캐시 0원 처리
   * 4. FCM 토큰 비활성화
   * 5. 관련 데이터 소프트 삭제
   * 6. Funeral인 경우 funeralList 처리
   * 7. 메인 계정 소프트 삭제
   * 8. 트랜잭션 커밋
   *
   * @param {Object} params - 회원탈퇴 처리 파라미터
   * @param {string} params.userId - 사용자 ID
   * @param {string} params.userType - 사용자 타입 (manager, funeral)
   * @param {string} params._smsCode - SMS 인증 코드
   * @param {string} params._phoneNumber - 사용자 전화번호
   * @returns {Promise<Object>} - 회원탈퇴 처리 결과
   * @throws {Error} - 회원탈퇴 처리 중 오류 발생
   */
  async deleteAccount({ userId, userType, _smsCode, _phoneNumber }) {
    const transaction = await db.sequelize.transaction();

    try {
      // 1. SMS 코드 검증은 라우터에서 처리

      // 2. 사용자 정보 재확인
      const user = await this.getUserInfo(userId, userType, transaction);

      // 3. Funeral인 경우 캐시 0원 처리
      if (userType === 'funeral') {
        await this.processFuneralCash(userId, user, transaction);
      }

      // 4. FCM 토큰 비활성화
      await this.deactivateFcmTokens(userId, userType);

      // 5. 관련 데이터 소프트 삭제
      await this.deleteRelatedData(userId, userType, transaction);

      // 6. Funeral인 경우 funeralList 처리
      if (userType === 'funeral') {
        await this.processFuneralList(userId, transaction);
      }

      // 7. 메인 계정 소프트 삭제
      await this.deleteMainAccount(userId, userType, transaction);

      await transaction.commit();

      logger.info(`Account deletion completed: ${userType} ${userId}`);

      return {
        success: true,
        message: '회원탈퇴가 완료되었습니다.',
        deletedAt: new Date(),
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Account deletion failed', error);
      throw error;
    }
  }

  /**
   * 사용자 정보 조회
   *
   * 사용자 타입(manager, funeral)에 따라 해당 테이블에서 사용자 정보를 조회
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 타입 (manager, funeral)
   * @param {Sequelize.Transaction} [transaction=null] - 트랜잭션 객체
   * @returns {Promise<Object>} - 사용자 정보
   * @throws {Error} - 사용자를 찾을 수 없을 경우 오류 발생
   */
  async getUserInfo(userId, userType, transaction = null) {
    if (userType === 'manager') {
      return await db.Manager.findByPk(userId, { transaction });
    } else if (userType === 'funeral') {
      return await db.Funeral.findByPk(userId, { transaction });
    }
    return null;
  }

  /**
   * 진행 중인 거래 확인
   *
   * 사용자 타입에 따라 해당 사용자의 진행 중인 거래(pending, approved 상태)를 조회
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 타입 (manager, funeral)
   * @returns {Promise<Array>} - 진행 중인 거래 목록
   */
  async checkActiveTransactions(userId, userType) {
    const activeTransactions = [];

    if (userType === 'manager') {
      // 상조팀장의 진행 중인 거래
      const dispatchRequests = await db.DispatchRequest.findAll({
        where: {
          managerId: userId,
          isApproved: ['pending', 'approved'],
        },
      });
      activeTransactions.push(...dispatchRequests);
    } else if (userType === 'funeral') {
      // 장례식장의 진행 중인 거래
      const dispatchRequests = await db.DispatchRequest.findAll({
        where: {
          funeralId: userId,
          isApproved: ['pending', 'approved'],
        },
      });
      activeTransactions.push(...dispatchRequests);
    }

    return activeTransactions;
  }

  /**
   * 캐시 정보 조회
   *
   * 사용자 타입에 따라 보유 캐시 금액을 조회하고 캐시 보유 여부 정보를 반환
   *
   * @param {Object} user - 사용자 정보
   * @param {string} userType - 사용자 타입 (manager, funeral)
   * @returns {Object} - 캐시 정보 {hasCash: boolean, amount: number}
   */
  getCashInfo(user, userType) {
    const cashAmount = userType === 'manager' ? user.managerCash : user.funeralCash;
    return {
      hasCash: cashAmount > 0,
      amount: cashAmount,
    };
  }

  /**
   * Funeral 캐시 0원 처리
   *
   * 장례식장 탈퇴 시 보유 캐시를 0원으로 설정하고 캐시 히스토리에 기록
   *
   * @param {string} funeralId - 장례식장 ID
   * @param {Object} user - 장례식장 정보
   * @param {Sequelize.Transaction} transaction - 트랜잭션 객체
   */
  async processFuneralCash(funeralId, user, transaction) {
    if (user.funeralCash > 0) {
      // 캐시 0원으로 설정
      await db.Funeral.update({ funeralCash: 0 }, { where: { funeralId }, transaction });

      // 캐시 히스토리 기록
      await db.FuneralCashHistory.create(
        {
          funeralId,
          transactionType: 'withdraw_cash',
          funeralCashAmount: -user.funeralCash,
          funeralCashBalanceAfter: 0,
          status: 'completed',
        },
        { transaction },
      );
    }
  }

  /**
   * FCM 토큰 비활성화
   *
   * 회원 탈퇴 시 해당 사용자의 모든 FCM 토큰을 비활성화 처리
   * FCM 토큰 비활성화 실패는 탈퇴 과정을 중단하지 않음
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 타입 (manager, funeral)
   */
  async deactivateFcmTokens(userId, userType) {
    try {
      await fcmService.deactivateUserTokens({ userId, userType });
    } catch (error) {
      logger.warn('FCM token deactivation failed', { userId, userType, error: error.message });
      // FCM 실패는 탈퇴를 막지 않음
    }
  }

  /**
   * 관련 데이터 소프트 삭제
   *
   * 처리 과정:
   * 1. TransactionList 삭제 (DispatchRequest 참조)
   * 2. DispatchRequest 삭제 (ManagerForm 참조)
   * 3. 정보 관련 데이터 삭제
   *
   * 사용자 타입에 따라 관련된 모든 데이터를 소프트 삭제 처리
   * 외래 키 제약 조건을 고려하여 순서대로 삭제 처리
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 타입 (manager, funeral)
   * @param {Sequelize.Transaction} transaction - 트랜잭션 객체
   */
  async deleteRelatedData(userId, userType, transaction) {
    if (userType === 'manager') {
      // Manager 관련 데이터 삭제 (외래 키 제약 조건 순서 준수)

      // 1. 먼저 TransactionList 삭제 (DispatchRequest 참조)
      await db.TransactionList.destroy({
        where: { managerId: userId },
        transaction,
      });

      // 2. DispatchRequest 삭제 (ManagerForm 참조)
      await db.DispatchRequest.destroy({
        where: { managerId: userId },
        transaction,
      });

      // 3. 나머지 Manager 관련 데이터 삭제
      await Promise.all([
        db.ManagerForm.destroy({ where: { managerId: userId }, transaction }),
        db.ManagerCart.destroy({ where: { managerId: userId }, transaction }),
        db.ManagerAddDocument.destroy({ where: { managerId: userId }, transaction }),
      ]);
    } else if (userType === 'funeral') {
      // Funeral 관련 데이터 삭제 (외래 키 제약 조건 순서 준수)

      // 1. 먼저 TransactionList 삭제 (DispatchRequest 참조)
      await db.TransactionList.destroy({
        where: { funeralId: userId },
        transaction,
      });

      // 2. DispatchRequest 삭제 (Funeral 참조)
      await db.DispatchRequest.destroy({
        where: { funeralId: userId },
        transaction,
      });

      // 3. 나머지 Funeral 관련 데이터 삭제
      await Promise.all([
        db.FuneralStaff.destroy({ where: { funeralId: userId }, transaction }),
        db.FuneralHallInfo.destroy({ where: { funeralId: userId }, transaction }),
        db.FuneralAddDocument.destroy({ where: { funeralId: userId }, transaction }),
      ]);
    }
  }

  /**
   * FuneralList 처리 (funeralId 제거, funeralIsJoin: false)
   *
   * 장례식장 탈퇴 시 FuneralList 테이블에서 funeralId를 null로 설정하고
   * funeralIsJoin을 false로 변경하여 회원 상태를 해제
   *
   * @param {string} funeralId - 장례식장 ID
   * @param {Sequelize.Transaction} transaction - 트랜잭션 객체
   */
  async processFuneralList(funeralId, transaction) {
    await db.FuneralList.update(
      {
        funeralId: null,
        funeralIsJoin: false,
      },
      { where: { funeralId }, transaction },
    );
  }

  /**
   * 메인 계정 소프트 삭제
   *
   * 사용자 타입에 따라 메인 계정 테이블에서 해당 사용자 정보를 소프트 삭제 처리
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 타입 (manager, funeral)
   * @param {Sequelize.Transaction} transaction - 트랜잭션 객체
   */
  async deleteMainAccount(userId, userType, transaction) {
    if (userType === 'manager') {
      await db.Manager.destroy({ where: { managerId: userId }, transaction });
    } else if (userType === 'funeral') {
      await db.Funeral.destroy({ where: { funeralId: userId }, transaction });
    }
  }
}

export default new AccountDeletionService();
