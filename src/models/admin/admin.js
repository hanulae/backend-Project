/**
 * 관리자 모델 (Admin Model)
 * - Sequelize ORM을 사용하여 관리자(Admin) 사용자의 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 시스템 전체를 관리하는 최고 권한자를 위한 사용자 계정을 관리하며, 보안을 위한 비밀번호 해싱과 검증 기능을 포함합니다.
 * - 비밀번호 자동 해싱, UUID 기반 고유 식별자, 소프트 삭제 지원 등의 기능을 제공합니다.
 */

import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

/**
 * 관리자 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 비밀번호 해싱을 위한 hooks와 보안 설정 포함
 * 3) UUID 기반 고유 식별자, 자동 비밀번호 해싱, 이메일 중복 방지 등 설정
 *
 * 반환:
 * - Admin: 초기화된 Admin 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 * - 비밀번호 해싱 실패: bcrypt 해싱 과정에서 오류 발생
 */
class Admin extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        adminId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },

        adminEmail: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          comment: '관리자 이메일',
        },

        adminPassword: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '관리자 비밀번호 (해시됨)',
        },

        adminName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '관리자 이름',
        },

        role: {
          type: DataTypes.STRING(20),
          defaultValue: 'admin',
          allowNull: false,
          comment: '권한 역할(admin)',
        },
      },
      {
        sequelize,
        modelName: 'Admin',
        tableName: 'admins',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '관리자 테이블',

        hooks: {
          beforeCreate: async (admin) => {
            if (admin.adminPassword) {
              const salt = await bcrypt.genSalt(10);
              admin.adminPassword = await bcrypt.hash(admin.adminPassword, salt);
            }
          },

          beforeUpdate: async (admin) => {
            if (admin.changed('adminPassword')) {
              const salt = await bcrypt.genSalt(10);
              admin.adminPassword = await bcrypt.hash(admin.adminPassword, salt);
            }
          },
        },
      },
    );
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
    return await bcrypt.compare(inputPassword, this.adminPassword);
  }
}

export default Admin;
