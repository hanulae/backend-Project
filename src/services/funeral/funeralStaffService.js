/**
 * 장례식장 직원 관리 서비스
 * - 장례식장 직원의 생성, 수정, 삭제, 조회 및 권한 관리 기능을 제공합니다.
 * - 직원 로그인, 비밀번호 변경, 권한 조회 등의 인증 관련 기능을 포함합니다.
 * - 트랜잭션을 사용하여 직원 정보와 권한 정보의 데이터 정합성을 보장합니다.
 * - 각 직원별로 세부적인 권한(방 관리, 정보 수정, 배차 내역 등)을 관리합니다.
 */
import db from '../../models/index.js';
import * as funeralStaffDao from '../../daos/funeral/funeralStaffDao.js';
import * as funeralStaffPermissionDao from '../../daos/funeral/funeralStaffPermissionDao.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';

/**
 * 장례식장 직원 생성
 *
 * 입력:
 * - params: Object — 직원 생성에 필요한 정보
 *   - funeralId: string — 장례식장 ID
 *   - funeralStaffPhoneNumber: string — 직원 휴대폰 번호
 *   - funeralStaffName: string — 직원 이름
 *   - funeralStaffRole: string — 직원 역할/직책
 *   - funeralStaffPassword: string — 직원 비밀번호
 *   - funeralMainPhoneNumber: string — 장례식장 대표 전화번호
 *   - permissions: Object — 직원 권한 설정 (선택사항)
 *     - room_management: boolean — 방 관리 권한
 *     - info_edit: boolean — 정보 수정 권한
 *     - dispatch_history: boolean — 배차 내역 조회 권한
 *     - dispatch_pending: boolean — 배차 대기 조회 권한
 *     - estimate_history: boolean — 견적 내역 조회 권한
 *     - app_settings: boolean — 앱 설정 권한
 *     - point_history: boolean — 포인트 내역 조회 권한
 *
 * 동작:
 * 1) 트랜잭션 시작
 * 2) 직원 기본 정보를 funeralStaffDao를 통해 생성
 * 3) 직원 ID를 사용하여 권한 정보를 funeralStaffPermissionDao를 통해 생성
 * 4) 권한이 지정되지 않은 경우 기본값 false로 초기화
 * 5) 트랜잭션 커밋 후 직원 정보와 권한 정보 반환
 *
 * 권한 초기화:
 * - permissions 객체가 없거나 특정 권한이 undefined인 경우 false로 설정
 * - 모든 권한은 기본적으로 비활성화 상태로 시작
 *
 * 반환:
 * - Object: { staff, permissions }
 *   - staff: FuneralStaff — 생성된 직원 정보
 *   - permissions: FuneralStaffPermission — 생성된 권한 정보
 *
 * 예외:
 * - 직원 생성 실패: '직원 생성 실패: {원인}' 형태로 Error throw
 * - 권한 생성 실패: 트랜잭션 롤백 후 오류 전파
 * - DB 오류: 트랜잭션 롤백 후 원본 오류 전파
 *
 * 데이터 정합성:
 * - 직원 정보와 권한 정보가 트랜잭션으로 묶여 있어, 하나라도 실패하면 전체 롤백됩니다.
 */
export const createStaff = async (params) => {
  const transaction = await db.sequelize.transaction();

  try {
    // 1. 직원 생성
    const staff = await funeralStaffDao.create(
      {
        funeralId: params.funeralId,
        funeralStaffPhoneNumber: params.funeralStaffPhoneNumber,
        funeralStaffName: params.funeralStaffName,
        funeralStaffRole: params.funeralStaffRole,
        funeralStaffPassword: params.funeralStaffPassword,
        funeralMainPhoneNumber: params.funeralMainPhoneNumber,
      },
      { transaction },
    );

    // 2. 권한 생성 (permissions가 없으면 false로 초기화)
    const staffPermissions = await funeralStaffPermissionDao.create(
      {
        funeralStaffId: staff.funeralStaffId,
        roomManagement: params.permissions?.room_management ?? false,
        infoEdit: params.permissions?.info_edit ?? false,
        dispatchHistory: params.permissions?.dispatch_history ?? false,
        dispatchPending: params.permissions?.dispatch_pending ?? false,
        estimateHistory: params.permissions?.estimate_history ?? false,
        appSettings: params.permissions?.app_settings ?? false,
        pointHistory: params.permissions?.point_history ?? false,
      },
      { transaction },
    );

    await transaction.commit();
    return { staff, permissions: staffPermissions };
  } catch (error) {
    await transaction.rollback();
    throw new Error('직원 생성 실패: ' + error.message);
  }
};

