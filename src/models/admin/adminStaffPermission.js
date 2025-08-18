/**
 * 관리자 권한 설정 모델 (Admin Permission Model)
 * - Sequelize ORM을 사용하여 관리자(Admin) 사용자의 세부 권한을 정의하고 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 역할 기반 접근 제어(RBAC) 시스템의 핵심 구성 요소로, 각 관리자가 수행할 수 있는 작업을 세밀하게 제어합니다.
 * - 관리자별 세부 권한 설정, 권한 기반 접근 제어, 기본 권한값 설정 등의 기능을 제공합니다.
 */

import { Sequelize, DataTypes } from 'sequelize';

/**
 * 관리자 권한 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 권한 기반 접근 제어를 위한 세부 권한 필드들과 보안 설정 포함
 * 3) 관리자와의 1:1 관계 설정
 *
 * 반환:
 * - AdminPermission: 초기화된 AdminPermission 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
 */
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

  /**
   * 모델 간 관계 설정 메서드
   *
   * 입력:
   * - models: Object — 애플리케이션의 모든 모델 객체들
   *
   * 동작:
   * 1) Sequelize의 associate 메서드를 통해 다른 모델과의 관계 정의
   * 2) 관리자 권한은 관리자(Admin)와 belongsTo 관계 설정
   * 3) 권한과 관리자를 연결하여 1:1 관계 구현
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
}

export default AdminPermission;
