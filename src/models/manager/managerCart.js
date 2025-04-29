import { Sequelize, DataTypes } from 'sequelize';

class ManagerCart extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        managerCartId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '상조팀장 장바구니 고유 ID',
        },
        managerId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '상조팀장 고유 ID (FK)',
        },
        funeralListId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 리스트 고유 ID (FK)',
        },
        isDeleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: '삭제 여부',
        },
      },
      {
        sequelize,
        timestamps: true,
        paranoid: true,
        modelName: 'ManagerCart',
        tableName: 'manager_carts',
        underscored: true,
        comment: '상조팀장 장바구니 관리 테이블',
      },
    );
  }

  /**
   * 관계 설정
   */
  static associate(models) {
    // 상조 팀장과의 관계 설정
    this.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager',
      onDelete: 'CASCADE', // 상조팀장 탈퇴 시 장바구니 연관된 데이터 삭제
    });
    // 장례식장 리스트와의 관계 설정 추후 필요
  }
}
export default ManagerCart;
