/**
 * 공지사항 관리 공통 DAO (Data Access Object)
 * - 모든 사용자 유형(상조팀장, 장례식장, 관리자)이 공통으로 사용하는 공지사항 데이터베이스 작업을 담당합니다.
 * - 공지사항 목록 조회, 상세 정보 조회, 사용자 유형별 필터링, 전체 공지사항 관리 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 가시성(isVisible) 필드를 통해 활성화된 공지사항만 조회하여 사용자에게 적절한 정보를 제공합니다.
 * - 생성일 기준 내림차순 정렬을 통해 최신 공지사항을 우선적으로 표시합니다.
 * - 사용자 유형별로 공지사항을 구분하여 관리할 수 있어 타겟팅된 정보 전달이 가능합니다.
 */
// daos/common/noticeDao.js
import db from '../../models/index.js';

/**
 * 가시화된 공지사항 목록 조회 (사용자 유형별 필터링 지원)
 *
 * 입력:
 * - type: string — 조회할 사용자 유형 (선택사항)
 *   - 'all': 모든 사용자 유형의 공지사항 (기본값)
 *   - 'manager': 상조팀장 전용 공지사항
 *   - 'funeral': 장례식장 전용 공지사항
 *   - 'admin': 관리자 전용 공지사항
 *
 * 동작:
 * 1) isVisible이 true인 활성화된 공지사항만 조회
 * 2) type 파라미터에 따라 사용자 유형별 필터링 적용
 * 3) 생성일 기준 내림차순 정렬 (최신 공지사항 순)
 * 4) 필요한 속성만 선택하여 반환 (성능 최적화)
 *
 * 조회 조건:
 * - isVisible: true (활성화된 공지사항만)
 * - userType: type 파라미터와 일치 (type이 'all'이 아닌 경우)
 *
 * 정렬:
 * - createdAt DESC (최신 공지사항 순)
 *
 * 반환 속성:
 * - noticeId: 공지사항 고유 ID
 * - title: 공지사항 제목
 * - createdAt: 생성일
 *
 * 반환:
 * - Array<Object>: 필터링된 공지사항 목록 배열
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 * - 로그: '공지사항 목록 DAO 오류: {오류메시지}' 형태로 콘솔 출력
 *

 *
 * 참고:
 * - 이 함수는 사용자에게 표시할 활성화된 공지사항만을 조회합니다.
 * - type 파라미터를 통해 사용자 유형별로 맞춤형 공지사항을 제공할 수 있습니다.
 * - 반환 속성을 최소화하여 네트워크 트래픽과 메모리 사용량을 줄입니다.
 * - 최신 공지사항이 먼저 표시되어 사용자 경험이 향상됩니다.
 * - type이 'all'인 경우 모든 사용자 유형의 공지사항을 반환합니다.
 * - 비활성화된 공지사항은 자동으로 제외되어 관리자가 임시로 숨길 수 있습니다.
 */
export const findAllVisible = async (type) => {
  try {
    const whereCondition = { isVisible: true };

    // type이 'all'이 아니고, 정의된 경우에만 userType 조건 추가
    if (type && type !== 'all') {
      whereCondition.userType = type;
    }

    return await db.Notice.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      attributes: ['noticeId', 'title', 'createdAt'],
    });
  } catch (error) {
    console.error('공지사항 목록 DAO 오류:', error.message);
    throw error;
  }
};

/**
 * 특정 공지사항 상세 정보 조회 (활성화된 공지사항만)
 *
 * 입력:
 * - noticeId: string — 조회할 공지사항의 고유 ID
 *
 * 동작:
 * 1) noticeId로 특정 공지사항 조회
 * 2) isVisible이 true인 활성화된 공지사항만 반환
 * 3) 필요한 속성만 선택하여 반환 (성능 최적화)
 * 4) 오류 발생 시 상세한 로그와 함께 원본 오류 전파
 *
 * 조회 조건:
 * - noticeId: 입력받은 공지사항 ID와 일치
 * - isVisible: true (활성화된 공지사항만)
 *
 * 반환 속성:
 * - noticeId: 공지사항 고유 ID
 * - title: 공지사항 제목
 * - content: 공지사항 내용
 * - createdAt: 생성일
 *
 * 반환:
 * - Object: 공지사항 상세 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 * - 로그: '공지사항 상세 DAO 오류: {오류메시지}' 형태로 콘솔 출력
 *

 *
 * 참고:
 * - 이 함수는 특정 공지사항의 상세 내용을 확인할 때 사용됩니다.
 * - 활성화된 공지사항만 반환하므로 비활성화된 공지사항은 접근할 수 없습니다.
 * - 반환 속성을 최소화하여 필요한 정보만 전달합니다.
 * - 반환값이 null인 경우 해당 ID의 공지사항이 존재하지 않거나 비활성화되었음을 의미합니다.
 * - 공지사항 내용(content)을 포함하여 사용자에게 완전한 정보를 제공합니다.
 * - 생성일 정보를 통해 공지사항의 시점을 파악할 수 있습니다.
 */
