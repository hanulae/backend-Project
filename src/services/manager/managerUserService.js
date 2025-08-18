/**
 * 상조팀장 사용자 관리 서비스
 * - 상조팀장의 회원가입, 아이디 중복 확인, 프로필 조회, 상세 정보 조회 등의 사용자 관련 기능을 제공합니다.
 * - 회원가입 시 필수 필드 검증, 전화번호 및 계좌번호 형식 검증, 파일 업로드 처리 등을 수행합니다.
 * - 트랜잭션을 사용하여 상조팀장 생성, 문서 저장, 초기 캐시 지급 등의 작업을 원자적으로 처리합니다.
 * - 보안을 위해 프로필 조회 시 비밀번호를 제외한 안전한 데이터만 반환합니다.
 * - 초기 서비스 제공을 위한 50,000원의 캐시를 자동으로 지급합니다.
 */
import db from '../../models/index.js';
import * as managerUserDao from '../../daos/manager/managerUserDao.js';
import * as managerAddDocumentDao from '../../daos/admin/managerAddDocumentDao.js';

import * as managerCashHistoryDao from '../../daos/manager/managerCashHistoryDao.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 상조팀장 회원가입
 *
 * 입력:
 * - params: Object — {
 *   managerUsername: string — 상조팀장 아이디,
 *   managerPassword: string — 상조팀장 비밀번호,
 *   managerName: string — 상조팀장 이름,
 *   managerPhoneNumber: string — 상조팀장 전화번호,
 *   managerBankName: string — 은행명,
 *   managerBankNumber: string — 계좌번호,
 *   files?: Array<Object> — 업로드된 파일 배열 (선택사항)
 * }
 *
 * 동작:
 * 1) 필수 필드 누락 여부 검증
 * 2) 전화번호 형식 검증 (한국 휴대폰 번호 형식)
 * 3) 계좌번호 형식 검증 (숫자만, 10~14자리)
 * 4) 데이터베이스 트랜잭션 시작
 * 5) 상조팀장 기본 정보 생성
 * 6) 업로드된 파일이 있는 경우 문서 정보 저장
 * 7) 초기 캐시 히스토리 생성 (50,000원)
 * 8) Manager 테이블에 초기 포인트(0)와 캐시(50,000원) 설정
 * 9) 트랜잭션 커밋 및 결과 반환
 *
 * 필수 필드 검증:
 * - managerUsername: 상조팀장 아이디
 * - managerPassword: 상조팀장 비밀번호
 * - managerName: 상조팀장 이름
 * - managerPhoneNumber: 상조팀장 전화번호
 * - managerBankName: 은행명
 * - managerBankNumber: 계좌번호
 *
 * 형식 검증:
 * - 전화번호: /^01([0|1|6|7|8|9])([0-9]{3,4})([0-9]{4})$/
 *   * 010, 011, 016, 017, 018, 019로 시작
 *   * 총 11자리 숫자
 * - 계좌번호: /^\d{10,14}$/
 *   * 숫자만 허용
 *   * 10~14자리 길이
 *
 * 트랜잭션 처리:
 * - 상조팀장 생성, 문서 저장, 캐시 히스토리 생성, 초기 잔액 설정을 하나의 트랜잭션으로 처리
 * - 오류 발생 시 모든 작업을 롤백하여 데이터 일관성 보장
 * - 수동 폴백: 이메일이 있는 경우 생성된 계정 삭제
 *
 * 초기 자금 지급:
 * - managerPoint: 0 (포인트는 서비스 이용을 통해 적립)
 * - managerCash: 50,000원 (초기 서비스 제공을 위한 기본 자금)
 * - 캐시 히스토리에 'service_cash' 타입으로 기록
 *
 * 파일 처리:
 * - files 배열이 있는 경우에만 문서 정보 저장
 * - 각 파일의 location(URL)과 originalname을 저장
 * - managerAddDocumentDao를 통해 문서 정보를 데이터베이스에 저장
 *
 * 반환:
 * - Object: {
 *   manager: Object — 생성된 상조팀장 정보,
 *   fileUrls: Array<string> — 업로드된 파일 URL 배열 (파일이 있는 경우에만)
 * }
 *
 * 예외:
 * - 필수 필드 누락: '다음 필수 정보가 누락되었습니다: {필드명들}'
 * - 전화번호 형식 오류: '유효한 휴대폰 번호 형식이 아닙니다.'
 * - 계좌번호 형식 오류: '유효한 계좌번호 형식이 아닙니다. 숫자만 입력해주세요.'
 * - DB 오류: 원본 오류를 그대로 전파
 * - 트랜잭션 실패: 모든 작업 롤백 후 오류 발생
 *
 * 보안:
 * - 트랜잭션을 통한 데이터 일관성 보장
 * - 필수 필드 검증으로 불완전한 데이터 저장 방지
 * - 형식 검증으로 잘못된 데이터 입력 방지
 * - 오류 발생 시 생성된 데이터 자동 정리
 *
 * 참고:
 * - 이 함수는 상조팀장의 완전한 계정 생성을 담당합니다.
 * - 초기 50,000원은 서비스 이용을 위한 기본 자금으로 제공됩니다.
 * - 포인트는 서비스 이용을 통해 적립되며, 초기값은 0입니다.
 * - 파일 업로드는 선택사항이며, 파일이 없는 경우에도 계정 생성이 가능합니다.
 * - 은행 예금주는 상조팀장 이름과 동일하게 설정됩니다.
 */
