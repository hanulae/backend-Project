/**
 * 관리자 사용자 조회 서비스
 * - 유형별 전체 조회, 단건 조회 기능 제공
 * - DAO 레이어를 래핑하여 일관된 오류 메시지를 반환합니다.
 */
import * as adminUserDao from '../../daos/admin/adminUserDao.js';

/**
 * 유형별 전체 사용자 조회
 *
 * 입력:
 * - type: 'all' | 'manager' | 'funeral'
 *
 * 동작:
 * - 'all'이면 상조팀장/장례식장 목록을 병렬로 조회하여 함께 반환
 * - 그 외에는 해당 타입 목록만 반환
 *
 * 반환:
 * - type === 'all' → { managers: Manager[], funerals: Funeral[] }
 * - type === 'manager' → { managers: Manager[] }
 * - type === 'funeral' → { funerals: Funeral[] }
 *
 * 예외:
 * - 유효하지 않은 type이면 Error throw
 */
export const getUsersByType = async (type) => {
  if (type === 'all') {
    const [managers, funerals] = await Promise.all([
      adminUserDao.findAllManagers(),
      adminUserDao.findAllFunerals(),
    ]);
    return { managers, funerals };
  }

  if (type === 'manager') {
    const managers = await adminUserDao.findAllManagers();
    return { managers };
  }

  if (type === 'funeral') {
    const funerals = await adminUserDao.findAllFunerals();
    return { funerals };
  }

  throw new Error('유효하지 않은 타입입니다. (all, manager, funeral 중 하나)');
};

/**
 * 단건 사용자 조회
 *
 * 입력:
 * - userId: string — 조회 대상 사용자 ID
 * - type: 'manager' | 'funeral' — 사용자 유형
 *
 * 동작:
 * - type에 따라 상조팀장/장례식장 단건 조회 후 존재 여부 검증
 *
 * 반환:
 * - type === 'manager' → { type: 'manager', manager: Manager }
 * - type === 'funeral' → { type: 'funeral', funeral: Funeral }
 *
 * 예외:
 * - 대상이 없거나 type이 유효하지 않으면 명확한 메시지의 Error throw
 */
export const getUserById = async (userId, type) => {
  try {
    if (type === 'manager') {
      const manager = await adminUserDao.findManagerById(userId);
      if (!manager) {
        throw new Error('상조팀장을 찾을 수 없습니다.');
      }
      return { type: 'manager', manager };
    }

    if (type === 'funeral') {
      const funeral = await adminUserDao.findFuneralById(userId);
      if (!funeral) {
        throw new Error('장례식장을 찾을 수 없습니다.');
      }
      return { type: 'funeral', funeral };
    }

    throw new Error('유효하지 않은 타입입니다. (manager, funeral 중 하나)');
  } catch (error) {
    console.error('특정 유저 정보 조회 오류:', error.message);
    throw new Error(`유저 정보 조회 실패: ${error.message}`);
  }
};
