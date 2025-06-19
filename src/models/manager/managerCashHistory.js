import { Sequelize, DataTypes } from 'sequelize';

class ManagerCashHistory extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        managerCashHistoryId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
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
            'charge_cash', // 캐시 충전
            'earn_cash', // 캐시 수익
            'withdraw_cash', // 캐시 출금
            'service_cash', // 서비스 캐시 적립
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
          comment: '은행 거래 ID (출금 시)  외부 결제 시스템에서 발급하는 거래 고유번호 저장',
        },
        status: {
          type: DataTypes.ENUM(
            'pending', // 처리 중
            'completed', // 완료
            'failed', // 실패
            'cancelled', // 취소됨
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
   * 관계 설정
   */
  static associate(models) {
    // 상조 팀장과의 관계
    this.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager',
    });
    // 입찰 리스트 테이블과의 관계 설정
    this.belongsTo(models.ManagerFormBid, {
      foreignKey: 'managerFormBidId',
      as: 'managerFormBid',
    });
    // funeralId 테이블과의 관계설정 필요
    this.belongsTo(models.Funeral, {
      foreignKey: 'funeralId',
      as: 'funeral',
    });
  }
}
export default ManagerCashHistory;
