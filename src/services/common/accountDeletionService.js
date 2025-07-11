import db from '../../models/index.js';
import fcmService from './fcmService.js';
import logger from '../../config/logger.js';

/**
 * 간단한 회원탈퇴 서비스
 */
class AccountDeletionService {
  /**
   * 회원탈퇴 가능 여부 확인
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

      // 3. 캐시 상태 확인
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
   */
  async deleteAccount({ userId, userType, _smsCode, _phoneNumber }) {
    const transaction = await db.sequelize.transaction();

    try {
      // 1. SMS 코드 검증은 라우터에서 처리했다고 가정

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
