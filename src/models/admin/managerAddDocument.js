import { Sequelize, DataTypes } from 'sequelize';

class ManagerAddDocument extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        managerAddDocumentId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '추가 제출 서류 고유 ID',
        },
        managerId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '상조팀장 고유 ID (FK)',
        },
        fileUrl: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: '제출한 서류 파일 URL',
        },
      },
      {
        sequelize,
        modelName: 'ManagerAddDocument',
        tableName: 'manager_add_documents',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '상조팀장 추가 제출 서류 테이블',
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

export default ManagerAddDocument;
