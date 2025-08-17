/**
 * 장례식장 결제 모델 (Funeral Payment Model)
 * - Sequelize ORM을 사용하여 장례식장의 결제 정보를 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 포트원(I'mport) 결제 시스템과 연동하여 장례식장의 캐시 충전, 결제 상태 관리, 결제 이력 추적 등을 체계적으로 관리합니다.
 * - 결제 정보의 무결성 보장, 포트원 연동 안전성, 결제 상태 추적 및 이력을 통한 재정적 거래의 투명성을 보장합니다.
 */

import { Sequelize, DataTypes } from 'sequelize';

/**
 * 장례식장 결제 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 장례식장 결제의 기본 정보, 포트원 결제 시스템 연동, 결제 상태 관리, 구매자 정보 등을 위한 설정 포함
 * 3) 데이터베이스 성능 최적화를 위한 인덱싱 설정
 *
 * 반환:
 * - FuneralPayment: 초기화된 FuneralPayment 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 * - 인덱스 설정 실패: 데이터베이스 인덱스 생성 오류 발생
 */
class FuneralPayment extends Sequelize.Model {
  /**
   * 모델 초기화 메서드
   *
   * 입력:
   * - sequelize: Object — Sequelize 인스턴스
   *
   * 동작:
   * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
   * 2) 장례식장 결제의 기본 정보, 포트원 결제 시스템 연동, 결제 상태 관리, 구매자 정보 등을 위한 설정 포함
   * 3) 데이터베이스 성능 최적화를 위한 인덱싱 설정
   *
   * 반환:
   * - FuneralPayment: 초기화된 FuneralPayment 모델 클래스
   *
   * 예외:
   * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
   * - 인덱스 설정 실패: 데이터베이스 인덱스 생성 오류 발생
   */
  static init(sequelize) {
    return super.init(
      {
        funeralPaymentId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '장례식장 결제 고유 ID',
        },

        funeralId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 고유 ID (FK)',
        },

        impUid: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
          comment: '포트원 결제 고유 번호',
        },

        merchantUid: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          comment: '가맹점 주문 번호',
        },

        amount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '결제 금액',
        },

        status: {
          type: DataTypes.ENUM('pending', 'paid', 'failed', 'cancelled', 'refunded'),
          allowNull: false,
          defaultValue: 'pending',
          comment: '결제 상태',
        },

        paymentMethod: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: '결제 수단 (card, bank, etc)',
        },

        buyerName: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: '구매자 이름',
        },

        buyerEmail: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: '구매자 이메일',
        },

        buyerTel: {
          type: DataTypes.STRING(20),
          allowNull: true,
          comment: '구매자 전화번호',
        },

        paymentDate: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '결제 완료 일시',
        },

        failReason: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: '결제 실패 사유',
        },
      },
      {
        sequelize,
        modelName: 'FuneralPayment',
        tableName: 'funeral_payments',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '장례식장 결제 정보 관리 테이블',

        indexes: [
          {
            fields: ['imp_uid'],
            unique: true,
            where: {
              imp_uid: {
                [Sequelize.Op.ne]: null,
              },
            },
          },
          {
            fields: ['merchant_uid'],
            unique: true,
          },
          {
            fields: ['funeral_id'],
          },
          {
            fields: ['status'],
          },
        ],
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
   * 2) 장례식장 결제는 장례식장과 belongsTo 관계를 가지며, 장례식장 캐시 히스토리와는 hasOne 관계를 가짐
   * 3) 결제와 관련된 모든 정보를 체계적으로 관리할 수 있도록 관계 설정
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

    this.hasOne(models.FuneralCashHistory, {
      foreignKey: 'bankTransactionId',
      sourceKey: 'impUid',
      as: 'cashHistory',
    });
  }
}

export default FuneralPayment;
