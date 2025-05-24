import { Sequelize, DataTypes } from 'sequelize';

class TransactionList extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        transactionId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '거래 고유 ID',
        },
        dispatchRequestId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '출동 요청 고유 ID (FK)',
        },
        totalAmount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '총 금액',
        },
        pointAmount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: '포인트 사용 금액',
        },
        cashAmount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: '현금 사용 금액',
        },
        funeralId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 고유 ID (FK)',
        },
        managerId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '상조팀장 고유 ID (FK)',
        },
        status: {
          type: DataTypes.ENUM('pending', 'completed', 'failed', 'canceled'),
          allowNull: false,
          defaultValue: 'pending',
          comment: '거래 상태',
        },
        managerTransactionCompletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '상조팀장 거래 완료 일자',
        },
        funeralTransactionCompletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '장례식장 거래 완료 일자',
        },
        transactionCompletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '최종 거래 완료 일자',
        },
      },
      {
        sequelize,
        modelName: 'TransactionList',
        tableName: 'transaction_lists',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '거래 목록 관리 테이블',
      },
    );
  }

  /**
   * 다른 모델과의 관계 설정
   */
  static associate(models) {
    // 출동 요청 테이블과의 관계
    this.belongsTo(models.DispatchRequest, {
      foreignKey: 'dispatchRequestId',
      as: 'dispatchRequest',
    });

    // 장례식장 테이블과의 관계
    this.belongsTo(models.Funeral, {
      foreignKey: 'funeralId',
      as: 'funeral',
    });

    // 상조팀장 테이블과의 관계
    this.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager',
    });
  }
}
export default TransactionList;
