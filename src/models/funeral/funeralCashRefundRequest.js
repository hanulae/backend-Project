/**
 * 장례식장 캐시 환급 요청 모델 (Funeral Cash Refund Request Model)
 * - Sequelize ORM을 사용하여 장례식장이 보유한 캐시를 현금으로 환급받기 위한 요청을 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 장례식장의 캐시 환급 요청부터 관리자 승인/거절까지의 전체 프로세스를 체계적으로 관리합니다.
 * - 환급 요청 저장, 상태 관리, 금액 검증, 관리자 메모 등의 기능을 제공합니다.
 */

import { Sequelize, DataTypes } from 'sequelize';

/**
 * 장례식장 캐시 환급 요청 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 장례식장 캐시 환급 요청의 기본 정보와 장례식장과의 관계를 위한 설정 포함
 * 3) 환급 요청 상태 관리, 금액 검증, 관리자 메모 등의 기능 설정
 *
 * 반환:
 * - FuneralCashRefundRequest: 초기화된 FuneralCashRefundRequest 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
 */
class FuneralCashRefundRequest extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        refundRequestId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '환급 요청 고유 ID',
        },

        funeralId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 고유 ID (FK)',
        },

        refundAmount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '환급 요청 금액',
        },

        status: {
          type: DataTypes.ENUM('requested', 'approved', 'rejected'),
          allowNull: false,
          defaultValue: 'requested',
          comment: '환급 상태 (요청됨, 승인됨, 거절됨)',
        },

        adminMemo: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: '관리자 메모',
        },
      },
      {
        sequelize,
        modelName: 'FuneralCashRefundRequest',
        tableName: 'funeral_cash_refund_requests',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '장례식장 캐시 환급 요청 테이블',
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
   * 2) 장례식장 캐시 환급 요청은 장례식장과 belongsTo 관계 설정
   * 3) 환급 요청과 장례식장을 연결하여 요청 소유권 및 관리 시스템 구현
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
  }
}

export default FuneralCashRefundRequest;
