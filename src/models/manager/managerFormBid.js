import { Sequelize, DataTypes } from 'sequelize';

class ManagerFormBid extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        managerFormBidId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '상조팀장 견적 입찰 고유 ID',
        },
        managerFormId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '상조팀장 견적 신청서 고유 ID (FK)',
        },
        funeralListId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 리스트 고유 ID (FK)',
        },
        funeralHallId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '장례식장의 호실 별 고유 ID (FK)',
        },
        proponentMoney: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: '제안가',
        },
        discount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: '할인률',
        },
        validUntil: {
          // 입찰 유효 기간 ( 견적 제출 후 일정 시간 동안 유효 )
          type: DataTypes.DATE,
          allowNull: true,
          comment: '입찰 유효 기간',
        },
        bidStatus: {
          type: DataTypes.ENUM(
            'pending', // 상조팀장이 견적 신청, 장례식장 응답 대기 중
            'bid_submitted', // 장례식장이 입찰 제출
            'bid_selected', // 상조팀장이 입찰 선택
            'deceased_arrived', // 고인 안치 완료 (추후 생각 필요)
            'transaction_completed', // 거래 완료
            'rejected', // 거절/취소
            'expired', // 만료
          ),
          allowNull: false,
          defaultValue: 'pending',
          comment: '입찰 상태',
        },
        managerFormCreatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: '상조팀장 견적 신청서 생성일',
        },
        bidSubmittedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '장례식장 입찰 제출한 시간',
        },
        bidSelectedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '상조팀장이 입찰을 선택한 시간(출동 신청)',
        },
        deceasedArrivedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '고인 안치 완료 시간',
        },
        transactionCompletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '거래 완료 시간',
        },
      },
      {
        sequelize,
        modelName: 'ManagerFormBid',
        tableName: 'manager_form_bids',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '상조팀장 견적 입찰 정보 테이블',
      },
    );
  }

  /**
   * 다른 모델과의 관계 설정
   */
  static associate(models) {
    // 하나의 견적 신청서에 여러개의 입찰이 존재 ( 1:N 관계 )
    this.belongsTo(models.ManagerForm, {
      foreignKey: 'managerFormId',
      as: 'managerForm',
      onDelete: 'CASCADE', // 견적 신청서 삭제 시 입찰 정보도 연쇄 삭제
    });
    // 상조팀장 캐쉬 내역 테이블과의 관계 설정
    this.hasMany(models.ManagerCashHistory, {
      foreignKey: 'managerFormBidId',
      as: 'managerCashHistories',
    });
    // 상조팀장 포인트 내역 테이블과의 관계 설정
    this.hasMany(models.ManagerPointHistory, {
      foreignKey: 'managerFormBidId',
      as: 'managerPointHistories',
    });
    // 장례식장 포인트 내역 테이블과의 관계 설정
    this.hasMany(models.FuneralPointHistory, {
      foreignKey: 'managerFormBidId',
      as: 'funeralPointHistories',
    });
    // 장례식장 현금 내역 테이블과의 관계 설정
    this.hasMany(models.FuneralCashHistory, {
      foreignKey: 'managerFormBidId',
      as: 'funeralCashHistories',
    });

    // 장례식장 ID - 추후 기입 예정

    // 호실 정보 ID - 추후 기입 예정
  }
}
export default ManagerFormBid;
