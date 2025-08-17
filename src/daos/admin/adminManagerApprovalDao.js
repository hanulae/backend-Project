/**
 * 관리자 상조팀장 승인 관리 DAO (Data Access Object)
 * - 상조팀장의 등록 승인 및 관리와 관련된 데이터베이스 작업을 담당합니다.
 * - 승인 대기 중인 상조팀장 조회, 승인/거절 처리, 승인 상태별 조회 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 보안을 위해 민감한 정보(비밀번호)를 제외하고, 로깅 시스템을 통해 승인 과정을 추적합니다.
 * - 상조팀장의 추가 서류 및 파일 관리 기능을 포함하여 종합적인 승인 프로세스를 지원합니다.
 */
import db from '../../models/index.js';
import logger from '../../config/logger.js'; // 없으면 console.error로 대체 가능

/**
 * 승인 대기 중인 모든 상조팀장 조회
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) 데이터베이스에서 승인되지 않은 모든 상조팀장 조회
 * 2) 생성일 기준 내림차순 정렬 (최신 등록순)
 * 3) 보안을 위해 비밀번호 필드 제외
 *
 * 조회 조건:
 * - isApproved: false (승인되지 않은 상조팀장만)
 * - 정렬: createdAt DESC (최신 등록순)
 *
 * 보안:
 * - managerPassword 필드는 자동으로 제외됨
 *
 * 반환:
 * - Array<Object>: 승인 대기 중인 상조팀장 배열
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자 대시보드에서 승인 대기 중인 상조팀장 목록을 표시하는 데 사용됩니다.
 * - 최신 등록순으로 정렬되어 최근 등록된 상조팀장을 우선적으로 확인할 수 있습니다.
 * - 비밀번호는 보안상 자동으로 제외되므로 사용자 인증이 필요한 경우 별도 처리해야 합니다.
 * - 승인 대기 중인 상조팀장이 없을 경우 빈 배열이 반환됩니다.
 * - 로깅을 통해 조회 과정을 추적할 수 있습니다.
 */
export const findAllPending = async () => {
  try {
    return await db.Manager.findAll({
      where: { isApproved: false },
      order: [['createdAt', 'DESC']],
      attributes: {
        exclude: ['managerPassword'],
      },
    });
  } catch (error) {
    logger.error('🔴 findAllPending 오류:', error);
    throw error;
  }
};

/**
 * 상조팀장 승인/거절 상태 업데이트
 *
 * 입력:
 * - managerId: string — 승인/거절할 상조팀장의 고유 ID
 * - isApproved: boolean — 승인 여부 (true: 승인, false: 거절)
 *
 * 동작:
 * 1) 지정된 상조팀장 ID의 승인 상태 업데이트
 * 2) 승인 시 현재 시간 기록, 거절 시 null 설정
 * 3) 업데이트된 레코드 정보 반환
 *
 * 상태 업데이트:
 * - isApproved: 승인/거절 상태 설정
 * - approvedAt: 승인 시 현재 시간 기록, 거절 시 null 설정
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
 * - 이 함수는 관리자가 상조팀장 등록을 승인하거나 거절할 때 사용됩니다.
 * - returning: true 옵션으로 업데이트된 레코드 정보를 반환받을 수 있습니다.
 * - 승인 시간은 승인 처리 시점에 자동으로 기록됩니다.
 * - 거절된 상조팀장의 경우 approvedAt이 null로 설정됩니다.
 * - 로깅을 통해 모든 승인/거절 과정을 추적할 수 있습니다.
 * - 업데이트할 레코드가 없는 경우 [0, []]이 반환됩니다.
 */
export const updateApproval = async (managerId, isApproved) => {
  try {
    return await db.Manager.update(
      {
        isApproved,
        approvedAt: isApproved ? new Date() : null,
      },
      {
        where: { managerId },
        returning: true,
      },
    );
  } catch (error) {
    logger.error('🔴 updateApproval 오류:', error);
    throw error;
  }
};

