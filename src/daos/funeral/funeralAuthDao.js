/**
 * 장례식장 인증 및 사용자 정보 관리 DAO (Data Access Object)
 * - 장례식장 사용자의 인증, 계정 정보 관리, 보안 관련 데이터베이스 작업을 담당합니다.
 * - 이메일, 사용자명, ID, 전화번호를 통한 사용자 조회 기능을 제공합니다.
 * - 비밀번호 변경, 전화번호 업데이트, 계좌 정보 관리 등의 기능을 지원합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - bcrypt를 사용한 비밀번호 해싱을 통해 보안을 강화합니다.
 * - 이모지를 사용하여 로그 메시지를 시각적으로 구분하여 디버깅을 용이하게 합니다.
 * - 포인트 및 캐시 시스템을 통한 장례식장의 재정적 상태를 관리합니다.
 */
import db from '../../models/index.js';
import bcrypt from 'bcrypt';

/**
 * 이메일 주소로 장례식장 사용자 조회
 *
 * 입력:
 * - email: string — 조회할 장례식장 사용자의 이메일 주소
 *
 * 동작:
 * 1) funeralEmail 필드가 입력받은 email과 일치하는 장례식장 사용자 조회
 * 2) findOne을 사용하여 단일 사용자 레코드 반환
 * 3) 오류 발생 시 이모지와 함께 상세한 오류 메시지 전달
 *
 * 조회 조건:
 * - funeralEmail: 입력받은 이메일 주소와 정확히 일치
 *
 * 반환:
 * - Object: 장례식장 사용자 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '🔴 findByEmail 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 로그인 시 이메일 인증이나 사용자 식별에 사용됩니다.
 * - 반환값이 null인 경우 해당 이메일의 사용자가 존재하지 않음을 의미합니다.
 * - 이메일 주소는 고유해야 하므로 중복 가입을 방지할 수 있습니다.
 * - 🔴 이모지를 통해 인증 관련 오류를 시각적으로 구분할 수 있습니다.
 */
export const findByEmail = async (email) => {
  try {
    return await db.Funeral.findOne({ where: { funeralEmail: email } });
  } catch (error) {
    throw new Error('🔴 findByEmail 오류:' + error);
  }
};

/**
 * 사용자명으로 장례식장 사용자 조회
 *
 * 입력:
 * - funeralUsername: string — 조회할 장례식장 사용자의 사용자명
 *
 * 동작:
 * 1) funeralUsername 필드가 입력받은 사용자명과 일치하는 장례식장 사용자 조회
 * 2) findOne을 사용하여 단일 사용자 레코드 반환
 * 3) 오류 발생 시 일반적인 데이터베이스 오류 메시지 전달
 *
 * 조회 조건:
 * - funeralUsername: 입력받은 사용자명과 정확히 일치
 *
 * 반환:
 * - Object: 장례식장 사용자 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '데이터베이스 조회 중 오류가 발생했습니다.' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 로그인 시 사용자명 인증이나 사용자 식별에 사용됩니다.
 * - 반환값이 null인 경우 해당 사용자명의 사용자가 존재하지 않음을 의미합니다.
 * - 사용자명은 고유해야 하므로 중복 가입을 방지할 수 있습니다.
 * - 함수명에 'Manager'가 포함되어 있지만 실제로는 장례식장 사용자를 조회합니다.
 */
export const findManagerByUsername = async (funeralUsername) => {
  try {
    const funeral = await db.Funeral.findOne({ where: { funeralUsername } });
    return funeral;
  } catch (error) {
    throw new Error('데이터베이스 조회 중 오류가 발생했습니다.');
  }
};

/**
 * ID로 장례식장 사용자 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장 사용자의 고유 ID
 *
 * 동작:
 * 1) funeralId로 특정 장례식장 사용자 조회
 * 2) findByPk를 사용하여 기본 키 기반 빠른 조회
 * 3) 오류 발생 시 이모지와 함께 상세한 오류 메시지 전달
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Object: 장례식장 사용자 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '🔴 findById 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 사용자 인증 후 세션에서 사용자 정보를 조회할 때 사용됩니다.
 * - findByPk를 사용하여 빠른 조회 성능을 제공합니다.
 * - 반환값이 null인 경우 해당 ID의 사용자가 존재하지 않음을 의미합니다.
 * - 🔴 이모지를 통해 인증 관련 오류를 시각적으로 구분할 수 있습니다.
 * - 사용자의 모든 정보에 접근할 수 있어 프로필 관리에 활용됩니다.
 */
