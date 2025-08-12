/**
 * 관리자 공지사항 관리 DAO (Data Access Object)
 * - 공지사항의 생성, 수정, 삭제, 조회와 관련된 데이터베이스 작업을 담당합니다.
 * - 공지사항의 가시성 관리, 사용자 유형별 분류, CRUD 작업 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 공지사항의 전체적인 라이프사이클을 관리하고 추적할 수 있도록 지원합니다.
 * - 관리자가 공지사항 시스템을 체계적으로 관리하고 모니터링할 수 있도록 합니다.
 */
import db from '../../models/index.js';

/**
 * 새로운 공지사항 생성
 *
 * 입력:
 * - title: string — 공지사항 제목
 * - content: string — 공지사항 내용
 * - isVisible: boolean — 공지사항 가시성 (true: 표시, false: 숨김)
 * - userType: string — 대상 사용자 유형 (예: 'all', 'manager', 'funeral', 'admin')
 *
 * 동작:
 * 1) 입력받은 정보로 새로운 공지사항 레코드 생성
 * 2) 데이터베이스에 공지사항 저장
 * 3) 생성된 공지사항 정보 반환
 *
 * 생성 정보:
 * - 제목, 내용, 가시성, 사용자 유형
 * - 자동 생성: createdAt, updatedAt, noticeId
 *
 * 반환:
 * - Object: 생성된 공지사항 정보
 *
 * 예외:
 * - DB 생성 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자가 새로운 공지사항을 등록할 때 사용됩니다.
 * - userType을 통해 특정 사용자 그룹에게만 공지사항을 표시할 수 있습니다.
 * - isVisible을 false로 설정하면 공개되지 않지만 데이터는 보존됩니다.
 * - 생성된 공지사항은 자동으로 고유 ID가 할당됩니다.
 * - 공지사항 생성 시점이 자동으로 기록됩니다.
 */
export const createNotice = async ({ title, content, isVisible, userType }) => {
  return await db.Notice.create({
    title,
    content,
    isVisible,
    userType,
  });
};

/**
 * 기존 공지사항 수정
 *
 * 입력:
 * - noticeId: string — 수정할 공지사항의 고유 ID
 * - title: string — 새로운 제목 (선택사항)
 * - content: string — 새로운 내용 (선택사항)
 * - isVisible: boolean — 새로운 가시성 설정 (선택사항)
 * - userType: string — 새로운 사용자 유형 (선택사항)
 *
 * 동작:
 * 1) noticeId로 기존 공지사항 조회
 * 2) 존재하지 않는 경우 null 반환
 * 3) 입력된 값이 있는 경우에만 해당 필드 업데이트
 * 4) 수정된 공지사항 정보 반환
 *
 * 업데이트 방식:
 * - nullish coalescing (??) 연산자를 사용하여 기존 값 보존
 * - 입력된 값이 있는 경우에만 업데이트, 없는 경우 기존 값 유지
 *
 * 반환:
 * - Object: 수정된 공지사항 정보 (성공 시)
 * - null: 해당 ID의 공지사항이 존재하지 않는 경우
 *
 * 예외:
 * - DB 수정 실패: '공지사항 수정 DAO 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자가 기존 공지사항을 수정할 때 사용됩니다.
 * - 부분 업데이트가 가능하여 필요한 필드만 수정할 수 있습니다.
 * - 수정되지 않은 필드는 기존 값이 그대로 유지됩니다.
 * - updatedAt 필드는 자동으로 현재 시간으로 업데이트됩니다.
 * - 존재하지 않는 공지사항 ID로 호출 시 null이 반환됩니다.
 * - 로깅을 통해 수정 과정을 추적할 수 있습니다.
 */
export const updateNotice = async (noticeId, { title, content, isVisible, userType }) => {
  try {
    const notice = await db.Notice.findByPk(noticeId);
    if (!notice) return null;

    await notice.update({
      title: title ?? notice.title,
      content: content ?? notice.content,
      isVisible: isVisible ?? notice.isVisible,
      userType: userType ?? notice.userType,
    });

    return notice;
  } catch (error) {
    console.error('공지사항 수정 DAO 오류:', error.message);
    throw error;
  }
};

/**
 * 공지사항 삭제
 *
 * 입력:
 * - noticeId: string — 삭제할 공지사항의 고유 ID
 *
 * 동작:
 * 1) noticeId로 해당 공지사항을 데이터베이스에서 완전 삭제
 * 2) 삭제된 레코드 수 반환
 * 3) 삭제 성공 여부를 boolean으로 반환
 *
 * 삭제 방식:
 * - destroy() 메서드를 사용하여 레코드를 완전히 제거
 * - 관련된 모든 데이터가 영구적으로 삭제됨
 *
 * 반환:
 * - boolean: true (삭제 성공), false (삭제할 레코드가 없는 경우)
 *
 * 예외:
 * - DB 삭제 실패: '공지사항 삭제 DAO 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자가 공지사항을 완전히 제거할 때 사용됩니다.
 * - 삭제된 공지사항은 복구할 수 없으므로 신중하게 사용해야 합니다.
 * - 반환값이 true인 경우 실제로 레코드가 삭제되었음을 의미합니다.
 * - 반환값이 false인 경우 해당 ID의 공지사항이 존재하지 않았음을 의미합니다.
 * - 로깅을 통해 삭제 과정을 추적할 수 있습니다.
 * - 대량 삭제 시 성능을 고려하여 적절한 배치 처리가 필요할 수 있습니다.
 */
export const deleteNotice = async (noticeId) => {
  try {
    const deleted = await db.Notice.destroy({
      where: { noticeId },
    });
    return deleted > 0;
  } catch (error) {
    console.error('공지사항 삭제 DAO 오류:', error.message);
    throw error;
  }
};

/**
 * 공지사항 목록 조회
 *
 * 입력:
 * - userType: string — 조회할 사용자 유형 (선택사항)
 * - isVisible: boolean | string — 조회할 가시성 상태 (선택사항)
 *
 * 동작:
 * 1) 선택적 필터링 조건에 따라 공지사항 조회
 * 2) 생성일 기준 내림차순 정렬 (최신 공지순)
 * 3) 필터링 조건이 없는 경우 모든 공지사항 조회
 *
 * 필터링 조건:
 * - userType: 특정 사용자 유형의 공지사항만 조회
 * - isVisible: 가시성 상태에 따른 필터링
 *   - 'true' 또는 true: 표시 중인 공지사항
 *   - 'false' 또는 false: 숨겨진 공지사항
 *   - undefined: 모든 상태의 공지사항
 *
 * 정렬:
 * - createdAt DESC (최신 공지사항 순)
 *
 * 반환:
 * - Array<Object>: 필터링된 공지사항 배열
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 공지사항 목록을 다양한 조건으로 조회할 때 사용됩니다.
 * - 필터링 조건을 지정하지 않으면 모든 공지사항이 반환됩니다.
 * - isVisible 파라미터는 문자열('true', 'false') 또는 boolean 값 모두 지원합니다.
 * - 최신 공지사항이 먼저 표시되어 사용자 경험이 향상됩니다.
 * - 필터링 조건이 복잡한 경우 여러 번 호출하여 조합할 수 있습니다.
 * - 대량의 공지사항이 있을 경우 페이지네이션 고려가 필요할 수 있습니다.
 */
export const getNoticeList = async ({ userType, isVisible }) => {
  const where = {};
  if (userType) where.userType = userType;
  if (typeof isVisible !== 'undefined')
    where.isVisible = isVisible === 'true' || isVisible === true;

  return await db.Notice.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });
};
