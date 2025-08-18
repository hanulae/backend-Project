/**
 * 상조팀장 포인트 히스토리 관리 DAO (Data Access Object)
 * - 상조팀장의 포인트 거래 내역을 관리하는 데이터베이스 작업을 담당합니다.
 * - 포인트 히스토리는 모든 포인트 관련 거래(적립, 차감, 전환 등)의 기록을 추적하고 관리하기 위한 핵심 기능입니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 상조팀장 포인트 거래 내역 생성, 포인트 거래 타입별 기록 관리, 포인트 잔액 변화 추적 등의 기능을 제공합니다.
 * - 거래 상태 및 메타데이터 저장을 통해 포인트 시스템의 투명성을 보장합니다.
 * - 상조팀장이 서비스를 이용하면서 발생하는 모든 포인트 관련 거래를 투명하게 기록하여, 포인트 적립/차감 내역과 현재 잔액을 정확하게 추적할 수 있도록 합니다.
 *
 * 거래 타입 예시:
 * - 'earn_point': 포인트 적립 (서비스 이용 시)
 * - 'use_point': 포인트 사용 (서비스 결제 시)
 * - 'cash_the_point': 포인트를 현금으로 전환
 * - 'refund_point': 포인트 환불
 * - 'expire_point': 포인트 만료
 */

// dao/manager/managerPointHistoryDao.js
import db from '../../models/index.js'; // 데이터베이스 연결 및 모델 인덱스

/**
 * 포인트 히스토리 생성
 *
 * 입력:
 * - pointData: Object — 생성할 포인트 히스토리 데이터
 *   - managerId: string|number — 상조팀장 고유 식별자 (ID)
 *   - transactionType: string — 거래 타입 (예: 'earn_point', 'use_point', 'cash_the_point')
 *   - managerPointAmount: number — 거래 포인트 금액 (양수: 적립, 음수: 차감)
 *   - managerPointBalanceAfter: number — 거래 후 포인트 잔액
 *   - status: string — 거래 상태 (예: 'pending', 'completed', 'failed')
 *   - description: string — 거래 설명 (선택사항)
 *   - relatedTransactionId: string|number — 관련 거래 ID (선택사항)
 * - options: Object — 데이터베이스 옵션 (기본값: {})
 *   - transaction: 트랜잭션 객체 (데이터 일관성 보장)
 *   - validate: 데이터 검증 옵션
 *   - hooks: 모델 훅 실행 여부
 *
 * 동작:
 * 1) 입력받은 포인트 데이터로 새로운 히스토리 레코드 생성
 * 2) Sequelize 옵션을 포함하여 데이터 일관성 보장
 * 3) 오류 발생 시 콘솔에 로그 출력 후 원본 오류 전달
 *
 * 생성 정보:
 * - 포인트 거래 기본 정보 (매니저 ID, 거래 타입, 금액, 잔액)
 * - 거래 상태 및 메타데이터 (상태, 설명, 관련 거래 ID)
 * - 자동 생성: ID, createdAt, updatedAt
 * - 트랜잭션을 통한 안전한 데이터 저장
 *
 * 반환:
 * - Object: 생성된 포인트 히스토리 객체
 *   - id: 히스토리 고유 ID
 *   - managerId: 상조팀장 ID
 *   - transactionType: 거래 타입
 *   - managerPointAmount: 거래 포인트 금액
 *   - managerPointBalanceAfter: 거래 후 포인트 잔액
 *   - status: 거래 상태
 *   - description: 거래 설명
 *   - relatedTransactionId: 관련 거래 ID
 *   - createdAt: 생성 일시
 *   - updatedAt: 수정 일시
 *
 * 예외:
 * - DB 생성 실패: 콘솔에 오류 로그 출력 후 원본 오류 전달
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *
 * 참고:
 * - 이 함수는 상조팀장의 포인트 거래 내역을 데이터베이스에 기록하는 기본 함수입니다.
 * - 모든 포인트 관련 거래(적립, 차감, 전환 등)를 추적 가능한 형태로 저장하여 포인트 시스템의 투명성을 보장합니다.
 * - ManagerPointHistory 모델을 사용하여 새로운 포인트 히스토리 레코드를 생성합니다.
 * - pointData에는 포인트 거래에 필요한 모든 정보가 포함되어야 합니다.
 * - options를 통해 트랜잭션 등의 데이터베이스 옵션을 전달할 수 있습니다.
 * - 포인트 히스토리 생성 중 오류 발생 시 로그를 기록합니다.
 * - 개발자가 문제를 추적할 수 있도록 구체적인 오류 메시지를 출력합니다.
 * - 원본 오류를 그대로 전달하여 상위 레벨에서 적절한 오류 처리가 가능합니다.
 * - 이는 데이터베이스 제약 조건 위반, 유효성 검사 실패 등의 구체적인 오류 정보를 유지하기 위함입니다.
 */
export const create = async (pointData, options = {}) => {
  try {
    // ManagerPointHistory 모델을 사용하여 새로운 포인트 히스토리 레코드 생성
    // pointData에는 포인트 거래에 필요한 모든 정보가 포함되어야 함
    // options를 통해 트랜잭션 등의 데이터베이스 옵션 전달 가능
    const result = await db.ManagerPointHistory.create(pointData, options);
    return result;
  } catch (error) {
    // 포인트 히스토리 생성 중 오류 발생 시 로그 기록
    // 개발자가 문제를 추적할 수 있도록 구체적인 오류 메시지 출력
    console.error('포인트 히스토리 생성 오류:', error.message);

    // 원본 오류를 그대로 전달하여 상위 레벨에서 적절한 오류 처리 가능
    // 이는 데이터베이스 제약 조건 위반, 유효성 검사 실패 등의
    // 구체적인 오류 정보를 유지하기 위함입니다.
    throw error;
  }
};
