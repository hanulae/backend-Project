import { Sequelize, DataTypes } from 'sequelize';

class AdminPermission extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        adminPermissionId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        adminId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '관리자 ID (FK)',
        },
        canManageUsers: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '유저 관리 권한',
        },
        canManageRefunds: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '환급 관리 권한',
        },
        canViewDashboard: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '대시보드 접근 권한',
        },
      },
      {
        sequelize,
        modelName: 'AdminPermission',
        tableName: 'admin_permissions',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '관리자 권한 설정 테이블',
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.Admin, { foreignKey: 'adminId', as: 'admin' });
  }
}

export default AdminPermission;
