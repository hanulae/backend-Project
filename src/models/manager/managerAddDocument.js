import { Sequelize, DataTypes } from 'sequelize';

class ManagerAddDocument extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        managerDocId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '상조팀장 추가 문서 고유 ID',
        },
        managerId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '상조팀장 고유 ID (FK)',
        },
        managerDocName: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '상조팀장 추가 문서 이름',
        },
        managerDocPath: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '상조팀장 추가 문서 경로',
        },
      },
      {
        sequelize,
        modelName: 'ManagerAddDocument',
        tableName: 'manager_add_documents',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '상조팀장 추가 문서 관리 테이블',
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
      onDelete: 'CASCADE',
    });
  }
}
export default ManagerAddDocument;
