/**
 * 관리자 출동 요청 관리 DAO (Data Access Object)
 * - 상조팀장과 장례식장의 출동 요청 관련 데이터베이스 작업을 담당합니다.
 * - 출동 요청 조회, 관리자별 요청 관리, 사용자별 요청 추적 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 출동 요청의 전체적인 라이프사이클을 관리하고 추적할 수 있도록 지원합니다.
 * - 관리자가 출동 시스템을 체계적으로 관리하고 모니터링할 수 있도록 합니다.
 */
// src/daos/admin/adminDispatchRequestDao.js
import db from '../../models/index.js';

/**
 * 관리자 ID로 출동 요청 조회
 *
 * 입력:
 * - adminId: string — 조회할 관리자의 고유 ID
 *
 * 동작:
 * 1) 특정 관리자 ID로 모든 출동 요청 조회
 * 2) 관리자 정보(이름, 이메일)를 포함하여 반환
 * 3) 관리자가 처리한 모든 출동 요청의 현황 파악
 *
 * 조회 조건:
 * - adminId와 일치하는 출동 요청
 * - 관리자 기본 정보 포함 (이름, 이메일)
 *
 * 포함 정보:
 * - 출동 요청 상세 정보 (요청 내용, 상태, 요청일 등)
 * - 관리자 기본 정보 (이름, 이메일)
 *
 * 반환:
 * - Array<Object>: 특정 관리자가 처리한 출동 요청 배열
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 관리자가 처리한 출동 요청의 현황을 파악하는 데 사용됩니다.
 * - 관리자의 업무 성과나 처리 현황을 추적할 때 활용됩니다.
 * - 관리자 정보는 이름과 이메일만 포함하여 보안을 강화합니다.
 * - 모든 상태의 출동 요청을 포함하므로 처리 완료, 진행 중, 대기 등을 구분하여 처리해야 합니다.
 */
export const findDispatchRequestsByAdminId = async (adminId) => {
  try {
    return await db.DispatchRequest.findAll({
      where: { adminId },
      include: [
        {
          model: db.Admin,
          attributes: ['adminName', 'adminEmail'],
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching dispatch requests:', error);
    throw error;
  }
};

/**
 * 상조팀장 ID로 출동 요청 조회
 *
 * 입력:
 * - managerId: string — 조회할 상조팀장의 고유 ID
 *
 * 동작:
 * 1) 특정 상조팀장 ID로 모든 출동 요청 조회
 * 2) 생성일 기준 내림차순 정렬 (최신 요청순)
 * 3) 상조팀장이 요청한 모든 출동의 현황 파악
 *
 * 조회 조건:
 * - managerId와 일치하는 출동 요청
 * - 정렬: createdAt DESC (최신 요청순)
 *
 * 포함 정보:
 * - 출동 요청 상세 정보 (요청 내용, 상태, 요청일, 위치 등)
 * - 상조팀장 관련 정보 (요청자 정보)
 *
 * 반환:
 * - Array<Object>: 특정 상조팀장이 요청한 출동 요청 배열
 *
 * 예외:
 * - DB 조회 실패: '상조팀장 출동 요청 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 상조팀장의 출동 요청 이력을 상세히 조회하는 데 사용됩니다.
 * - 상조팀장의 업무 패턴이나 요청 빈도를 분석할 때 활용됩니다.
 * - 최신 요청순으로 정렬되어 최근 활동을 우선적으로 확인할 수 있습니다.
 * - 모든 상태의 출동 요청을 포함하므로 승인 대기, 진행 중, 완료 등을 구분하여 처리해야 합니다.
 */
export const findDispatchRequestsByManagerId = async (managerId) => {
  try {
    return await db.DispatchRequest.findAll({
      where: { managerId },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('상조팀장 출동 요청 조회 오류: ' + error.message);
  }
};

/**
 * 장례식장 ID로 출동 요청 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) 특정 장례식장 ID로 모든 출동 요청 조회
 * 2) 생성일 기준 내림차순 정렬 (최신 요청순)
 * 3) 장례식장이 요청한 모든 출동의 현황 파악
 *
 * 조회 조건:
 * - funeralId와 일치하는 출동 요청
 * - 정렬: createdAt DESC (최신 요청순)
 *
 * 포함 정보:
 * - 출동 요청 상세 정보 (요청 내용, 상태, 요청일, 위치 등)
 * - 장례식장 관련 정보 (요청자 정보)
 *
 * 반환:
 * - Array<Object>: 특정 장례식장이 요청한 출동 요청 배열
 *
 * 예외:
 * - DB 조회 실패: '장례식장 출동 요청 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 장례식장의 출동 요청 이력을 상세히 조회하는 데 사용됩니다.
 * - 장례식장의 출동 요청 패턴이나 빈도를 분석할 때 활용됩니다.
 * - 최신 요청순으로 정렬되어 최근 활동을 우선적으로 확인할 수 있습니다.
 * - 모든 상태의 출동 요청을 포함하므로 승인 대기, 진행 중, 완료 등을 구분하여 처리해야 합니다.
 * - 출동 위치 정보를 통해 지역별 출동 현황을 파악할 수 있습니다.
 */
export const findDispatchRequestsByFuneralId = async (funeralId) => {
  try {
    return await db.DispatchRequest.findAll({
      where: { funeralId },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('장례식장 출동 요청 조회 오류: ' + error.message);
  }
};
