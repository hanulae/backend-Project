// models/funeralStaffPermission.js
import { Sequelize, DataTypes } from 'sequelize';

class FuneralStaffPermission extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralStaffPermissionId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '직원 권한 고유 ID',
        },
        funeralStaffId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '직원 ID (FK)',
        },
        canManageStaff: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '직원관리 메뉴 접근 여부',
        },
        canRequestRefund: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '환급요청 메뉴 접근 여부',
        },
        canViewDispatch: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '출동요청상세 접근 여부',
        },
        canManageRoom: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '호실관리 접근 여부',
        },
      },
      {
        sequelize,
        modelName: 'FuneralStaffPermission',
        tableName: 'funeral_staff_permissions',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '장례식장 직원 권한 테이블',
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.FuneralStaff, {
      foreignKey: 'funeralStaffId',
      as: 'funeralStaff',
    });
  }
}

export default FuneralStaffPermission;
