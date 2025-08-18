/**
 * 관리자 사용자 관리 DAO (Data Access Object)
 * - 관리자가 상조팀장과 장례식장 사용자 정보를 조회하고 관리하는 데이터베이스 작업을 담당합니다.
 * - 사용자 목록 조회, 개별 사용자 상세 정보 조회, 관리자 계정 조회 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 보안을 위해 민감한 정보(비밀번호)를 자동으로 제외하고, 사용자 인증이 필요한 경우 별도 처리하도록 설계되었습니다.
 * - 상조팀장(Manager)과 장례식장(Funeral) 사용자 그룹을 체계적으로 관리할 수 있도록 지원합니다.
 */
import db from '../../models/index.js';

/**
 * 모든 상조팀장 사용자 목록 조회
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) 데이터베이스에서 모든 상조팀장(Manager) 사용자 조회
 * 2) 전체 상조팀장 목록을 배열로 반환
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - Manager 테이블의 모든 레코드
 * - 필터링 없음 (승인 상태, 활성 상태 등 구분 없음)
 *
 * 반환:
 * - Array<Object>: 모든 상조팀장 사용자 정보 배열
 *
 * 예외:
 * - DB 조회 실패: '상조팀장 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자가 전체 상조팀장 현황을 파악할 때 사용됩니다.
 * - 승인 상태나 활성 상태에 관계없이 모든 상조팀장을 조회합니다.
 * - 대량의 상조팀장이 있을 경우 페이지네이션이나 필터링 기능을 고려해야 할 수 있습니다.
 * - 반환된 데이터는 상조팀장의 기본 정보를 포함하지만, 비밀번호는 포함되지 않습니다.
 * - 오류 발생 시 명확한 오류 메시지를 제공하여 디버깅을 용이하게 합니다.
 */
export const findAllManagers = async () => {
  try {
    return await db.Manager.findAll();
  } catch (error) {
    throw new Error('상조팀장 조회 오류: ' + error.message);
  }
};

/**
 * 모든 장례식장 사용자 목록 조회
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) 데이터베이스에서 모든 장례식장(Funeral) 사용자 조회
 * 2) 전체 장례식장 목록을 배열로 반환
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - Funeral 테이블의 모든 레코드
 * - 필터링 없음 (승인 상태, 활성 상태 등 구분 없음)
 *
 * 반환:
 * - Array<Object>: 모든 장례식장 사용자 정보 배열
 *
 * 예외:
 * - DB 조회 실패: '장례식장 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자가 전체 장례식장 현황을 파악할 때 사용됩니다.
 * - 승인 상태나 활성 상태에 관계없이 모든 장례식장을 조회합니다.
 * - 대량의 장례식장이 있을 경우 페이지네이션이나 필터링 기능을 고려해야 할 수 있습니다.
 * - 반환된 데이터는 장례식장의 기본 정보를 포함하지만, 비밀번호는 포함되지 않습니다.
 * - 오류 발생 시 명확한 오류 메시지를 제공하여 디버깅을 용이하게 합니다.
 * - 상조팀장과 장례식장을 구분하여 관리할 수 있어 사용자 그룹별 현황 파악이 가능합니다.
 */
export const findAllFunerals = async () => {
  try {
    return await db.Funeral.findAll();
  } catch (error) {
    throw new Error('장례식장 조회 오류: ' + error.message);
  }
};

/**
 * 관리자 계정 조회 (역할이 'admin'인 첫 번째 계정)
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) Admin 테이블에서 role이 'admin'인 계정을 조회
 * 2) 생성일 기준 오름차순 정렬하여 가장 먼저 생성된 관리자 계정 반환
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - role: 'admin' (관리자 역할)
 * - 정렬: createdAt ASC (가장 먼저 생성된 순)
 * - 결과: 첫 번째 관리자 계정 하나만 반환
 *
 * 반환:
 * - Object: 첫 번째 관리자 계정 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '관리자 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 시스템의 최초 관리자 계정이나 주요 관리자 계정을 찾을 때 사용됩니다.
 * - role 필드를 통해 관리자 권한을 가진 계정만을 필터링합니다.
 * - 생성일 순으로 정렬하여 가장 먼저 생성된 관리자 계정을 우선적으로 반환합니다.
 * - 시스템 초기화 시 최초 관리자 계정을 찾거나, 관리자 권한이 필요한 작업에서 사용됩니다.
 * - 반환값이 null인 경우 해당 역할의 관리자 계정이 존재하지 않음을 의미합니다.
 * - 보안상 중요한 관리자 계정 정보이므로 접근 권한을 적절히 제한해야 합니다.
 */
