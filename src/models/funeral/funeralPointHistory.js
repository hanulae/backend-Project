import { Sequelize, DataTypes } from 'sequelize';

class FuneralPointHistory extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralPointHistoryId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '장례식장 포인트 내역 고유 ID',
        },
        funeralId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 고유 ID (FK)',
        },
        transactionType: {
          type: DataTypes.ENUM(
            'earn_point', // 포인트 적립
            'use_point', // 포인트 사용
            'cash_the_point', // 포인트 캐쉬 전환
            'service_point', // 서비스 포인트 적립
          ),
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
   * 다른 모델과의 관계 설정
   */
  static associate(models) {
    // 장례식장 테이블과의 관계 생성
    this.belongsTo(models.Funeral, {
      foreignKey: 'funeralId',
      as: 'funeral',
    });

    // 상조팀장 테이블과의 관계 생성
    this.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager',
    });

    // 입찰 리스트 테이블과의 관계 생성
    this.belongsTo(models.ManagerFormBid, {
      foreignKey: 'managerFormBidId',
      as: 'managerFormBid',
    });

    // funeralListId 테이블과의 관계설정 필요
  }
}
export default FuneralPointHistory;
