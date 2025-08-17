/**
 * 장례식장 직원 모델 (Funeral Staff Model)
 * - Sequelize ORM을 사용하여 장례식장에 소속된 직원들의 정보를 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 장례식장 직원의 기본 정보(이름, 전화번호, 직급), 인증 정보(비밀번호), 장례식장 대표번호 등을 체계적으로 관리합니다.
 * - 장례식장과의 소속 관계와 직원별 권한 관리를 지원하며, 직원 정보의 무결성과 보안을 보장합니다.
 */

import { Sequelize, DataTypes } from 'sequelize'; // Sequelize ORM 라이브러리

/**
 * 장례식장 직원 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 장례식장 직원의 기본 정보, 인증 정보, 소속 관계, 보안 설정 등을 위한 설정 포함
 * 3) 직원 정보의 무결성과 보안을 보장하는 설정 적용
 *
 * 반환:
 * - FuneralStaff: 초기화된 FuneralStaff 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 */
class FuneralStaff extends Sequelize.Model {
  /**
   * 모델 초기화 메서드
   *
   * 입력:
   * - sequelize: Object — Sequelize 인스턴스
   *
   * 동작:
   * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
   * 2) 장례식장 직원의 기본 정보, 인증 정보, 소속 관계, 보안 설정 등을 위한 설정 포함
   * 3) 직원 정보의 무결성과 보안을 보장하는 설정 적용
   *
   * 반환:
   * - FuneralStaff: 초기화된 FuneralStaff 모델 클래스
   *
   * 예외:
   * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
   */
  static init(sequelize) {
    return super.init(
      {
        funeralStaffId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
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

        funeralStaffPassword: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: '장례식장 직원 비밀번호',
        },

        funeralMainPhoneNumber: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: '장례식장 대표번호',
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
   * 다른 모델과의 관계 설정 메서드
   *
   * 입력:
   * - models: Object — 애플리케이션의 모든 모델 객체들
   *
   * 동작:
   * 1) Sequelize의 associate 메서드를 통해 다른 모델과의 관계 정의
   * 2) 장례식장 직원은 장례식장과 belongsTo 관계를 가지며, 직원 권한과는 hasMany 관계를 가짐
   * 3) 직원과 관련된 모든 정보를 체계적으로 관리할 수 있도록 관계 설정
   *
   * 반환:
   * - void: 관계 설정만 수행하고 반환값 없음
   *
   * 예외:
   * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
   */
  static associate(models) {
    this.belongsTo(models.Funeral, {
      foreignKey: 'funeralId',
      as: 'funeral',
      onDelete: 'CASCADE',
    });

    this.hasMany(models.FuneralStaffPermission, {
      foreignKey: 'funeralStaffId',
      as: 'permissions',
    });
  }
}

export default FuneralStaff;