export const findById = async (funeralId) => {
  try {
    return await db.Funeral.findByPk(funeralId);
  } catch (error) {
    throw new Error('🔴 findById 오류:' + error.message);
  }
};

/**
 * 사용자 정보로 장례식장 사용자 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장 사용자의 고유 ID
 *
 * 동작:
 * 1) funeralId로 특정 장례식장 사용자 조회
 * 2) findOne을 사용하여 단일 사용자 레코드 반환
 * 3) 오류 발생 시 이모지와 함께 상세한 오류 메시지 전달
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Object: 장례식장 사용자 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '🔴 findByUserInfo 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 사용자 프로필 정보를 조회할 때 사용됩니다.
 * - findById와 유사하지만 findOne을 사용하여 조회합니다.
 * - 반환값이 null인 경우 해당 ID의 사용자가 존재하지 않음을 의미합니다.
 * - 🔴 이모지를 통해 인증 관련 오류를 시각적으로 구분할 수 있습니다.
 * - 사용자의 모든 정보에 접근할 수 있어 상세한 프로필 관리에 활용됩니다.
 */
export const findByUserInfo = async (funeralId) => {
  try {
    return await db.Funeral.findOne({ where: { funeralId } });
  } catch (error) {
    throw new Error('🔴 findByUserInfo 오류:' + error.message);
  }
};

/**
 * 장례식장 사용자 비밀번호 업데이트
 *
 * 입력:
 * - funeralId: string — 비밀번호를 변경할 장례식장 사용자의 고유 ID
 * - newPassword: string — 새로운 비밀번호 (해시되지 않은 평문)
 *
 * 동작:
 * 1) funeralId로 사용자 존재 여부 확인
 * 2) 사용자가 존재하지 않으면 오류 발생
 * 3) 새로운 비밀번호로 업데이트
 * 4) 변경된 사용자 정보 반환
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Object: 업데이트된 장례식장 사용자 정보
 *
 * 예외:
 * - 사용자 없음: '사용자를 찾을 수 없습니다.' 형태로 Error throw
 * - DB 업데이트 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 사용자가 비밀번호를 변경할 때 사용됩니다.
 * - 새로운 비밀번호는 해시되지 않은 평문 상태로 전달됩니다.
 * - 사용자 존재 여부를 먼저 확인하여 안전한 업데이트를 보장합니다.
 * - 업데이트된 사용자 정보를 반환하여 변경 사항을 확인할 수 있습니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 */
export const updatePassword = async (funeralId, newPassword) => {
  try {
    const funeral = await db.Funeral.findByPk(funeralId);
    if (!funeral) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    funeral.funeralPassword = newPassword;
    await funeral.save();

    return funeral;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * 전화번호로 비밀번호 재설정 (분실 시)
 *
 * 입력:
 * - cleanedPhoneNumber: string — 정리된 전화번호 (하이픈 제거 등)
 * - newPassword: string — 새로운 비밀번호 (평문)
 *
 * 동작:
 * 1) 새로운 비밀번호를 bcrypt로 해싱 (salt rounds: 10)
 * 2) 전화번호가 일치하는 사용자의 비밀번호를 해시된 값으로 업데이트
 * 3) 업데이트 과정을 로그로 출력
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralPhoneNumber: 입력받은 정리된 전화번호와 정확히 일치
 *
 * 보안:
 * - bcrypt를 사용한 비밀번호 해싱 (salt rounds: 10)
 * - 평문 비밀번호를 데이터베이스에 저장하지 않음
 *
 * 반환:
 * - Array: Sequelize update 결과 배열 [업데이트된 행 수, 업데이트된 행들]
 *
 * 예외:
 * - DB 업데이트 실패: '비밀번호 업데이트 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 사용자가 비밀번호를 분실했을 때 전화번호 인증을 통해 재설정할 때 사용됩니다.
 * - 🚀 이모지를 통해 비밀번호 재설정 과정을 시각적으로 구분할 수 있습니다.
 * - 전화번호는 정리된 상태(하이픈 제거 등)로 전달되어야 합니다.
 * - bcrypt 해싱을 통해 보안을 강화합니다.
 * - 반환값의 첫 번째 요소는 업데이트된 행의 수를 나타냅니다.
 * - 전화번호가 일치하는 사용자가 없으면 업데이트된 행 수가 0이 됩니다.
 */
