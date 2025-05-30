import { Sequelize, DataTypes } from 'sequelize';

class ManagerCashRefundRequest extends Sequelize.Model {
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
        modelName: 'ManagerCashRefundRequest',
        tableName: 'manager_cash_refund_requests',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '상조팀장 캐시 환급 요청 테이블',
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager',
    });
  }
}

export default ManagerCashRefundRequest;
