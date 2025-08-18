/**
 * 관리자 장례식장 승인 관리 DAO (Data Access Object)
 * - 장례식장의 등록 승인 및 관리와 관련된 데이터베이스 작업을 담당합니다.
 * - 승인 대기 중인 장례식장 조회, 승인/거절 처리, 승인 상태별 조회 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - UUID 검증을 통한 데이터 무결성을 보장하고, 보안을 위해 민감한 정보(비밀번호, 캐시)를 제외합니다.
 * - 로깅 시스템을 통해 승인 과정을 추적하고 모니터링할 수 있도록 지원합니다.
 */
import db from '../../models/index.js';
import logger from '../../config/logger.js'; // 없으면 console.error 사용 가능
import { validate as isUUID } from 'uuid';

/**
 * 승인 대기 중인 모든 장례식장 조회
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) 데이터베이스에서 승인되지 않은 모든 장례식장 조회
 * 2) 생성일 기준 내림차순 정렬 (최신 등록순)
 * 3) 보안을 위해 비밀번호 필드 제외
 *
 * 조회 조건:
 * - isApproved: false (승인되지 않은 장례식장만)
 * - 정렬: createdAt DESC (최신 등록순)
 *
 * 보안:
 * - funeralPassword 필드는 자동으로 제외됨
 *
 * 반환:
 * - Array<Object>: 승인 대기 중인 장례식장 배열
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * ```
 *
 * 참고:
 * - 이 함수는 관리자 대시보드에서 승인 대기 중인 장례식장 목록을 표시하는 데 사용됩니다.
 * - 최신 등록순으로 정렬되어 최근 등록된 장례식장을 우선적으로 확인할 수 있습니다.
 * - 비밀번호는 보안상 자동으로 제외되므로 사용자 인증이 필요한 경우 별도 처리해야 합니다.
 * - 승인 대기 중인 장례식장이 없을 경우 빈 배열이 반환됩니다.
 */
export const findAllPending = async () => {
  try {
    return await db.Funeral.findAll({
      where: { isApproved: false },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['funeralPassword'] },
    });
  } catch (error) {
    logger.error('🔴 findAllPending 오류:', error);
    throw error;
  }
};

/**
 * 장례식장 승인/거절 상태 업데이트
 *
 * 입력:
 * - funeralId: string — 승인/거절할 장례식장의 고유 ID
 * - isApproved: boolean — 승인 여부 (true: 승인, false: 거절)
 *
 * 동작:
 * 1) UUID 형식 검증을 통한 입력값 유효성 검사
 * 2) 장례식장 존재 여부 확인
 * 3) 승인/거절 상태 업데이트 및 승인 시간 기록
 * 4) 업데이트된 장례식장 정보 반환
 *
 * 검증 과정:
 * - UUID 형식 검증: 올바른 UUID 형식인지 확인
 * - 존재 여부 확인: 해당 ID의 장례식장이 실제로 존재하는지 확인
 *
 * 상태 업데이트:
 * - isApproved: 승인/거절 상태 설정
 * - approvedAt: 승인 시 현재 시간 기록, 거절 시 null 설정
 *
 * 반환값:
 * - 'invalid_uuid': UUID 형식이 올바르지 않은 경우
 * - null: 해당 ID의 장례식장이 존재하지 않는 경우
 * - Object: 업데이트된 장례식장 정보 (성공 시)
 *
 * 예외:
 * - DB 업데이트 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자가 장례식장 등록을 승인하거나 거절할 때 사용됩니다.
 * - UUID 검증을 통해 잘못된 ID 입력을 방지합니다.
 * - 승인 시간은 승인 처리 시점에 자동으로 기록됩니다.
 * - 거절된 장례식장의 경우 approvedAt이 null로 설정됩니다.
 * - 로깅을 통해 모든 승인/거절 과정을 추적할 수 있습니다.
 */
export const updateApproval = async (funeralId, isApproved) => {
  try {
    // ✅ 1. UUID 형식 검증
    if (!isUUID(funeralId)) {
      return 'invalid_uuid';
    }

    // ✅ 2. 존재 여부 확인
    const funeral = await db.Funeral.findByPk(funeralId);
    if (!funeral) {
      return null;
    }

    // ✅ 3. 승인/거절 처리
    funeral.isApproved = isApproved;
    funeral.approvedAt = isApproved ? new Date() : null;
    await funeral.save();

    return funeral;
  } catch (error) {
    logger.error('🔴 updateApproval 오류:', error);
    throw error;
  }
};