export const registerManager = async (params) => {
  const missingFields = [];

  if (!params.managerUsername) missingFields.push('managerUsername');
  if (!params.managerPassword) missingFields.push('managerPassword');
  if (!params.managerName) missingFields.push('managerName');
  if (!params.managerPhoneNumber) missingFields.push('managerPhoneNumber');
  if (!params.managerBankName) missingFields.push('managerBankName');
  if (!params.managerBankNumber) missingFields.push('managerBankNumber');

  if (missingFields.length > 0) {
    throw new Error(`다음 필수 정보가 누락되었습니다: ${missingFields.join(', ')}`);
  }

  // // ✅ 이메일 형식 검증
  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // if (!emailRegex.test(params.managerEmail)) {
  //   throw new Error('유효한 이메일 형식이 아닙니다.');
  // }

  // ✅ 핸드폰 번호 형식 검증 (대한민국 기준)
  const phoneRegex = /^01([0|1|6|7|8|9])([0-9]{3,4})([0-9]{4})$/;
  if (!phoneRegex.test(params.managerPhoneNumber)) {
    throw new Error('유효한 휴대폰 번호 형식이 아닙니다.');
  }

  // ✅ 계좌번호 형식 검증 (숫자만, 10~14자리 정도 허용)
  const accountRegex = /^\d{10,14}$/;
  if (!accountRegex.test(params.managerBankNumber)) {
    throw new Error('유효한 계좌번호 형식이 아닙니다. 숫자만 입력해주세요.');
  }

  const transaction = await db.sequelize.transaction();

  try {
    // 1. 상조팀장 생성
    const managerData = {
      managerUsername: params.managerUsername,
      managerPassword: params.managerPassword,
      managerName: params.managerName,
      managerPhoneNumber: params.managerPhoneNumber,
      managerBankName: params.managerBankName,
      managerBankNumber: params.managerBankNumber,
      managerBankHolder: params.managerName,
    };

    const result = await managerUserDao.insert(managerData, { transaction });

    // 2. 문서 정보 저장 (files 배열이 있는 경우에만)
    const fileUrls = [];
    if (params.files && params.files.length > 0) {
      for (const file of params.files) {
        const fileUrl = file.location;
        const fileName = file.originalname;
        fileUrls.push(fileUrl);

        await managerAddDocumentDao.create(
          {
            managerId: result.managerId,
            managerDocName: fileName,
            managerDocPath: fileUrl,
          },
          { transaction },
        );
      }
    }

    // // 3. 포인트 히스토리 초기화
    // await managerPointHistoryDao.create(
    //   {
    //     managerId: result.managerId,
    //     transactionType: 'service_point',
    //     managerPointAmount: 50000,
    //     managerPointBalanceAfter: 50000,
    //     status: 'completed',
    //   },
    //   { transaction },
    // );

    // 4. 캐시 히스토리 초기화
    await managerCashHistoryDao.create(
      {
        managerId: result.managerId,
        transactionType: 'service_cash',
        managerCashAmount: 50000,
        managerCashBalanceAfter: 50000,
        status: 'completed',
      },
      { transaction },
    );

    // 🔁 실제 Manager 테이블 업데이트
    await db.Manager.update(
      {
        managerPoint: 0,
        managerCash: 50000,
      },
      { where: { managerId: result.managerId }, transaction },
    );

    await transaction.commit();
    return {
      manager: result,
      fileUrls, // files 배열이 있는 경우에만 fileUrls 반환
    };
  } catch (error) {
    await transaction.rollback();
    // ✅ 실패 시 생성된 상조팀장 계정 삭제 (manual fallback)
    if (params.managerEmail) {
      await managerUserDao.deleteByEmail(params.managerEmail);
    }

    throw error;
  }
};

