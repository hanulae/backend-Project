/**
 * 관리자 캐시 환급 관리 DAO (Data Access Object)
 * - 상조팀장과 장례식장의 캐시 환급 요청 관련 데이터베이스 작업을 담당합니다.
 * - 환급 요청 조회, 승인 상태 관리, 환급 완료 내역 추적 등의 기능을 제공합니다.
 * - Sequelize ORM을 사용하여 데이터베이스와의 상호작용을 처리합니다.
 * - 환급 요청의 전체적인 라이프사이클을 관리하고 추적할 수 있도록 지원합니다.
 * - 관리자가 환급 시스템을 체계적으로 관리하고 모니터링할 수 있도록 합니다.
 */
import db from '../../models/index.js';

/**
 * 상조팀장 환급 요청 전체 조회
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) 데이터베이스에서 모든 상조팀장의 캐시 환급 요청 조회
 * 2) 상조팀장 정보를 포함하여 반환
 * 3) 생성일 기준 내림차순 정렬 (최신 요청순)
 *
 * 조회 조건:
 * - 모든 환급 요청 (상태 구분 없음)
 * - 정렬: createdAt DESC (최신 요청순)
 *
 * 포함 정보:
 * - 상조팀장 기본 정보 (아이디, 이름, 연락처 등)
 * - 환급 요청 상세 정보 (금액, 사유, 상태, 요청일 등)
 *
 * 반환:
 * - Array<Object>: 상조팀장 환급 요청 배열 (상조팀장 정보 포함)
 *
 * 예외:
 * - DB 조회 실패: '상조팀장 환급 요청 DAO 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자 대시보드에서 전체 상조팀장의 환급 요청 현황을 파악하는 데 사용됩니다.
 * - 모든 상태의 환급 요청을 포함하므로 승인 대기, 승인, 거부 등을 구분하여 처리해야 합니다.
 * - 대량의 데이터가 있을 경우 페이지네이션 고려가 필요할 수 있습니다.
 */
