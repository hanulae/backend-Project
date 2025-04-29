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
        businessNumber: {
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
        latitude: {
          type: DataTypes.DECIMAL(10, 7),
          allowNull: true,
          comment: '위도',
        },
        longitude: {
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
        totalRooms: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: '총 호실 수',
        },
        parkingCapacity: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: '주차 가능 대수',
        },
        isJoin: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: '회원가입 여부',
        },
        region: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '지역 (시/도)',
        },
        city: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '도시 (시/군/구)',
        },
        searchKeywords: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: '검색 키워드 (쉼표로 구분)',
        },
        verificationStatus: {
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
            fields: ['business_number'],
            unique: true,
          },
          {
            fields: ['region', 'city'],
          },
          {
            fields: ['funeral_name'],
          },
        ],
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.Funeral, {});
  }
}
export default FuneralList;
