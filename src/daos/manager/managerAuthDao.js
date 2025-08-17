/**
 * 매니저(팀장) 인증 관리 DAO (Data Access Object)
 * - 매니저 계정의 인증 및 계정 관리를 위한 모든 데이터베이스 작업을 담당합니다.
 * - 매니저 계정 조회, 비밀번호 관리, 연락처 정보 업데이트 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - bcrypt를 사용한 비밀번호 해싱으로 보안을 강화합니다.
 * - 은행 계좌 정보 관리 및 연락처 정보 업데이트를 지원합니다.
 */
import db from '../../models/index.js';
import bcrypt from 'bcrypt';

/**
 * 사용자명으로 매니저 조회
 *
 * 입력:
 * - managerUsername: string — 조회할 매니저의 사용자명 (로그인 ID)
 *
 * 동작:
 * 1) 사용자명으로 매니저 정보 조회
 * 2) 해당하는 사용자명이 없으면 null 반환
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - managerUsername: 입력받은 사용자명과 정확히 일치
 *
 * 반환:
 * - Object|null: 매니저 정보 객체 또는 null (존재하지 않는 경우)
 *
 * 예외:
 * - DB 조회 실패: '데이터베이스 조회 중 오류가 발생했습니다.' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 로그인 시 사용자 인증이나 사용자명 중복 확인에 사용됩니다.
 * - 매니저의 전체 정보를 반환하여 로그인 후 세션 관리에 활용할 수 있습니다.
 * - 사용자명은 고유해야 하며 중복 확인이 필요합니다.
 * - 로그인 시에는 추가로 비밀번호 검증이 필요합니다.
 * - 반환되는 정보에는 민감한 정보가 포함될 수 있으므로 주의가 필요합니다.
 */
export const findManagerByUsername = async (managerUsername) => {
  try {
    const manager = await db.Manager.findOne({ where: { managerUsername } });
    return manager;
  } catch (error) {
    throw new Error('데이터베이스 조회 중 오류가 발생했습니다.');
  }
};

/**
 * 이름과 전화번호로 매니저 조회
 *
 * 입력:
 * - name: string — 매니저의 실명
 * - phoneNumber: string — 매니저의 전화번호
 *
 * 동작:
 * 1) 이름과 전화번호가 모두 일치하는 매니저 계정 조회
 * 2) 해당하는 정보가 없으면 null 반환
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - managerName: 입력받은 이름과 정확히 일치
 * - managerPhoneNumber: 입력받은 전화번호와 정확히 일치
 *
 * 반환:
 * - Object|null: 매니저 정보 객체 또는 null (존재하지 않는 경우)
 *
 * 예외:
 * - DB 조회 실패: '🔴 findByNameAndPhone 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 아이디 찾기나 계정 확인 시 사용됩니다.
 * - 보안을 위해 두 정보를 모두 확인합니다.
 * - 이름과 전화번호가 모두 일치해야 계정을 찾을 수 있습니다.
 * - 아이디 찾기 후 SMS로 사용자명을 전송하는 로직과 연동됩니다.
 * - 개인정보 보호를 위해 전화번호 마스킹 처리가 필요할 수 있습니다.
 */
export const findByNameAndPhone = async (name, phoneNumber) => {
  try {
    return await db.Manager.findOne({
      where: {
        managerName: name,
        managerPhoneNumber: phoneNumber,
      },
    });
  } catch (error) {
    throw new Error('🔴 findByNameAndPhone 오류:' + error.message);
  }
};

/**
 * 전화번호로 매니저 조회
 *
 * 입력:
 * - managerPhoneNumber: string — 조회할 매니저의 전화번호
 *
 * 동작:
 * 1) 전화번호로 매니저 계정 조회
 * 2) 해당하는 전화번호가 없으면 null 반환
 * 3) 보안을 위해 사용자명과 비밀번호만 반환
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - managerPhoneNumber: 입력받은 전화번호와 정확히 일치
 *
 * 반환 속성:
 * - managerUsername: 사용자명
 * - managerPassword: 비밀번호 (해시된 값)
 *
 * 반환:
 * - Object|null: 매니저 정보 객체 (사용자명, 비밀번호만 포함) 또는 null
 *
 * 예외:
 * - DB 조회 실패: '휴대폰으로 아이디 찾기 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 아이디 찾기 기능에서 사용됩니다.
 * - 보안을 위해 사용자명과 비밀번호만 반환합니다.
 * - 전화번호는 고유해야 하며 중복 확인이 필요합니다.
 * - 아이디 찾기 후 SMS로 사용자명을 전송하는 로직과 연동됩니다.
 * - 전화번호 형식 검증이 필요합니다.
 * - 개인정보 보호를 위해 전화번호 마스킹 처리가 필요할 수 있습니다.
 */
