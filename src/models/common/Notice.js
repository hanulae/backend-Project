// models/common/Notice.js
import { Sequelize, DataTypes } from 'sequelize';

class Notice extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        noticeId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
          comment: '공지사항 고유 ID',
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: '공지사항 제목',
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: '공지사항 본문',
        },
        isVisible: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false,
          comment: '공지사항 공개 여부',
        },
      },
      {
        sequelize,
        modelName: 'Notice',
        tableName: 'notices',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '공지사항 테이블',
      },
    );
  }

  //   static associate(models) {
  //     // 관계가 필요한 경우 여기에 설정
  //   }
}

export default Notice;
