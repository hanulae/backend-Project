import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

class Manager extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        managerId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '상조팀장 고유 ID',
        },
        managerEmail: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: {
            name: 'manager_email_unique',
            msg: '이미 사용 중인 이메일입니다',
          },
          validate: {
            isEmail: true,
          },
          comment: '상조팀장 이메일 = 로그인 아이디',
        },
        managerPassword: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: '상조팀장 비밀번호(해시됨)',
        },
        managerPhoneNumber: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: '상조팀장 전화번호',
        },
        managerName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '상조팀장 이름',
        },
        managerBankName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '상조팀장 등록 은행 이름',
        },
        managerBankNumber: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: '상조팀장 계좌번호 (암호화됨)',
        },
        managerBankHolder: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '상조팀장 계좌 예금주명',
        },
        managerPoint: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false,
          comment: '상조팀장 포인트',
        },
        managerCash: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false,
          comment: '상조팀장 캐쉬',
        },
        isApproved: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: '상조팀장 회원가입 관리자 승인 여부',
        },
        approvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '상조팀장 회원가입 관리자 승인 일시',
        },
      },
      {
        sequelize,
        modelName: 'Manager',
        tableName: 'managers',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '상조팀장 관련 회원 정보 테이블',
        hooks: {
          beforeCreate: async (manager) => {
            if (manager.managerPassword) {
              manager.managerPassword = await bcrypt.hash(manager.managerPassword, 10);
            }
          },
          beforeUpdate: async (manager) => {
            if (manager.changed('managerPassword')) {
              manager.managerPassword = await bcrypt.hash(manager.managerPassword, 10);
            }
          },
        },
      },
    );
  }

  /**
   * 다른 모델과의 관계 설정
   */
  static associate(models) {
    // Manager는 ManagerForm에 속함 ( 1:N 관계 )
    this.hasMany(models.ManagerForm, {
      foreignKey: 'managerId',
      as: 'forms',
    });
    // Manager는 ManagerCashHistory에 속함 ( 1:N 관계 )
    this.hasMany(models.ManagerCashHistory, {
      foreignKey: 'managerId',
      as: 'managerCashHistories',
    });
    // Manager는 ManagerPointHistory에 속함 ( 1:N 관계 )
    this.hasMany(models.ManagerPointHistory, {
      foreignKey: 'managerId',
      as: 'managerPointHistories',
    });
    // Manager는 FuneralCashHistory에 속함 ( 1:N 관계 )
    this.hasMany(models.FuneralCashHistory, {
      foreignKey: 'managerId',
      as: 'funeralCashHistories',
    });
    // Manager는 FuneralPointHistory에 속함 ( 1:N 관계 )
    this.hasMany(models.FuneralPointHistory, {
      foreignKey: 'managerId',
      as: 'funeralPointHistories',
    });
    // Manager는 ManagerAddDocument에 속함 ( 1:N 관계 )
    this.hasMany(models.ManagerAddDocument, {
      foreignKey: 'managerId',
      as: 'managerAddDocuments',
    });
  }

  /**
   * 비밀번호 검증 인스턴스 메서드
   * @params {string} password - 검증할 평문 비밀번호
   * @returns {Promise<boolean>} 비밀번호 일치 여부
   */
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.managerPassword);
  }

  // 안전한 데이터 반환 메서드 (비밀번호 제외)
  toSafeObject() {
    const { managerPassword: _managerPassword, ...safeData } = this.toJSON();
    return safeData;
  }
}

export default Manager;
