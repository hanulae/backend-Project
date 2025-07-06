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
        roomManagement: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '호실 관리 접근 여부',
        },
        infoEdit: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '정보 수정 접근 여부',
        },
        dispatchHistory: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '지난 출동 내역 접근 여부',
        },
        dispatchPending: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '출동 대기 내역 접근 여부',
        },
        estimateHistory: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '견적 내역 접근 여부',
        },
        appSettings: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '앱 설정 접근 여부',
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
