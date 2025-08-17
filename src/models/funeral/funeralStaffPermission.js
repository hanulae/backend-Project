/**
 * 장례식장 직원 권한 모델 (Funeral Staff Permission Model)
 * - Sequelize ORM을 사용하여 장례식장 직원들의 세부적인 접근 권한을 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 각 직원이 시스템의 어떤 기능에 접근할 수 있는지를 8가지 핵심 기능으로 세분화하여 관리하며, 역할 기반 접근 제어(RBAC)를 구현합니다.
 * - 보안과 사용성을 균형있게 관리하여 직원별 세밀한 접근 권한 제어와 권한 변경 이력 추적을 지원합니다.
 */

// models/funeralStaffPermission.js
import { Sequelize, DataTypes } from 'sequelize'; // Sequelize ORM 라이브러리

/**
 * 장례식장 직원 권한 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 장례식장 직원의 8가지 핵심 기능에 대한 접근 권한을 BOOLEAN 값으로 관리
 * 3) 보안과 사용성을 균형있게 조절하는 설정 적용
 *
 * 반환:
 * - FuneralStaffPermission: 초기화된 FuneralStaffPermission 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 */
class FuneralStaffPermission extends Sequelize.Model {
  /**
   * 모델 초기화 메서드
   *
   * 입력:
   * - sequelize: Object — Sequelize 인스턴스
   *
   * 동작:
   * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
   * 2) 장례식장 직원의 8가지 핵심 기능에 대한 접근 권한을 BOOLEAN 값으로 관리
   * 3) 보안과 사용성을 균형있게 조절하는 설정 적용
   *
   * 반환:
   * - FuneralStaffPermission: 초기화된 FuneralStaffPermission 모델 클래스
   *
   * 예외:
   * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
   */
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

        pointHistory: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '포인트 내역 접근 여부',
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

  /**
   * 다른 모델과의 관계 설정 메서드
   *
   * 입력:
   * - models: Object — 애플리케이션의 모든 모델 객체들
   *
   * 동작:
   * 1) Sequelize의 associate 메서드를 통해 다른 모델과의 관계 정의
   * 2) 장례식장 직원 권한은 직원과 belongsTo 관계를 가짐
   * 3) 권한과 관련된 모든 정보를 체계적으로 관리할 수 있도록 관계 설정
   *
   * 반환:
   * - void: 관계 설정만 수행하고 반환값 없음
   *
   * 예외:
   * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
   */
  static associate(models) {
    this.belongsTo(models.FuneralStaff, {
      foreignKey: 'funeralStaffId',
      as: 'funeralStaff',
    });
  }
}

export default FuneralStaffPermission;
