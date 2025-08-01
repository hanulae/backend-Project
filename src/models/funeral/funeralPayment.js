import { Sequelize, DataTypes } from 'sequelize';

class FuneralPayment extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralPaymentId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
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
          allowNull: true, // 결제 준비 단계에서는 null 허용
          unique: true,
          comment: '포트원 결제 고유 번호',
        },
        merchantUid: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true, // 중복 방지
          comment: '가맹점 주문 번호',
        },
        amount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '결제 금액',
        },
        status: {
          type: DataTypes.ENUM(
            'pending', // 결제 대기
            'paid', // 결제 완료
            'failed', // 결제 실패
            'cancelled', // 결제 취소
            'refunded', // 환불 완료
          ),
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
   * 관계 설정
   */
  static associate(models) {
    // 장례식장 테이블과의 관계 설정
    this.belongsTo(models.Funeral, {
      foreignKey: 'funeralId',
      as: 'funeral',
    });

    // 장례식장 캐시 히스토리와의 관계 설정
    this.hasOne(models.FuneralCashHistory, {
      foreignKey: 'bankTransactionId',
      sourceKey: 'impUid',
      as: 'cashHistory',
    });
  }
}

export default FuneralPayment;