export const lostUpdatePassword = async (cleanedPhoneNumber, newPassword) => {
  console.log(
    '🚀 ~ lostUpdatePassword ~ cleanedPhoneNumber, newPassword:',
    cleanedPhoneNumber,
    newPassword,
  );
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return await db.Funeral.update(
      { funeralPassword: hashedPassword },
      { where: { funeralPhoneNumber: cleanedPhoneNumber } },
    );
  } catch (error) {
    throw new Error('비밀번호 업데이트 실패: ' + error.message);
  }
};

/**
 * 장례식장 사용자 전화번호 업데이트 (returning 옵션 포함)
 *
 * 입력:
 * - funeralId: string — 전화번호를 변경할 장례식장 사용자의 고유 ID
 * - newPhone: string — 새로운 전화번호
 *
 * 동작:
 * 1) funeralId로 특정 사용자의 전화번호를 새로운 번호로 업데이트
 * 2) returning: true 옵션으로 업데이트된 행 정보 반환
 * 3) 오류 발생 시 원본 오류를 그대로 전파
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Array: Sequelize update 결과 배열 [업데이트된 행 수, 업데이트된 행들]
 *
 * 예외:
 * - DB 업데이트 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 사용자가 전화번호를 변경할 때 사용됩니다.
 * - returning: true 옵션으로 업데이트된 행의 정보를 반환합니다.
 * - 반환값의 첫 번째 요소는 업데이트된 행의 수를 나타냅니다.
 * - 전화번호 변경 시 사용자 인증이나 연락처 업데이트에 활용됩니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 */
export const updatePhone = async (funeralId, newPhone) => {
  try {
    return await db.Funeral.update(
      { funeralPhoneNumber: newPhone },
      { where: { funeralId }, returning: true },
    );
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * 장례식장 사용자 전화번호 업데이트 (기본 옵션)
 *
 * 입력:
 * - funeralId: string — 전화번호를 변경할 장례식장 사용자의 고유 ID
 * - newPhoneNumber: string — 새로운 전화번호
 *
 * 동작:
 * 1) funeralId로 특정 사용자의 전화번호를 새로운 번호로 업데이트
 * 2) 기본 update 옵션 사용
 * 3) 오류 발생 시 이모지와 함께 상세한 오류 메시지 전달
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Array: Sequelize update 결과 배열 [업데이트된 행 수]
 *
 * 예외:
 * - DB 업데이트 실패: '🔴 updatePhoneNumber 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 사용자가 전화번호를 변경할 때 사용됩니다.
 * - updatePhone과 유사하지만 returning 옵션이 없습니다.
 * - 🔴 이모지를 통해 전화번호 업데이트 관련 오류를 시각적으로 구분할 수 있습니다.
 * - 반환값의 첫 번째 요소는 업데이트된 행의 수를 나타냅니다.
 * - 전화번호 변경 시 사용자 인증이나 연락처 업데이트에 활용됩니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 */
export const updatePhoneNumber = async (funeralId, newPhoneNumber) => {
  try {
    return await db.Funeral.update(
      { funeralPhoneNumber: newPhoneNumber },
      { where: { funeralId } },
    );
  } catch (error) {
    throw new Error('🔴 updatePhoneNumber 오류:' + error.message);
  }
};

