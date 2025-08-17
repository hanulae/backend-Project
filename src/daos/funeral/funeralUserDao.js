/**
 * 장례식장 사용자 관리 DAO (Data Access Object)
 * - 장례식장 회원가입 및 사용자 정보 관리를 위한 모든 데이터베이스 작업을 담당합니다.
 * - 장례식장 회원가입 처리, 사용자명 중복 확인, 사용자 정보 조회 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 약관 동의 정보 저장 및 프로필 정보 관리를 지원합니다.
 * - 트랜잭션을 통한 데이터 일관성 보장을 제공합니다.
 */
import db from '../../models/index.js';

/**
 * 새로운 장례식장 등록
 *
 * 입력:
 * - funeralData: Object — 등록할 장례식장 데이터
 *   - funeralUsername: string — 장례식장 사용자명 (로그인 ID)
 *   - funeralPassword: string — 장례식장 비밀번호 (해시된 값)
 *   - funeralName: string — 장례식장 상호명
 *   - funeralPhoneNumber: string — 장례식장 연락처
 *   - funeralAddress: string — 장례식장 주소
 * - transaction: Object — Sequelize 트랜잭션 객체
 *
 * 동작:
 * 1) 입력받은 장례식장 데이터로 새로운 레코드 생성
 * 2) 트랜잭션을 포함하여 데이터 일관성 보장
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 생성 정보:
 * - 장례식장 기본 정보 (사용자명, 비밀번호, 상호명, 연락처, 주소)
 * - 자동 생성: ID, createdAt, updatedAt
 * - 트랜잭션을 통한 안전한 데이터 저장
 *
 * 반환:
 * - Object: 생성된 장례식장 레코드
 *
 * 예외:
 * - DB 생성 실패: '장례식장 회원가입 DAO 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 장례식장 회원가입 시 호출됩니다.
 * - 트랜잭션을 지원하여 데이터 일관성을 보장합니다.
 * - 비밀번호는 이미 해시된 상태로 전달받아야 합니다.
 * - 사용자명은 고유해야 하며 중복 확인이 필요합니다.
 * - 회원가입 완료 후 약관 동의 정보도 함께 저장해야 합니다.
 * - 장례식장 정보는 공개적으로 노출될 수 있으므로 민감한 정보는 제외해야 합니다.
 */
export const insert = async (funeralData, transaction) => {
  try {
    const newFuneral = await db.Funeral.create(funeralData, { transaction });
    return newFuneral;
  } catch (error) {
    throw new Error('장례식장 회원가입 DAO 오류:' + error.message);
  }
};

/**
 * 사용자명으로 장례식장 조회
 *
 * 입력:
 * - funeralUsername: string — 조회할 장례식장의 사용자명
 *
 * 동작:
 * 1) 사용자명으로 장례식장 정보 조회
 * 2) 해당하는 사용자명이 없으면 null 반환
 * 3) 오류 발생 시 콘솔에 로그 출력 후 Error throw
 *
 * 조회 조건:
 * - funeralUsername: 입력받은 사용자명과 정확히 일치
 *
 * 반환:
 * - Object|null: 장례식장 정보 객체 또는 null (존재하지 않는 경우)
 *
 * 예외:
 * - DB 조회 실패: 콘솔에 오류 로그 출력 후 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 회원가입 시 사용자명 중복 확인에 사용됩니다.
 * - 로그인 시 사용자 인증에도 사용됩니다.
 * - 동일한 사용자명이 이미 존재하는지 확인할 수 있습니다.
 * - 사용자명은 대소문자를 구분합니다.
 * - 중복 확인 후 회원가입 진행 여부를 결정할 수 있습니다.
 * - 로그인 시에는 추가로 비밀번호 검증이 필요합니다.
 */
export const findByUsername = async (funeralUsername) => {
  try {
    return await db.Funeral.findOne({ where: { funeralUsername } });
  } catch (error) {
    console.error('🔴 아이디 중복 확인 DAO 오류:', error.message);
    throw error;
  }
};

