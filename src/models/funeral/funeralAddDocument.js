import { Sequelize, DataTypes } from 'sequelize';

class FuneralAddDocument extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralDocId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '장례식장 추가 문서 고유 ID',
        },
        funeralId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 고유 ID (FK)',
        },
        funeralDocName: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '장례식장 추가 문서 이름',
        },
        funeralDocPath: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '장례식장 추가 문서 경로',
        },
      },
      {
        sequelize,
        modelName: 'FuneralAddDocument',
        tableName: 'funeral_add_documents',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '장례식장 추가 문서 관리 테이블',
      },
    );
  }

  /**
   * 다른 모델과의 관계 설정
   */
  static associate(models) {
    // 상조팀장 테이블과의 관계
    this.belongsTo(models.Funeral, {
      foreignKey: 'funeralId',
      as: 'funeral',
      onDelete: 'CASCADE',
    });
  }
}
export default FuneralAddDocument;
