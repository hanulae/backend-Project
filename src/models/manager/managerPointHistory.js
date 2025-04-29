import { Sequelize, DataTypes } from 'sequelize';

class ManagerPointHistory extends Sequelize.Model {
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
            'earn_point', // 포인트 적립
            'cash_the_point', // 포인트 캐쉬 전환
            'service_point', // 서비스 포인트 적립
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
    // funeralListId 테이블과의 관계설정 필요
  }
}
export default ManagerPointHistory;