/**
 * 장례식장 직원 정보 수정
 *
 * 입력:
 * - params: Object — 직원 수정에 필요한 정보
 *   - funeralStaffId: string — 수정할 직원 ID
 *   - funeralStaffPhoneNumber: string — 수정할 휴대폰 번호
 *   - funeralStaffName: string — 수정할 직원 이름
 *   - funeralStaffRole: string — 수정할 직원 역할/직책
 *   - funeralStaffPassword: string — 수정할 비밀번호
 *   - funeralMainPhoneNumber: string — 수정할 장례식장 대표 전화번호
 *   - permissions: Object — 수정할 직원 권한 설정
 *     - room_management: boolean — 방 관리 권한
 *     - info_edit: boolean — 정보 수정 권한
 *     - dispatch_history: boolean — 배차 내역 조회 권한
 *     - dispatch_pending: boolean — 배차 대기 조회 권한
 *     - estimate_history: boolean — 견적 내역 조회 권한
 *     - app_settings: boolean — 앱 설정 권한
 *     - point_history: boolean — 포인트 내역 조회 권한
 *
 * 동작:
 * 1) 직원 기본 정보를 funeralStaffDao를 통해 수정
 * 2) 직원 권한 정보를 funeralStaffPermissionDao를 통해 수정
 * 3) 권한이 지정되지 않은 경우 기본값 false로 설정
 * 4) 수정된 직원 정보와 권한 정보 반환
 *
 * 권한 처리:
 * - permissions 객체의 각 권한이 undefined인 경우 false로 설정
 * - 모든 권한은 명시적으로 설정되어야 하며, 기본값은 false입니다.
 *
 * 반환:
 * - Object: { staff, permissions }
 *   - staff: FuneralStaff — 수정된 직원 정보
 *   - permissions: FuneralStaffPermission — 수정된 권한 정보
 *
 * 예외:
 * - 직원 수정 실패: '직원 수정 실패: {원인}' 형태로 Error throw
 * - 권한 수정 실패: 해당 오류를 포함하여 전파
 * - DAO 오류: 원본 오류를 포함하여 전파
 *
 * 참고:
 * - 이 함수는 트랜잭션을 사용하지 않으므로, 직원 정보와 권한 정보 수정이 독립적으로 처리됩니다.
 * - 향후 데이터 정합성 보장을 위해 트랜잭션 처리를 고려해볼 수 있습니다.
 */
export const updateStaff = async (params) => {
  const {
    funeralStaffId,
    funeralStaffPhoneNumber,
    funeralStaffName,
    funeralStaffRole,
    permissions,
    funeralStaffPassword,
    funeralMainPhoneNumber,
  } = params;

  try {
    // 1. 직원 정보 수정
    const staff = await funeralStaffDao.update(funeralStaffId, {
      funeralStaffPhoneNumber,
      funeralStaffName,
      funeralStaffRole,
      funeralStaffPassword,
      funeralMainPhoneNumber,
    });

    // 2. 권한 수정
    const staffPermissions = await funeralStaffPermissionDao.update(funeralStaffId, {
      roomManagement: permissions?.room_management ?? false,
      infoEdit: permissions?.info_edit ?? false,
      dispatchHistory: permissions?.dispatch_history ?? false,
      dispatchPending: permissions?.dispatch_pending ?? false,
      estimateHistory: permissions?.estimate_history ?? false,
      appSettings: permissions?.app_settings ?? false,
      pointHistory: permissions?.point_history ?? false,
    });

    return { staff, permissions: staffPermissions };
  } catch (error) {
    throw new Error('직원 수정 실패: ' + error.message);
  }
};

/**
 * 장례식장 직원 삭제
 *
 * 입력:
 * - funeralStaffId: string — 삭제할 직원 ID
 *
 * 동작:
 * - funeralStaffDao를 통해 해당 직원을 삭제합니다.
 * - 직원 삭제 시 관련된 권한 정보도 함께 삭제됩니다.
 *
 * 반환:
 * - Object: 삭제 결과 (DAO 반환값)
 *
 * 예외:
 * - 직원 삭제 실패: '직원 삭제 실패: {원인}' 형태로 Error throw
 * - DAO 오류: 원본 오류를 포함하여 전파
 *
 * 참고:
 * - 직원 삭제 시 해당 직원의 모든 권한 정보도 함께 삭제됩니다.
 * - 삭제된 직원은 복구할 수 없으므로 신중하게 처리해야 합니다.
 */
