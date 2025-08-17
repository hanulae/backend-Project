/**
 * 상조팀장 추가 문서 모델 (Manager Add Document Model)
 * - Sequelize ORM을 사용하여 상조팀장이 업로드한 추가 문서들을 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 상조팀장의 사업자등록증, 자격증, 계약서, 기타 업무 관련 문서 등의 파일 정보를 체계적으로 관리합니다.
 * - 상조팀장과의 관계를 통해 문서 소유권을 추적하며, 파일 시스템 연동을 지원하는 핵심 구성 요소입니다.
 */

import { Sequelize, DataTypes } from 'sequelize'; // Sequelize ORM 라이브러리

/**
 * 상조팀장 추가 문서 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 상조팀장 추가 문서의 기본 정보와 상조팀장과의 관계를 위한 설정 포함
 * 3) 문서 소유권 추적과 파일 시스템 연동을 위한 설정 적용
 *
 * 반환:
 * - ManagerAddDocument: 초기화된 ManagerAddDocument 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 */
class ManagerAddDocument extends Sequelize.Model {
  /**
   * 모델 초기화 메서드
   *
   * 입력:
   * - sequelize: Object — Sequelize 인스턴스
   *
   * 동작:
   * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
   * 2) 상조팀장 추가 문서의 기본 정보와 상조팀장과의 관계를 위한 설정 포함
   * 3) 문서 소유권 추적과 파일 시스템 연동을 위한 설정 적용
   *
   * 반환:
   * - ManagerAddDocument: 초기화된 ManagerAddDocument 모델 클래스
   *
   * 예외:
   * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
   */
  static init(sequelize) {
    return super.init(
      {
        managerDocId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '상조팀장 추가 문서 고유 ID',
        },

        managerId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '상조팀장 고유 ID (FK)',
        },

        managerDocName: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '상조팀장 추가 문서 이름',
        },

        managerDocPath: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '상조팀장 추가 문서 경로',
        },
      },
      {
        sequelize,
        modelName: 'ManagerAddDocument',
        tableName: 'manager_add_documents',
        underscored: true,
        timestamps: true,
        paranoid: false,
        comment: '상조팀장 추가 문서 관리 테이블',
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
   * 2) 상조팀장 추가 문서는 상조팀장과 belongsTo 관계를 가짐
   * 3) 문서와 관련된 모든 정보를 체계적으로 관리할 수 있도록 관계 설정
   *
   * 반환:
   * - void: 관계 설정만 수행하고 반환값 없음
   *
   * 예외:
   * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
   */
  static associate(models) {
    this.belongsTo(models.Manager, {
      foreignKey: 'managerId',
      as: 'manager',
      onDelete: 'CASCADE',
    });
  }
}

export default ManagerAddDocument;
