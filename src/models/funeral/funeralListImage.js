import { Sequelize, DataTypes } from 'sequelize';

class FuneralListImage extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralListImageId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '장례식장 리스트 이미지 고유 ID',
        },
        funeralListId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 리스트 고유 ID (FK)',
        },
        imageUrl: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '이미지 경로',
        },
      },
      {
        sequelize,
        modelName: 'FuneralListImage',
        tableName: 'funeral_list_images',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '장례식장 리스트 이미지 관리 테이블',
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.FuneralList, {
      foreignKey: 'funeralListId',
      as: 'funeralList',
      onDelete: 'CASCADE',
    });
  }
}

export default FuneralListImage;
