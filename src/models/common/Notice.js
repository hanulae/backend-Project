/**
 * 공지사항 모델 (Notice Model)
 * - Sequelize ORM을 사용하여 시스템 전체의 공지사항을 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 다양한 사용자 유형(상조팀장, 장례식장, 전체)에게 중요한 정보를 전달하고, 공지사항의 공개/비공개 상태를 관리합니다.
 * - 공지사항 정보 저장, 사용자 유형별 분류, 공개/비공개 상태 제어 등의 기능을 제공합니다.
 */

import { Sequelize, DataTypes } from 'sequelize';

/**
 * 공지사항 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 공지사항의 기본 정보와 사용자 유형별 분류, 공개 상태 관리 등을 위한 설정 포함
 * 3) UUID 기반 고유 식별자, 공지사항 공개/비공개 상태 제어, 소프트 삭제 지원 등 설정
 *
 * 반환:
 * - Notice: 초기화된 Notice 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 * - 데이터 검증 실패: 필수 필드 누락 또는 제약 조건 위반 시 오류 발생
 */
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

        userType: {
          type: DataTypes.ENUM('manager', 'funeral', 'all'),
          allowNull: false,
          defaultValue: 'all',
          comment: '공지사항 대상 유저 타입 (manager: 상조팀장, funeral: 장례식장, all: 전체)',
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

  /**
   * 모델 간 관계 설정 메서드
   *
   * 입력:
   * - models: Object — 애플리케이션의 모든 모델 객체들
   *
   * 동작:
   * 1) 현재는 관계 설정이 필요하지 않아 주석 처리됨
   * 2) 향후 공지사항과 다른 모델 간의 관계가 필요한 경우 활성화 가능
   * 3) 공지사항 작성자, 첨부파일, 카테고리 등과의 관계 정의 가능
   *
   * 반환:
   * - void: 관계 설정만 수행하고 반환값 없음
   *
   * 예외:
   * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
   */
  // static associate(models) {
  //   // 관계가 필요한 경우 여기에 설정
  // }
}

export default Notice;
