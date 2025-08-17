/**
 * 장례식장 사용자 관리 서비스
 * - 장례식장 회원가입, 프로필 조회, 사용자명 중복 확인 등의 기능을 제공합니다.
 * - 회원가입 시 필수 정보 검증, 파일 업로드 처리, 초기 캐시 지급, 약관 동의 정보 저장을 수행합니다.
 * - 트랜잭션을 사용하여 회원가입 과정의 데이터 정합성을 보장합니다.
 * - 상조팀장과 장례식장 사용자 타입을 구분하여 처리합니다.
 */
import db from '../../models/index.js';
import * as funeralUserDao from '../../daos/funeral/funeralUserDao.js';
import * as funeralAddDocumentDao from '../../daos/admin/funeralAddDocumentDao.js';
import * as funeralCashHistoryDao from '../../daos/funeral/funeralCashHistoryDao.js';

/**
 * 장례식장 회원가입
 *
 * 입력:
 * - params: Object — 회원가입에 필요한 정보
 *   - funeralUsername: string — 장례식장 사용자명 (필수)
 *   - funeralPassword: string — 장례식장 비밀번호 (필수)
 *   - funeralName: string — 장례식장 이름 (필수)
 *   - funeralPhoneNumber: string — 장례식장 휴대폰 번호 (필수)
 *   - funeralBankName: string — 은행명 (필수)
 *   - funeralBankNumber: string — 계좌번호 (필수)
 *   - funeralBankHolder: string — 예금주명 (필수)
 *   - funeralHome: string — 장례식장 주소 (선택사항)
 *   - files: Array<Object> — 업로드된 파일 배열 (선택사항)
 *     - originalname: string — 원본 파일명
 *     - location: string — 파일 저장 경로
 *   - userType: string — 사용자 타입 ('manager' 또는 'funeral')
 *   - serviceAgreement: boolean — 서비스 이용약관 동의 여부
 *   - personalInfoAgreement: boolean — 개인정보 처리방침 동의 여부
 *   - locationInfoAgreement: boolean — 위치정보 이용약관 동의 여부
 *   - age14OrOlderAgreement: boolean — 14세 이상 동의 여부
 *   - marketingInfoAgreement: boolean — 마케팅 정보 수신 동의 여부
 *
 * 동작:
 * 1) 필수 정보 누락 여부 검증
 * 2) 트랜잭션 시작
 * 3) 장례식장 기본 정보를 funeralUserDao를 통해 생성
 * 4) 파일이 있는 경우 funeralAddDocumentDao를 통해 각 파일 정보 저장
 * 5) 초기 서비스 캐시 5만원 지급 (funeralCashHistoryDao)
 * 6) 장례식장 테이블에 초기 포인트(0)와 캐시(5만원) 설정
 * 7) 약관 동의 정보를 userType에 따라 적절한 테이블에 저장
 * 8) 트랜잭션 커밋 후 결과 반환
 *
 * 필수 검증:
 * - funeralUsername, funeralPassword, funeralName, funeralPhoneNumber
 * - funeralBankName, funeralBankNumber, funeralBankHolder
 * - files 필드는 선택사항으로 변경됨 (기존 필수에서 제거)
 *
 * 초기 지급:
 * - 서비스 캐시: 50,000원 (service_cash 타입, completed 상태)
 * - 포인트: 0원
 * - 캐시 잔액: 50,000원
 *
 * 파일 처리:
 * - files 배열이 존재하고 비어있지 않은 경우에만 처리
 * - 각 파일에 대해 funeralId와 연결하여 문서 정보 저장
 * - 파일명(originalname)과 저장 경로(location) 저장
 *
 * 약관 동의:
 * - userType이 'manager'인 경우 managerId와 연결
 * - userType이 'funeral'인 경우 funeralId와 연결
 * - 모든 약관 동의 정보는 필수로 저장
 *
 * 반환:
 * - Object: { funeral, fileCount }
 *   - funeral: Object — 생성된 장례식장 정보
 *   - fileCount: number — 업로드된 파일 개수 (0 또는 실제 파일 개수)
 *
 * 예외:
 * - 필수 정보 누락: '필수 정보가 누락되었습니다.'
 * - 회원가입 실패: '회원가입 중 오류 발생: {원인}' 형태로 Error throw
 * - 파일 저장 실패: 트랜잭션 롤백 후 오류 전파
 * - 캐시 지급 실패: 트랜잭션 롤백 후 오류 전파
 * - 약관 동의 저장 실패: 트랜잭션 롤백 후 오류 전파
 *
 * 데이터 정합성:
 * - 모든 회원가입 과정이 트랜잭션으로 묶여 있어, 하나라도 실패하면 전체 롤백됩니다.
 * - 초기 캐시 지급과 잔액 설정이 동시에 처리되어 데이터 일관성을 보장합니다.
 */
