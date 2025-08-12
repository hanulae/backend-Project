/**
 * 관리자 직원 관리 DAO (Data Access Object)
 * - 관리자 직원의 생성, 수정, 삭제, 조회와 관련된 데이터베이스 작업을 담당합니다.
 * - 직원 권한 관리, 관리자별 직원 목록 관리, CRUD 작업 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - AdminStaff와 AdminStaffPermission 테이블 간의 연관관계를 활용하여 종합적인 직원 관리 시스템을 지원합니다.
 * - 보안을 위해 민감한 정보(비밀번호, 생성/수정 시간)를 제외하고, 권한 정보를 포함하여 반환합니다.
 */
import db from '../../models/index.js';

/**
 * 새로운 관리자 직원 생성
 *
 * 입력:
 * - adminId: string — 상위 관리자의 고유 ID
 * - email: string — 직원 이메일 주소
 * - password: string — 직원 비밀번호 (암호화된 상태)
 * - name: string — 직원 이름
 * - adminStaffRole: string — 직원 역할/직책
 * - options: Object — Sequelize 옵션 (기본값: {})
 *
 * 동작:
 * 1) 입력받은 정보로 새로운 AdminStaff 레코드 생성
 * 2) 데이터베이스에 직원 정보 저장
 * 3) 생성된 직원 정보 반환
 *
 * 생성 정보:
 * - 상위 관리자 ID, 이메일, 비밀번호, 이름, 역할
 * - 자동 생성: adminStaffId, createdAt, updatedAt
 *
 * 반환:
 * - Object: 생성된 관리자 직원 정보
 *
 * 예외:
 * - DB 생성 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 상위 관리자가 새로운 직원을 등록할 때 사용됩니다.
 * - adminStaffRole을 통해 직원의 역할과 권한 수준을 구분할 수 있습니다.
 * - 비밀번호는 이미 암호화된 상태로 전달되어야 합니다.
 * - options 파라미터를 통해 트랜잭션 등의 Sequelize 옵션을 전달할 수 있습니다.
 * - 생성된 직원은 상위 관리자(adminId)의 관리 하에 배치됩니다.
 */
export const createAdminStaff = async (
  { adminId, email, password, name, adminStaffRole },
  options = {},
) => {
  return await db.AdminStaff.create(
    {
      adminId,
      adminStaffEmail: email,
      adminStaffPassword: password,
      adminStaffName: name,
      adminStaffRole: adminStaffRole, // ✅ 변경됨
    },
    options,
  );
};

/**
 * 관리자 직원 권한 생성
 *
 * 입력:
 * - adminStaffId: string — 권한을 부여할 직원의 고유 ID
 * - permissions: Object — 부여할 권한들의 객체 (adminStaffId 제외)
 * - options: Object — Sequelize 옵션 (기본값: {})
 *
 * 동작:
 * 1) adminStaffId와 함께 권한 정보를 AdminStaffPermission 테이블에 저장
 * 2) 직원에게 필요한 권한들을 일괄 설정
 * 3) 생성된 권한 정보 반환
 *
 * 권한 구조:
 * - adminStaffId: 권한 소유자 식별
 * - 기타 권한 필드들: 각종 시스템 권한 설정
 *
 * 반환:
 * - Object: 생성된 권한 정보
 *
 * 예외:
 * - DB 생성 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 직원 생성 후 해당 직원에게 필요한 권한을 설정할 때 사용됩니다.
 * - spread 연산자(...permissions)를 사용하여 동적으로 권한 필드를 처리합니다.
 * - 권한은 AdminStaffPermission 테이블에 별도로 저장되어 권한 관리의 유연성을 제공합니다.
 * - options 파라미터를 통해 트랜잭션 등의 Sequelize 옵션을 전달할 수 있습니다.
 * - 권한 설정은 직원의 역할과 업무 범위에 따라 체계적으로 관리해야 합니다.
 */
export const createAdminStaffPermission = async (
  { adminStaffId, ...permissions },
  options = {},
) => {
  return await db.AdminStaffPermission.create({ adminStaffId, ...permissions }, options);
};

