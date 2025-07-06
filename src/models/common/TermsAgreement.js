import { Sequelize, DataTypes } from 'sequelize';

class TermsAgreement extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        termsAgreementId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '약관 동의 고유 ID',
        },
        managerId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '상조팀장 ID (FK)',
        },
        funeralId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '장례식장 ID (FK)',
        },
        serviceAgreement: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: '서비스 이용약관 동의 여부',
        },
        personalInfoAgreement: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: '개인정보 수집 및 이용 동의 여부',
        },
        locationInfoAgreement: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: '위치정보 수집 및 이용 동의 여부',
        },
        age14OrOlderAgreement: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: '만 14세 이상 동의 여부',
        },
        marketingInfoAgreement: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '마케팅 정보 수신 동의 여부 (선택)',
        },
      },
      {
        sequelize,
        modelName: 'TermsAgreement',
        tableName: 'terms_agreements',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '사용자 약관 동의 테이블',
      },
    );
  }

  static associate(models) {
    this.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager',
    });
    this.belongsTo(models.Funeral, {
      foreignKey: 'funeralId',
      as: 'funeral',
    });
  }
}

export default TermsAgreement;
