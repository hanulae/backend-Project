import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt'; // ✅ 비밀번호 비교 또는 해싱용으로 사용

class Admin extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        adminId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        adminEmail: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          comment: '관리자 이메일',
        },
        adminPassword: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '관리자 비밀번호 (해시됨)',
        },
        adminName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '관리자 이름',
        },
        role: {
          type: DataTypes.STRING(20),
          defaultValue: 'admin',
          allowNull: false,
          comment: '권한 역할(admin)',
        },
      },
      {
        sequelize,
        modelName: 'Admin',
        tableName: 'admins',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '관리자 테이블',
        // ✅ 권장: 해시 저장을 위한 hooks
        hooks: {
          beforeCreate: async (admin) => {
            if (admin.adminPassword) {
              const salt = await bcrypt.genSalt(10);
              admin.adminPassword = await bcrypt.hash(admin.adminPassword, salt);
            }
          },
          beforeUpdate: async (admin) => {
            if (admin.changed('adminPassword')) {
              const salt = await bcrypt.genSalt(10);
              admin.adminPassword = await bcrypt.hash(admin.adminPassword, salt);
            }
          },
        },
      },
    );
  }

  // ✅ 권장: 비밀번호 비교 함수 추가
  async verifyPassword(inputPassword) {
    return await bcrypt.compare(inputPassword, this.adminPassword);
  }
}

export default Admin;
