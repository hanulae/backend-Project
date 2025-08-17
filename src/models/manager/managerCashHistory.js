/**
 * 상조팀장 현금 내역 모델 (Manager Cash History Model)
 * - Sequelize ORM을 사용하여 상조팀장의 현금 거래 내역을 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 상조팀장의 현금 충전, 수익, 출금, 서비스 캐시 적립 등의 모든 현금 관련 거래를 체계적으로 관리합니다.
 * - 현금 잔액 추적과 거래 이력을 통한 투명성을 보장하며, 외부 결제 시스템과의 연동을 지원하는 핵심 구성 요소입니다.
 */

import { Sequelize, DataTypes } from 'sequelize'; // Sequelize ORM 라이브러리

/**
 * 상조팀장 현금 내역 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 상조팀장 현금 내역의 기본 정보, 현금 거래 타입, 거래 금액, 잔액, 거래 상태 등을 위한 설정 포함
 * 3) 장례식장과의 거래 관계와 견적서를 통한 현금 출처 추적 설정
 *
 * 반환:
 * - ManagerCashHistory: 초기화된 ManagerCashHistory 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 */
class ManagerCashHistory extends Sequelize.Model {
  /**
   * 모델 초기화 메서드
   *
   * 입력:
   * - sequelize: Object — Sequelize 인스턴스
   *
   * 동작:
   * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
   * 2) 상조팀장 현금 내역의 기본 정보, 현금 거래 타입, 거래 금액, 잔액, 거래 상태 등을 위한 설정 포함
   * 3) 장례식장과의 거래 관계와 견적서를 통한 현금 출처 추적 설정
   *
   * 반환:
   * - ManagerCashHistory: 초기화된 ManagerCashHistory 모델 클래스
   *
   * 예외:
   * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
   */
  static init(sequelize) {
    return super.init(
      {
        managerCashHistoryId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '상조팀장 현금 내역 고유 ID',
        },

        managerId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '상조팀장 고유 ID (FK)',
        },

        transactionType: {
          type: DataTypes.ENUM(
            'charge_cash', // 캐시 충전 (현금을 캐시로 전환)
            'earn_cash', // 캐시 수익 (서비스 제공 시 현금 획득)
            'withdraw_cash', // 캐시 출금 (캐시를 현금으로 전환)
            'service_cash', // 서비스 캐시 적립 (서비스 제공 시 보상)
          ),
          allowNull: false,
          comment: '캐시 히스토리 타입',
        },

        managerCashAmount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '적립/출금/서비스로 받는 상조팀장 캐시 양',
        },

        managerCashBalanceAfter: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '작업 후 잔액 캐쉬',
        },

        funeralId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '거래한 장례식장의 고유 ID (FK)',
        },

        managerFormBidId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '캐시 출처를 확인하기 위한 견적서 ID (FK)',
        },

        transactionDate: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          comment: '거래 일시 외부 결제 시스템에서 결제가 이루어진 시간',
        },

        bankTransactionId: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: '은행 거래 ID (출금 시) 외부 결제 시스템에서 발급하는 거래 고유번호 저장',
        },

        status: {
          type: DataTypes.ENUM(
            'pending', // 처리 중 (거래 진행 중)
            'completed', // 완료 (거래 성공)
            'failed', // 실패 (거래 실패)
            'cancelled', // 취소됨 (거래 취소)
          ),
          allowNull: false,
          defaultValue: 'pending',
          comment: '거래 상태',
        },
      },
      {
        sequelize,
        modelName: 'ManagerCashHistory',
        tableName: 'manager_cash_histories',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '상조팀장 캐시 내역 관리 테이블',
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
   * 2) 상조팀장 현금 내역은 상조팀장과 belongsTo 관계를 가지며, 입찰 견적서와 장례식장과도 belongsTo 관계를 가짐
   * 3) 현금 거래와 관련된 모든 정보를 체계적으로 관리할 수 있도록 관계 설정
   *
   * 반환:
   * - void: 관계 설정만 수행하고 반환값 없음
   *
   * 예외:
   * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
   */
  static associate(models) {
    this.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager',
    });

    this.belongsTo(models.ManagerFormBid, {
      foreignKey: 'managerFormBidId',
      as: 'managerFormBid',
    });

    this.belongsTo(models.Funeral, {
      foreignKey: 'funeralId',
      as: 'funeral',
    });
  }
}

export default ManagerCashHistory;