export const registerFuneral = async (params) => {
  if (
    !params.funeralUsername ||
    !params.funeralPassword ||
    !params.funeralName ||
    !params.funeralPhoneNumber ||
    !params.funeralBankName ||
    !params.funeralBankNumber ||
    !params.funeralBankHolder
    // 'files' 필드에 대한 필수 검사 제거
    // !params.files ||
    // !Array.isArray(params.files) ||
    // params.files.length === 0
  ) {
    throw new Error('필수 정보가 누락되었습니다.');
  }

  const transaction = await db.sequelize.transaction();

  try {
    const funeralData = {
      funeralUsername: params.funeralUsername,
      funeralPassword: params.funeralPassword,
      funeralName: params.funeralName,
      funeralPhoneNumber: params.funeralPhoneNumber,
      funeralBankName: params.funeralBankName,
      funeralBankNumber: params.funeralBankNumber,
      funeralBankHolder: params.funeralBankHolder,
      funeralHome: params.funeralHome || null,
    };
    console.log('🚀 ~ registerFuneral ~ funeralData:', funeralData);

    const result = await funeralUserDao.insert(funeralData, transaction);

    // ✅ 여러 파일 반복 저장 (files 배열이 있는 경우에만)
    if (params.files && Array.isArray(params.files) && params.files.length > 0) {
      for (const file of params.files) {
        await funeralAddDocumentDao.create(
          {
            funeralId: result.funeralId,
            funeralDocName: file.originalname,
            funeralDocPath: file.location,
          },
          { transaction },
        );
      }
    }

    await funeralCashHistoryDao.create(
      {
        funeralId: result.funeralId,
        transactionType: 'service_cash',
        funeralCashAmount: 50000,
        funeralCashBalanceAfter: 50000,
        status: 'completed',
      },
      { transaction },
    );

    await db.Funeral.update(
      {
        funeralPoint: 0,
        funeralCash: 50000,
      },
      { where: { funeralId: result.funeralId }, transaction },
    );
    // 약관 동의 정보 저장
    const termsData = {
      serviceAgreement: params.serviceAgreement,
      personalInfoAgreement: params.personalInfoAgreement,
      locationInfoAgreement: params.locationInfoAgreement,
      age14OrOlderAgreement: params.age14OrOlderAgreement,
      marketingInfoAgreement: params.marketingInfoAgreement,
    };

    if (params.userType === 'manager') {
      termsData.managerId = result.managerId;
    } else if (params.userType === 'funeral') {
      termsData.funeralId = result.funeralId;
    }

    await funeralUserDao.createTermsAgreement(termsData, transaction);
    await transaction.commit();

    return {
      funeral: result,
      fileCount: params.files ? params.files.length : 0, // files 배열이 있는 경우에만 fileCount 반환
    };
  } catch (error) {
    await transaction.rollback();
    throw new Error('회원가입 중 오류 발생: ' + error.message);
  }
};