export const deleteStaff = async (funeralStaffId) => {
  try {
    return await funeralStaffDao.remove(funeralStaffId);
  } catch (error) {
    throw new Error('직원 삭제 실패: ' + error.message);
  }
};

/**
 * 장례식장별 직원 목록 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장 ID
 *
 * 동작:
 * - funeralStaffDao를 통해 해당 장례식장에 속한 모든 직원 정보를 조회합니다.
 * - 직원 정보와 함께 각 직원의 권한 정보도 함께 조회됩니다.
 *
 * 반환:
 * - Array<Object>: 직원 목록 (각 직원의 기본 정보와 권한 정보 포함)
 *
 * 예외:
 * - 직원 목록 조회 실패: '직원 목록 조회 실패: {원인}' 형태로 Error throw
 * - DAO 오류: 원본 오류를 포함하여 전파
 *
 * 데이터 구조:
 * - 각 직원 객체는 기본 정보와 권한 정보를 포함합니다.
 * - 권한 정보는 roomManagement, infoEdit, dispatchHistory 등의 boolean 값으로 구성됩니다.
 */
export const getStaffListByFuneral = async (funeralId) => {
  try {
    const staffList = await funeralStaffDao.findByFuneralStaffWithPermissions(funeralId);

    return staffList;
  } catch (error) {
    throw new Error('직원 목록 조회 실패: ' + error.message);
  }
};

/**
 * 휴대폰 번호 중복 검사 (직원 등록 시)
 *
 * 입력:
 * - phoneNumber: string — 검사할 휴대폰 번호
 * - funeralId: string — 장례식장 ID
 *
 * 동작:
 * 1) 해당 장례식장에 속한 직원 중에서 입력된 휴대폰 번호가 이미 등록되어 있는지 확인
 * 2) 중복이 있는 경우 오류 발생, 중복이 없는 경우 null 반환
 *
 * 검증 과정:
 * - funeralStaffDao.getStaffByPhoneNumberAndFuneralId를 통해 장례식장별 휴대폰 번호 중복 검사
 * - 동일한 장례식장 내에서만 중복을 검사합니다.
 *
 * 반환:
 * - null 또는 undefined: 중복이 없는 경우
 * - Error: 중복이 있는 경우 '이미 등록된 전화번호입니다.' 오류 발생
 *
 * 예외:
 * - 중복 발견: '이미 등록된 전화번호입니다.'
 * - DAO 조회 실패: 해당 오류를 포함하여 전파
 *
 * 참고:
 * - 이 함수는 직원 등록 시 휴대폰 번호 중복을 방지하기 위해 사용됩니다.
 * - 장례식장별로 독립적으로 중복을 검사하므로, 다른 장례식장의 직원과는 중복되지 않습니다.
 */
