/**
 * 장례식장 직원 관리 DAO (Data Access Object)
 * - 장례식장 직원의 모든 데이터베이스 작업을 담당합니다.
 * - 직원 계정 생성, 수정, 삭제, 직원 정보 조회, 직원 권한 정보 조회, 직원 비밀번호 관리 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 장례식장별 직원 관리와 권한 기반 접근 제어를 지원합니다.
 * - 직원 인증 및 보안 관리를 위한 비밀번호 관리 기능을 제공합니다.
 */
import db from '../../models/index.js';

/**
 * 새로운 장례식장 직원 생성
 *
 * 입력:
 * - data: Object — 생성할 직원 데이터
 *   - funeralId: number — 장례식장 ID
 *   - funeralStaffUsername: string — 직원 사용자명
 *   - funeralStaffPhoneNumber: string — 직원 전화번호
 *   - funeralStaffPassword: string — 직원 비밀번호 (해시된 값)
 *   - 기타 필요한 필드들
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) 입력받은 직원 데이터로 새로운 직원 레코드 생성
 * 2) Sequelize 옵션을 포함하여 데이터 일관성 보장
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 생성 정보:
 * - 직원 기본 정보 (이름, 전화번호, 비밀번호 등)
 * - 장례식장과의 연관 관계
 * - 자동 생성: ID, createdAt, updatedAt
 *
 * 반환:
 * - Object: 생성된 직원 레코드
 *
 * 예외:
 * - DB 생성 실패: '직원 생성 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 장례식장에 새로운 직원을 등록할 때 사용됩니다.
 * - 직원의 기본 정보(이름, 전화번호, 비밀번호 등)를 데이터베이스에 저장합니다.
 * - Sequelize 옵션을 통해 데이터 일관성을 보장할 수 있습니다.
 * - 장례식장 ID를 통해 직원과 장례식장을 연결합니다.
 * - 직원 등록 후 권한 설정이 필요할 수 있습니다.
 */
export const create = async (data, options = {}) => {
  try {
    return await db.FuneralStaff.create(data, options);
  } catch (error) {
    throw new Error('직원 생성 오류: ' + error.message);
  }
};

/**
 * 기존 직원 정보 수정
 *
 * 입력:
 * - funeralStaffId: number — 수정할 직원의 고유 ID
 * - data: Object — 수정할 직원 데이터
 *   - funeralStaffUsername: string — 직원 사용자명
 *   - funeralStaffPhoneNumber: string — 직원 전화번호
 *   - 기타 수정할 필드들
 *
 * 동작:
 * 1) funeralStaffId로 특정 직원의 정보를 새로운 데이터로 업데이트
 * 2) 업데이트 성공 시 업데이트된 직원 정보를 다시 조회하여 반환
 * 3) 업데이트할 직원이 없으면 오류 발생
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralStaffId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Object: 수정된 직원 레코드 정보
 *
 * 예외:
 * - 직원 없음: '해당 직원이 존재하지 않습니다.' 형태로 Error throw
 * - DB 업데이트 실패: '직원 수정 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 직원의 정보를 업데이트할 때 사용됩니다.
 * - 업데이트 후 최신 정보를 반환하여 데이터 일관성을 보장합니다.
 * - 업데이트할 직원이 존재하지 않으면 명확한 오류 메시지를 제공합니다.
 * - 직원명, 전화번호 등의 변경에 활용됩니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 */
export const update = async (funeralStaffId, data) => {
  try {
    const [updatedCount] = await db.FuneralStaff.update(data, {
      where: { funeralStaffId },
    });

    if (updatedCount === 0) {
      throw new Error('해당 직원이 존재하지 않습니다.');
    }

    return await db.FuneralStaff.findByPk(funeralStaffId);
  } catch (error) {
    throw new Error('직원 수정 오류: ' + error.message);
  }
};

