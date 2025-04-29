import { Sequelize, DataTypes } from 'sequelize';

class FuneralStaff extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralStaffId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '장례식장 직원 고유 ID',
        },
        funeralId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 고유 ID (FK)',
        },
        funeralStaffPhoneNumber: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: '장례식장 직원 전화번호',
        },
        funeralStaffName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '장례식장 직원 이름',
        },
        funeralStaffRole: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '직원 직급',
        },
      },
      {
        sequelize,
        modelName: 'FuneralStaff',
        tableName: 'funeral_staffs',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '장례식장 직원 관리 테이블',
      },
    );
  }

  /**
   * 다른 모델과의 관계 설정
   */
  static associate(models) {
    // 장례식장 테이블과의 관계
    this.belongsTo(models.Funeral, {
      foreignKey: 'funeralId',
      as: 'funeral',
      onDelete: 'CASCADE',
    });
  }
}
export default FuneralStaff;
