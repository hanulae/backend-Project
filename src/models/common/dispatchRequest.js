import { Sequelize, DataTypes } from 'sequelize';

class DispatchRequest extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        dispatchRequestId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '출동 요청 고유 ID',
        },
        address: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '출동 요청 주소',
        },
        addressDetail: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '출동 요청 상세 주소',
        },
        famPhoneNumber: {
          type: DataTypes.STRING(20),
          allowNull: true,
          comment: '가족 전화번호',
        },
        managerPhoneNumber: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: '상조팀장 전화번호',
        },
        emergencyPhoneNumber: {
          type: DataTypes.STRING(20),
          allowNull: true,
          comment: '비상 연락망',
        },
        isApproved: {
          type: DataTypes.ENUM('pending', 'approved', 'completed', 'rejected', 'canceled'),
          allowNull: false,
          defaultValue: 'pending',
          comment: '승인 상태',
        },
        managerId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '상조팀장 ID (FK)',
        },
        funeralId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 ID (FK)',
        },
        managerFormId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '상조팀장 견적 요청서 ID (FK)',
        },
        managerFormBidId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '입찰 테이블 ID (FK)',
        },
      },
      {
        sequelize,
        modelName: 'DispatchRequest',
        tableName: 'dispatch_requests',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '출동 요청 관리 테이블',
      },
    );
  }

  /**
   * 다른 모델과의 관계 설정
   */
  static associate(models) {
    // 상조팀장 테이블과의 관계
    this.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager',
    });

    // 장례식장 테이블과의 관계
    this.belongsTo(models.Funeral, {
      foreignKey: 'funeralId',
      as: 'funeral',
    });

    // 상조팀장 견적 요청서 테이블과의 관계
    this.belongsTo(models.ManagerForm, {
      foreignKey: 'managerFormId',
      as: 'managerForm',
    });

    // 입찰 테이블과의 관계
    this.belongsTo(models.ManagerFormBid, {
      foreignKey: 'managerFormBidId',
      as: 'managerFormBid',
    });
  }
}
export default DispatchRequest;
