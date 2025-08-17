/**
 * 상조팀장 사용자 관리 DAO (Data Access Object)
 * - 상조팀장의 사용자 계정 정보를 관리하는 데이터베이스 작업을 담당합니다.
 * - 상조팀장의 회원가입, 로그인, 프로필 관리, 계정 검색 등의 기본적인 사용자 계정 관련 데이터베이스 작업을 수행합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 상조팀장 회원가입, 사용자명(아이디) 중복 확인, 사용자 ID로 프로필 정보 조회, 휴대폰 번호로 사용자 검색 등의 기능을 제공합니다.
 * - 상조팀장이 서비스에 가입하고 로그인할 때 필요한 계정 정보를 안전하게 저장하고, 중복 가입을 방지하며, 필요시 계정 정보를 검색할 수 있도록 지원합니다.
 * - 소프트 삭제(paranoid) 지원으로 데이터 복구가 가능하며, 트랜잭션을 통한 데이터 일관성을 보장합니다.
 * - 민감한 정보 접근 시 적절한 오류 처리를 제공합니다.
 */

// src/dao/manager/managerUserDao.js
import db from '../../models/index.js'; // 데이터베이스 연결 및 모델 인덱스

/**
 * 상조팀장 회원가입
 *
 * 입력:
 * - managerData: Object — 생성할 상조팀장 데이터
 *   - managerUsername: string — 사용자명 (아이디)
 *   - managerPassword: string — 비밀번호 (해시화된 상태)
 *   - managerName: string — 상조팀장 실명
 *   - managerPhoneNumber: string — 휴대폰 번호
 *   - managerEmail: string — 이메일 주소 (선택사항)
 *   - managerAddress: string — 주소 (선택사항)
 *   - managerBusinessNumber: string — 사업자 등록번호 (선택사항)
 *   - managerCompanyName: string — 회사명 (선택사항)
 * - options: Object — 데이터베이스 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체 (데이터 일관성 보장)
 *   - validate: 데이터 검증 옵션
 *   - hooks: 모델 훅 실행 여부
 *
 * 동작:
 * 1) 입력받은 상조팀장 데이터로 새로운 사용자 레코드 생성
 * 2) Sequelize 옵션을 포함하여 데이터 일관성 보장
 * 3) 오류 발생 시 콘솔에 로그 출력 후 원본 오류 전달
 *
 * 생성 정보:
 * - 상조팀장 기본 정보 (사용자명, 비밀번호, 실명, 휴대폰 번호)
 * - 선택적 정보 (이메일, 주소, 사업자 등록번호, 회사명)
 * - 자동 생성: ID, createdAt, updatedAt
 * - 트랜잭션을 통한 안전한 데이터 저장
 *
 * 반환:
 * - Object: 생성된 상조팀장 사용자 객체
 *   - id: 사용자 고유 ID
 *   - managerUsername: 사용자명
 *   - managerName: 실명
 *   - managerPhoneNumber: 휴대폰 번호
 *   - managerEmail: 이메일
 *   - managerAddress: 주소
 *   - managerBusinessNumber: 사업자 등록번호
 *   - managerCompanyName: 회사명
 *   - createdAt: 생성 일시
 *   - updatedAt: 수정 일시
 *
 * 예외:
 * - DB 생성 실패: 콘솔에 오류 로그 출력 후 원본 오류 전달
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 새로운 상조팀장 사용자를 데이터베이스에 등록하는 함수입니다.
 * - 회원가입 프로세스에서 사용되며, 상조팀장의 기본 정보를 안전하게 저장합니다.
 * - Manager 모델을 사용하여 새로운 상조팀장 사용자 레코드를 생성합니다.
 * - options를 통해 트랜잭션 등의 데이터베이스 옵션을 전달할 수 있습니다.
 * - 트랜잭션을 사용하여 데이터 일관성을 보장합니다.
 * - 회원가입 중 오류 발생 시 로그를 기록합니다.
 * - 개발자가 문제를 추적할 수 있도록 구체적인 오류 메시지를 출력합니다.
 * - 원본 오류를 그대로 전달하여 상위 레벨에서 적절한 오류 처리가 가능합니다.
 * - 이는 데이터베이스 제약 조건 위반, 유효성 검사 실패 등의 구체적인 오류 정보를 유지하기 위함입니다.
 */
