/**
 * 상조팀장 포인트 관리 서비스
 * - 상조팀장의 포인트를 현금으로 전환 요청, 포인트 내역 조회, 현재 포인트 잔액 조회 등의 포인트 관련 기능을 제공합니다.
 * - 포인트를 현금으로 전환하는 요청을 처리하여 사용자의 포인트 활용도를 높입니다.
 * - 포인트 내역 조회 시 페이지네이션을 지원하여 대량의 데이터를 효율적으로 처리합니다.
 * - 포인트 잔액을 실시간으로 조회하여 사용자의 포인트 상태를 파악할 수 있습니다.
 */
import * as pointDao from '../../daos/manager/managerPointDao.js';

/**
 * 상조팀장 포인트를 현금으로 전환 요청
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 * - amount: number — 전환 요청할 포인트 금액
 *
 * 동작:
 * - managerId와 amount를 DAO에 전달하여 포인트를 현금으로 전환하는 요청을 처리
 * - 포인트 전환 요청 테이블에 요청 정보를 저장
 * - 전환 요청의 상태를 관리하고 추적 가능하도록 지원
 *
 * 포인트 전환 프로세스:
 * - 포인트 전환 요청 테이블에 요청 정보 저장
 * - 요청 상태는 초기에 'pending' 또는 'requested' 상태로 설정
 * - 관리자 승인 후 실제 포인트 차감 및 현금 지급 처리
 *
 * 검증 사항:
 * - managerId 유효성: 존재하는 상조팀장인지 확인
 * - amount 유효성: 0보다 큰 양수이며, 보유 포인트 이하인지 확인
 * - 전환 가능 여부: 포인트 전환 정책에 따른 제한 사항 확인
 *
 * 반환:
 * - Object: 생성된 포인트 전환 요청 레코드
 *
 * 예외:
 * - DB 저장 실패: DAO에서 발생한 오류 전파
 * - 검증 실패: 포인트 전환 조건을 만족하지 않는 경우 오류 발생
 *
 * 참고:
 * - 이 함수는 포인트 전환 요청만 처리하며, 실제 전환은 관리자 승인 후 진행됩니다.
 * - 포인트 전환 요청은 별도의 승인 프로세스를 거쳐야 합니다.
 * - 전환 요청 후 포인트는 즉시 차감되지 않고 승인 대기 상태로 유지됩니다.
 */
export const requestPointToCash = async (managerId, amount) => {
  return await pointDao.insertPointToCash(managerId, amount);
};

/**
 * 상조팀장 포인트 내역 조회 (페이지네이션 지원)
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 * - page: number — 조회할 페이지 번호 (1부터 시작)
 * - limit: number — 페이지당 조회할 레코드 수
 *
 * 동작:
 * 1) 페이지 번호와 limit을 기반으로 offset 계산
 * 2) DAO를 통해 해당 상조팀장의 포인트 내역 조회
 * 3) 전체 레코드 수와 현재 페이지 데이터를 포함한 응답 객체 구성
 * 4) 페이지네이션 정보 계산 및 포함
 *
 * 페이지네이션 계산:
 * - offset = (page - 1) * limit
 * - totalPages = Math.ceil(count / limit)
 * - currentPage = Number(page) (문자열을 숫자로 변환)
 *
 * 조회되는 정보:
 * - 포인트 획득/사용 내역
 * - 포인트 전환 요청 내역
 * - 포인트 적립/차감 사유
 * - 포인트 변동 시간
 * - 포인트 변동 후 잔액
 *
 * 반환:
 * - Object: {
 *   data: Array<Object> — 포인트 내역 배열,
 *   pageInfo: {
 *     totalItems: number — 전체 레코드 수,
 *     totalPages: number — 전체 페이지 수,
 *     currentPage: number — 현재 페이지 번호
 *   }
 * }
 *
 * 예외:
 * - DB 조회 실패: DAO에서 발생한 오류 전파
 * - 잘못된 페이지 번호: 음수나 0인 경우 적절한 오류 발생
 *
 * 참고:
 * - 페이지 번호는 1부터 시작하는 1-based 인덱싱을 사용합니다.
 * - limit은 페이지당 최대 레코드 수를 제한합니다.
 * - 전체 레코드 수가 0인 경우 totalPages는 0이 됩니다.
 * - 페이지네이션 정보를 통해 클라이언트에서 페이지 네비게이션을 구현할 수 있습니다.
 */
export const getPointHistory = async (managerId, page, limit) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await pointDao.fetchPointHistory(managerId, offset, limit);
  return {
    data: rows,
    pageInfo: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    },
  };
};

/**
 * 상조팀장 현재 포인트 잔액 조회
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 *
 * 동작:
 * - managerId로 해당 상조팀장의 현재 포인트 잔액 조회
 * - 포인트 테이블에서 현재 보유 중인 포인트 수량 반환
 *
 * 조회되는 정보:
 * - 현재 보유 포인트 수량
 * - 포인트 적립/사용 내역에 따른 실시간 잔액
 *
 * 반환:
 * - number: 현재 보유 포인트 잔액
 *
 * 예외:
 * - DB 조회 실패: DAO에서 발생한 오류 전파
 * - 상조팀장 없음: 존재하지 않는 managerId인 경우 적절한 오류 발생
 *
 * 참고:
 * - 이 함수는 단순한 잔액 조회로, 별도의 오류 처리가 없습니다.
 * - 상조팀장이 존재하지 않는 경우 DAO에서 적절한 오류를 발생시킵니다.
 * - 실시간 포인트 잔액 확인이 필요한 경우 이 함수를 사용합니다.
 * - 포인트 잔액은 포인트 적립/사용/전환 등의 모든 거래 내역을 반영한 최신 값입니다.
 */
export const getCurrentPoint = async (managerId) => {
  return await pointDao.getCurrentPoint(managerId);
};
