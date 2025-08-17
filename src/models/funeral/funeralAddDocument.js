/**
 * 장례식장 추가 문서 모델 (Funeral Add Document Model)
 * - Sequelize ORM을 사용하여 장례식장이 업로드한 추가 문서들을 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 장례식장의 사업자등록증, 시설 사진, 계약서, 기타 인증 문서 등을 체계적으로 저장하고 관리합니다.
 * - 문서 정보 저장, 장례식장과의 관계 설정, 문서 이력 추적 등의 기능을 제공합니다.
 */

import { Sequelize, DataTypes } from 'sequelize';

/**
 * 장례식장 추가 문서 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 장례식장 추가 문서의 기본 정보와 장례식장과의 관계를 위한 설정 포함
 * 3) UUID 기반 고유 식별자, 문서명과 파일 경로 관리, 소프트 삭제 지원 등 설정
 *
 * 반환:
 * - FuneralAddDocument: 초기화된 FuneralAddDocument 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
 */
class FuneralAddDocument extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralDocId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          primaryKey: true,
          comment: '장례식장 추가 문서 고유 ID',
        },

        funeralId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '장례식장 고유 ID (FK)',
        },

        funeralDocName: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '장례식장 추가 문서 이름',
        },

        funeralDocPath: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '장례식장 추가 문서 경로',
        },
      },
      {
        sequelize,
        modelName: 'FuneralAddDocument',
        tableName: 'funeral_add_documents',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '장례식장 추가 문서 관리 테이블',
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
   * 2) 장례식장 추가 문서는 장례식장과 belongsTo 관계 설정
   * 3) 문서와 장례식장을 연결하여 문서 소유권 및 관리 시스템 구현
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
  }
}

export default FuneralAddDocument;