export async function getStaffByPhoneNumber(phoneNumber, funeralId) {
  try {
    // funeralId에 속한 직원 중 해당 전화번호가 있는지 조회
    const staff = await funeralStaffDao.getStaffByPhoneNumberAndFuneralId(phoneNumber, funeralId);

    if (staff) {
      throw new Error('이미 등록된 전화번호입니다.');
    }

    return staff; // 중복이 없으면 null 또는 undefined 반환
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}

/**
 * 직원 권한 조회
 *
 * 입력:
 * - staffId: string — 조회할 직원 ID
 *
 * 동작:
 * - funeralStaffPermissionDao를 통해 해당 직원의 모든 권한 정보를 조회합니다.
 *
 * 반환:
 * - Object: 직원의 권한 정보 (roomManagement, infoEdit, dispatchHistory 등)
 *
 * 예외:
 * - 권한 조회 실패: '직원 권한 조회 오류: {원인}' 형태로 Error throw
 * - DAO 오류: 원본 오류를 포함하여 전파
 *
 * 권한 정보:
 * - roomManagement: 방 관리 권한
 * - infoEdit: 정보 수정 권한
 * - dispatchHistory: 배차 내역 조회 권한
 * - dispatchPending: 배차 대기 조회 권한
 * - estimateHistory: 견적 내역 조회 권한
 * - appSettings: 앱 설정 권한
 * - pointHistory: 포인트 내역 조회 권한
 */
export async function getStaffPermissions(staffId) {
  try {
    return await funeralStaffPermissionDao.getPermissionsByStaffId(staffId);
  } catch (error) {
    throw new Error('직원 권한 조회 오류: ' + error.message);
  }
}

/**
 * 직원 로그인
 *
 * 입력:
 * - funeralStaffPhoneNumber: string — 직원 휴대폰 번호
 * - funeralStaffPassword: string — 직원 비밀번호
 *
 * 동작:
 * 1) 휴대폰 번호로 직원 정보 조회
 * 2) 비밀번호 일치 여부 확인 (평문 비교)
 * 3) 로그인 성공 시 JWT 액세스 토큰 및 리프레시 토큰 생성
 * 4) 직원 권한 정보 조회
 * 5) 토큰과 직원 정보, 권한 정보 반환
 *
 * 인증 과정:
 * - 휴대폰 번호로 직원 존재 여부 확인
 * - 비밀번호 직접 비교 (해싱되지 않은 상태)
 * - JWT 토큰에 funeralId와 funeralStaffId 포함
 *
 * 토큰 생성:
 * - accessToken: 단기 액세스 토큰
 * - refreshToken: 장기 리프레시 토큰
 * - 두 토큰 모두 장례식장 ID와 직원 ID를 포함
 *
 * 반환:
 * - Object: { accessToken, refreshToken, staff, permissions }
 *   - accessToken: string — JWT 액세스 토큰
 *   - refreshToken: string — JWT 리프레시 토큰
 *   - staff: Object — 직원 정보 (toSafeObject 적용)
 *   - permissions: Object — 직원 권한 정보
 * - null: 로그인 실패 시
 *
 * 예외:
 * - 로그인 실패: null 반환 (직원 없음 또는 비밀번호 불일치)
 * - 권한 조회 실패: 해당 오류를 포함하여 전파
 *
 * 보안:
 * - 현재 비밀번호가 평문으로 저장되어 있어 보안상 취약할 수 있습니다.
 * - 향후 bcrypt 등의 해싱 알고리즘 적용을 권장합니다.
 */
export async function loginStaff({ funeralStaffPhoneNumber, funeralStaffPassword }) {
  const staff = await funeralStaffDao.findByPhoneNumber(funeralStaffPhoneNumber);

  if (!staff || staff.funeralStaffPassword !== funeralStaffPassword) {
    return null; // 로그인 실패
  }

  // 토큰 생성
  const accessToken = generateToken({
    funeralId: staff.funeralId,
    funeralStaffId: staff.funeralStaffId,
  });

  const refreshToken = generateRefreshToken({
    funeralId: staff.funeralId,
    funeralStaffId: staff.funeralStaffId,
  });

  // 직원 권한 가져오기
  const permissions = await getStaffPermissions(staff.funeralStaffId);

  return {
    accessToken,
    refreshToken,
    staff: staff.toSafeObject ? staff.toSafeObject() : staff,
    permissions,
  };
}

/**
 * 직원 비밀번호 변경
 *
 * 입력:
 * - funeralStaffId: string — 비밀번호를 변경할 직원 ID
 * - newPassword: string — 새로운 비밀번호
 *
 * 동작:
 * 1) 직원 ID로 직원 정보 조회
 * 2) 새로운 비밀번호가 기존 비밀번호와 동일한지 검증
 * 3) 비밀번호가 다른 경우에만 업데이트 수행
 * 4) 업데이트 성공 시 true 반환
 *
 * 검증 과정:
 * - 직원 존재 여부 확인
 * - 기존 비밀번호와 새 비밀번호 동일성 검사
 * - 동일한 경우 오류 발생
 *
 * 반환:
 * - boolean: true (비밀번호 변경 성공)
 *
 * 예외:
 * - 직원 없음: '직원을 찾을 수 없습니다.'
 * - 동일한 비밀번호: '기존 비밀번호와 동일합니다. 다른 비밀번호를 입력해주세요.'
 * - 비밀번호 업데이트 실패: DAO에서 발생한 오류 전파
 *
 * 보안:
 * - 현재 비밀번호가 평문으로 저장되어 있어 보안상 취약할 수 있습니다.
 * - 향후 bcrypt 등의 해싱 알고리즘 적용을 권장합니다.
 * - 기존 비밀번호와 동일한 비밀번호로의 변경을 방지합니다.
 */
export async function updateStaffPassword(funeralStaffId, newPassword) {
  try {
    // 1. 기존 비밀번호 조회
    const staff = await funeralStaffDao.findById(funeralStaffId);
    if (!staff) {
      throw new Error('직원을 찾을 수 없습니다.');
    }

    // 2. 기존 비밀번호와 같은지 체크 (해싱 안할 경우)
    if (staff.funeralStaffPassword === newPassword) {
      throw new Error('기존 비밀번호와 동일합니다. 다른 비밀번호를 입력해주세요.');
    }

    // 3. 비밀번호 업데이트
    await funeralStaffDao.updatePassword(funeralStaffId, newPassword);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}
