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
        funeralBusinessNumber: {
          type: DataTypes.STRING(12),
          allowNull: false,
          comment: '사업자등록번호',
        },
        funeralName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: '장례식장 이름',
        },
        funeralAddress: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '장례식장 주소',
        },
        funeralAddressDetail: {
          type: DataTypes.STRING(255),
          allowNull: true,
          comment: '장례식장 상세주소',
        },
        funeralLatitude: {
          type: DataTypes.DECIMAL(10, 7),
          allowNull: true,
          comment: '위도',
        },
        funeralLongitude: {
          type: DataTypes.DECIMAL(10, 7),
          allowNull: true,
          comment: '경도',
        },
        funeralRepNumber: {
          type: DataTypes.STRING(20),
          allowNull: true,
          comment: '장례식장 대표 전화번호',
        },
        funeralFaxNumber: {
          type: DataTypes.STRING(20),
          allowNull: true,
          comment: '장례식장 팩스번호',
        },
        funeralTotalRooms: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: '총 호실 수',
        },
        funeralParkingCapacity: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: '주차 가능 대수',
        },
        funeralIsJoin: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: '회원가입 여부',
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
        funeralSearchKeywords: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: '검색 키워드 (쉼표로 구분)',
        },
        funeralVerificationStatus: {
          type: DataTypes.ENUM('unverified', 'verified', 'rejected'),
          allowNull: false,
          defaultValue: 'unverified',
          comment: '정보 검증 상태',
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
            fields: ['funeral_business_number'],
            unique: true,
          },
          {
            fields: ['funeral_region', 'funeral_city'],
          },
          {
            fields: ['funeral_name'],
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
  }
}
export default FuneralList;
