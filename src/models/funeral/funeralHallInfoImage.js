import { Sequelize, DataTypes } from 'sequelize';

class FuneralHallInfoImage extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralHallInfoImageId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '장례식장 호실 이미지 고유 ID',
        },
        funeralHallId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 호실 고유 ID (FK)',
        },
        funeralHallInfoImageUrl: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '장례식장 호실 이미지 경로',
        },
      },
      {
        sequelize,
        modelName: 'FuneralHallInfoImage',
        tableName: 'funeral_hall_info_images',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '장례식장 호실 이미지 관리 테이블',
      },
    );
  }

  /**
   * 다른 모델과의 관계 설정
   */
  static associate(models) {
    this.belongsTo(models.FuneralHallInfo, {
      foreignKey: 'funeralHallId',
      as: 'funeralHallInfo',
      onDelete: 'CASCADE',
    });
  }
}
export default FuneralHallInfoImage;