/**
 * 상조팀장 ID로 추가 서류 정보 조회
 *
 * 입력:
 * - managerId: string — 조회할 상조팀장의 고유 ID
 *
 * 동작:
 * 1) 특정 상조팀장 ID로 추가 서류 정보 조회
 * 2) 파일 URL과 생성일 정보 반환
 * 3) 승인 검토에 필요한 서류 정보 제공
 *
 * 조회 조건:
 * - managerId와 일치하는 추가 서류 레코드
 *
 * 포함 정보:
 * - fileUrl: 업로드된 서류 파일의 URL
 * - createdAt: 서류 업로드 시간
 *
 * 반환:
 * - Object: 상조팀장 추가 서류 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '상조팀장 파일 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 상조팀장 승인 전 추가 서류를 검토할 때 사용됩니다.
 * - ManagerAddDocument 테이블에서 서류 정보를 조회합니다.
 * - 반환값이 null인 경우 해당 상조팀장의 추가 서류가 없음을 의미합니다.
 * - 승인 프로세스에서 필수 서류 검증에 활용됩니다.
 * - 파일 URL을 통해 실제 서류 내용을 확인할 수 있습니다.
 */
export const findByManagerId = async (managerId) => {
  try {
    return await db.ManagerAddDocument.findOne({
      where: { managerId },
      attributes: ['fileUrl', 'createdAt'],
    });
  } catch (error) {
    throw new Error('상조팀장 파일 조회 오류: ' + error.message);
  }
};

/**
 * 승인 상태별 상조팀장 조회
 *
 * 입력:
 * - isApproved: boolean — 조회할 승인 상태 (기본값: false)
 *
 * 동작:
 * 1) 지정된 승인 상태에 해당하는 모든 상조팀장 조회
 * 2) 생성일 기준 내림차순 정렬 (최신 등록순)
 * 3) 보안을 위해 비밀번호 필드 제외
 *
 * 조회 조건:
 * - isApproved와 일치하는 상조팀장
 * - 정렬: createdAt DESC (최신 등록순)
 *
 * 보안:
 * - managerPassword 필드는 자동으로 제외됨
 *
 * 반환:
 * - Array<Object>: 지정된 승인 상태의 상조팀장 배열
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 승인 상태에 따라 상조팀장을 분류하여 조회하는 데 사용됩니다.
 * - isApproved가 true인 경우 승인된 상조팀장, false인 경우 승인 대기 중인 상조팀장을 조회합니다.
 * - 기본값은 false로 설정되어 있어, 파라미터 없이 호출 시 승인 대기 중인 상조팀장을 조회합니다.
 * - 최신 등록순으로 정렬되어 최근 등록된 상조팀장을 우선적으로 확인할 수 있습니다.
 * - 비밀번호는 보안상 자동으로 제외되므로 사용자 인증이 필요한 경우 별도 처리해야 합니다.
 * - 로깅을 통해 조회 과정을 추적할 수 있습니다.
 */
export const findByApprovalStatus = async (isApproved = false) => {
  try {
    return await db.Manager.findAll({
      where: { isApproved },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['managerPassword'] },
    });
  } catch (error) {
    logger.error('🔴 findByApprovalStatus 오류:', error);
    throw error;
  }
};

/**
 * 상조팀장의 모든 파일 및 서류 조회
 *
 * 입력:
 * - managerId: string — 조회할 상조팀장의 고유 ID
 *
 * 동작:
 * 1) 특정 상조팀장 ID로 모든 추가 서류 및 파일 조회
 * 2) 파일 경로와 생성일 정보 반환
 * 3) 생성일 기준 내림차순 정렬 (최신 파일순)
 *
 * 조회 조건:
 * - managerId와 일치하는 모든 추가 서류 레코드
 * - 정렬: createdAt DESC (최신 파일순)
 *
 * 포함 정보:
 * - managerDocPath: 서류 파일의 저장 경로
 * - createdAt: 파일 업로드 시간
 *
 * 반환:
 * - Array<Object>: 상조팀장의 모든 파일 및 서류 배열
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 상조팀장이 업로드한 모든 추가 서류를 확인할 때 사용됩니다.
 * - ManagerAddDocument 테이블에서 해당 상조팀장의 모든 서류를 조회합니다.
 * - 최신 파일순으로 정렬되어 최근 업로드된 서류를 우선적으로 확인할 수 있습니다.
 * - 반환값이 빈 배열인 경우 해당 상조팀장의 추가 서류가 없음을 의미합니다.
 * - 승인 프로세스에서 모든 필수 서류의 완성도를 검증하는 데 활용됩니다.
 * - 로깅을 통해 조회 과정을 추적할 수 있습니다.
 * - 파일 경로를 통해 실제 서류에 접근할 수 있습니다.
 */
export const findManagerFile = async (managerId) => {
  try {
    return await db.ManagerAddDocument.findAll({
      where: { managerId },
      attributes: ['managerDocPath', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    logger.error('🔴 findManagerFile 오류:', error);
    throw error;
  }
};
