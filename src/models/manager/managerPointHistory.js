/**
 * 상조팀장 포인트 내역 모델 (Manager Point History Model)
 * - Sequelize ORM을 사용하여 상조팀장의 포인트 거래 내역을 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 상조팀장의 포인트 적립, 캐시 전환, 서비스 포인트 적립 등의 모든 포인트 관련 거래를 체계적으로 관리합니다.
 * - 포인트 잔액 추적과 거래 이력을 통한 투명성을 보장하며, 장례식장과의 거래 관계와 견적서를 통한 포인트 출처 추적을 지원하는 핵심 구성 요소입니다.
 */

import { Sequelize, DataTypes } from 'sequelize';

/**
 * 상조팀장 포인트 내역 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 상조팀장 포인트 내역의 기본 정보, 포인트 거래 타입, 거래 금액, 잔액, 거래 상태 등을 포함
 * 3) 장례식장과의 거래 관계와 견적서를 통한 포인트 출처 추적도 설정
 *
 * 반환:
 * - ManagerPointHistory: 초기화된 ManagerPointHistory 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 */
class ManagerPointHistory extends Sequelize.Model {
  /**
   * 모델 초기화 메서드
   *
   * 입력:
   * - sequelize: Object — Sequelize 인스턴스
   *
   * 동작:
   * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
   * 2) 상조팀장 포인트 내역의 기본 정보, 포인트 거래 타입, 거래 금액, 잔액, 거래 상태 등을 포함
   * 3) 장례식장과의 거래 관계와 견적서를 통한 포인트 출처 추적도 설정
   *
   * 반환:
   * - ManagerPointHistory: 초기화된 ManagerPointHistory 모델 클래스
   *
   * 예외:
   * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
   */
  static init(sequelize) {
    return super.init(
      {
        managerPointHistoryId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '상조팀장 포인트 내역 고유 ID',
        },

        managerId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '상조팀장 고유 ID (FK)',
        },

        transactionType: {
          type: DataTypes.ENUM(
            'earn_point', // 포인트 적립 (서비스 제공 시 포인트 획득)
            'cash_the_point', // 포인트 캐쉬 전환 (포인트를 현금으로 전환)
            'service_point', // 서비스 포인트 적립 (서비스 제공 시 보상)
          ),
          allowNull: false,
          comment: '포인트 히스토리 타입',
        },

        managerPointAmount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '적립/변환/서비스로 받는 상조팀장 포인트 금액',
        },

        managerPointBalanceAfter: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '작업 후 잔액 포인트',
        },

        funeralListId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '거래한 장례식장의 고유 ID (FK)',
        },

        managerFormBidId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '포인트 출처를 확인하기 위한 견적서 ID (FK)',
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
        modelName: 'ManagerPointHistory',
        tableName: 'manager_point_histories',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '상조팀장 포인트 내역 관리 테이블',
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
   * 2) 상조팀장 포인트 내역은 상조팀장과 belongsTo 관계를 가짐
   * 3) 입찰 견적서와도 belongsTo 관계를 가져 포인트 거래와 관련된 모든 정보를 체계적으로 관리
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

    // TODO: funeralListId 테이블과의 관계설정 필요
    // 장례식장 리스트와의 연결이 필요한 경우 추가 구현
  }
}

export default ManagerPointHistory;
