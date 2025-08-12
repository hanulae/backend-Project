/**
 * 장례식장 현금 내역 모델 (Funeral Cash History Model)
 * - Sequelize ORM을 사용하여 장례식장의 현금 거래 내역을 체계적으로 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 장례식장의 캐시 충전, 사용, 출금, 서비스 적립 등 모든 현금 관련 거래를 추적하고 기록합니다.
 * - 다양한 거래 타입 관리, 거래 상태 관리, 외부 결제 시스템 연동 등의 기능을 제공합니다.
 */

import { Sequelize, DataTypes } from 'sequelize';

/**
 * 장례식장 현금 내역 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 장례식장 현금 거래의 모든 세부 정보와 관련 모델과의 관계를 위한 설정 포함
 * 3) 거래 타입, 상태, 금액, 잔액, 외부 결제 시스템 연동 등 설정
 *
 * 반환:
 * - FuneralCashHistory: 초기화된 FuneralCashHistory 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
 */
class FuneralCashHistory extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralCashHistoryId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '장례식장 현금 내역 고유 ID',
        },

        funeralId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 고유 ID (FK)',
        },

        funeralPaymentId: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: '장례식장 결제 고유 ID (FK)',
        },

        merchantUid: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: '외부 결제 시스템에서 발급하는 거래 고유번호 저장',
        },

        transactionType: {
          type: DataTypes.ENUM('earn_cash', 'use_cash', 'withdraw_cash', 'service_cash'),
          allowNull: false,
          comment: '캐시 히스토리 타입',
        },

        funeralCashAmount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '충전/사용/출금/서비스 캐시 양',
        },

        funeralCashBalanceAfter: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '작업 후 잔액 캐쉬',
        },

        managerId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '거래한 상조팀장의 고유 ID (FK)',
        },

        managerFormBidId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '거래를 확인하기 위한 견적서 ID (FK)',
        },

        transactionDate: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          comment: '충전 및 출금 시 거래 일시 외부 결제 시스템에서 결제가 이루어진 시간',
        },

        bankTransactionId: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: '은행 거래 ID (출금 시) 외부 결제 시스템에서 발급하는 거래 고유번호 저장',
        },

        status: {
          type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
          allowNull: false,
          defaultValue: 'pending',
          comment: '거래 상태',
        },
      },
      {
        sequelize,
        modelName: 'FuneralCashHistory',
        tableName: 'funeral_cash_histories',
        timestamps: true,
        underscored: true,
        paranoid: true,
        comment: '장례식장 현금 내역 관리 테이블',
      },
    );
  }

  /**
   * 다른 모델과의 관계 설정 메서드
   *
   * 입력:
   * - models: Object — 애플리케이션의 모든 모델 객체들
   *
   * 동작:
   * 1) Sequelize의 associate 메서드를 통해 다른 모델과의 관계 정의
   * 2) 장례식장 현금 내역은 여러 모델과 다양한 관계 설정
   * 3) 거래의 전체적인 맥락과 연결성을 파악할 수 있는 관계 구현
   *
   * 반환:
   * - void: 관계 설정만 수행하고 반환값 없음
   *
   * 예외:
   * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
   */
  static associate(models) {
    this.belongsTo(models.Funeral, {
      foreignKey: 'funeralId',
      as: 'funeral',
    });

    this.belongsTo(models.FuneralPayment, {
      foreignKey: 'funeralPaymentId',
      as: 'funeralPayment',
    });

    this.belongsTo(models.FuneralPayment, {
      foreignKey: 'merchantUid',
      targetKey: 'merchantUid',
      as: 'funeralPaymentByMerchant',
    });

    this.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager',
    });

    this.belongsTo(models.ManagerFormBid, {
      foreignKey: 'managerFormBidId',
      as: 'managerFormBid',
    });
  }
}

export default FuneralCashHistory;