export const findByPhone = async (managerPhoneNumber) => {
  try {
    return await db.Manager.findOne({
      where: { managerPhoneNumber: managerPhoneNumber },
      attributes: ['managerUsername', 'managerPassword'], // 보안을 위해 필요한 정보만 반환
    });
  } catch (error) {
    throw new Error('휴대폰으로 아이디 찾기 오류:' + error.message);
  }
};

/**
 * 매니저 ID로 매니저 정보 조회
 *
 * 입력:
 * - managerId: number — 조회할 매니저의 고유 ID
 *
 * 동작:
 * 1) 매니저 ID로 상세 정보 조회
 * 2) 해당하는 ID가 없으면 null 반환
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - managerId: 입력받은 ID와 정확히 일치 (Primary Key)
 *
 * 반환:
 * - Object|null: 매니저 정보 객체 또는 null (존재하지 않는 경우)
 *
 * 예외:
 * - DB 조회 실패: '🔴 findById 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 매니저의 고유 ID를 사용하여 상세 정보를 가져올 때 사용됩니다.
 * - 프로필 조회, 정보 수정 전 조회, 권한 확인 등에 사용됩니다.
 * - Primary Key를 사용하므로 빠른 조회가 가능합니다.
 * - 반환되는 정보에는 모든 매니저 데이터가 포함됩니다.
 * - ID는 자동 생성되는 고유한 값입니다.
 * - 프로필 수정 시 이 함수로 기존 정보를 먼저 조회해야 합니다.
 */
export const findById = async (managerId) => {
  try {
    return await db.Manager.findByPk(managerId);
  } catch (error) {
    throw new Error('🔴 findById 오류:' + error.message);
  }
};

/**
 * 매니저 비밀번호 업데이트
 *
 * 입력:
 * - managerId: number — 비밀번호를 변경할 매니저의 고유 ID
 * - newPassword: string — 새로운 평문 비밀번호
 *
 * 동작:
 * 1) 새로운 비밀번호를 bcrypt로 해싱 (솔트 라운드 10)
 * 2) 해시된 비밀번호로 데이터베이스 업데이트
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 보안 처리:
 * - bcrypt 해싱 알고리즘 사용
 * - 솔트 라운드 10으로 보안 강화
 * - 평문 비밀번호는 저장하지 않음
 *
 * 반환:
 * - Array: 업데이트된 레코드 수와 업데이트된 레코드 ID 배열
 *
 * 예외:
 * - 비밀번호 해싱 실패: '비밀번호 업데이트 실패: {오류메시지}' 형태로 Error throw
 * - DB 업데이트 실패: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 비밀번호 변경 기능에서 사용됩니다.
 * - 보안을 위해 평문 비밀번호는 저장하지 않습니다.
 * - bcrypt는 단방향 해싱으로 원본 비밀번호 복구가 불가능합니다.
 * - 솔트 라운드 10은 보안과 성능의 균형을 맞춘 설정입니다.
 * - 비밀번호 변경 후 로그인 시 새로운 비밀번호로 인증해야 합니다.
 * - 정기적인 비밀번호 변경을 권장합니다.
 */
export const updatePassword = async (managerId, newPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10); // 솔트 라운드 10으로 해싱
    return await db.Manager.update({ managerPassword: hashedPassword }, { where: { managerId } });
  } catch (error) {
    throw new Error('비밀번호 업데이트 실패: ' + error.message);
  }
};

/**
 * 전화번호로 매니저 비밀번호 재설정
 *
 * 입력:
 * - cleanedPhoneNumber: string — 정리된 전화번호 (하이픈 제거 등)
 * - newPassword: string — 새로운 평문 비밀번호
 *
 * 동작:
 * 1) 새로운 비밀번호를 bcrypt로 해싱 (솔트 라운드 10)
 * 2) 전화번호로 해당 매니저를 찾아 비밀번호 업데이트
 * 3) 콘솔에 입력값 로그 출력 (디버깅용)
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 보안 처리:
 * - bcrypt 해싱 알고리즘 사용
 * - 솔트 라운드 10으로 보안 강화
 * - 평문 비밀번호는 저장하지 않음
 *
 * 반환:
 * - Array: 업데이트된 레코드 수와 업데이트된 레코드 ID 배열
 *
 * 예외:
 * - 비밀번호 해싱 실패: '비밀번호 업데이트 실패: {오류메시지}' 형태로 Error throw
 * - DB 업데이트 실패: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 비밀번호 분실 시 전화번호 인증 후 새로운 비밀번호로 재설정하는 기능입니다.
 * - 전화번호로 매니저를 식별하므로 전화번호 형식이 정확해야 합니다.
 * - 비밀번호 변경 완료 후 SMS로 알림을 전송하는 것이 좋습니다.
 * - 보안을 위해 평문 비밀번호는 저장하지 않습니다.
 * - 정기적인 비밀번호 변경을 권장합니다.
 * - 디버깅을 위한 로그가 콘솔에 출력됩니다.
 */
