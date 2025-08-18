/**
 * 상조팀장 캐시 환급 요청 관리 DAO (Data Access Object)
 * - 상조팀장이 보유한 캐시를 현금으로 환급받기 위한 요청을 관리하는 데이터베이스 작업을 담당합니다.
 * - 상조팀장 캐시 환급 요청 생성, 환급 요청 상태 관리 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 환급 금액 및 요청 정보 저장, 상태별 관리 (requested, approved, rejected, completed 등)를 지원합니다.
 * - 상조팀장이 서비스 이용을 위해 충전한 캐시를 현금으로 환급받고자 할 때 이 DAO를 통해 환급 요청을 생성하고, 관리자가 승인/거부 처리할 수 있습니다.
 */

import db from '../../models/index.js'; // 데이터베이스 연결 및 모델 인덱스

/**
 * 상조팀장 캐시 환급 요청 생성
 *
 * 입력:
 * - managerId: string|number — 상조팀장 고유 식별자 (ID)
 * - amount: number — 환급 요청 금액 (원 단위)
 * - status: string — 환급 요청 상태 (기본값: 'requested')
 *   - 'requested': 요청됨 (기본값)
 *   - 'approved': 승인됨
 *   - 'rejected': 거부됨
 *   - 'completed': 완료됨
 *   - 'cancelled': 취소됨
 *
 * 동작:
 * 1) 입력받은 파라미터로 새로운 환급 요청 레코드 생성
 * 2) refundAmount 필드에 환급 요청 금액을 저장 (필드명 일치)
 * 3) status는 기본값 'requested'로 설정하여 대기 상태로 시작
 * 4) 오류 발생 시 상세한 오류 메시지와 함께 Error throw
 *
 * 생성 정보:
 * - managerId: 상조팀장 ID
 * - refundAmount: 환급 요청 금액 (필드명 일치)
 * - status: 환급 요청 상태
 * - 자동 생성: ID, createdAt, updatedAt
 * - adminMemo: 관리자 메모 필드 (필요시 추가 가능)
 *
 * 반환:
 * - Object: 생성된 환급 요청 객체
 *   - id: 환급 요청 고유 ID
 *   - managerId: 상조팀장 ID
 *   - refundAmount: 환급 요청 금액
 *   - status: 요청 상태
 *   - createdAt: 생성 일시
 *   - updatedAt: 수정 일시
 *
 * 예외:
 * - DB 생성 실패: '환급 요청 저장 실패: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 상조팀장이 보유한 캐시를 현금으로 환급받기 위한 요청을 생성합니다.
 * - 이 요청은 관리자의 승인을 거쳐야 실제 환급이 진행됩니다.
 * - ManagerCashRefundRequest 모델을 사용하여 새로운 환급 요청 레코드를 생성합니다.
 * - refundAmount 필드에 환급 요청 금액을 저장하여 필드명을 일치시킵니다.
 * - status는 기본값 'requested'로 설정하여 대기 상태로 시작합니다.
 * - 관리자 메모 필드(adminMemo)는 필요시 추가할 수 있습니다.
 * - 데이터베이스 저장 실패 시 구체적인 오류 메시지와 함께 에러가 발생합니다.
 * - 개발자와 사용자 모두에게 명확한 오류 정보를 제공합니다.
 */
export const create = async ({ managerId, amount, status = 'requested' }) => {
  try {
    // ManagerCashRefundRequest 모델을 사용하여 새로운 환급 요청 레코드 생성
    // refundAmount 필드에 환급 요청 금액을 저장 (필드명 일치)
    // status는 기본값 'requested'로 설정하여 대기 상태로 시작
    return await db.ManagerCashRefundRequest.create({
      managerId, // 상조팀장 ID
      refundAmount: amount, // 환급 요청 금액 (필드명 일치)
      status, // 환급 요청 상태
      // adminMemo: ... // 관리자 메모 필드 (필요시 추가 가능)
    });
  } catch (error) {
    // 데이터베이스 저장 실패 시 구체적인 오류 메시지와 함께 에러 발생
    // 개발자와 사용자 모두에게 명확한 오류 정보 제공
    throw new Error('환급 요청 저장 실패: ' + error.message);
  }
};