export const insert = async (managerData, options = {}) => {
  try {
    // Manager 모델을 사용하여 새로운 상조팀장 사용자 레코드 생성
    // options를 통해 트랜잭션 등의 데이터베이스 옵션 전달 가능
    // 트랜잭션을 사용하여 데이터 일관성 보장
    const newUser = await db.Manager.create(managerData, options);
    return newUser;
  } catch (error) {
    // 회원가입 중 오류 발생 시 로그 기록
    // 개발자가 문제를 추적할 수 있도록 구체적인 오류 메시지 출력
    console.error('회원가입 DAO 오류:', error.message);

    // 원본 오류를 그대로 전달하여 상위 레벨에서 적절한 오류 처리 가능
    // 이는 데이터베이스 제약 조건 위반, 유효성 검사 실패 등의
    // 구체적인 오류 정보를 유지하기 위함입니다.
    throw error;
  }
};

/**
 * 사용자명(아이디) 중복 확인
 *
 * 입력:
 * - managerUsername: string — 확인할 사용자명 (아이디)
 *
 * 동작:
 * 1) Manager 테이블에서 특정 사용자명으로 사용자 검색
 * 2) paranoid: false 옵션으로 소프트 삭제된 레코드도 포함하여 조회
 * 3) 오류 발생 시 콘솔에 로그 출력 후 원본 오류 전달
 *
 * 조회 조건:
 * - managerUsername: 입력받은 사용자명과 정확히 일치
 *
 * 조회 옵션:
 * - paranoid: false — 소프트 삭제된 레코드도 포함하여 조회
 *
 * 반환:
 * - Object|null: 중복된 사용자가 있으면 사용자 객체, 없으면 null
 *   - id: 사용자 고유 ID
 *   - managerUsername: 사용자명
 *   - managerName: 실명
 *   - managerPhoneNumber: 휴대폰 번호
 *   - deletedAt: 삭제 일시 (소프트 삭제된 경우)
 *   - 기타 사용자 정보 필드들
 *
 * 예외:
 * - DB 조회 실패: 콘솔에 오류 로그 출력 후 원본 오류 전달
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 회원가입 시 사용자명의 중복 여부를 확인하는 함수입니다.
 * - 소프트 삭제된 계정도 포함하여 조회하므로, 동일한 사용자명으로 재가입을 방지할 수 있습니다.
 * - Manager 테이블에서 특정 사용자명으로 사용자를 검색합니다.
 * - paranoid: false 옵션으로 소프트 삭제된 레코드도 포함하여 조회하되, where 조건으로 필터링합니다.
 * - 이는 동일한 사용자명으로 재가입을 방지하기 위함입니다.
 * - 사용자명 중복 확인 중 오류 발생 시 로그를 기록합니다.
 * - 🔴 이모지를 사용하여 중요한 오류임을 시각적으로 표시합니다.
 * - 원본 오류를 그대로 전달하여 상위 레벨에서 적절한 오류 처리가 가능합니다.
 */
export const findByUsername = async (managerUsername) => {
  try {
    // Manager 테이블에서 특정 사용자명으로 사용자 검색
    // paranoid: false 옵션으로 소프트 삭제된 레코드도 포함하여 조회
    // 이는 동일한 사용자명으로 재가입을 방지하기 위함입니다.
    return await db.Manager.findOne({
      where: {
        managerUsername, // 사용자명으로 필터링
      },
      paranoid: false, // 소프트 삭제된 레코드도 포함하여 조회하되, where 조건으로 필터링
    });
  } catch (error) {
    // 사용자명 중복 확인 중 오류 발생 시 로그 기록
    // 🔴 이모지를 사용하여 중요한 오류임을 시각적으로 표시
    console.error('🔴 아이디 중복 확인 DAO 오류:', error.message);

    // 원본 오류를 그대로 전달하여 상위 레벨에서 적절한 오류 처리 가능
    throw error;
  }
};

