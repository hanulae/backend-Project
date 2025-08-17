/**
 * 장례식장 직원 권한 관리 DAO (Data Access Object)
 * - 장례식장 직원의 권한을 관리하는 모든 데이터베이스 작업을 담당합니다.
 * - 직원 권한 생성 및 수정, 직원별 권한 조회, 권한 기반 접근 제어를 위한 권한 정보 관리 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 세밀한 권한 제어를 통해 시스템 보안을 강화합니다.
 * - 각 기능별 접근 권한을 체계적으로 관리합니다.
 *
 * 권한 종류:
 * - roomManagement: 호실 관리 권한
 * - infoEdit: 장례식장 정보 수정 권한
 * - dispatchHistory: 지난 출동 내역 권한
 * - dispatchPending: 출동 대기 내역 권한
 * - estimateHistory: 견적 내역 권한
 * - appSettings: 앱 설정 권한
 * - pointHistory: 포인트 내역 권한
 */
import db from '../../models/index.js';

/**
 * 새로운 직원 권한 생성
 *
 * 입력:
 * - data: Object — 생성할 권한 데이터
 *   - funeralStaffId: number — 직원 ID
 *   - roomManagement: boolean — 호실 관리 권한 (true/false)
 *   - infoEdit: boolean — 장례식장 정보 수정 권한 (true/false)
 *   - dispatchHistory: boolean — 지난 출동 내역 권한 (true/false)
 *   - dispatchPending: boolean — 출동 대기 내역 권한 (true/false)
 *   - estimateHistory: boolean — 견적 내역 권한 (true/false)
 *   - appSettings: boolean — 앱 설정 권한 (true/false)
 *   - pointHistory: boolean — 포인트 내역 권한 (true/false)
 * - options: Object — Sequelize 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체
 *   - 기타 Sequelize 옵션들
 *
 * 동작:
 * 1) 입력받은 권한 데이터로 새로운 권한 레코드 생성
 * 2) Sequelize 옵션을 포함하여 데이터 일관성 보장
 * 3) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 생성 정보:
 * - 직원별 세부 권한 설정 (각 기능별 접근 권한)
 * - 장례식장 직원과의 연관 관계
 * - 자동 생성: ID, createdAt, updatedAt
 *
 * 반환:
 * - Object: 생성된 권한 레코드
 *
 * 예외:
 * - DB 생성 실패: '직원 권한 생성 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 장례식장 직원에게 처음 권한을 부여할 때 사용됩니다.
 * - 각 권한 항목에 대한 접근 권한을 설정할 수 있습니다.
 * - Sequelize 옵션을 통해 데이터 일관성을 보장할 수 있습니다.
 * - 직원 ID를 통해 권한과 직원을 연결합니다.
 * - 권한 설정 후 직원의 기능 접근이 제한됩니다.
 * - 모든 권한이 false로 설정되면 해당 직원은 제한된 기능만 사용할 수 있습니다.
 */
export const create = async (data, options = {}) => {
  try {
    return await db.FuneralStaffPermission.create(data, options);
  } catch (error) {
    throw new Error('직원 권한 생성 오류: ' + error.message);
  }
};