/**
 * 사용자명 중복 확인
 *
 * 입력:
 * - funeralUsername: string — 확인할 사용자명
 *
 * 동작:
 * 1) funeralUserDao를 통해 입력된 사용자명으로 장례식장 정보 조회
 * 2) 조회 결과에 따라 사용 가능 여부 판단
 * 3) 중복 확인 결과 반환
 *
 * 중복 확인 로직:
 * - 조회된 장례식장이 없으면 true 반환 (사용 가능)
 * - 조회된 장례식장이 있으면 false 반환 (사용 불가)
 *
 * 반환:
 * - boolean: true (사용 가능), false (사용 불가)
 *
 * 예외:
 * - 중복 확인 실패: DAO에서 발생한 오류를 그대로 전파
 * - 로깅: 오류 발생 시 콘솔에 '아이디 중복 확인 서비스 오류:' 메시지와 함께 출력
 *
 * 참고:
 * - 이 함수는 회원가입 전 사용자명 중복 여부를 확인하는 용도로 사용됩니다.
 * - 사용자명이 고유해야 하므로, 이미 존재하는 사용자명은 사용할 수 없습니다.
 */
export const isUsernameAvailable = async (funeralUsername) => {
  try {
    const funeral = await funeralUserDao.findByUsername(funeralUsername);
    return !funeral; // Return true if no manager is found, meaning the username is available
  } catch (error) {
    console.error('아이디 중복 확인 서비스 오류:', error.message);
    throw error;
  }
};

/**
 * 내 프로필 정보 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장 ID
 *
 * 동작:
 * 1) funeralUserDao를 통해 해당 장례식장 ID로 사용자 정보 조회
 * 2) 사용자 존재 여부 확인
 * 3) 존재하는 경우 toSafeObject() 메서드를 통해 안전한 데이터 반환
 *
 * 안전한 데이터:
 * - toSafeObject() 메서드를 통해 민감한 정보(비밀번호 등)를 제외한 데이터만 반환
 * - 사용자 개인정보 보호를 위한 보안 조치
 *
 * 반환:
 * - Object: 장례식장 정보 (비밀번호 제외)
 *
 * 예외:
 * - 사용자 없음: '상조팀장 정보를 찾을 수 없습니다.' (오타로 인해 '상조팀장'으로 표시됨)
 * - 프로필 조회 실패: '프로필 조회 실패: {원인}' 형태로 Error throw
 * - DAO 오류: 원본 오류를 포함하여 전파
 *
 * 참고:
 * - 오류 메시지에 '상조팀장'이라고 표시되어 있지만, 실제로는 장례식장 정보를 조회합니다.
 * - 향후 메시지 수정이 필요할 수 있습니다.
 */
export const getMyProfile = async (funeralId) => {
  try {
    const funeral = await funeralUserDao.findById(funeralId);

    if (!funeral) {
      throw new Error('상조팀장 정보를 찾을 수 없습니다.');
    }

    return funeral.toSafeObject(); // 비밀번호 제외한 안전한 데이터만 전달
  } catch (error) {
    throw new Error('프로필 조회 실패: ' + error.message);
  }
};

/**
 * 장례식장 ID로 사용자 정보 조회
 *
 * 입력:
 * - funeralId: string — 조회할 장례식장 ID
 *
 * 동작:
 * - funeralUserDao를 통해 해당 장례식장 ID로 사용자 정보를 조회합니다.
 * - 원본 데이터를 그대로 반환합니다 (toSafeObject 미적용).
 *
 * 반환:
 * - Object: 장례식장 정보 (원본 데이터, 비밀번호 포함)
 *
 * 예외:
 * - DAO에서 발생한 오류를 그대로 전파합니다.
 *
 * 참고:
 * - 이 함수는 getMyProfile과 달리 원본 데이터를 반환합니다.
 * - 비밀번호 등 민감한 정보가 포함될 수 있으므로 주의가 필요합니다.
 * - 주로 내부 시스템에서 사용자 정보를 확인할 때 사용됩니다.
 */
export const getFuneralById = async (funeralId) => {
  return await funeralUserDao.findById(funeralId);
};