export const findById = async (noticeId) => {
  try {
    return await db.Notice.findOne({
      where: { noticeId, isVisible: true },
      attributes: ['noticeId', 'title', 'content', 'createdAt'],
    });
  } catch (error) {
    console.error('공지사항 상세 DAO 오류:', error.message);
    throw error;
  }
};

/**
 * 특정 사용자 유형의 모든 공지사항 조회 (활성화 상태 무관)
 *
 * 입력:
 * - userType: string — 조회할 사용자 유형
 *   - 'manager': 상조팀장 전용 공지사항
 *   - 'funeral': 장례식장 전용 공지사항
 *   - 'admin': 관리자 전용 공지사항
 *
 * 동작:
 * 1) userType으로 특정 사용자 유형의 공지사항만 조회
 * 2) 활성화 상태와 관계없이 모든 공지사항 반환
 * 3) 생성일 기준 내림차순 정렬 (최신 공지사항 순)
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - userType: 입력받은 사용자 유형과 일치
 * - 활성화 상태 필터링 없음 (모든 상태의 공지사항)
 *
 * 정렬:
 * - createdAt DESC (최신 공지사항 순)
 *
 * 반환:
 * - Array<Object>: 해당 사용자 유형의 모든 공지사항 배열
 *
 * 예외:
 * - DB 조회 실패: '공지사항 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자가 특정 사용자 유형의 공지사항 현황을 파악할 때 사용됩니다.
 * - 활성화 상태와 관계없이 모든 공지사항을 조회하므로 관리 목적으로 활용됩니다.
 * - 반환값이 빈 배열인 경우 해당 사용자 유형의 공지사항이 없음을 의미합니다.
 * - 활성화/비활성화 상태를 구분하여 공지사항 관리 현황을 분석할 수 있습니다.
 * - 최신 공지사항 순으로 정렬되어 최근 활동을 우선적으로 확인할 수 있습니다.
 * - 공지사항의 전체 생명주기를 추적하고 관리할 수 있습니다.
 */
export const findNoticesByType = async (userType) => {
  try {
    return await db.Notice.findAll({
      where: { userType },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('공지사항 조회 오류: ' + error.message);
  }
};

/**
 * 모든 공지사항 조회 (사용자 유형, 활성화 상태 무관)
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) 데이터베이스의 모든 공지사항을 조회
 * 2) 사용자 유형이나 활성화 상태와 관계없이 전체 공지사항 반환
 * 3) 생성일 기준 내림차순 정렬 (최신 공지사항 순)
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 조회 조건:
 * - 모든 공지사항 (필터링 없음)
 * - 사용자 유형, 활성화 상태 구분 없음
 *
 * 정렬:
 * - createdAt DESC (최신 공지사항 순)
 *
 * 반환:
 * - Array<Object>: 모든 공지사항 배열
 *
 * 예외:
 * - DB 조회 실패: '전체 공지사항 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자가 시스템의 전체 공지사항 현황을 파악할 때 사용됩니다.
 * - 모든 공지사항을 조회하므로 시스템 관리 및 분석 목적으로 활용됩니다.
 * - 반환값이 빈 배열인 경우 시스템에 등록된 공지사항이 없음을 의미합니다.
 * - 사용자 유형별, 활성화 상태별 통계를 생성하여 시스템 현황을 분석할 수 있습니다.
 * - 최신 공지사항 순으로 정렬되어 최근 활동을 우선적으로 확인할 수 있습니다.
 * - 공지사항 관리 시스템의 전반적인 상태와 성과를 평가할 수 있습니다.
 * - 대량의 공지사항이 있을 경우 페이지네이션이나 필터링 기능을 고려해야 할 수 있습니다.
 */
export const findAllNotices = async () => {
  try {
    return await db.Notice.findAll({
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('전체 공지사항 조회 오류: ' + error.message);
  }
};