/**
 * 상조팀장 아이디 중복 확인
 *
 * 입력:
 * - managerUsername: string — 확인할 상조팀장 아이디
 *
 * 동작:
 * - managerUsername으로 데이터베이스에서 상조팀장 조회
 * - 조회 결과에 따라 아이디 사용 가능 여부 반환
 *
 * 중복 확인 로직:
 * - 데이터베이스에서 해당 아이디로 상조팀장 검색
 * - 검색 결과가 없으면 아이디 사용 가능 (true 반환)
 * - 검색 결과가 있으면 아이디 중복 (false 반환)
 *
 * 반환:
 * - boolean: true — 아이디 사용 가능, false — 아이디 중복
 *
 * 예외:
 * - DB 조회 실패: '아이디 중복 확인 서비스 오류: {원인}' 형태로 콘솔에 기록
 * - 기타 오류: 원본 오류를 그대로 전파
 *
 * 로깅:
 * - 오류 발생 시 콘솔에 '아이디 중복 확인 서비스 오류:' 형태로 기록
 * - 오류 메시지와 원인을 함께 기록
 *
 * 참고:
 * - 이 함수는 회원가입 전 아이디 중복 여부를 확인하는 데 사용됩니다.
 * - true 반환 시 해당 아이디로 회원가입이 가능합니다.
 * - false 반환 시 다른 아이디를 선택해야 합니다.
 * - DB 연결 오류나 기타 시스템 오류에 대한 예외 처리가 포함되어 있습니다.
 */
export const isUsernameAvailable = async (managerUsername) => {
  try {
    const manager = await managerUserDao.findByUsername(managerUsername);
    return !manager; // Return true if no manager is found, meaning the username is available
  } catch (error) {
    console.error('아이디 중복 확인 서비스 오류:', error.message);
    throw error;
  }
};

/**
 * 상조팀장 내 프로필 조회
 *
 * 입력:
 * - managerId: string — 조회할 상조팀장 ID
 *
 * 동작:
 * - managerId로 상조팀장 정보 조회
 * - 상조팀장 존재 여부 확인
 * - 비밀번호를 제외한 안전한 데이터만 반환
 *
 * 보안 처리:
 * - toSafeObject() 메서드를 사용하여 민감한 정보 제거
 * - 비밀번호 등 보안에 민감한 필드는 반환하지 않음
 * - 사용자 인증 후에만 호출되어야 함
 *
 * 반환:
 * - Object: 비밀번호가 제거된 안전한 상조팀장 정보
 *
 * 예외:
 * - 상조팀장 없음: '상조팀장 정보를 찾을 수 없습니다.'
 * - DB 조회 실패: '프로필 조회 실패: {원인}' 형태로 Error throw
 * - 기타 오류: 원본 오류를 포함한 상세 메시지
 *
 * 참고:
 * - 이 함수는 로그인한 상조팀장이 자신의 프로필을 조회할 때 사용됩니다.
 * - toSafeObject()는 모델에서 정의된 메서드로, 보안에 민감한 필드를 자동으로 제거합니다.
 * - 프로필 조회는 인증된 사용자만 접근할 수 있어야 합니다.
 * - 반환되는 데이터는 클라이언트에 안전하게 노출할 수 있는 정보만 포함합니다.
 */
export const getMyProfile = async (managerId) => {
  try {
    const manager = await managerUserDao.findById(managerId);

    if (!manager) {
      throw new Error('상조팀장 정보를 찾을 수 없습니다.');
    }

    return manager.toSafeObject(); // 비밀번호 제외한 안전한 데이터만 전달
  } catch (error) {
    throw new Error('프로필 조회 실패: ' + error.message);
  }
};

/**
 * 상조팀장 상세 정보 조회
 *
 * 입력:
 * - managerId: string — 조회할 상조팀장 ID
 *
 * 동작:
 * - managerId로 상조팀장의 모든 정보 조회
 * - DAO를 통해 데이터베이스에서 상조팀장 정보 검색
 * - 조회된 모든 정보를 그대로 반환 (보안 필터링 없음)
 *
 * 반환:
 * - Object: 상조팀장의 모든 정보 (비밀번호 포함)
 *
 * 예외:
 * - DB 조회 실패: DAO에서 발생한 오류 전파
 * - 상조팀장 없음: DAO에서 적절한 오류 발생
 *
 * 보안 주의사항:
 * - 이 함수는 모든 정보를 반환하므로 주의해서 사용해야 합니다.
 * - 비밀번호 등 민감한 정보가 포함될 수 있습니다.
 * - 관리자 권한이 있는 사용자만 호출해야 합니다.
 * - 클라이언트에 직접 노출하지 말고 필요한 정보만 추출하여 사용해야 합니다.
 *
 * 참고:
 * - 이 함수는 주로 관리자나 시스템 내부에서 사용됩니다.
 * - 사용자 인증이나 프로필 표시에는 getMyProfile()을 사용하는 것이 좋습니다.
 * - 반환되는 데이터는 데이터베이스에 저장된 모든 필드를 포함합니다.
 * - DAO에서 발생하는 모든 오류가 그대로 전파됩니다.
 */
export const getManagerById = async (managerId) => {
  return await managerUserDao.findById(managerId);
};
