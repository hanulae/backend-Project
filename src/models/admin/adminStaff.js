/**
 * 관리자 직원 모델 (Admin Staff Model)
 * - Sequelize ORM을 사용하여 관리자 팀에 소속된 직원들의 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 최상위 관리자(Admin)의 하위 직원으로, 시스템 운영을 보조하는 역할을 담당하며, 계층적 권한 구조를 지원합니다.
 * - 비밀번호 자동 해싱, UUID 기반 고유 식별자, 소프트 삭제 지원 등의 기능을 제공합니다.
 */

import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

/**
 * 관리자 직원 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 비밀번호 해싱을 위한 hooks와 보안 설정 포함
 * 3) 최상위 관리자와의 외래키 관계 설정
 *
 * 반환:
 * - AdminStaff: 초기화된 AdminStaff 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 * - 비밀번호 해싱 실패: bcrypt 해싱 과정에서 오류 발생
 */
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

  /**
   * 모델 간 관계 설정 메서드
   *
   * 입력:
   * - models: Object — 애플리케이션의 모든 모델 객체들
   *
   * 동작:
   * 1) Sequelize의 associate 메서드를 통해 다른 모델과의 관계 정의
   * 2) 관리자 직원은 최상위 관리자(Admin)와 belongsTo 관계 설정
   * 3) 계층적 구조 구현을 위한 외래키 연결
   *
   * 반환:
   * - void: 관계 설정만 수행하고 반환값 없음
   *
   * 예외:
   * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
   */
  static associate(models) {
    this.belongsTo(models.Admin, {
      foreignKey: 'adminId',
      as: 'admin',
    });
  }

  /**
   * 비밀번호 검증 메서드
   *
   * 입력:
   * - inputPassword: string — 사용자가 입력한 평문 비밀번호
   *
   * 동작:
   * 1) 사용자가 입력한 평문 비밀번호와 데이터베이스에 저장된 해시된 비밀번호 비교
   * 2) bcrypt.compare()를 사용하여 안전한 비밀번호 검증 수행
   * 3) 타이밍 공격 방지 및 Salt 자동 적용
   *
   * 반환:
   * - Promise<boolean>: 비밀번호 일치 여부 (true: 일치, false: 불일치)
   *
   * 예외:
   * - 비밀번호 검증 실패: bcrypt 비교 과정에서 오류 발생
   */
  async verifyPassword(inputPassword) {
    return await bcrypt.compare(inputPassword, this.adminStaffPassword);
  }
}

export default AdminStaff;