/**
 * 관리자 직원 ID로 상세 정보 조회
 *
 * 입력:
 * - adminStaffId: string — 조회할 직원의 고유 ID
 *
 * 동작:
 * 1) 특정 직원 ID로 상세 정보 조회
 * 2) 연관된 권한 정보를 포함하여 반환
 * 3) 보안을 위해 민감한 정보 제외
 *
 * 조회 조건:
 * - adminStaffId와 일치하는 직원 레코드
 * - 권한 정보 포함 (permissions)
 *
 * 포함 정보:
 * - 직원 기본 정보 (이름, 이메일, 역할 등)
 * - 권한 정보 (AdminStaffPermission)
 *
 * 보안:
 * - password 필드는 자동으로 제외됨
 * - createdAt, updatedAt 필드는 자동으로 제외됨
 *
 * 반환:
 * - Object: 직원 정보와 권한을 포함한 객체 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 직원의 상세 정보와 권한을 확인할 때 사용됩니다.
 * - include를 통해 연관된 권한 정보를 함께 조회합니다.
 * - 비밀번호는 보안상 자동으로 제외되므로 사용자 인증이 필요한 경우 별도 처리해야 합니다.
 * - 반환값이 null인 경우 해당 ID의 직원이 존재하지 않음을 의미합니다.
 * - 권한 정보는 permissions 속성에 포함되어 직원의 시스템 접근 권한을 파악할 수 있습니다.
 */
