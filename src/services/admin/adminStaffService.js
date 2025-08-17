/**
 * 관리자 스태프 서비스
 * - 스태프 생성(권한 포함), 단건/전체 조회, 수정, 삭제 제공
 * - 트랜잭션을 통해 생성·권한부여를 원자적으로 처리하고, 수정 시 권한 변경도 함께 지원합니다.
 */
import * as adminStaffDao from '../../daos/admin/adminStaffDao.js';
import db from '../../models/index.js';

/**
 * 스태프 생성 + 권한 생성 (트랜잭션)
 *
 * 입력:
 * - adminId: string — 소속 관리자 ID
 * - email: string — 스태프 이메일
 * - password: string — 초기 비밀번호
 * - name: string — 이름
 * - adminStaffRole: string — 역할(예: 'operator', 'viewer' 등 정책에 따름)
 * - permissions?: object — 권한 세트(미지정 시 기본 권한 부여)
 *
 * 동작:
 * - 트랜잭션 시작 → 스태프 생성 → 권한 레코드 생성 → 커밋
 * - permissions 미전달 시 기본 권한(canManageUsers/canManageRefunds/canViewDashboard=false) 사용
 *
 * 반환:
 * - staff: 생성된 스태프 레코드
 *
 * 예외:
 * - 도중 오류 시 롤백 후 Error('관리자 직원 생성 중 오류 발생: ...') throw
 */
export const createAdminStaff = async ({
  adminId,
  email,
  password,
  name,
  adminStaffRole,
  permissions,
}) => {
  const transaction = await db.sequelize.transaction();

  try {
    const staff = await adminStaffDao.createAdminStaff(
      { adminId, email, password, name, adminStaffRole },
      { transaction },
    );

    const defaultPermissions = {
      canManageUsers: false,
      canManageRefunds: false,
      canViewDashboard: false,
    };

    await adminStaffDao.createAdminStaffPermission(
      {
        adminStaffId: staff.adminStaffId,
        ...(permissions || defaultPermissions),
      },
      { transaction },
    );

    await transaction.commit();
    return staff;
  } catch (err) {
    await transaction.rollback();
    throw new Error('관리자 직원 생성 중 오류 발생: ' + err.message);
  }
};

/**
 * 스태프 단건 조회
 *
 * 입력:
 * - adminStaffId: string — 스태프 PK
 *
 * 반환:
 * - staff: 스태프 레코드
 *
 * 예외:
 * - 대상 없음 시 Error('해당 관리자 직원을 찾을 수 없습니다.') throw
 */
export const getAdminStaffById = async (adminStaffId) => {
  const staff = await adminStaffDao.findAdminStaffById(adminStaffId);

  if (!staff) {
    throw new Error('해당 관리자 직원을 찾을 수 없습니다.');
  }

  return staff;
};

/**
 * 관리자별 스태프 전체 조회
 *
 * 입력:
 * - adminId: string — 관리자 PK
 *
 * 반환:
 * - Array<staff>: 소속 관리자 기준 스태프 목록
 */
export const getAllAdminStaff = async (adminId) => {
  return await adminStaffDao.findAllAdminStaffByAdminId(adminId);
};

/**
 * 스태프 정보/권한 수정
 *
 * 입력:
 * - adminStaffId: string — 수정 대상 스태프 PK
 * - updateData: {
 *     email?: string;
 *     password?: string; // 제공 시 비밀번호 갱신
 *     name?: string;
 *     permissions?: object; // 제공 시 권한 세트 갱신
 *   }
 *
 * 동작:
 * - 기본 프로필(email, name, password) 업데이트
 * - permissions 제공 시 권한 레코드도 함께 업데이트
 *
 * 반환:
 * - true: 성공 시
 */
export const updateAdminStaff = async (adminStaffId, updateData) => {
  const { email, password, name, permissions } = updateData;

  const updatePayload = { email, name };
  if (password) updatePayload.password = password;

  await adminStaffDao.updateAdminStaff(adminStaffId, updatePayload);

  if (permissions) {
    await adminStaffDao.updateAdminStaffPermission(adminStaffId, permissions);
  }

  return true;
};

/**
 * 스태프 삭제
 *
 * 입력:
 * - adminStaffId: string — 삭제 대상 스태프 PK
 *
 * 반환:
 * - void (DAO 실행 성공 시 예외 없이 종료)
 */
export const deleteAdminStaff = async (adminStaffId) => {
  await adminStaffDao.deleteAdminStaff(adminStaffId);
};
