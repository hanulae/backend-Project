/**
 * 상조팀장 모델 (Manager Model)
 * - Sequelize ORM을 사용하여 상조팀장(장례 서비스 제공자)의 회원 정보를 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 상조팀장의 기본 정보(이름, 전화번호, 아이디), 인증 정보(해시된 비밀번호), 은행 정보(은행명, 계좌번호, 예금주), 재정 정보(포인트, 캐시), 승인 상태 등을 체계적으로 관리합니다.
 * - bcrypt를 통한 비밀번호 보안, 다양한 모델과의 관계 설정, 안전한 데이터 반환 메서드를 지원하며, 장례 서비스 제공을 위한 핵심 사용자 엔티티입니다.
 */

import { Sequelize, DataTypes } from 'sequelize'; // Sequelize ORM 라이브러리
import bcrypt from 'bcrypt'; // 비밀번호 해싱 라이브러리

/**
 * 상조팀장 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 상조팀장의 기본 정보, 인증 정보, 은행 정보, 재정 정보, 승인 상태 등을 위한 설정 포함
 * 3) bcrypt를 통한 보안과 Sequelize Hooks를 통한 자동 비밀번호 해싱 설정
 *
 * 반환:
 * - Manager: 초기화된 Manager 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 */
class Manager extends Sequelize.Model {
  /**
   * 모델 초기화 메서드
   *
   * 입력:
   * - sequelize: Object — Sequelize 인스턴스
   *
   * 동작:
   * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
   * 2) 상조팀장의 기본 정보, 인증 정보, 은행 정보, 재정 정보, 승인 상태 등을 위한 설정 포함
   * 3) bcrypt를 통한 보안과 Sequelize Hooks를 통한 자동 비밀번호 해싱 설정
   *
   * 반환:
   * - Manager: 초기화된 Manager 모델 클래스
   *
   * 예외:
   * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
   */
  static init(sequelize) {
    return super.init(
      {
        managerId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '상조팀장 고유 ID',
        },

        managerUsername: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: {
            name: 'manager_username_unique',
            msg: '이미 사용 중인 아이디입니다',
          },
          validate: {
            notEmpty: true,
          },
          comment: '상조팀장 아이디 = 로그인 아이디',
        },

        managerPassword: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: '상조팀장 비밀번호(해시됨)',
        },

        managerPhoneNumber: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: '상조팀장 전화번호',
        },

        managerName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '상조팀장 이름',
        },

        managerBankName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '상조팀장 등록 은행 이름',
        },

        managerBankNumber: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: '상조팀장 계좌번호 (암호화됨)',
        },

        managerBankHolder: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '상조팀장 계좌 예금주명',
        },

        managerPoint: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false,
          comment: '상조팀장 포인트',
        },

        managerCash: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false,
          comment: '상조팀장 캐쉬',
        },

        isApproved: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: '상조팀장 회원가입 관리자 승인 여부',
        },

        approvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '상조팀장 회원가입 관리자 승인 일시',
        },
      },
      {
        sequelize,
        modelName: 'Manager',
        tableName: 'managers',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '상조팀장 관련 회원 정보 테이블',

        hooks: {
          beforeCreate: async (manager) => {
            if (manager.managerPassword) {
              manager.managerPassword = await bcrypt.hash(manager.managerPassword, 10);
            }
          },
          beforeUpdate: async (manager) => {
            if (manager.changed('managerPassword')) {
              manager.managerPassword = await bcrypt.hash(manager.managerPassword, 10);
            }
          },
        },
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
   * 2) 상조팀장은 다양한 모델과 hasMany 관계를 가짐
   * 3) 상조팀장과 관련된 모든 정보를 체계적으로 관리할 수 있도록 관계 설정
   *
   * 반환:
   * - void: 관계 설정만 수행하고 반환값 없음
   *
   * 예외:
   * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
   */
  static associate(models) {
    this.hasMany(models.ManagerForm, {
      foreignKey: 'managerId',
      as: 'forms',
    });

    this.hasMany(models.ManagerCashHistory, {
      foreignKey: 'managerId',
      as: 'managerCashHistories',
    });

    this.hasMany(models.ManagerPointHistory, {
      foreignKey: 'managerId',
      as: 'managerPointHistories',
    });

    this.hasMany(models.FuneralCashHistory, {
      foreignKey: 'managerId',
      as: 'funeralCashHistories',
    });

    this.hasMany(models.FuneralPointHistory, {
      foreignKey: 'managerId',
      as: 'funeralPointHistories',
    });

    this.hasMany(models.ManagerAddDocument, {
      foreignKey: 'managerId',
      as: 'managerAddDocuments',
    });
  }

  /**
   * 비밀번호 검증 인스턴스 메서드
   *
   * 입력:
   * - password: string — 검증할 평문 비밀번호
   *
   * 동작:
   * 1) bcrypt를 사용하여 입력된 평문 비밀번호와 저장된 해시된 비밀번호를 비교
   * 2) 로그인 인증을 수행하며, 보안을 위해 비동기적으로 처리
   * 3) 타이밍 공격 방지를 위한 상수 시간 비교 수행
   *
   * 반환:
   * - Promise<boolean>: 비밀번호 일치 여부 (true: 일치, false: 불일치)
   *
   * 예외:
   * - 비밀번호 비교 실패: bcrypt 비교 과정에서 오류 발생
   */
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.managerPassword);
  }

  /**
   * 안전한 데이터 반환 메서드 (비밀번호 제외)
   *
   * 입력:
   * - 없음
   *
   * 동작:
   * 1) 상조팀장 정보를 JSON 형태로 변환
   * 2) 민감한 정보인 비밀번호를 제외하여 보안 강화
   * 3) 구조 분해 할당을 통한 안전한 데이터 추출
   *
   * 반환:
   * - Object: 비밀번호가 제외된 안전한 상조팀장 데이터
   *
   * 예외:
   * - 데이터 변환 실패: JSON 변환 과정에서 오류 발생
   */
  toSafeObject() {
    const { managerPassword: _managerPassword, ...safeData } = this.toJSON();
    return safeData;
  }
}

export default Manager;