export const findById = async () => {
  try {
    // 첫 번째 관리자 계정 하나만 조회 (role이 'admin'인 계정)
    const result = await db.Admin.findOne({
      where: {
        role: 'admin',
      },
      order: [['createdAt', 'ASC']], // 가장 먼저 생성된 관리자
    });

    return result;
  } catch (error) {
    throw new Error('관리자 조회 오류: ' + error.message);
  }
};

/**
 * 특정 상조팀장 사용자 상세 정보 조회
 *
 * 입력:
 * - managerId: string — 조회할 상조팀장의 고유 ID
 *
 * 동작:
 * 1) managerId로 특정 상조팀장 사용자 조회
 * 2) 보안을 위해 비밀번호 필드 자동 제외
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - managerId와 일치하는 상조팀장 레코드
 * - findByPk를 사용한 기본 키 기반 조회
 *
 * 보안:
 * - managerPassword 필드는 자동으로 제외됨
 * - 민감한 인증 정보 노출 방지
 *
 * 반환:
 * - Object: 상조팀장 상세 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '상조팀장 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 상조팀장의 상세 정보를 확인할 때 사용됩니다.
 * - 비밀번호는 보안상 자동으로 제외되므로 사용자 인증이 필요한 경우 별도 처리해야 합니다.
 * - findByPk를 사용하여 빠른 조회 성능을 제공합니다.
 * - 반환값이 null인 경우 해당 ID의 상조팀장이 존재하지 않음을 의미합니다.
 * - 승인 상태, 연락처 등 상조팀장의 주요 정보를 확인할 수 있습니다.
 * - 관리자가 상조팀장 정보를 검토하거나 수정할 때 활용됩니다.
 */
export const findManagerById = async (managerId) => {
  try {
    return await db.Manager.findByPk(managerId, {
      attributes: {
        exclude: ['managerPassword'], // 비밀번호 제외
      },
    });
  } catch (error) {
    throw new Error('상조팀장 조회 오류: ' + error.message);
  }
};

/**
 * 특정 장례식장 사용자 상세 정보 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) funeralId로 특정 장례식장 사용자 조회
 * 2) 보안을 위해 비밀번호 필드 자동 제외
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralId와 일치하는 장례식장 레코드
 * - findByPk를 사용한 기본 키 기반 조회
 *
 * 보안:
 * - funeralPassword 필드는 자동으로 제외됨
 * - 민감한 인증 정보 노출 방지
 *
 * 반환:
 * - Object: 장례식장 상세 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '장례식장 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 장례식장의 상세 정보를 확인할 때 사용됩니다.
 * - 비밀번호는 보안상 자동으로 제외되므로 사용자 인증이 필요한 경우 별도 처리해야 합니다.
 * - findByPk를 사용하여 빠른 조회 성능을 제공합니다.
 * - 반환값이 null인 경우 해당 ID의 장례식장이 존재하지 않음을 의미합니다.
 * - 승인 상태, 주소, 연락처 등 장례식장의 주요 정보를 확인할 수 있습니다.
 * - 관리자가 장례식장 정보를 검토하거나 수정할 때 활용됩니다.
 * - 상조팀장과 장례식장을 구분하여 관리할 수 있어 사용자 그룹별 현황 파악이 가능합니다.
 */
export const findFuneralById = async (funeralId) => {
  try {
    return await db.Funeral.findByPk(funeralId, {
      attributes: {
        exclude: ['funeralPassword'], // 비밀번호 제외
      },
    });
  } catch (error) {
    throw new Error('장례식장 조회 오류: ' + error.message);
  }
};