export const lostUpdatePassword = async (cleanedPhoneNumber, newPassword) => {
  console.log(
    '🚀 ~ lostUpdatePassword ~ cleanedPhoneNumber, newPassword:',
    cleanedPhoneNumber,
    newPassword,
  );
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10); // 솔트 라운드 10으로 해싱
    return await db.Manager.update(
      { managerPassword: hashedPassword },
      { where: { managerPhoneNumber: cleanedPhoneNumber } },
    );
  } catch (error) {
    throw new Error('비밀번호 업데이트 실패: ' + error.message);
  }
};

/**
 * 매니저 전화번호 업데이트
 *
 * 입력:
 * - managerId: number — 전화번호를 변경할 매니저의 고유 ID
 * - newPhoneNumber: string — 새로운 전화번호
 *
 * 동작:
 * 1) 매니저 ID로 해당 매니저를 찾아 전화번호 업데이트
 * 2) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 업데이트 조건:
 * - managerId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Array: 업데이트된 레코드 수와 업데이트된 레코드 ID 배열
 *
 * 예외:
 * - DB 업데이트 실패: '🔴 updatePhoneNumber 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 연락처 변경 기능에서 사용됩니다.
 * - 변경 전 중복 확인이 필요할 수 있습니다.
 * - 전화번호는 고유해야 하며 다른 매니저와 중복되지 않아야 합니다.
 * - 전화번호 형식 검증이 필요합니다.
 * - 변경 완료 후 SMS로 알림을 전송하는 것이 좋습니다.
 * - 개인정보 보호를 위해 전화번호 마스킹 처리가 필요할 수 있습니다.
 */
export const updatePhoneNumber = async (managerId, newPhoneNumber) => {
  try {
    return await db.Manager.update(
      { managerPhoneNumber: newPhoneNumber },
      { where: { managerId } },
    );
  } catch (error) {
    throw new Error('🔴 updatePhoneNumber 오류:' + error.message);
  }
};

/**
 * 매니저 은행 계좌 정보 업데이트
 *
 * 입력:
 * - managerId: number — 은행 정보를 업데이트할 매니저의 고유 ID
 * - managerBankName: string — 은행명 (예: '신한은행', 'KB국민은행')
 * - managerBankNumber: string — 계좌번호
 * - managerBankHolder: string — 예금주명
 *
 * 동작:
 * 1) 매니저 ID로 해당 매니저를 찾아 은행 정보 업데이트
 * 2) 은행명, 계좌번호, 예금주명을 한 번에 업데이트
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 업데이트 조건:
 * - managerId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Array: 업데이트된 레코드 수와 업데이트된 레코드 ID 배열
 *
 * 예외:
 * - DB 업데이트 실패: '🔴 계좌 정보 업데이트 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 정산을 위한 은행 계좌 정보를 등록하거나 수정할 때 사용됩니다.
 * - 은행명, 계좌번호, 예금주명을 한 번에 업데이트합니다.
 * - 계좌번호는 고유해야 하며 다른 매니저와 중복되지 않아야 합니다.
 * - 은행명은 표준화된 형식으로 입력하는 것이 좋습니다.
 * - 예금주명은 매니저의 실명과 일치해야 합니다.
 * - 정산 시 이 정보를 사용하여 계좌 이체를 진행합니다.
 */
export const updateBankInfo = async (
  managerId,
  managerBankName,
  managerBankNumber,
  managerBankHolder,
) => {
  try {
    return await db.Manager.update(
      {
        managerBankName,
        managerBankNumber,
        managerBankHolder,
      },
      { where: { managerId } },
    );
  } catch (error) {
    throw new Error('🔴 계좌 정보 업데이트 오류:' + error.message);
  }
};