/**
 * 사용자 ID로 프로필 정보 조회
 *
 * 입력:
 * - managerId: string|number — 조회할 상조팀장의 고유 ID
 *
 * 동작:
 * 1) Manager 테이블에서 기본키(managerId)로 사용자 정보 조회
 * 2) findByPk를 사용하여 가장 빠른 조회 방법으로 인덱스 활용
 * 3) 오류 발생 시 콘솔에 로그 출력 후 원본 오류 전달
 *
 * 조회 조건:
 * - managerId: 입력받은 ID와 정확히 일치 (Primary Key)
 *
 * 조회 방식:
 * - findByPk: 가장 빠른 조회 방법으로 인덱스를 활용
 *
 * 반환:
 * - Object|null: 상조팀장 정보가 있으면 사용자 객체, 없으면 null
 *   - id: 사용자 고유 ID
 *   - managerUsername: 사용자명
 *   - managerName: 실명
 *   - managerPhoneNumber: 휴대폰 번호
 *   - managerEmail: 이메일
 *   - managerAddress: 주소
 *   - managerBusinessNumber: 사업자 등록번호
 *   - managerCompanyName: 회사명
 *   - managerPoint: 보유 포인트
 *   - managerCash: 보유 캐시
 *   - createdAt: 생성 일시
 *   - updatedAt: 수정 일시
 *
 * 예외:
 * - DB 조회 실패: 콘솔에 오류 로그 출력 후 원본 오류 전달
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 특정 상조팀장의 상세 프로필 정보를 조회하는 함수입니다.
 * - 로그인 후 사용자 정보 표시, 프로필 수정, 권한 확인 등에서 사용됩니다.
 * - Manager 테이블에서 기본키(managerId)로 사용자 정보를 조회합니다.
 * - findByPk는 가장 빠른 조회 방법으로, 인덱스를 활용합니다.
 * - 프로필 조회 중 오류 발생 시 로그를 기록합니다.
 * - 🔴 이모지를 사용하여 중요한 오류임을 시각적으로 표시합니다.
 * - 원본 오류를 그대로 전달하여 상위 레벨에서 적절한 오류 처리가 가능합니다.
 */
export const findById = async (managerId) => {
  try {
    // Manager 테이블에서 기본키(managerId)로 사용자 정보 조회
    // findByPk는 가장 빠른 조회 방법으로, 인덱스를 활용합니다.
    return await db.Manager.findByPk(managerId);
  } catch (error) {
    // 프로필 조회 중 오류 발생 시 로그 기록
    // 🔴 이모지를 사용하여 중요한 오류임을 시각적으로 표시
    console.error('🔴 프로필 DAO 오류:', error.message);

    // 원본 오류를 그대로 전달하여 상위 레벨에서 적절한 오류 처리 가능
    throw error;
  }
};

/**
 * 휴대폰 번호로 사용자 검색
 *
 * 입력:
 * - managerPhoneNumber: string — 검색할 휴대폰 번호
 *
 * 동작:
 * 1) Manager 테이블에서 휴대폰 번호로 사용자 검색
 * 2) where 조건을 사용하여 정확한 휴대폰 번호 매칭
 * 3) 오류 발생 시 콘솔에 로그 출력 후 원본 오류 전달
 *
 * 조회 조건:
 * - managerPhoneNumber: 입력받은 휴대폰 번호와 정확히 일치
 *
 * 반환:
 * - Object|null: 해당 휴대폰 번호를 가진 사용자가 있으면 사용자 객체, 없으면 null
 *   - id: 사용자 고유 ID
 *   - managerUsername: 사용자명
 *   - managerName: 실명
 *   - managerPhoneNumber: 휴대폰 번호
 *   - managerEmail: 이메일
 *   - 기타 사용자 정보 필드들
 *
 * 예외:
 * - DB 조회 실패: 콘솔에 오류 로그 출력 후 원본 오류 전달
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 휴대폰 번호를 기반으로 상조팀장 사용자를 검색하는 함수입니다.
 * - "아이디 찾기" 기능에서 사용되며, 사용자가 휴대폰 번호만 알고 있을 때 계정을 찾을 수 있도록 지원합니다.
 * - Manager 테이블에서 휴대폰 번호로 사용자를 검색합니다.
 * - where 조건을 사용하여 정확한 휴대폰 번호 매칭을 수행합니다.
 * - 휴대폰 번호로 사용자 검색 중 오류 발생 시 로그를 기록합니다.
 * - 🔴 이모지를 사용하여 중요한 오류임을 시각적으로 표시합니다.
 * - 원본 오류를 그대로 전달하여 상위 레벨에서 적절한 오류 처리가 가능합니다.
 */
export const findByPhone = async (managerPhoneNumber) => {
  try {
    // Manager 테이블에서 휴대폰 번호로 사용자 검색
    // where 조건을 사용하여 정확한 휴대폰 번호 매칭
    return await db.Manager.findOne({ where: { managerPhoneNumber } });
  } catch (error) {
    // 휴대폰 번호로 사용자 검색 중 오류 발생 시 로그 기록
    // 🔴 이모지를 사용하여 중요한 오류임을 시각적으로 표시
    console.error('🔴 휴대폰으로 아이디 찾기 DAO 오류:', error.message);

    // 원본 오류를 그대로 전달하여 상위 레벨에서 적절한 오류 처리 가능
    throw error;
  }
};