/**
 * 직원 삭제
 *
 * 입력:
 * - funeralStaffId: number — 삭제할 직원의 고유 ID
 *
 * 동작:
 * 1) funeralStaffId로 특정 직원을 데이터베이스에서 완전히 제거
 * 2) 삭제할 직원이 존재하지 않으면 오류 발생
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralStaffId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - number: 삭제된 레코드 수
 *
 * 예외:
 * - 직원 없음: '삭제할 직원이 존재하지 않습니다.' 형태로 Error throw
 * - DB 삭제 실패: '직원 삭제 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 지정된 ID의 직원을 데이터베이스에서 완전히 제거할 때 사용됩니다.
 * - 삭제할 직원이 존재하지 않으면 명확한 오류 메시지를 제공합니다.
 * - 직원 삭제 시 관련된 권한 정보도 함께 정리해야 할 수 있습니다.
 * - 삭제는 되돌릴 수 없으므로 신중하게 사용해야 합니다.
 * - 직원 계정 비활성화를 고려해볼 수 있습니다.
 */
export const remove = async (funeralStaffId) => {
  try {
    const deleted = await db.FuneralStaff.destroy({
      where: { funeralStaffId },
    });
    if (!deleted) throw new Error('삭제할 직원이 존재하지 않습니다.');
    return deleted;
  } catch (error) {
    throw new Error('직원 삭제 오류:' + error);
  }
};

/**
 * 특정 장례식장에 소속된 모든 직원 조회
 *
 * 입력:
 * - funeralId: number — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) funeralId로 특정 장례식장에 근무하는 모든 직원 목록 조회
 * 2) 생성일 기준 내림차순 정렬 (최근 등록된 직원 순)
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 정렬:
 * - createdAt DESC (최근 등록된 직원 순)
 *
 * 반환:
 * - Array<Object>: 해당 장례식장의 직원 목록 배열
 *
 * 예외:
 * - DB 조회 실패: '직원 목록 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 장례식장 ID로 해당 장례식장에 근무하는 모든 직원 목록을 가져올 때 사용됩니다.
 * - 최근 등록된 직원부터 표시되어 최근 활동을 우선적으로 확인할 수 있습니다.
 * - 반환값이 빈 배열인 경우 해당 장례식장에 소속된 직원이 없음을 의미합니다.
 * - 직원 관리, 권한 설정, 인사 관리 등에 활용됩니다.
 * - 장례식장별 직원 현황 파악에 필수적인 기능입니다.
 */
export const findByFuneralStaff = async (funeralId) => {
  try {
    return await db.FuneralStaff.findAll({
      where: { funeralId },
      order: [['createdAt', 'DESC']], // 생성일 기준 내림차순 정렬
    });
  } catch (error) {
    throw new Error('직원 목록 조회 오류:' + error);
  }
};

/**
 * 특정 장례식장의 직원과 권한 정보를 함께 조회
 *
 * 입력:
 * - funeralId: number — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) funeralId로 특정 장례식장의 직원 목록 조회
 * 2) 각 직원의 권한 정보도 함께 조회 (FuneralStaffPermission 모델과 조인)
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralId: 입력받은 ID와 정확히 일치
 *
 * 조인 정보:
 * - FuneralStaffPermission 모델과 조인
 * - 권한 정보를 'permissions' 별칭으로 접근
 *
 * 반환:
 * - Array<Object>: 직원과 권한 정보가 포함된 배열
 *
 * 예외:
 * - DB 조회 실패: '직원 및 권한 조회 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 장례식장 ID로 해당 장례식장의 직원 목록을 가져오면서 각 직원의 권한 정보도 함께 조회할 때 사용됩니다.
 * - 권한 기반 접근 제어(RBAC)에 사용됩니다.
 * - 직원별 세부 권한 설정 현황을 파악할 수 있습니다.
 * - 시스템 보안 및 사용자 권한 관리에 필수적인 기능입니다.
 * - 권한 정보가 없는 직원도 함께 조회됩니다.
 */
