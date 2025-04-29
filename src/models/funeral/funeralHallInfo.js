import { Sequelize, DataTypes } from 'sequelize';

class FuneralHallInfo extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralHallId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '장례식장 호실 고유 ID',
        },
        funeralListId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 리스트 고유 ID (FK)',
        },
        funeralHallName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '장례식장 호실 이름',
        },
        funeralHallSize: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '장례식장 호실 평수',
        },
        funeralHallNumberOfMourners: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '장례식장 호실 수용가능 인원',
        },
        funeralHallPrice: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '호실사용료',
        },
        funeralHallDetailPrice: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '식장 지불 금액 호실 사용료 이외의 추가적인 금액 (ex: 수의, 밥값 등)',
        },
        funeralHallStatus: {
          type: DataTypes.ENUM(
            'available', // 사용가능
            'unavailable', // 사용불가능
            'reserved', // 예약중
          ),
          allowNull: false,
          defaultValue: 'available',
          comment: '호실 상태 (추후 확장성 고려)',
        },
      },
      {
        sequelize,
        modelName: 'FuneralHallInfo',
        tableName: 'funeral_hall_infos',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '장례식장 호실 정보 관리 테이블',
      },
    );
  }

  /**
   * 관계 설정
   */
  // 장례식장 호실 이미지 테이블과의 관계 생성
  static associate(models) {
    this.hasMany(models.FuneralHallInfoImage, {
      foreignKey: 'funeralHallId',
      as: 'funeralHallInfoImages',
    });
    // 장례식장 리스트 테이블과의 관계 생성 - 추후 필요
  }
}
export default FuneralHallInfo;
