/**
 * 장례식장 모델 (Funeral Model)
 * - Sequelize ORM을 사용하여 장례식장 회원의 정보를 관리하는 데이터베이스 테이블 구조와 동작을 정의하는 모델 클래스입니다.
 * - 장례식장의 기본 정보(이름, 연락처, 은행 정보), 계정 정보(아이디, 비밀번호), 재무 정보(포인트, 캐시), 승인 상태 등을 체계적으로 관리합니다.
 * - 비밀번호 자동 해시화, 포인트 및 캐시 시스템, 관리자 승인 시스템 등의 기능을 제공합니다.
 */

import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

/**
 * 장례식장 모델 클래스
 *
 * 입력:
 * - sequelize: Object — Sequelize 인스턴스
 *
 * 동작:
 * 1) Sequelize 모델의 테이블 구조, 필드 정의, 설정 등을 초기화
 * 2) 장례식장의 기본 정보, 계정 정보, 은행 정보, 재무 정보, 승인 상태 등을 위한 설정 포함
 * 3) 비밀번호 자동 해시화를 위한 훅 설정
 *
 * 반환:
 * - Funeral: 초기화된 Funeral 모델 클래스
 *
 * 예외:
 * - 모델 초기화 실패: Sequelize 모델 생성 오류 발생
 * - 비밀번호 해싱 실패: bcrypt 해싱 과정에서 오류 발생
 */
class Funeral extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        funeralId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          comment: '장례식장 고유 ID',
        },

        funeralUsername: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: {
            name: 'funeral_username_unique',
            msg: '이미 사용 중인 아이디입니다',
          },
          validate: {
            notEmpty: true,
          },
          comment: '상조팀장 아이디 = 로그인 아이디',
        },

        funeralPassword: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: '장례식장 비밀번호(해시됨)',
        },

        funeralPhoneNumber: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: '장례식장 대표자 전화번호',
        },

        funeralName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '장례식장 이름',
        },

        funeralBankName: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '장례식장 등록 은행 이름',
        },

        funeralBankNumber: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: '장례식장 계좌번호 (암호화됨)',
        },

        funeralBankHolder: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '장례식장 계좌 예금주명',
        },

        funeralHome: {
          type: DataTypes.STRING(100),
          allowNull: true,
          comment: '장례식장 정보',
        },

        funeralPoint: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false,
          comment: '장례식장 포인트',
        },

        funeralCash: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false,
          comment: '장례식장 캐쉬',
        },

        isApproved: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: '장례식장 회원가입 관리자 승인 여부',
        },

        approvedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '장례식장 회원가입 관리자 승인 일시',
        },
      },
      {
        sequelize,
        modelName: 'Funeral',
        tableName: 'funerals',
        underscored: true,
        timestamps: true,
        paranoid: true,
        comment: '장례식장 관련 회원 정보 테이블',

        hooks: {
          beforeCreate: async (funeral) => {
            if (funeral.funeralPassword) {
              funeral.funeralPassword = await bcrypt.hash(funeral.funeralPassword, 10);
            }
          },

          beforeUpdate: async (funeral) => {
            if (funeral.changed('funeralPassword')) {
              funeral.funeralPassword = await bcrypt.hash(funeral.funeralPassword, 10);
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
   * 2) 장례식장은 다양한 관련 모델과 1:N, 1:1 관계 설정
   * 3) 포인트 히스토리, 현금 내역, 직원, 호실 정보, 입찰 정보 등과의 관계 구현
   *
   * 반환:
   * - void: 관계 설정만 수행하고 반환값 없음
   *
   * 예외:
   * - 관계 설정 실패: 모델 간 연결 과정에서 오류 발생
   */
  static associate(models) {
    this.hasMany(models.FuneralPointHistory, {
      foreignKey: 'funeralId',
      as: 'funeralPointHistories',
    });

    this.hasMany(models.FuneralCashHistory, {
      foreignKey: 'funeralId',
      as: 'funeralCashHistories',
    });

    this.hasMany(models.FuneralStaff, {
      foreignKey: 'funeralId',
      as: 'funeralStaffs',
    });

    this.hasOne(models.FuneralList, {
      foreignKey: 'funeralId',
      as: 'funeralList',
    });

    this.hasMany(models.FuneralHallInfo, {
      foreignKey: 'funeralId',
      as: 'funeralHallInfos',
    });

    this.hasMany(models.ManagerFormBid, {
      foreignKey: 'funeralId',
      as: 'managerFormBids',
    });

    this.hasMany(models.ManagerCashHistory, {
      foreignKey: 'funeralId',
      as: 'managerCashHistories',
    });
  }

  /**
   * 비밀번호 검증 인스턴스 메서드
   *
   * 입력:
   * - password: string — 검증할 평문 비밀번호
   *
   * 동작:
   * 1) 사용자가 입력한 평문 비밀번호와 데이터베이스에 저장된 해시된 비밀번호 비교
   * 2) bcrypt.compare를 사용하여 안전한 비밀번호 검증 수행
   * 3) 타이밍 공격 방지 및 비동기 처리로 성능 최적화
   *
   * 반환:
   * - Promise<boolean>: 비밀번호 일치 여부 (true: 일치, false: 불일치)
   *
   * 예외:
   * - 비밀번호 검증 실패: bcrypt 비교 과정에서 오류 발생
   */
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.funeralPassword);
  }

  /**
   * 안전한 데이터 반환 메서드 (비밀번호 제외)
   *
   * 입력:
   * - 없음
   *
   * 동작:
   * 1) 장례식장 정보를 외부로 전달할 때 보안상 민감한 정보(비밀번호)를 제외
   * 2) 구조 분해 할당을 사용하여 비밀번호 필드를 제거
   * 3) API 응답이나 로그 출력 시 사용할 수 있는 안전한 데이터 생성
   *
   * 반환:
   * - Object: 비밀번호가 제외된 안전한 장례식장 데이터
   *
   * 예외:
   * - 데이터 변환 실패: 객체 변환 과정에서 오류 발생
   */
  toSafeObject() {
    const { funeralPassword: _funeralPassword, ...safeData } = this.toJSON();
    return safeData;
  }
}

export default Funeral;
