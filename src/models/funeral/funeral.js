import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

class Funeral extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '장례식장 고유 ID',
        },
        funeralEmail: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: {
            name: 'funeral_email_unique',
            msg: '이미 사용중인 이메일 입니다.',
          },
          validate: {
            isEmail: true,
          },
          comment: '장례식장 이메일 = 로그인 아이디',
        },
        funeralPassword: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: '장례식장 비밀번호(해시됨)',
        },
        funeralPhoneNumber: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: '장례식장 대표자 전화번호',
        },
        funeralName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '장례식장 이름',
        },
        funeralBankName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '장례식장 등록 은행 이름',
        },
        funeralBankNumber: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: '장례식장 계좌번호 (암호화됨)',
        },
        funeralBankHolder: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '장례식장 계좌 예금주명',
        },
        funeralPoint: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false,
          comment: '장례식장 포인트',
        },
        funeralCash: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false,
          comment: '장례식장 캐쉬',
        },
        isApproved: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: '장례식장 회원가입 관리자 승인 여부',
        },
        approvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '장례식장 회원가입 관리자 승인 일시',
        },
      },
      {
        sequelize,
        modelName: 'Funeral',
        tableName: 'funerals',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '장례식장 관련 회원 정보 테이블',
      },
    );
  }

  /**
   * 다른 모델과의 관계 설정
   */
  static associate(models) {
    // 포인트 히스트리 테이블과의 관계설정
    this.hasMany(models.FuneralPointHistory, {
      foreignKey: 'funeralId',
      as: 'funeralPointHistories',
    });

    // 현금 내역 테이블과의 관계설정
    this.hasMany(models.FuneralCashHistory, {
      foreignKey: 'funeralId',
      as: 'funeralCashHistories',
    });
    // 장례식장 직원 테이블과의 관계설정
    this.hasMany(models.FuneralStaff, {
      foreignKey: 'funeralId',
      as: 'funeralStaffs',
    });
    // 장례식장 리스트 테이블과의 관계설정
    this.hasOne(models.FuneralList, {
      foreignKey: 'funeralId',
      as: 'funeralList',
    });
  }

  /**
   * 비밀번호 해시를 위한 훅
   */
  static hooks = {
    beforeCreate: async (funeral) => {
      if (funeral.funeralPassword) {
        funeral.funeralPassword = await bcrypt.hash(funeral.funeralPassword, 10);
      }
    },
    beforeUpdate: async (funeral) => {
      if (funeral.changed('funeralPassword')) {
        funeral.funeralPassword = await bcrypt.hash(funeral.funeralPassword, 10);
      }
    },
  };

  /**
   * 비밀번호 검증 인스턴스 메서드
   * @params {string} password - 검증할 평문 비밀번호
   * @returns {Promise<boolean>} 비밀번호 일치 여부
   */
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.funeralPassword);
  }

  // 안전한 데이터 반환 메서드 (비밀번호 제외)
  toSafeObject() {
    const { funeralPassword: _funeralPassword, ...safeData } = this.toJSON();
    return safeData;
  }
}
export default Funeral;
