import { Sequelize, DataTypes } from 'sequelize';

class FuneralList extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralListId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '장례식장 리스트 고유 ID',
        },
        funeralId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '장례식장 회원 고유 ID (FK)',
        },
        funeralName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: '장례식장 이름',
        },
        funeralRegion: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '지역 (시/도)',
        },
        funeralCity: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '도시 (시/군/구)',
        },
        funeralAddress: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '장례식장 주소',
        },
        funeralScale: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '장례식장 규모 (소형/ 중형/ 대형)',
        },
        funeralTotalRooms: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '총 빈소 수',
        },
        funeralOperationType: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '운영 형태 (사설, 공설)',
        },
        funeralStyle: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '장례식장 형태 (병원, 전문)',
        },
        funeralParkingLot: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          comment: '주차장 유/무',
        },
        funeralStore: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          comment: '매점 유/무',
        },
        funeralFamilyWaitingRoom: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          comment: '유족 대기실 유/무',
        },
        funeralDisabledFacility: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          comment: '장애인 시설 유/무',
        },
        funeralIsJoin: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: '회원가입 여부',
        },
        funeralSearchKeywords: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: '검색 키워드 (쉼표로 구분)',
        },
      },
      {
        sequelize,
        modelName: 'FuneralList',
        tableName: 'funeral_lists',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '전국 장례식장 기본 정보 관리 테이블',
        indexes: [
          {
            fields: ['funeral_region', 'funeral_city'],
          },
          {
            fields: ['funeral_name'],
          },
          {
            fields: ['funeral_id'],
          },
        ],
      },
    );
  }

  /**
   * 관계 설정
   */
  static associate(models) {
    // 장례식장 회원 테이블과의 관계 설정
    this.belongsTo(models.Funeral, {
      foreignKey: 'funeralId',
      as: 'funeral',
      constraints: false, // 장례식장 회원가입 전까지는 null 값 허용
    });
    // 상조팀장 장바구니 테이블과의 관계 설정
    this.hasMany(models.ManagerCart, {
      foreignKey: 'funeralListId',
      as: 'managerCart',
    });
    // 입찰 테이블과의 관계 설정
    this.hasMany(models.ManagerFormBid, {
      foreignKey: 'funeralListId',
      as: 'managerFormBid',
    });
    // 호실 정보 테이블과의 관계 설정
    this.hasMany(models.FuneralHallInfo, {
      foreignKey: 'funeralListId',
      as: 'funeralHallInfo',
    });
  }
}
export default FuneralList;