/**
 * 직원의 권한을 수정하거나 생성 (upsert 방식)
 *
 * 입력:
 * - funeralStaffId: number — 권한을 수정할 직원의 고유 ID
 * - data: Object — 수정할 권한 데이터
 *   - roomManagement: boolean — 호실 관리 권한
 *   - infoEdit: boolean — 장례식장 정보 수정 권한
 *   - dispatchHistory: boolean — 지난 출동 내역 권한
 *   - dispatchPending: boolean — 출동 대기 내역 권한
 *   - estimateHistory: boolean — 견적 내역 권한
 *   - appSettings: boolean — 앱 설정 권한
 *   - pointHistory: boolean — 포인트 내역 권한
 *
 * 동작:
 * 1) 기존 권한이 있는지 확인
 * 2) 기존 권한이 있으면 업데이트, 없으면 새로 생성
 * 3) upsert(update or insert) 방식으로 동작
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 처리 방식:
 * - 기존 권한 존재: 기존 권한을 새로운 데이터로 업데이트
 * - 기존 권한 없음: funeralStaffId를 포함하여 새로운 권한 생성
 *
 * 반환:
 * - Array|Object: 업데이트된 레코드 수 배열 또는 생성된 권한 레코드
 *
 * 예외:
 * - DB 작업 실패: '직원 권한 수정 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 upsert 방식으로 동작하여 권한 설정의 편의성을 제공합니다.
 * - 직원에게 이미 권한이 설정되어 있다면 기존 권한을 업데이트합니다.
 * - 직원에게 권한이 설정되어 있지 않다면 새로운 권한을 생성합니다.
 * - 권한 변경 시 즉시 적용되어 직원의 기능 접근이 제한됩니다.
 * - 부분적인 권한 업데이트가 가능하여 필요한 권한만 변경할 수 있습니다.
 * - 권한 관리의 효율성을 높여줍니다.
 */
export const update = async (funeralStaffId, data) => {
  try {
    // 기존 권한이 있는지 확인
    const existing = await db.FuneralStaffPermission.findOne({ where: { funeralStaffId } });

    if (existing) {
      // 기존 권한이 있으면 업데이트
      return await db.FuneralStaffPermission.update(data, { where: { funeralStaffId } });
    } else {
      // 기존 권한이 없으면 새로 생성 (funeralStaffId 포함)
      return await db.FuneralStaffPermission.create({ funeralStaffId, ...data });
    }
  } catch (error) {
    throw new Error('직원 권한 수정 오류: ' + error.message);
  }
};

/**
 * 특정 직원의 권한 정보 조회
 *
 * 입력:
 * - staffId: number — 조회할 직원의 고유 ID
 *
 * 동작:
 * 1) staffId로 특정 직원의 모든 권한 정보 조회
 * 2) 필요한 속성만 선택하여 반환 (성능 최적화)
 * 3) 해당하는 권한이 없으면 null 반환
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - funeralStaffId: 입력받은 ID와 정확히 일치
 *
 * 반환 속성:
 * - roomManagement: 호실 관리 권한
 * - infoEdit: 장례식장 정보 수정 권한
 * - dispatchHistory: 지난 출동 내역 권한
 * - dispatchPending: 출동 대기 내역 권한
 * - estimateHistory: 견적 내역 권한
 * - appSettings: 앱 설정 권한
 * - pointHistory: 포인트 내역 권한
 *
 * 반환:
 * - Object|null: 권한 정보 객체 또는 null (권한이 설정되지 않은 경우)
 *
 * 예외:
 * - DB 조회 실패: '직원 권한 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 직원 ID로 해당 직원의 모든 권한 정보를 가져올 때 사용됩니다.
 * - 권한 기반 접근 제어(RBAC)를 위해 각 기능별 권한 여부를 확인할 때 사용됩니다.
 * - 필요한 속성만 반환하여 성능을 최적화합니다.
 * - 반환값이 null인 경우 해당 직원에게 권한이 설정되지 않았음을 의미합니다.
 * - 각 권한 필드는 boolean 값으로 true/false를 반환합니다.
 * - 권한 확인 후 해당 기능에 대한 접근을 허용하거나 거부할 수 있습니다.
 * - 시스템 보안 및 사용자 권한 관리에 필수적인 기능입니다.
 */
export const getPermissionsByStaffId = async (staffId) => {
  try {
    return await db.FuneralStaffPermission.findOne({
      where: { funeralStaffId: staffId },
      attributes: [
        'roomManagement', // 호실 관리 권한
        'infoEdit', // 장례식장 정보 수정 권한
        'dispatchHistory', // 지난 출동 내역 권한
        'dispatchPending', // 출동 대기 내역 권한
        'estimateHistory', // 견적 내역 권한
        'appSettings', // 앱 설정 권한
        'pointHistory', // 포인트 내역 권한
      ],
    });
  } catch (error) {
    throw new Error('직원 권한 조회 오류: ' + error.message);
  }
};
