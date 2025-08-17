/**
 * 상조팀장 현금 환급 요청 모델 (Manager Cash Refund Request Model)
 * - Sequelize ORM을 사용하여 상조팀장이 보유한 현금을 환급받기 위한 요청을 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 상조팀장의 현금 환급 요청부터 관리자 승인/거절까지의 전체 프로세스를 체계적으로 관리합니다.
 * - 재정적 거래의 투명성과 안전성을 보장하며, 환급 요청 이력 추적과 관리자 승인 프로세스를 지원하는 핵심 구성 요소입니다.
 */

import { Sequelize, DataTypes } from 'sequelize'; // Sequelize ORM 라이브러리

/**
 * 상조팀장 현금 환급 요청 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 상조팀장 현금 환급 요청의 기본 정보와 상조팀장과의 관계를 위한 설정 포함
 * 3) 환급 요청 상태 관리와 관리자 승인 프로세스를 위한 설정 적용
 *
 * 반환:
 * - ManagerCashRefundRequest: 초기화된 ManagerCashRefundRequest 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 */
class ManagerCashRefundRequest extends Sequelize.Model {
  /**
   * 모델 초기화 메서드
   *
   * 입력:
   * - sequelize: Object — Sequelize 인스턴스
   *
   * 동작:
   * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
   * 2) 상조팀장 현금 환급 요청의 기본 정보와 상조팀장과의 관계를 위한 설정 포함
   * 3) 환급 요청 상태 관리와 관리자 승인 프로세스를 위한 설정 적용
   *
   * 반환:
   * - ManagerCashRefundRequest: 초기화된 ManagerCashRefundRequest 모델 클래스
   *
   * 예외:
   * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
   */
  static init(sequelize) {
    return super.init(
      {
        refundRequestId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '환급 요청 고유 ID',
        },

        managerId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '상조팀장 ID (FK)',
        },

        refundAmount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '환급 요청 금액',
        },

        status: {
          type: DataTypes.ENUM(
            'requested', // 요청됨 (환급 요청 대기 상태)
            'approved', // 승인됨 (환급 요청 승인 완료)
            'rejected', // 거절됨 (환급 요청 거절 완료)
          ),
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
        modelName: 'ManagerCashRefundRequest',
        tableName: 'manager_cash_refund_requests',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '상조팀장 캐시 환급 요청 테이블',
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
   * 2) 상조팀장 현금 환급 요청은 상조팀장과 belongsTo 관계를 가짐
   * 3) 환급 요청과 상조팀장을 연결하여 체계적으로 관리할 수 있도록 관계 설정
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
  }
}

export default ManagerCashRefundRequest;