/**
 * 장례식장 사용자 계좌 정보 업데이트 (returning 옵션 포함)
 *
 * 입력:
 * - funeralId: string — 계좌 정보를 변경할 장례식장 사용자의 고유 ID
 * - bankName: string — 새로운 은행명
 * - bankNumber: string — 새로운 계좌번호
 *
 * 동작:
 * 1) funeralId로 특정 사용자의 은행명과 계좌번호를 업데이트
 * 2) returning: true 옵션으로 업데이트된 행 정보 반환
 * 3) 오류 발생 시 원본 오류를 그대로 전파
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Array: Sequelize update 결과 배열 [업데이트된 행 수, 업데이트된 행들]
 *
 * 예외:
 * - DB 업데이트 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 사용자가 은행 계좌 정보를 변경할 때 사용됩니다.
 * - returning: true 옵션으로 업데이트된 행의 정보를 반환합니다.
 * - 반환값의 첫 번째 요소는 업데이트된 행의 수를 나타냅니다.
 * - 계좌 정보 변경 시 결제나 환불 처리에 활용됩니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 */
export const updateAccount = async (funeralId, bankName, bankNumber) => {
  try {
    return await db.Funeral.update(
      { funeralBankName: bankName, funeralBankNumber: bankNumber },
      { where: { funeralId }, returning: true },
    );
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * 장례식장 사용자 계좌 정보 업데이트 (예금주 포함)
 *
 * 입력:
 * - funeralId: string — 계좌 정보를 변경할 장례식장 사용자의 고유 ID
 * - funeralBankName: string — 새로운 은행명
 * - funeralBankNumber: string — 새로운 계좌번호
 * - funeralBacnkHolder: string — 새로운 예금주명 (오타 주의: 'Bacnk')
 *
 * 동작:
 * 1) funeralId로 특정 사용자의 은행명, 계좌번호, 예금주명을 업데이트
 * 2) 기본 update 옵션 사용
 * 3) 오류 발생 시 이모지와 함께 상세한 오류 메시지 전달
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Array: Sequelize update 결과 배열 [업데이트된 행 수]
 *
 * 예외:
 * - DB 업데이트 실패: '🔴 계좌 정보 업데이트 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 사용자가 은행 계좌 정보를 변경할 때 사용됩니다.
 * - updateAccount와 달리 예금주명도 함께 업데이트합니다.
 * - 🔴 이모지를 통해 계좌 정보 업데이트 관련 오류를 시각적으로 구분할 수 있습니다.
 * - 반환값의 첫 번째 요소는 업데이트된 행의 수를 나타냅니다.
 * - 계좌 정보 변경 시 결제나 환불 처리에 활용됩니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 * - 매개변수명에 오타가 있으므로 주의가 필요합니다 (funeralBacnkHolder).
 */
export const updateBankInfo = async (
  funeralId,
  funeralBankName,
  funeralBankNumber,
  funeralBacnkHolder,
) => {
  try {
    return await db.Funeral.update(
      {
        funeralBankName,
        funeralBankNumber,
        funeralBacnkHolder,
      },
      { where: { funeralId } },
    );
  } catch (error) {
    throw new Error('🔴 계좌 정보 업데이트 오류:' + error.message);
  }
};

/**
 * 전화번호로 장례식장 사용자 ID 및 비밀번호 조회
 *
 * 입력:
 * - funeralPhoneNumber: string — 조회할 장례식장 사용자의 전화번호
 *
 * 동작:
 * 1) funeralPhoneNumber 필드가 입력받은 전화번호와 일치하는 사용자 조회
 * 2) 필요한 속성만 선택하여 반환 (보안 강화)
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralPhoneNumber: 입력받은 전화번호와 정확히 일치
 *
 * 반환 속성:
 * - funeralUsername: 사용자명
 * - funeralPassword: 비밀번호 (해시된 상태)
 *
 * 반환:
 * - Object: 사용자명과 비밀번호 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '휴대폰으로 아이디 찾기 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 사용자가 아이디를 분실했을 때 전화번호로 찾을 때 사용됩니다.
 * - 필요한 속성만 반환하여 보안을 강화합니다.
 * - 반환값이 null인 경우 해당 전화번호의 사용자가 존재하지 않음을 의미합니다.
 * - 비밀번호는 해시된 상태로 반환되므로 보안에 안전합니다.
 * - 아이디 찾기 기능의 핵심 함수로 활용됩니다.
 */