/**
 * 장례식장 ID로 상세 정보 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) 특정 장례식장 ID로 상세 정보 조회
 * 2) 보안을 위해 민감한 정보(비밀번호, 캐시) 제외
 * 3) 장례식장의 기본 정보 및 승인 상태 반환
 *
 * 보안:
 * - funeralPassword 필드는 자동으로 제외됨
 * - funeralCash 필드는 자동으로 제외됨
 *
 * 조회 조건:
 * - funeralId와 일치하는 장례식장 레코드
 *
 * 반환:
 * - Object: 장례식장 상세 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '장례식장 파일 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 장례식장의 상세 정보를 확인할 때 사용됩니다.
 * - 승인 처리 전 장례식장 정보를 검토할 때 활용됩니다.
 * - 비밀번호와 캐시 정보는 보안상 자동으로 제외됩니다.
 * - 반환값이 null인 경우 해당 ID의 장례식장이 존재하지 않음을 의미합니다.
 * - 장례식장의 승인 상태를 확인하여 승인 대기, 승인, 거절 등을 구분할 수 있습니다.
 */
export const findByFuneralId = async (funeralId) => {
  try {
    return await db.Funeral.findOne({
      where: { funeralId },
      attributes: { exclude: ['funeralPassword', 'funeralCash'] }, // 비밀번호 컬럼 제외
    });
  } catch (error) {
    throw new Error('장례식장 파일 조회 오류: ' + error.message);
  }
};

/**
 * 승인 상태별 장례식장 조회
 *
 * 입력:
 * - isApproved: boolean — 조회할 승인 상태 (기본값: false)
 *
 * 동작:
 * 1) 지정된 승인 상태에 해당하는 모든 장례식장 조회
 * 2) 생성일 기준 내림차순 정렬 (최신 등록순)
 * 3) 보안을 위해 비밀번호 필드 제외
 *
 * 조회 조건:
 * - isApproved와 일치하는 장례식장
 * - 정렬: createdAt DESC (최신 등록순)
 *
 * 보안:
 * - funeralPassword 필드는 자동으로 제외됨
 *
 * 반환:
 * - Array<Object>: 지정된 승인 상태의 장례식장 배열
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 승인 상태에 따라 장례식장을 분류하여 조회하는 데 사용됩니다.
 * - isApproved가 true인 경우 승인된 장례식장, false인 경우 승인 대기 중인 장례식장을 조회합니다.
 * - 기본값은 false로 설정되어 있어, 파라미터 없이 호출 시 승인 대기 중인 장례식장을 조회합니다.
 * - 최신 등록순으로 정렬되어 최근 등록된 장례식장을 우선적으로 확인할 수 있습니다.
 * - 비밀번호는 보안상 자동으로 제외되므로 사용자 인증이 필요한 경우 별도 처리해야 합니다.
 * - 로깅을 통해 조회 과정을 추적할 수 있습니다.
 */
export const findByApprovalStatus = async (isApproved = false) => {
  try {
    return await db.Funeral.findAll({
      where: { isApproved },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['funeralPassword'] },
    });
  } catch (error) {
    logger.error('🔴 findByApprovalStatus 오류:', error);
    throw error;
  }
};

/**
 * 장례식장 리스트 정보 업데이트
 *
 * 입력:
 * - updateValues: Object — 업데이트할 컬럼과 값들의 객체
 * - whereValues: Object — WHERE 조건으로 사용할 컬럼과 값들의 객체
 *
 * 동작:
 * 1) 지정된 조건에 맞는 장례식장 리스트 레코드 업데이트
 * 2) 업데이트된 레코드 수 반환
 *
 * 업데이트 방식:
 * - updateValues: SET 절에 사용될 컬럼과 값
 * - whereValues: WHERE 절에 사용될 조건
 *
 * 반환:
 * - Array: [업데이트된 레코드 수, 업데이트된 레코드 배열]
 *
 * 예외:
 * - DB 업데이트 실패: '장례식장 리스트 업데이트 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 장례식장 리스트의 다양한 정보를 일괄 업데이트하는 데 사용됩니다.
 * - updateValues에는 업데이트할 컬럼과 값들을, whereValues에는 조건을 지정합니다.
 * - 반환값의 첫 번째 요소는 업데이트된 레코드 수, 두 번째 요소는 업데이트된 레코드 배열입니다.
 * - 업데이트할 레코드가 없는 경우 [0, []]이 반환됩니다.
 * - 대량 업데이트 시 성능을 고려하여 적절한 WHERE 조건을 사용해야 합니다.
 * - 트랜잭션이 필요한 경우 호출하는 서비스 레이어에서 처리해야 합니다.
 */
export const updateFuneralList = async (updateValues, whereValues) => {
  try {
    return await db.FuneralList.update(updateValues, { where: whereValues });
  } catch (error) {
    throw new Error('장례식장 리스트 업데이트 오류: ' + error.message);
  }
};