export const findManagerRefundRequests = async () => {
  try {
    return await db.ManagerCashRefundRequest.findAll({
      include: [
        {
          model: db.Manager,
          as: 'manager',
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('상조팀장 환급 요청 DAO 오류: ' + error.message);
  }
};

/**
 * 장례식장 환급 요청 전체 조회
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) 데이터베이스에서 모든 장례식장의 캐시 환급 요청 조회
 * 2) 장례식장 정보를 포함하여 반환
 * 3) 생성일 기준 내림차순 정렬 (최신 요청순)
 *
 * 조회 조건:
 * - 모든 환급 요청 (상태 구분 없음)
 * - 정렬: createdAt DESC (최신 요청순)
 *
 * 포함 정보:
 * - 장례식장 기본 정보 (이름, 주소, 연락처 등)
 * - 환급 요청 상세 정보 (금액, 사유, 상태, 요청일 등)
 *
 * 반환:
 * - Array<Object>: 장례식장 환급 요청 배열 (장례식장 정보 포함)
 *
 * 예외:
 * - DB 조회 실패: '장례식장 환급 요청 DAO 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자 대시보드에서 전체 장례식장의 환급 요청 현황을 파악하는 데 사용됩니다.
 * - 모든 상태의 환급 요청을 포함하므로 승인 대기, 승인, 거부 등을 구분하여 처리해야 합니다.
 * - 대량의 데이터가 있을 경우 페이지네이션 고려가 필요할 수 있습니다.
 */
export const findFuneralRefundRequests = async () => {
  try {
    return await db.FuneralCashRefundRequest.findAll({
      include: [
        {
          model: db.Funeral,
          as: 'funeral',
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('장례식장 환급 요청 DAO 오류: ' + error.message);
  }
};

/**
 * 상조팀장 환급 요청 단건 조회
 *
 * 입력:
 * - requestId: string — 조회할 환급 요청의 고유 ID
 *
 * 동작:
 * 1) requestId로 특정 상조팀장 환급 요청 조회
 * 2) 해당 환급 요청의 상세 정보 반환
 *
 * 조회 조건:
 * - requestId와 일치하는 환급 요청 레코드
 *
 * 반환:
 * - Object: 상조팀장 환급 요청 상세 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '상조팀장 환급 요청 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 환급 요청의 상세 정보를 확인할 때 사용됩니다.
 * - 관리자가 환급 요청을 승인/거부하기 전에 상세 내용을 검토할 때 활용됩니다.
 * - 반환값이 null인 경우 해당 ID의 환급 요청이 존재하지 않음을 의미합니다.
 */
export const findManagerRefundById = async (requestId) => {
  try {
    return await db.ManagerCashRefundRequest.findByPk(requestId);
  } catch (error) {
    throw new Error('상조팀장 환급 요청 조회 오류: ' + error.message);
  }
};

/**
 * 상조팀장 정보 조회
 *
 * 입력:
 * - managerId: string — 조회할 상조팀장의 고유 ID
 *
 * 동작:
 * 1) managerId로 특정 상조팀장 정보 조회
 * 2) 상조팀장의 기본 정보 반환
 *
 * 조회 조건:
 * - managerId와 일치하는 상조팀장 레코드
 *
 * 반환:
 * - Object: 상조팀장 기본 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '상조팀장 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 환급 요청 처리 시 상조팀장의 현재 정보를 확인하는 데 사용됩니다.
 * - 환급 승인 전 상조팀장의 캐시 잔액, 계좌 정보 등을 검증할 때 활용됩니다.
 * - 반환값이 null인 경우 해당 ID의 상조팀장이 존재하지 않음을 의미합니다.
 */
export const findManagerById = async (managerId) => {
  try {
    return await db.Manager.findByPk(managerId);
  } catch (error) {
    throw new Error('상조팀장 조회 오류: ' + error.message);
  }
};

/**
 * 장례식장 환급 요청 단건 조회
 *
 * 입력:
 * - id: string — 조회할 환급 요청의 고유 ID
 *
 * 동작:
 * 1) id로 특정 장례식장 환급 요청 조회
 * 2) 해당 환급 요청의 상세 정보 반환
 *
 * 조회 조건:
 * - id와 일치하는 환급 요청 레코드
 *
 * 반환:
 * - Object: 장례식장 환급 요청 상세 정보 (null일 수 있음)
 *
 * 예외:
 * - DB 조회 실패: '장례식장 환급 요청 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 장례식장 환급 요청의 상세 정보를 확인할 때 사용됩니다.
 * - 관리자가 환급 요청을 승인/거부하기 전에 상세 내용을 검토할 때 활용됩니다.
 * - 반환값이 null인 경우 해당 ID의 환급 요청이 존재하지 않음을 의미합니다.
 */
export const findFuneralRefundById = async (id) => {
  try {
    return await db.FuneralCashRefundRequest.findByPk(id);
  } catch (error) {
    throw new Error('장례식장 환급 요청 조회 오류: ' + error.message);
  }
};

/**
 * 상조팀장 환급 완료 내역 조회
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) 데이터베이스에서 승인된 상조팀장 환급 요청만 조회
 * 2) 상조팀장 정보를 포함하여 반환
 * 3) 수정일 기준 내림차순 정렬 (최신 완료순)
 *
 * 조회 조건:
 * - status: 'approved' (승인된 환급 요청만)
 * - 정렬: updatedAt DESC (최신 완료순)
 *
 * 포함 정보:
 * - 상조팀장 기본 정보 (아이디, 이름, 연락처 등)
 * - 환급 완료 상세 정보 (금액, 승인일, 처리자 등)
 *
 * 반환:
 * - Array<Object>: 승인된 상조팀장 환급 요청 배열 (상조팀장 정보 포함)
 *
 * 예외:
 * - DB 조회 실패: Sequelize에서 발생한 데이터베이스 오류 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자가 승인된 환급 내역을 추적하고 보고서를 작성할 때 사용됩니다.
 * - 승인 상태('approved')인 환급 요청만 조회하므로 처리 완료된 건들만 포함됩니다.
 * - updatedAt은 환급 요청이 승인된 시간을 의미합니다.
 * - 비밀번호 필드는 기본적으로 제외되지만 필요시 주석 해제하여 포함할 수 있습니다.
 */
export const getManagerCashRefundHistory = async () => {
  return await db.ManagerCashRefundRequest.findAll({
    where: { status: 'approved' },
    order: [['updatedAt', 'DESC']],
    include: [
      {
        model: db.Manager,
        as: 'manager',
        // attributes: { exclude: ['managerPassword'] }, // 필요시
      },
    ],
  });
};

/**
 * 장례식장 환급 완료 내역 조회
 *
 * 입력:
 * - 없음
 *
 * 동작:
 * 1) 데이터베이스에서 승인된 장례식장 환급 요청만 조회
 * 2) 장례식장 정보를 포함하여 반환
 * 3) 수정일 기준 내림차순 정렬 (최신 완료순)
 *
 * 조회 조건:
 * - status: 'approved' (승인된 환급 요청만)
 * - 정렬: updatedAt DESC (최신 완료순)
 *
 * 포함 정보:
 * - 장례식장 기본 정보 (이름, 주소, 연락처 등)
 * - 환급 완료 상세 정보 (금액, 승인일, 처리자 등)
 *
 * 반환:
 * - Array<Object>: 승인된 장례식장 환급 요청 배열 (장례식장 정보 포함)
 *
 * 예외:
 * - DB 조회 실패: Sequelize에서 발생한 데이터베이스 오류 전파
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 관리자가 승인된 장례식장 환급 내역을 추적하고 보고서를 작성할 때 사용됩니다.
 * - 승인 상태('approved')인 환급 요청만 조회하므로 처리 완료된 건들만 포함됩니다.
 * - updatedAt은 환급 요청이 승인된 시간을 의미합니다.
 * - 비밀번호 필드는 기본적으로 제외되지만 필요시 주석 해제하여 포함할 수 있습니다.
 */
export const getFuneralCashRefundHistory = async () => {
  return await db.FuneralCashRefundRequest.findAll({
    where: { status: 'approved' },
    order: [['updatedAt', 'DESC']],
    include: [
      {
        model: db.Funeral,
        as: 'funeral',
        // attributes: { exclude: ['funeralPassword'] }, // 필요시
      },
    ],
  });
};

/**
 * 특정 상조팀장의 환급 신청 내역 조회
 *
 * 입력:
 * - managerId: string — 조회할 상조팀장의 고유 ID
 *
 * 동작:
 * 1) 특정 상조팀장 ID로 모든 환급 신청 내역 조회
 * 2) 상조팀장 정보를 포함하여 반환 (비밀번호 제외)
 * 3) 생성일 기준 내림차순 정렬 (최신 신청순)
 *
 * 조회 조건:
 * - managerId와 일치하는 환급 요청
 * - 정렬: createdAt DESC (최신 신청순)
 *
 * 포함 정보:
 * - 상조팀장 기본 정보 (비밀번호 제외)
 * - 환급 신청 상세 정보 (금액, 사유, 상태, 신청일 등)
 *
 * 보안:
 * - managerPassword 필드는 자동으로 제외됨
 *
 * 반환:
 * - Array<Object>: 특정 상조팀장의 환급 신청 내역 배열
 *
 * 예외:
 * - DB 조회 실패: '상조팀장 환급 신청 내역 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 상조팀장의 환급 신청 이력을 상세히 조회하는 데 사용됩니다.
 * - 관리자가 특정 상조팀장의 환급 현황을 파악할 때 활용됩니다.
 * - 모든 상태의 환급 신청을 포함하므로 승인 대기, 승인, 거부 등을 구분하여 처리해야 합니다.
 * - 비밀번호는 보안상 자동으로 제외됩니다.
 */
export const findManagerRefundsByUserId = async (managerId) => {
  try {
    return await db.ManagerCashRefundRequest.findAll({
      where: { managerId },
      include: [
        {
          model: db.Manager,
          as: 'manager', // 관계 설정 시 사용한 별칭
          attributes: { exclude: ['managerPassword'] }, // 비밀번호 제외
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('상조팀장 환급 신청 내역 조회 오류: ' + error.message);
  }
};

/**
 * 특정 장례식장의 환급 신청 내역 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장의 고유 ID
 *
 * 동작:
 * 1) 특정 장례식장 ID로 모든 환급 신청 내역 조회
 * 2) 장례식장 정보를 포함하여 반환 (비밀번호 제외)
 * 3) 생성일 기준 내림차순 정렬 (최신 신청순)
 *
 * 조회 조건:
 * - funeralId와 일치하는 환급 요청
 * - 정렬: createdAt DESC (최신 신청순)
 *
 * 포함 정보:
 * - 장례식장 기본 정보 (비밀번호 제외)
 * - 환급 신청 상세 정보 (금액, 사유, 상태, 신청일 등)
 *
 * 보안:
 * - funeralPassword 필드는 자동으로 제외됨
 *
 * 반환:
 * - Array<Object>: 특정 장례식장의 환급 신청 내역 배열
 *
 * 예외:
 * - DB 조회 실패: '장례식장 환급 신청 내역 조회 오류: {오류메시지}' 형태로 Error throw
 * - DB 연결 오류: Sequelize에서 발생한 데이터베이스 오류 전파
 *

 *
 * 참고:
 * - 이 함수는 특정 장례식장의 환급 신청 이력을 상세히 조회하는 데 사용됩니다.
 * - 관리자가 특정 장례식장의 환급 현황을 파악할 때 활용됩니다.
 * - 모든 상태의 환급 신청을 포함하므로 승인 대기, 승인, 거부 등을 구분하여 처리해야 합니다.
 * - 비밀번호는 보안상 자동으로 제외됩니다.
 */
export const findFuneralRefundsByUserId = async (funeralId) => {
  try {
    return await db.FuneralCashRefundRequest.findAll({
      where: { funeralId },
      include: [
        {
          model: db.Funeral,
          as: 'funeral', // 관계 설정 시 사용한 별칭
          attributes: { exclude: ['funeralPassword'] }, // 비밀번호 제외
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('장례식장 환급 신청 내역 조회 오류: ' + error.message);
  }
};
