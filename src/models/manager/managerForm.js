import { Sequelize, DataTypes } from 'sequelize';

class ManagerForm extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        managerFormId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
          comment: '상조팀장 견적 신청서 고유 ID',
        },
        managerId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '상조팀장 고유 ID (FK)',
        },
        chiefMournerName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '상주 이름',
        },
        deceasedName: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: '고인 성함 (선택적 기입)',
        },
        numberOfMourners: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '예상 조문객 수',
        },
        roomSize: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: '평수 (선택적 기입)',
        },
        checkInDate: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: '입실 일자',
        },
        checkOutDate: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: '퇴실 일자',
        },
        formStatus: {
          type: DataTypes.ENUM(
            'request', // 견적 요청 단계
            'bid_received', // 최소 1개 이상의 입찰을 받은 상태
            'bid_selected', // 상조 팀장 입찰 + 출동 요청 단계 ( 출동 신청 승인 대기 상태 )
            'bid_progress', // 장례식장 + 상조팀장 출동요청 및 출동 승인 후 거래 진행중 상태
            'in_progress', // 고인 안치 완료, 장례 진행중 상태
            'completed', // 장례 완료 및 정산 완료 상태
            'canceled', // 취소됨
          ),
          defaultValue: 'request',
          allowNull: false,
          comment: '견적 신청 프로세스 상태',
        },
      },
      {
        sequelize,
        modelName: 'ManagerForm',
        tableName: 'manager_forms',
        underscored: true,
        timestamps: true,
        // paranoid: true,
        comment: '상조팀장 견적 신청서 관리 테이블',
      },
    );
  }

  /**
   * 다른 모델과의 관계 설정
   */
  static associate(models) {
    // ManagerForm은 Manager에 속함 ( N:1 관계 )
    this.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager',
      onDelete: 'CASCADE',
    });
  }
}

export default ManagerForm;