export const findByFuneralStaffWithPermissions = async (funeralId) => {
  try {
    return await db.FuneralStaff.findAll({
      where: { funeralId },
      include: [
        {
          model: db.FuneralStaffPermission, // 권한 모델과 조인
          as: 'permissions', // 권한 정보를 permissions로 별칭
        },
      ],
    });
  } catch (error) {
    throw new Error('직원 및 권한 조회 실패: ' + error.message);
  }
};

/**
 * 전화번호로 직원 조회
 *
 * 입력:
 * - phoneNumber: string — 조회할 직원의 전화번호
 *
 * 동작:
 * 1) funeralStaffPhoneNumber 필드가 입력받은 전화번호와 일치하는 직원 조회
 * 2) findOne을 사용하여 단일 직원 레코드 반환
 * 3) 해당하는 직원이 없으면 null 반환
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralStaffPhoneNumber: 입력받은 전화번호와 정확히 일치
 *
 * 반환:
 * - Object|null: 조회된 직원 정보 객체 또는 null (없는 경우)
 *
 * 예외:
 * - DB 조회 실패: '직원 조회 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 전화번호를 기준으로 직원을 찾아 반환할 때 사용됩니다.
 * - 로그인이나 직원 인증 시 사용됩니다.
 * - 전화번호는 고유해야 하므로 중복 가입을 방지할 수 있습니다.
 * - 반환값이 null인 경우 해당 전화번호의 직원이 존재하지 않음을 의미합니다.
 * - 직원 식별 및 인증에 핵심적인 기능입니다.
 */
export async function getStaffByPhoneNumberAndFuneralId(phoneNumber) {
  try {
    const staff = await db.FuneralStaff.findOne({
      where: {
        funeralStaffPhoneNumber: phoneNumber,
      },
    });
    return staff;
  } catch (error) {
    throw new Error(`직원 조회 실패: ${error.message}`);
  }
}

/**
 * 전화번호로 직원 조회 (간단한 버전)
 *
 * 입력:
 * - funeralStaffPhoneNumber: string — 조회할 직원의 전화번호
 *
 * 동작:
 * 1) funeralStaffPhoneNumber 필드가 입력받은 전화번호와 일치하는 직원 조회
 * 2) findOne을 사용하여 단일 직원 레코드 반환
 * 3) 해당하는 직원이 없으면 null 반환
 * 4) 오류 발생 시 원본 오류를 그대로 전파
 *
 * 조회 조건:
 * - funeralStaffPhoneNumber: 입력받은 전화번호와 정확히 일치
 *
 * 반환:
 * - Object|null: 조회된 직원 정보 객체 또는 null (없는 경우)
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 전화번호만으로 직원을 찾는 간단한 조회 함수입니다.
 * - getStaffByPhoneNumberAndFuneralId와 동일한 기능을 제공합니다.
 * - 오류 처리가 간단하여 기본적인 조회에 적합합니다.
 * - 반환값이 null인 경우 해당 전화번호의 직원이 존재하지 않음을 의미합니다.
 * - 직원 식별 및 기본 정보 확인에 활용됩니다.
 */
export async function findByPhoneNumber(funeralStaffPhoneNumber) {
  return await db.FuneralStaff.findOne({
    where: { funeralStaffPhoneNumber },
  });
}

/**
 * 전화번호로 직원의 사용자명만 조회
 *
 * 입력:
 * - funeralStaffPhoneNumber: string — 조회할 직원의 전화번호
 *
 * 동작:
 * 1) funeralStaffPhoneNumber 필드가 입력받은 전화번호와 일치하는 직원 조회
 * 2) 필요한 속성만 선택하여 반환 (성능 최적화)
 * 3) 해당하는 직원이 없으면 null 반환
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralStaffPhoneNumber: 입력받은 전화번호와 정확히 일치
 *
 * 반환 속성:
 * - funeralStaffUsername: 사용자명
 *
 * 반환:
 * - Object|null: 사용자명만 포함된 직원 객체 또는 null
 *
 * 예외:
 * - DB 조회 실패: '휴대폰으로 아이디 찾기 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 전화번호를 기준으로 직원을 찾되 사용자명 필드만 반환할 때 사용됩니다.
 * - 주로 아이디 찾기 기능에서 사용됩니다.
 * - 필요한 속성만 반환하여 네트워크 트래픽과 메모리 사용량을 줄입니다.
 * - 반환값이 null인 경우 해당 전화번호의 직원이 존재하지 않음을 의미합니다.
 * - 성능 최적화를 위해 최소한의 데이터만 조회합니다.
 */
