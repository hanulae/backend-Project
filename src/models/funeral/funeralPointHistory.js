/**
 * 장례식장 포인트 내역 모델 (Funeral Point History Model)
 * - Sequelize ORM을 사용하여 장례식장의 포인트 거래 내역을 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 장례식장의 포인트 적립, 사용, 캐시 전환, 서비스 포인트 적립 등의 모든 포인트 관련 거래를 체계적으로 관리합니다.
 * - 포인트 잔액 추적과 거래 이력을 통한 투명성을 보장하며, 상조팀장과의 거래 관계와 견적서를 통한 포인트 출처 추적을 지원합니다.
 */

import { Sequelize, DataTypes } from 'sequelize'; // Sequelize ORM 라이브러리

/**
 * 장례식장 포인트 내역 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 장례식장 포인트 내역의 기본 정보, 포인트 거래 타입, 거래 금액, 잔액, 거래 상태 등을 위한 설정 포함
 * 3) 상조팀장과의 거래 관계와 견적서를 통한 포인트 출처 추적 설정
 *
 * 반환:
 * - FuneralPointHistory: 초기화된 FuneralPointHistory 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 */
class FuneralPointHistory extends Sequelize.Model {
  /**
   * 모델 초기화 메서드
   *
   * 입력:
   * - sequelize: Object — Sequelize 인스턴스
   *
   * 동작:
   * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
   * 2) 장례식장 포인트 내역의 기본 정보, 포인트 거래 타입, 거래 금액, 잔액, 거래 상태 등을 위한 설정 포함
   * 3) 상조팀장과의 거래 관계와 견적서를 통한 포인트 출처 추적 설정
   *
   * 반환:
   * - FuneralPointHistory: 초기화된 FuneralPointHistory 모델 클래스
   *
   * 예외:
   * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
   */
  static init(sequelize) {
    return super.init(
      {
        funeralPointHistoryId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '장례식장 포인트 내역 고유 ID',
        },

        funeralId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 고유 ID (FK)',
        },

        transactionType: {
          type: DataTypes.ENUM('earn_point', 'use_point', 'cash_the_point', 'service_point'),
          allowNull: false,
          comment: '포인트 히스토리 타입',
        },

        funeralPointAmount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '적립/변환/사용/서비스로 받는 장례식장 포인트 양',
        },

        funeralPointBalanceAfter: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '작업 후 잔액 포인트',
        },

        managerId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '거래한 상조팀장의 고유 ID (FK)',
        },

        managerFormBidId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '포인트 출처를 확인하기 위한 견적서 ID (FK)',
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
        modelName: 'FuneralPointHistory',
        tableName: 'funeral_point_histories',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '장례식장 포인트 내역 관리 테이블',
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
   * 2) 장례식장 포인트 내역은 장례식장과 belongsTo 관계를 가지며, 상조팀장과 입찰 견적서와도 belongsTo 관계를 가짐
   * 3) 포인트 거래와 관련된 모든 정보를 체계적으로 관리할 수 있도록 관계 설정
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

export default FuneralPointHistory;