/**
 * 장례식장 ID로 장례식장 정보 조회
 *
 * 입력:
 * - funeralId: number — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) 장례식장 ID로 상세 정보 조회
 * 2) 해당하는 ID가 없으면 null 반환
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - id: 입력받은 ID와 정확히 일치 (Primary Key)
 *
 * 반환:
 * - Object|null: 장례식장 정보 객체 또는 null (존재하지 않는 경우)
 *
 * 예외:
 * - DB 조회 실패: '🔴 프로필 DAO 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 장례식장의 고유 ID를 사용하여 상세 정보를 가져올 때 사용됩니다.
 * - 프로필 조회, 정보 수정 전 조회, 권한 확인 등에 사용됩니다.
 * - Primary Key를 사용하므로 빠른 조회가 가능합니다.
 * - 반환되는 정보에는 모든 장례식장 데이터가 포함됩니다.
 * - ID는 자동 생성되는 고유한 값입니다.
 * - 프로필 수정 시 이 함수로 기존 정보를 먼저 조회해야 합니다.
 */
export const findById = async (funeralId) => {
  try {
    return await db.Funeral.findByPk(funeralId);
  } catch (error) {
    throw new Error('🔴 프로필 DAO 오류:' + error.message);
  }
};

/**
 * 약관 동의 정보 저장
 *
 * 입력:
 * - termsData: Object — 저장할 약관 동의 데이터
 *   - funeralId: number — 약관에 동의한 장례식장의 고유 ID
 *   - privacyPolicy: boolean — 개인정보처리방침 동의 여부
 *   - termsOfService: boolean — 이용약관 동의 여부
 *   - marketingConsent: boolean — 마케팅 정보 수신 동의 여부
 *   - agreementDate: Date — 약관 동의 일시
 * - transaction: Object — Sequelize 트랜잭션 객체
 *
 * 동작:
 * 1) 약관 동의 데이터로 새로운 레코드 생성
 * 2) 트랜잭션을 포함하여 데이터 일관성 보장
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 생성 정보:
 * - 약관별 동의 여부 (개인정보처리방침, 이용약관, 마케팅 동의)
 * - 동의 일시 기록
 * - 장례식장과의 연관 관계
 * - 자동 생성: ID, createdAt, updatedAt
 *
 * 반환:
 * - Object: 생성된 약관 동의 레코드
 *
 * 예외:
 * - DB 생성 실패: '약관 동의 정보 저장 DAO 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 장례식장 회원가입 시 필수 약관 동의 정보를 별도 테이블에 저장할 때 사용됩니다.
 * - 개인정보처리방침, 이용약관 등의 동의 여부와 동의 시간을 기록합니다.
 * - 트랜잭션을 지원하여 데이터 일관성을 보장합니다.
 * - 약관 동의는 회원가입의 필수 조건입니다.
 * - 동의 일시는 정확한 기록을 위해 자동으로 설정됩니다.
 * - 마케팅 동의는 선택사항이므로 false로 설정 가능합니다.
 */
export const createTermsAgreement = async (termsData, transaction) => {
  try {
    const newTermsAgreement = await db.TermsAgreement.create(termsData, { transaction });
    return newTermsAgreement;
  } catch (error) {
    throw new Error('약관 동의 정보 저장 DAO 오류:' + error.message);
  }
};

/**
 * 전화번호로 장례식장 조회
 *
 * 입력:
 * - funeralPhoneNumber: string — 조회할 장례식장의 전화번호
 *
 * 동작:
 * 1) 전화번호로 장례식장 정보 조회
 * 2) 해당하는 전화번호가 없으면 null 반환
 * 3) 오류 발생 시 콘솔에 로그 출력 후 Error throw
 *
 * 조회 조건:
 * - funeralPhoneNumber: 입력받은 전화번호와 정확히 일치
 *
 * 반환:
 * - Object|null: 장례식장 정보 객체 또는 null (존재하지 않는 경우)
 *
 * 예외:
 * - DB 조회 실패: 콘솔에 오류 로그 출력 후 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 아이디 찾기 기능에서 사용됩니다.
 * - 사용자가 가입 시 등록한 전화번호로 해당하는 장례식장 계정을 찾을 수 있습니다.
 * - 전화번호는 고유해야 하며 중복 확인이 필요합니다.
 * - 아이디 찾기 후 SMS로 사용자명을 전송하는 로직과 연동됩니다.
 * - 전화번호 형식 검증이 필요합니다.
 * - 개인정보 보호를 위해 전화번호 마스킹 처리가 필요할 수 있습니다.
 */
export const findByPhone = async (funeralPhoneNumber) => {
  try {
    return await db.Funeral.findOne({ where: { funeralPhoneNumber } });
  } catch (error) {
    console.error('🔴 휴대폰으로 아이디 찾기 DAO 오류:', error.message);
    throw error;
  }
};