export const findAdminStaffById = async (adminStaffId) => {
  return await db.AdminStaff.findOne({
    where: { adminStaffId },
    include: [
      {
        model: db.AdminStaffPermission,
        as: 'permissions',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
    ],
    attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
  });
};

/**
 * 특정 관리자 하위의 모든 직원 조회
 *
 * 입력:
 * - adminId: string — 상위 관리자의 고유 ID
 *
 * 동작:
 * 1) 지정된 관리자 ID 하위의 모든 직원 조회
 * 2) 각 직원의 권한 정보를 포함하여 반환
 * 3) 직원 ID 기준 오름차순 정렬
 * 4) 보안을 위해 민감한 정보 제외
 *
 * 조회 조건:
 * - adminId와 일치하는 직원들
 * - 권한 정보 포함 (permissions)
 *
 * 정렬:
 * - adminStaffId ASC (직원 ID 오름차순)
 *
 * 포함 정보:
 * - 직원 기본 정보 (이름, 이메일, 역할 등)
 * - 권한 정보 (AdminStaffPermission)
 *
 * 보안:
 * - password 필드는 자동으로 제외됨
 * - createdAt, updatedAt 필드는 자동으로 제외됨
 *
 * 반환:
 * - Array<Object>: 직원 정보와 권한을 포함한 배열
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 관리자가 관리하는 모든 직원의 현황을 파악할 때 사용됩니다.
 * - 조직 구조에서 상위 관리자별로 직원을 그룹화하여 관리할 수 있습니다.
 * - 직원 ID 순으로 정렬되어 일관된 순서로 결과를 확인할 수 있습니다.
 * - 각 직원의 권한 정보를 포함하여 권한 관리 현황을 종합적으로 파악할 수 있습니다.
 * - 반환값이 빈 배열인 경우 해당 관리자 하위에 직원이 없음을 의미합니다.
 */
export const findAllAdminStaffByAdminId = async (adminId) => {
  return await db.AdminStaff.findAll({
    where: { adminId },
    include: [
      {
        model: db.AdminStaffPermission,
        as: 'permissions',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
    ],
    attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
    order: [['adminStaffId', 'ASC']],
  });
};

/**
 * 관리자 직원 정보 업데이트
 *
 * 입력:
 * - adminStaffId: string — 업데이트할 직원의 고유 ID
 * - updatePayload: Object — 업데이트할 필드와 값들의 객체
 *
 * 동작:
 * 1) 지정된 직원 ID의 정보를 updatePayload로 업데이트
 * 2) 업데이트된 레코드 수 반환
 *
 * 업데이트 방식:
 * - updatePayload에 포함된 필드만 업데이트
 * - Sequelize의 update 메서드 사용
 *
 * 반환:
 * - Array: [업데이트된 레코드 수, 업데이트된 레코드 배열]
 *
 * 예외:
 * - DB 업데이트 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 직원의 기본 정보를 수정할 때 사용됩니다.
 * - updatePayload에는 수정할 필드와 값만 포함하면 됩니다.
 * - 반환값의 첫 번째 요소는 업데이트된 레코드 수, 두 번째 요소는 업데이트된 레코드 배열입니다.
 * - 업데이트할 레코드가 없는 경우 [0, []]이 반환됩니다.
 * - 비밀번호 변경이 필요한 경우 별도로 처리해야 합니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 */
export const updateAdminStaff = async (adminStaffId, updatePayload) => {
  return await db.AdminStaff.update(updatePayload, { where: { adminStaffId } });
};

/**
 * 관리자 직원 권한 업데이트
 *
 * 입력:
 * - adminStaffId: string — 권한을 업데이트할 직원의 고유 ID
 * - permissions: Object — 새로운 권한 설정 객체
 *
 * 동작:
 * 1) 지정된 직원 ID의 권한 정보를 새로운 설정으로 업데이트
 * 2) 기존 권한을 완전히 대체
 * 3) 업데이트된 레코드 수 반환
 *
 * 업데이트 방식:
 * - permissions 객체로 기존 권한을 완전히 대체
 * - Sequelize의 update 메서드 사용
 *
 * 반환:
 * - Array: [업데이트된 레코드 수, 업데이트된 레코드 배열]
 *
 * 예외:
 * - DB 업데이트 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 직원의 권한을 변경할 때 사용됩니다.
 * - permissions 객체는 새로운 권한 설정을 완전히 대체하므로, 모든 권한을 명시해야 합니다.
 * - 권한 업데이트는 보안에 중요한 영향을 미치므로 신중하게 처리해야 합니다.
 * - 반환값의 첫 번째 요소는 업데이트된 레코드 수, 두 번째 요소는 업데이트된 레코드 배열입니다.
 * - 업데이트할 레코드가 없는 경우 [0, []]이 반환됩니다.
 * - 권한 변경 후에는 해당 직원의 세션을 재검증하는 것이 좋습니다.
 */
export const updateAdminStaffPermission = async (adminStaffId, permissions) => {
  return await db.AdminStaffPermission.update(permissions, { where: { adminStaffId } });
};

/**
 * 관리자 직원 삭제
 *
 * 입력:
 * - adminStaffId: string — 삭제할 직원의 고유 ID
 *
 * 동작:
 * 1) 지정된 직원 ID의 레코드를 데이터베이스에서 완전 삭제
 * 2) 연관된 권한 정보도 함께 삭제 (CASCADE 설정에 따라)
 * 3) 삭제된 레코드 수 반환
 *
 * 삭제 방식:
 * - destroy() 메서드를 사용하여 레코드를 완전히 제거
 * - 관련된 모든 데이터가 영구적으로 삭제됨
 *
 * 반환:
 * - number: 삭제된 레코드 수
 *
 * 예외:
 * - DB 삭제 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 직원을 완전히 제거할 때 사용됩니다.
 * - 삭제된 직원과 관련된 모든 정보는 복구할 수 없으므로 신중하게 사용해야 합니다.
 * - 반환값이 0인 경우 해당 ID의 직원이 존재하지 않았음을 의미합니다.
 * - 직원 삭제 시 연관된 권한 정보도 함께 삭제되므로, 권한 관리의 일관성이 유지됩니다.
 * - 활성 세션이 있는 직원을 삭제할 경우 세션 관리 시스템과의 연동을 고려해야 합니다.
 * - 대량 삭제 시 성능을 고려하여 적절한 배치 처리가 필요할 수 있습니다.
 */
export const deleteAdminStaff = async (adminStaffId) => {
  return await db.AdminStaff.destroy({ where: { adminStaffId } });
};