export const findByPhone = async (funeralStaffPhoneNumber) => {
  try {
    return await db.FuneralStaff.findOne({
      where: { funeralStaffPhoneNumber: funeralStaffPhoneNumber },
      attributes: ['funeralStaffUsername'], // 사용자명 필드만 조회
    });
  } catch (error) {
    throw new Error('휴대폰으로 아이디 찾기 오류:' + error.message);
  }
};

/**
 * 직원의 비밀번호 업데이트
 *
 * 입력:
 * - funeralStaffId: number — 비밀번호를 변경할 직원의 고유 ID
 * - newPassword: string — 새로운 비밀번호 (해시된 값)
 *
 * 동작:
 * 1) funeralStaffId로 특정 직원을 찾아 비밀번호를 새로운 값으로 변경
 * 2) 업데이트할 직원이 존재하지 않으면 오류 발생
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralStaffId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - boolean: 업데이트 성공 시 true
 *
 * 예외:
 * - 직원 없음: '해당 직원이 존재하지 않습니다.' 형태로 Error throw
 * - DB 업데이트 실패: '직원 비밀번호 DB수정 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 직원 ID로 해당 직원을 찾아 비밀번호를 새로운 값으로 변경할 때 사용됩니다.
 * - 비밀번호 변경이나 재설정 시 사용됩니다.
 * - 새로운 비밀번호는 해시된 상태로 전달되어야 합니다.
 * - 직원 존재 여부를 먼저 확인하여 안전한 업데이트를 보장합니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 * - 보안을 위해 비밀번호 변경 이력을 기록하는 것을 고려할 수 있습니다.
 */
export async function updatePassword(funeralStaffId, newPassword) {
  try {
    const [updatedCount] = await db.FuneralStaff.update(
      { funeralStaffPassword: newPassword }, // 새로운 비밀번호로 업데이트
      { where: { funeralStaffId } },
    );
    if (updatedCount === 0) {
      throw new Error('해당 직원이 존재하지 않습니다.');
    }
    return true;
  } catch (error) {
    throw new Error('직원 비밀번호 DB수정 오류: ' + error.message);
  }
}

/**
 * 직원 ID로 직원 정보 조회
 *
 * 입력:
 * - funeralStaffId: number — 조회할 직원의 고유 ID
 *
 * 동작:
 * 1) funeralStaffId로 특정 직원 조회
 * 2) findByPk를 사용하여 기본 키 기반 빠른 조회
 * 3) 해당하는 직원이 없으면 null 반환
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralStaffId: 입력받은 ID와 정확히 일치
 *
 * 반환:
 * - Object|null: 조회된 직원 정보 객체 또는 null (존재하지 않는 경우)
 *
 * 예외:
 * - DB 조회 실패: '직원 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 직원의 고유 ID를 사용하여 해당 직원의 모든 정보를 조회할 때 사용됩니다.
 * - findByPk를 사용하여 빠른 조회 성능을 제공합니다.
 * - 직원 상세 정보 확인이나 수정 전 조회에 사용됩니다.
 * - 반환값이 null인 경우 해당 ID의 직원이 존재하지 않음을 의미합니다.
 * - 직원의 모든 정보에 접근할 수 있어 종합적인 관리에 활용됩니다.
 */
export async function findById(funeralStaffId) {
  try {
    return await db.FuneralStaff.findByPk(funeralStaffId);
  } catch (error) {
    throw new Error('직원 조회 오류: ' + error.message);
  }
}