export const findByPhone = async (funeralPhoneNumber) => {
  try {
    return await db.Funeral.findOne({
      where: { funeralPhoneNumber: funeralPhoneNumber },
      attributes: ['funeralUsername', 'funeralPassword'],
    });
  } catch (error) {
    throw new Error('휴대폰으로 아이디 찾기 오류:' + error.message);
  }
};

/**
 * 장례식장 사용자 전화번호 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장 사용자의 고유 ID
 *
 * 동작:
 * 1) funeralId로 특정 사용자의 전화번호만 조회
 * 2) 필요한 속성만 선택하여 반환 (성능 최적화)
 * 3) 오류 발생 시 원본 오류를 그대로 전파
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환 속성:
 * - funeralPhoneNumber: 전화번호
 *
 * 반환:
 * - Object: 전화번호 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 사용자의 전화번호만 필요한 경우에 사용됩니다.
 * - 필요한 속성만 반환하여 네트워크 트래픽과 메모리 사용량을 줄입니다.
 * - 반환값이 null인 경우 해당 ID의 사용자가 존재하지 않음을 의미합니다.
 * - 전화번호 인증이나 연락처 확인에 활용됩니다.
 * - 성능 최적화를 위해 최소한의 데이터만 조회합니다.
 */
export const getFuneralPhoneNumber = async (funeralId) => {
  return await db.Funeral.findOne({
    where: { funeralId },
    attributes: ['funeralPhoneNumber'],
  });
};

/**
 * 장례식장 포인트 및 캐시 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장 사용자의 고유 ID
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) funeralId로 특정 사용자의 포인트와 캐시 정보만 조회
 * 2) 필요한 속성만 선택하여 반환 (성능 최적화)
 * 3) 트랜잭션 옵션을 포함하여 데이터 일관성 보장
 * 4) 오류 발생 시 원본 오류를 그대로 전파
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환 속성:
 * - funeralPoint: 포인트 잔액
 * - funeralCash: 캐시 잔액
 *
 * 반환:
 * - Object: 포인트 및 캐시 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 사용자의 포인트와 캐시 잔액을 확인할 때 사용됩니다.
 * - 필요한 속성만 반환하여 성능을 최적화합니다.
 * - 트랜잭션 옵션을 통해 데이터 일관성을 보장할 수 있습니다.
 * - 반환값이 null인 경우 해당 ID의 사용자가 존재하지 않음을 의미합니다.
 * - 포인트와 캐시는 별도로 관리되는 재정적 자원입니다.
 * - 잔액 확인, 결제 처리, 포인트 적립 등에 활용됩니다.
 */
export const getFuneralPointAndCash = async (funeralId, options = {}) => {
  return await db.Funeral.findOne({
    where: { funeralId: funeralId },
    attributes: ['funeralPoint', 'funeralCash'],
    ...options,
  });
};

/**
 * 장례식장 포인트 및 캐시 업데이트
 *
 * 입력:
 * - funeralId: string — 업데이트할 장례식장 사용자의 고유 ID
 * - updatePoint: number — 새로운 포인트 값
 * - updateCash: number — 새로운 캐시 값
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) funeralId로 특정 사용자의 포인트와 캐시를 새로운 값으로 업데이트
 * 2) 트랜잭션 옵션을 포함하여 데이터 일관성 보장
 * 3) 오류 발생 시 원본 오류를 그대로 전파
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Array: Sequelize update 결과 배열 [업데이트된 행 수]
 *
 * 예외:
 * - DB 업데이트 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 사용자의 포인트와 캐시 잔액을 변경할 때 사용됩니다.
 * - 트랜잭션 옵션을 통해 데이터 일관성을 보장할 수 있습니다.
 * - 반환값의 첫 번째 요소는 업데이트된 행의 수를 나타냅니다.
 * - 포인트 적립, 차감, 캐시 충전, 사용 등에 활용됩니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 * - 재정적 거래의 정확성을 위해 트랜잭션 사용을 권장합니다.
 */
export const updateFuneralPointAndCash = async (
  funeralId,
  updatePoint,
  updateCash,
  options = {},
) => {
  return await db.Funeral.update(
    { funeralPoint: updatePoint, funeralCash: updateCash },
    { where: { funeralId: funeralId }, ...options },
  );
};
