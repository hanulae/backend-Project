import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

class AdminStaff extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        adminStaffId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        adminId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '최상위 관리자 FK',
        },
        adminStaffEmail: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          comment: '직원 이메일 (로그인 ID)',
        },
        adminStaffPassword: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '직원 비밀번호 (해시)',
        },
        adminStaffName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '직원 이름',
        },
        adminStaffRole: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: '직원',
          comment: '직원 직급 (예: 팀장, 과장, 일반직원 등)',
        },
      },
      {
        sequelize,
        modelName: 'AdminStaff',
        tableName: 'admin_staffs',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '관리자 직원 테이블',
        hooks: {
          // 비밀번호 해시 자동 처리
          beforeCreate: async (adminStaff) => {
            if (adminStaff.adminStaffPassword) {
              adminStaff.adminStaffPassword = await bcrypt.hash(adminStaff.adminStaffPassword, 10);
            }
          },
          beforeUpdate: async (adminStaff) => {
            if (adminStaff.changed('adminStaffPassword')) {
              adminStaff.adminStaffPassword = await bcrypt.hash(adminStaff.adminStaffPassword, 10);
            }
          },
        },
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.Admin, {
      foreignKey: 'adminId',
      as: 'admin',
    });
  }

  // ✅ 비밀번호 비교 메서드 추가
  async verifyPassword(inputPassword) {
    return await bcrypt.compare(inputPassword, this.adminStaffPassword);
  }
}

export default AdminStaff;
