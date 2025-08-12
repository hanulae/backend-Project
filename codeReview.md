# 🏗️ 장례 서비스 플랫폼 백엔드 프로젝트 인계서

## 📋 백엔드 프로젝트 개요

**프로젝트명**: 장례 서비스 플랫폼 백엔드 시스템  
**개발 기간**: 2024년 5월 ~ 현재  
**개발 언어**: Node.js, JavaScript  
**데이터베이스**: PostgreSQL/MySQL  
**프레임워크**: Express.js, Sequelize ORM  
**외주 개발자**: [김반석, 이정현]  
**의뢰인**: [하늘애/우리부고]  
**프로젝트 규모**: 대형 (약 50개 이상의 API 엔드포인트)  
**개발 인력**: 2명

---

## 🎯 프로젝트 목적 및 비즈니스 가치

### 핵심 목적

장례 서비스 업계의 디지털화를 위한 통합 플랫폼 백엔드 시스템으로, 상조팀장, 장례식장, 관리자 간의 서비스 연결 및 결제 시스템을 제공합니다.

### 비즈니스 가치

- **업계 표준화**: 장례 서비스 업계의 디지털 표준 제시
- **효율성 증대**: 수동 프로세스의 자동화로 업무 효율성 향상
- **투명성 확보**: 모든 거래 내역의 투명한 기록 및 추적
- **고객 만족도 향상**: 빠른 응답과 정확한 서비스 제공

### 타겟 사용자

1. **상조팀장**: 고객 관리, 견적서 작성, 입찰 참여
2. **장례식장**: 시설 관리, 예약 관리, 수익 관리
3. **관리자**: 시스템 전체 관리, 승인, 모니터링

---

## 🏛️ 시스템 아키텍처

### 전체 구조

```
backend-Project/
├── src/                    # 소스 코드
│   ├── models/            # 데이터베이스 모델 (Sequelize)
│   ├── routes/            # API 라우트 (Express Router)
│   ├── services/          # 비즈니스 로직 (Service Layer)
│   ├── middlewares/       # 미들웨어 (인증, 파일업로드 등)
│   ├── middleware/        # 레거시 미들웨어 (점진적 마이그레이션)
│   ├── daos/              # 데이터 접근 계층 (Data Access Object)
│   ├── dao/               # 레거시 DAO (점진적 마이그레이션)
│   ├── utils/             # 유틸리티 함수 (JWT, 결제, 이메일 등)
│   ├── config/            # 설정 파일 (데이터베이스, 환경변수)
│   ├── Init/              # 초기화 스크립트
│   ├── app.js             # Express 앱 메인 파일
│   └── index.js           # 서버 시작점
├── migrations/             # 데이터베이스 마이그레이션
├── config/                 # 환경 설정
├── logs/                   # 로그 파일
├── .husky/                 # Git hooks (코드 품질 관리)
├── .eslintrc              # ESLint 설정
├── .prettierrc            # Prettier 설정
└── package.json           # 프로젝트 의존성 및 스크립트
```

### 주요 기술 스택

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (v4.18+)
- **ORM**: Sequelize (v6+)
- **Database**: PostgreSQL/MySQL (Sequelize 지원)
- **File Upload**: Multer + AWS S3
- **Authentication**: JWT + bcrypt
- **Payment**: 아임포트(I'mport), 포트원(PortOne)
- **Email**: Mailgun
- **SMS**: 외부 SMS 서비스 연동
- **Security**: Helmet, CORS, Compression
- **Logging**: Morgan, Winston
- **Code Quality**: ESLint, Prettier, Husky

### 아키텍처 패턴

- **MVC Pattern**: Model-View-Controller 구조
- **Service Layer**: 비즈니스 로직 분리
- **DAO Pattern**: 데이터 접근 계층 분리
- **Middleware Pattern**: 요청/응답 처리 미들웨어
- **Repository Pattern**: 데이터 접근 추상화
- **Legacy Migration**: 기존 코드의 점진적 마이그레이션 지원

---

## 📊 데이터베이스 모델 구조

### 1. 관리자 계층 (Admin Models)

#### 1.1 Admin Model ([`src/models/admin/admin.js`](src/models/admin/admin.js))

**역할**: 시스템 최고 권한 관리자 계정 관리

- **주요 기능**:
  - 관리자 계정 생성/수정/삭제
  - 비밀번호 자동 해싱 (bcrypt, salt rounds: 10)
  - UUID 기반 고유 식별자
  - 소프트 삭제 지원
- **핵심 필드**:
  - `adminId`: UUID (Primary Key)
  - `adminEmail`: 이메일 (고유값)
  - `adminPassword`: 해시된 비밀번호
  - `adminName`: 관리자 실명
  - `role`: 권한 역할

### 2. 장례식장 계층 (Funeral Models)

#### 2.1 Funeral Model ([`src/models/funeral/funeral.js`](src/models/funeral/funeral.js))

**역할**: 장례식장 회원 정보 및 계정 관리

- **주요 기능**:
  - 장례식장 기본 정보 관리 (이름, 연락처, 은행 정보)
  - 계정 정보 관리 (아이디, 비밀번호)
  - 재무 정보 관리 (포인트, 캐시)
  - 관리자 승인 시스템
- **핵심 필드**:
  - `funeralId`: UUID (Primary Key)
  - `funeralUsername`: 사용자명 (로그인 ID)
  - `funeralPassword`: 해시된 비밀번호
  - `funeralPoint`: 보유 포인트
  - `funeralCash`: 보유 캐시
  - `isApproved`: 승인 여부
  - `approvedAt`: 승인 일시
- **관련 모델**: FuneralAddDocument, FuneralCashHistory, FuneralCashRefundRequest

#### 2.2 FuneralAddDocument Model ([`src/models/funeral/funeralAddDocument.js`](src/models/funeral/funeralAddDocument.js))

**역할**: 장례식장 추가 문서 관리

- **주요 기능**:
  - 사업자등록증, 시설 사진, 계약서 등 문서 저장
  - 장례식장별 문서 분류 및 관리
  - 파일 경로 관리 및 추적
- **핵심 필드**:
  - `funeralDocId`: UUID (Primary Key)
  - `funeralId`: 장례식장 FK
  - `funeralDocName`: 문서 이름
  - `funeralDocPath`: 파일 경로
- **관련 모델**: Funeral

#### 2.3 FuneralCashHistory Model ([`src/models/funeral/funeralCashHistory.js`](src/models/funeral/funeralCashHistory.js))

**역할**: 장례식장 현금 거래 내역 관리

- **주요 기능**:
  - 캐시 충전, 사용, 출금, 서비스 적립 등 거래 추적
  - 거래 상태 관리 (처리중, 완료, 실패, 취소)
  - 외부 결제 시스템 연동
- **핵심 필드**:
  - `funeralCashHistoryId`: UUID (Primary Key)
  - `transactionType`: 거래 타입 (earn_cash, use_cash, withdraw_cash, service_cash)
  - `funeralCashAmount`: 거래 금액
  - `funeralCashBalanceAfter`: 거래 후 잔액
  - `status`: 거래 상태 (pending, completed, failed, cancelled)
- **관련 모델**: Funeral, FuneralPayment, Manager, ManagerFormBid

#### 2.4 FuneralCashRefundRequest Model ([`src/models/funeral/funeralCashRefundRequest.js`](src/models/funeral/funeralCashRefundRequest.js))

**역할**: 장례식장 캐시 환급 요청 관리

- **주요 기능**:
  - 캐시를 현금으로 환급받기 위한 요청 처리
  - 환급 요청 상태 관리 (요청됨, 승인됨, 거절됨)
  - 관리자 승인 프로세스 지원
- **핵심 필드**:
  - `refundRequestId`: UUID (Primary Key)
  - `funeralId`: 장례식장 FK
  - `refundAmount`: 환급 요청 금액
  - `status`: 환급 상태 (requested, approved, rejected)
  - `adminMemo`: 관리자 메모
- **관련 모델**: Funeral

#### 2.5 FuneralPayment Model ([`src/models/funeral/funeralPayment.js`](src/models/funeral/funeralPayment.js))

**역할**: 장례식장 결제 정보 관리

- **주요 기능**:
  - 결제 시스템 연동 (포트원, 아임포트)
  - 결제 상태 관리 및 이력 추적
  - 결제 검증 및 보안
- **핵심 필드**:
  - `funeralPaymentId`: UUID (Primary Key)
  - `funeralId`: 장례식장 FK
  - `paymentAmount`: 결제 금액
  - `paymentStatus`: 결제 상태 (pending, paid, failed, cancelled, refunded)
  - `paymentMethod`: 결제 방법
- **관련 모델**: Funeral

#### 2.6 FuneralList Model ([`src/models/funeral/funeralList.js`](src/models/funeral/funeralList.js))

**역할**: 장례식장 목록 및 공개 정보 관리

- **주요 기능**:
  - 장례식장 기본 정보 공개
  - 검색 및 필터링 지원
  - 위치 및 시설 정보 관리
- **핵심 필드**:
  - `funeralListId`: UUID (Primary Key)
  - `funeralId`: 장례식장 FK
  - `funeralName`: 장례식장명
  - `address`: 주소
  - `phone`: 연락처
- **관련 모델**: Funeral, FuneralListImage

#### 2.7 FuneralListImage Model ([`src/models/funeral/funeralListImage.js`](src/models/funeral/funeralListImage.js))

**역할**: 장례식장 목록용 이미지 관리

- **주요 기능**:
  - 장례식장 대표 이미지 관리
  - 이미지 갤러리 및 시설 사진
  - 이미지 순서 및 우선순위 관리
- **핵심 필드**:
  - `funeralListImageId`: UUID (Primary Key)
  - `funeralListId`: 장례식장 목록 FK
  - `imageUrl`: 이미지 URL
  - `imageOrder`: 이미지 순서
- **관련 모델**: FuneralList

#### 2.8 FuneralHallInfo Model ([`src/models/funeral/funeralHallInfo.js`](src/models/funeral/funeralHallInfo.js))

**역할**: 장례식장 시설 정보 관리

- **주요 기능**:
  - 시설 상세 정보 관리
  - 운영 시간 및 서비스 정보
  - 시설 규모 및 수용 인원
- **핵심 필드**:
  - `funeralHallInfoId`: UUID (Primary Key)
  - `funeralId`: 장례식장 FK
  - `hallName`: 장례식장명
  - `capacity`: 수용 인원
  - `operatingHours`: 운영 시간
- **관련 모델**: Funeral, FuneralHallInfoImage

#### 2.9 FuneralHallInfoImage Model ([`src/models/funeral/funeralHallInfoImage.js`](src/models/funeral/funeralHallInfoImage.js))

**역할**: 장례식장 시설 이미지 관리

- **주요 기능**:
  - 시설 내부/외부 이미지 관리
  - 룸별 이미지 및 시설 사진
  - 이미지 분류 및 태그 관리
- **핵심 필드**:
  - `funeralHallInfoImageId`: UUID (Primary Key)
  - `funeralHallInfoId`: 시설 정보 FK
  - `imageUrl`: 이미지 URL
  - `imageType`: 이미지 유형 (exterior, interior, room)
- **관련 모델**: FuneralHallInfo

### 3. 공통 모델 (Common Models)

#### 3.1 Notice Model ([`src/models/common/Notice.js`](src/models/common/Notice.js))

**역할**: 시스템 전체 공지사항 관리

- **주요 기능**:
  - 사용자 유형별 공지사항 분류 및 관리
  - 공지사항 공개/비공개 상태 제어
  - 공지사항 이력 추적 및 관리
- **핵심 필드**:
  - `noticeId`: UUID (Primary Key)
  - `title`: 공지사항 제목
  - `content`: 공지사항 본문
  - `isVisible`: 공개 여부
  - `userType`: 대상 사용자 유형 (manager, funeral, all)
- **관련 모델**: 독립적 (시스템 전체 공지)

#### 3.2 TransactionList Model ([`src/models/common/transactionList.js`](src/models/common/transactionList.js))

**역할**: 시스템 전체 거래 내역 통합 관리

- **주요 기능**:
  - 모든 사용자의 거래 내역 통합 조회
  - 거래 유형별 분류 및 필터링
  - 거래 통계 및 분석 지원
- **핵심 필드**:
  - `transactionId`: UUID (Primary Key)
  - `userId`: 사용자 ID
  - `userType`: 사용자 유형 (manager, funeral)
  - `transactionType`: 거래 유형
  - `amount`: 거래 금액
- **관련 모델**: Manager, Funeral

#### 3.3 FcmToken Model ([`src/models/common/fcmToken.js`](src/models/common/fcmToken.js))

**역할**: Firebase Cloud Messaging 토큰 관리

- **주요 기능**:
  - 사용자별 FCM 토큰 저장 및 관리
  - 푸시 알림 발송을 위한 토큰 관리
  - 토큰 갱신 및 유효성 검증
- **핵심 필드**:
  - `fcmTokenId`: UUID (Primary Key)
  - `userId`: 사용자 ID
  - `userType`: 사용자 유형
  - `token`: FCM 토큰
  - `deviceInfo`: 디바이스 정보
- **관련 모델**: Manager, Funeral

#### 3.4 NotificationHistory Model ([`src/models/common/notificationHistory.js`](src/models/common/notificationHistory.js))

**역할**: 알림 발송 이력 관리

- **주요 기능**:
  - 푸시 알림, 이메일, SMS 발송 이력 추적
  - 알림 상태 및 수신 확인 관리
  - 알림 통계 및 분석
- **핵심 필드**:
  - `notificationId`: UUID (Primary Key)
  - `userId`: 수신자 ID
  - `userType`: 수신자 유형
  - `notificationType`: 알림 유형 (push, email, sms)
  - `status`: 발송 상태
- **관련 모델**: Manager, Funeral

#### 3.5 TermsAgreement Model ([`src/models/common/TermsAgreement.js`](src/models/common/TermsAgreement.js))

**역할**: 이용약관 동의 이력 관리

- **주요 기능**:
  - 사용자별 이용약관 동의 이력 추적
  - 약관 버전 관리 및 동의 시점 기록
  - 법적 요구사항 준수 지원
- **핵심 필드**:
  - `termsAgreementId`: UUID (Primary Key)
  - `userId`: 사용자 ID
  - `userType`: 사용자 유형
  - `termsVersion`: 약관 버전
  - `agreedAt`: 동의 일시
- **관련 모델**: Manager, Funeral

#### 3.6 DispatchRequest Model ([`src/models/common/dispatchRequest.js`](src/models/common/dispatchRequest.js))

**역할**: 장례 배차 요청 관리

- **주요 기능**:
  - 장례 배차 요청 생성 및 관리
  - 배차 상태 추적 및 업데이트
  - 배차 담당자 배정 및 관리
- **핵심 필드**:
  - `dispatchRequestId`: UUID (Primary Key)
  - `requesterId`: 요청자 ID
  - `requesterType`: 요청자 유형
  - `pickupLocation`: 픽업 위치
  - `destination`: 목적지
  - `status`: 배차 상태
- **관련 모델**: Manager, Funeral

### 4. 상조팀장 계층 (Manager Models)

#### 4.1 Manager Model ([`src/models/manager/manager.js`](src/models/manager/manager.js))

**역할**: 상조팀장 회원 정보 및 계정 관리

- **주요 기능**:
  - 상조팀장 기본 정보 관리
  - 계정 정보 및 비밀번호 관리
  - 재무 정보 관리 (포인트, 캐시)
  - 승인 상태 관리
- **핵심 필드**:
  - `managerId`: UUID (Primary Key)
  - `managerUsername`: 사용자명 (로그인 ID)
  - `managerPassword`: 해시된 비밀번호
  - `managerPoint`: 보유 포인트
  - `managerCash`: 보유 캐시
  - `isApproved`: 승인 여부

#### 4.2 ManagerForm Model ([`src/models/manager/managerForm.js`](src/models/manager/managerForm.js))

**역할**: 상조팀장 견적서 및 서비스 정보 관리

- **주요 기능**:
  - 견적서 작성 및 관리
  - 서비스 가격 및 옵션 설정
  - 입찰 참여를 위한 정보 제공
- **핵심 필드**:
  - `managerFormId`: UUID (Primary Key)
  - `managerId`: 상조팀장 FK
  - `serviceName`: 서비스명
  - `servicePrice`: 서비스 가격
  - `serviceDescription`: 서비스 설명

#### 4.3 ManagerCart Model ([`src/models/manager/managerCart.js`](src/models/manager/managerCart.js))

**역할**: 상조팀장 장바구니 및 주문 관리

- **주요 기능**:
  - 서비스 선택 및 장바구니 담기
  - 주문 정보 관리
  - 결제 프로세스 지원
- **핵심 필드**:
  - `managerCartId`: UUID (Primary Key)
  - `managerId`: 상조팀장 FK
  - `funeralId`: 장례식장 FK
  - `cartStatus`: 장바구니 상태
  - `totalAmount`: 총 금액

#### 4.4 ManagerAddDocument Model ([`src/models/manager/managerAddDocument.js`](src/models/manager/managerAddDocument.js))

**역할**: 상조팀장 추가 제출 서류 관리

- **주요 기능**:
  - 사업자등록증, 계약서, 서비스 소개서 등 추가 서류 관리
  - 파일 URL 관리 및 추적
  - 상조팀장별 서류 분류 및 관리
- **핵심 필드**:
  - `managerAddDocumentId`: UUID (Primary Key)
  - `managerId`: 상조팀장 FK
  - `fileUrl`: 제출한 서류 파일 URL
- **관련 모델**: Manager

#### 4.5 ManagerFormBid Model ([`src/models/manager/managerFormBid.js`](src/models/manager/managerFormBid.js))

**역할**: 상조팀장 견적서 입찰 및 제안 관리

- **주요 기능**:
  - 견적서 기반 입찰 참여
  - 제안 가격 및 조건 관리
  - 입찰 상태 및 결과 추적
- **핵심 필드**:
  - `managerFormBidId`: UUID (Primary Key)
  - `managerId`: 상조팀장 FK
  - `funeralId`: 장례식장 FK
  - `bidAmount`: 입찰 금액
  - `bidStatus`: 입찰 상태
- **관련 모델**: Manager, Funeral, ManagerForm

#### 4.6 ManagerCashHistory Model ([`src/models/manager/managerCashHistory.js`](src/models/manager/managerCashHistory.js))

**역할**: 상조팀장 현금 거래 내역 관리

- **주요 기능**:
  - 현금 충전, 사용, 출금, 서비스 적립 등 거래 추적
  - 거래 상태 관리 및 이력 기록
  - 잔액 검증 및 관리
- **핵심 필드**:
  - `managerCashHistoryId`: UUID (Primary Key)
  - `managerId`: 상조팀장 FK
  - `transactionType`: 거래 타입 (earn_cash, use_cash, withdraw_cash, service_cash)
  - `managerCashAmount`: 거래 금액
  - `managerCashBalanceAfter`: 거래 후 잔액
- **관련 모델**: Manager

#### 4.7 ManagerPointHistory Model ([`src/models/manager/managerPointHistory.js`](src/models/manager/managerPointHistory.js))

**역할**: 상조팀장 포인트 거래 내역 관리

- **주요 기능**:
  - 포인트 적립, 사용, 캐시 전환 등 거래 추적
  - 포인트 잔액 관리 및 검증
  - 거래 이력 및 출처 추적
- **핵심 필드**:
  - `managerPointHistoryId`: UUID (Primary Key)
  - `managerId`: 상조팀장 FK
  - `transactionType`: 거래 타입 (earn_point, cash_the_point, service_point)
  - `managerPointAmount`: 거래 포인트
  - `managerPointBalanceAfter`: 거래 후 포인트 잔액
- **관련 모델**: Manager, ManagerFormBid

#### 4.8 ManagerCashRefundRequest Model ([`src/models/manager/ManagerCashRefundRequest.js`](src/models/manager/ManagerCashRefundRequest.js))

**역할**: 상조팀장 현금 환급 요청 관리

- **주요 기능**:
  - 현금을 환급받기 위한 요청 처리
  - 환급 요청 상태 관리 (요청됨, 승인됨, 거절됨)
  - 관리자 승인 프로세스 지원
- **핵심 필드**:
  - `refundRequestId`: UUID (Primary Key)
  - `managerId`: 상조팀장 FK
  - `refundAmount`: 환급 요청 금액
  - `status`: 환급 상태 (requested, approved, rejected)
  - `adminMemo`: 관리자 메모
- **관련 모델**: Manager

---

## 🔧 미들웨어 구조

### 1. 파일 업로드 미들웨어

#### 1.1 uploadFuneralFile ([`src/middlewares/uploadFuneralFile.js`](src/middlewares/uploadFuneralFile.js))

**역할**: 장례식장 관련 파일 업로드 처리

- **주요 기능**:
  - AWS S3 클라우드 스토리지 연동
  - 다중 파일 업로드 지원 (최대 10개)
  - 파일 형식 검증 (PDF, JPG, JPEG, PNG)
  - 파일 크기 제한 (5MB)
  - 고유한 파일명 생성으로 중복 방지
- **저장 경로**: `funeral_files/{timestamp}-{originalname}`
- **사용 라우트**: `/funeral/upload`, `/funeral/account`

#### 1.2 uploadFuneralRoomFile ([`src/middlewares/uploadFuneralRoomFile.js`](src/middlewares/uploadFuneralRoomFile.js))

**역할**: 장례식장 룸 이미지 파일 업로드 처리

- **주요 기능**:
  - 이미지 파일 형식만 허용 (JPG, JPEG, PNG)
  - 장례식장 룸 전용 저장 경로 분리
  - 이미지 갤러리 및 시설 소개 이미지 관리
- **저장 경로**: `funeral_room_files/{timestamp}-{originalname}`
- **사용 라우트**: `/funeral/hall-info`, `/funeral/room-images`

#### 1.3 uploadManagerFile ([`src/middlewares/uploadManagerFile.js`](src/middlewares/uploadManagerFile.js))

**역할**: 상조팀장 관련 파일 업로드 처리

- **주요 기능**:
  - 사업자등록증, 계약서, 서비스 소개서 등 문서 관리
  - 상조팀장 전용 저장 경로 분리
  - 업무 문서와 이미지 파일 모두 지원
- **저장 경로**: `manager_files/{timestamp}-{originalname}`
- **사용 라우트**: `/manager/upload`, `/manager/account`

### 2. 인증 미들웨어

#### 2.1 authMiddleware ([`src/middlewares/authMiddleware.js`](src/middlewares/authMiddleware.js))

**역할**: JWT 토큰 기반 사용자 인증

- **주요 기능**:
  - JWT 토큰 검증 및 디코딩
  - 사용자 정보를 request 객체에 추가
  - 인증 실패 시 적절한 에러 응답
- **사용 라우트**: 모든 보호된 API 엔드포인트

#### 2.2 adminAuthMiddleware ([`src/middlewares/adminAuthMiddleware.js`](src/middlewares/adminAuthMiddleware.js))

**역할**: 관리자 전용 인증 및 권한 검증

- **주요 기능**:
  - 관리자 계정 인증
  - 관리자 권한 레벨 검증
  - 권한 부족 시 접근 차단
- **사용 라우트**: `/admin/*` 모든 엔드포인트

### 3. 유효성 검증 미들웨어

#### 3.1 validators ([`src/middlewares/validators.js`](src/middlewares/validators.js))

**역할**: 요청 데이터 유효성 검증

- **주요 기능**:
  - 입력 데이터 형식 및 범위 검증
  - 필수 필드 존재 여부 확인
  - SQL 인젝션 방지를 위한 데이터 정제
- **사용 라우트**: 모든 POST/PUT/PATCH 요청

#### 3.2 envValidator ([`src/middlewares/envValidator.js`](src/middlewares/envValidator.js))

**역할**: 환경 변수 설정 검증

- **주요 기능**:
  - 필수 환경 변수 존재 여부 확인
  - 환경 변수 형식 및 값 검증
  - 애플리케이션 시작 전 설정 오류 방지
- **사용 시점**: 애플리케이션 초기화 시

---

## 🔐 보안 및 인증 시스템

### 1. 비밀번호 보안

- **해싱 알고리즘**: bcrypt (salt rounds: 10)
- **자동 해싱**: 모델 생성/수정 시 자동 처리
- **검증 메서드**: `verifyPassword()` 메서드 제공

### 2. 권한 관리

- **계층적 권한 구조**: 최상위 관리자 → 관리자 직원 → 일반 사용자
- **역할 기반 접근 제어(RBAC)**: 세부 권한별 접근 제어
- **최소 권한 원칙**: 기본적으로 모든 권한 비활성화

### 3. 데이터 보안

- **소프트 삭제**: 데이터 복구 가능
- **외래키 제약**: 데이터 무결성 보장
- **타임스탬프**: 모든 변경 이력 추적

---

## 💰 결제 및 재무 시스템

### 1. 포인트 시스템

- **적립**: 서비스 제공 시 포인트 적립
- **사용**: 서비스 이용 시 포인트 차감
- **이력 추적**: 모든 포인트 거래 내역 기록

### 2. 캐시 시스템

- **충전**: 현금을 캐시로 전환
- **출금**: 캐시를 현금으로 환급
- **잔액 관리**: 실시간 잔액 추적 및 검증

### 3. 환급 시스템

- **요청 프로세스**: 캐시 → 환급 요청 → 관리자 승인 → 현금 지급
- **상태 관리**: 요청됨 → 승인됨/거절됨
- **이력 관리**: 모든 환급 요청 및 처리 내역 기록

---

## 📁 파일 관리 시스템

### 1. AWS S3 연동

- **클라우드 스토리지**: 안전한 파일 저장 및 관리
- **접근 제어**: 사용자별 파일 접근 권한 관리
- **백업 및 복구**: 자동 백업 및 장애 복구 지원

### 2. 파일 업로드 제한

- **형식 제한**: PDF, JPG, JPEG, PNG만 허용
- **크기 제한**: 최대 5MB
- **개수 제한**: 최대 10개 파일 동시 업로드

### 3. 파일명 관리

- **고유성 보장**: 타임스탬프 기반 파일명 생성
- **경로 분리**: 사용자 유형별 저장 경로 분리
- **중복 방지**: 동일 파일명 충돌 방지

---

## 🚀 API 구조 및 라우팅

### 메인 라우터 ([`src/routes/index.js`](src/routes/index.js))

**역할**: 모든 하위 도메인 라우터를 통합하여 마운트

- **구조**: Express Router를 사용한 모듈화된 라우팅
- **CORS 설정**: 다중 도메인 지원 (개발/배포 환경)
- **에러 처리**: 404 및 전역 에러 핸들링

### 1. 관리자 API (`/admin`) - [라우터 인덱스](src/routes/admin/adminIndex.js)

#### 1.1 인증 관리 ([`src/routes/admin/adminAuth.js`](src/routes/admin/adminAuth.js))

- **POST** `/admin/auth/login` - 관리자 로그인
- **POST** `/admin/auth/logout` - 관리자 로그아웃
- **GET** `/admin/auth/verify` - 토큰 검증

#### 1.2 사용자 관리 ([`src/routes/admin/adminUser.js`](src/routes/admin/adminUser.js))

- **GET** `/admin/users` - 관리자 목록 조회
- **POST** `/admin/users` - 관리자 계정 생성
- **PUT** `/admin/users/:id` - 관리자 정보 수정
- **DELETE** `/admin/users/:id` - 관리자 계정 삭제

#### 1.3 직원 관리 ([`src/routes/admin/adminStaff.js`](src/routes/admin/adminStaff.js))

- **GET** `/admin/staff` - 직원 목록 조회
- **POST** `/admin/staff` - 직원 계정 생성
- **PUT** `/admin/staff/:id` - 직원 정보 수정
- **DELETE** `/admin/staff/:id` - 직원 계정 삭제

#### 1.4 승인 관리

- **장례식장 승인** ([`src/routes/admin/adminFuneralApproval.js`](src/routes/admin/adminFuneralApproval.js))
  - `GET /admin/funeral/approval` - 승인 대기 목록
  - `PUT /admin/funeral/approval/:id` - 승인/거절 처리
- **상조팀장 승인** ([`src/routes/admin/adminManagerApproval.js`](src/routes/admin/adminManagerApproval.js))
  - `GET /admin/manager/approval` - 승인 대기 목록
  - `PUT /admin/manager/approval/:id` - 승인/거절 처리

#### 1.5 현금 관리 ([`src/routes/admin/adminCash.js`](src/routes/admin/adminCash.js))

- **GET** `/admin/cash/balance` - 전체 현금 잔액 조회
- **GET** `/admin/cash/history` - 현금 거래 내역 조회
- **POST** `/admin/cash/adjust` - 현금 잔액 조정

#### 1.6 환급 요청 관리 ([`src/routes/admin/adminCashRefundRequest.js`](src/routes/admin/adminCashRefundRequest.js))

- **GET** `/admin/refund/requests` - 환급 요청 목록 조회
- **PUT** `/admin/refund/requests/:id` - 환급 요청 승인/거절
- **POST** `/admin/refund/requests/:id/memo` - 관리자 메모 추가

#### 1.7 공지사항 관리 ([`src/routes/admin/adminNotice.js`](src/routes/admin/adminNotice.js))

- **GET** `/admin/notices` - 공지사항 목록 조회
- **POST** `/admin/notices` - 공지사항 생성
- **PUT** `/admin/notices/:id` - 공지사항 수정
- **DELETE** `/admin/notices/:id` - 공지사항 삭제

#### 1.8 배차 요청 관리 ([`src/routes/admin/adminDispatchRequest.js`](src/routes/admin/adminDispatchRequest.js))

- **GET** `/admin/dispatch/requests` - 배차 요청 목록 조회
- **PUT** `/admin/dispatch/requests/:id` - 배차 요청 상태 변경
- **POST** `/admin/dispatch/requests/:id/assign` - 배차 담당자 지정

### 2. 장례식장 API (`/funeral`) - [라우터 인덱스](src/routes/funeral/funeralIndex.js)

#### 2.1 인증 관리 ([`src/routes/funeral/funeralAuth.js`](src/routes/funeral/funeralAuth.js))

- **POST** `/funeral/auth/register` - 장례식장 회원가입
- **POST** `/funeral/auth/login` - 장례식장 로그인
- **POST** `/funeral/auth/logout` - 장례식장 로그아웃
- **POST** `/funeral/auth/refresh` - 토큰 갱신
- **POST** `/funeral/auth/forgot-password` - 비밀번호 찾기
- **POST** `/funeral/auth/reset-password` - 비밀번호 재설정

#### 2.2 계정 관리 ([`src/routes/funeral/funeralAccount.js`](src/routes/funeral/funeralAccount.js))

- **GET** `/funeral/account/profile` - 프로필 정보 조회
- **PUT** `/funeral/account/profile` - 프로필 정보 수정
- **PUT** `/funeral/account/password` - 비밀번호 변경
- **DELETE** `/funeral/account` - 계정 탈퇴

#### 2.3 사용자 관리 ([`src/routes/funeral/funeralUser.js`](src/routes/funeral/funeralUser.js))

- **GET** `/funeral/users` - 직원 목록 조회
- **POST** `/funeral/users` - 직원 계정 생성
- **PUT** `/funeral/users/:id` - 직원 정보 수정
- **DELETE** `/funeral/users/:id` - 직원 계정 삭제

#### 2.4 직원 관리 ([`src/routes/funeral/funeralStaff.js`](src/routes/funeral/funeralStaff.js))

- **GET** `/funeral/staff` - 직원 상세 정보 조회
- **POST** `/funeral/staff` - 직원 추가
- **PUT** `/funeral/staff/:id` - 직원 정보 수정
- **DELETE** `/funeral/staff/:id` - 직원 제거

#### 2.5 현금 관리 ([`src/routes/funeral/funeralCash.js`](src/routes/funeral/funeralCash.js))

- **GET** `/funeral/cash/balance` - 캐시 잔액 조회
- **GET** `/funeral/cash/history` - 캐시 거래 내역 조회
- **POST** `/funeral/cash/charge` - 캐시 충전
- **POST** `/funeral/cash/withdraw` - 캐시 출금 요청

#### 2.6 포인트 관리 ([`src/routes/funeral/funeralPoint.js`](src/routes/funeral/funeralPoint.js))

- **GET** `/funeral/point/balance` - 포인트 잔액 조회
- **GET** `/funeral/point/history` - 포인트 적립/사용 내역 조회
- **POST** `/funeral/point/earn` - 포인트 적립

#### 2.7 환급 요청 ([`src/routes/funeral/funeralWithdrawal.js`](src/routes/funeral/funeralWithdrawal.js))

- **GET** `/funeral/withdrawal/requests` - 환급 요청 목록 조회
- **POST** `/funeral/withdrawal/requests` - 환급 요청 생성
- **GET** `/funeral/withdrawal/requests/:id` - 환급 요청 상세 조회

#### 2.8 장례식장 정보 관리 ([`src/routes/funeral/funeralHallInfo.js`](src/routes/funeral/funeralHallInfo.js))

- **GET** `/funeral/hall-info` - 장례식장 정보 조회
- **PUT** `/funeral/hall-info` - 장례식장 정보 수정
- **POST** `/funeral/hall-info/images` - 시설 이미지 업로드

#### 2.9 장례식장 목록 ([`src/routes/funeral/funeralList.js`](src/routes/funeral/funeralList.js))

- **GET** `/funeral/list` - 장례식장 목록 조회 (공개 정보)
- **GET** `/funeral/list/:id` - 특정 장례식장 상세 정보

#### 2.10 배차 요청 관리 ([`src/routes/funeral/funeralDispatchRequest.js`](src/routes/funeral/funeralDispatchRequest.js))

- **GET** `/funeral/dispatch/requests` - 배차 요청 목록 조회
- **POST** `/funeral/dispatch/requests` - 배차 요청 생성
- **PUT** `/funeral/dispatch/requests/:id` - 배차 요청 상태 변경

#### 2.11 결제 관리 ([`src/routes/funeral/funeralPaymentCash.js`](src/routes/funeral/funeralPaymentCash.js))

- **POST** `/funeral/payment/cash` - 현금 결제 처리
- **GET** `/funeral/payment/history` - 결제 내역 조회
- **POST** `/funeral/payment/refund` - 결제 환불 요청

#### 2.12 통신 관리

- **이메일** ([`src/routes/funeral/funeralEmail.js`](src/routes/funeral/funeralEmail.js))
  - `POST /funeral/email/send` - 이메일 발송
  - `GET /funeral/email/history` - 이메일 발송 내역
- **SMS** ([`src/routes/funeral/funeralSMS.js`](src/routes/funeral/funeralSMS.js))
  - `POST /funeral/sms/send` - SMS 발송
  - `GET /funeral/sms/history` - SMS 발송 내역

### 3. 상조팀장 API (`/manager`) - [라우터 인덱스](src/routes/manager/managerIndex.js)

#### 3.1 인증 관리 ([`src/routes/manager/managerAuth.js`](src/routes/manager/managerAuth.js))

- **POST** `/manager/auth/register` - 상조팀장 회원가입
- **POST** `/manager/auth/login` - 상조팀장 로그인
- **POST** `/manager/auth/logout` - 상조팀장 로그아웃
- **POST** `/manager/auth/refresh` - 토큰 갱신
- **POST** `/manager/auth/forgot-password` - 비밀번호 찾기
- **POST** `/manager/auth/reset-password` - 비밀번호 재설정

#### 3.2 계정 관리 ([`src/routes/manager/managerUser.js`](src/routes/manager/managerUser.js))

- **GET** `/manager/account/profile` - 프로필 정보 조회
- **PUT** `/manager/account/profile` - 프로필 정보 수정
- **PUT** `/manager/account/password` - 비밀번호 변경
- **DELETE** `/manager/account` - 계정 탈퇴

#### 3.3 현금 관리 ([`src/routes/manager/managerCash.js`](src/routes/manager/managerCash.js))

- **GET** `/manager/cash/balance` - 캐시 잔액 조회
- **GET** `/manager/cash/history` - 캐시 거래 내역 조회
- **POST** `/manager/cash/charge` - 캐시 충전
- **POST** `/manager/cash/withdraw` - 캐시 출금 요청

#### 3.4 포인트 관리 ([`src/routes/manager/managerPoint.js`](src/routes/manager/managerPoint.js))

- **GET** `/manager/point/balance` - 포인트 잔액 조회
- **GET** `/manager/point/history` - 포인트 적립/사용 내역 조회
- **POST** `/manager/point/earn` - 포인트 적립

#### 3.5 환급 요청 ([`src/routes/manager/managerWithdrawal.js`](src/routes/manager/managerWithdrawal.js))

- **GET** `/manager/withdrawal/requests` - 환급 요청 목록 조회
- **POST** `/manager/withdrawal/requests` - 환급 요청 생성
- **GET** `/manager/withdrawal/requests/:id` - 환급 요청 상세 조회

#### 3.6 견적서 관리 ([`src/routes/manager/managerForm.js`](src/routes/manager/managerForm.js))

- **GET** `/manager/forms` - 견적서 목록 조회
- **POST** `/manager/forms` - 견적서 생성
- **PUT** `/manager/forms/:id` - 견적서 수정
- **DELETE** `/manager/forms/:id` - 견적서 삭제

#### 3.7 장바구니 관리 ([`src/routes/manager/managerCart.js`](src/routes/manager/managerCart.js))

- **GET** `/manager/cart` - 장바구니 목록 조회
- **POST** `/manager/cart` - 장바구니에 서비스 추가
- **PUT** `/manager/cart/:id` - 장바구니 수량/옵션 변경
- **DELETE** `/manager/cart/:id` - 장바구니에서 제거

#### 3.8 장례식장 목록 ([`src/routes/manager/managerFuneralList.js`](src/routes/manager/managerFuneralList.js))

- **GET** `/manager/funeral/list` - 장례식장 목록 조회
- **GET** `/manager/funeral/list/:id` - 특정 장례식장 상세 정보

#### 3.9 배차 요청 관리 ([`src/routes/manager/managerDispatchRequest.js`](src/routes/manager/managerDispatchRequest.js))

- **GET** `/manager/dispatch/requests` - 배차 요청 목록 조회
- **POST** `/manager/dispatch/requests` - 배차 요청 생성
- **PUT** `/manager/dispatch/requests/:id` - 배차 요청 상태 변경

#### 3.10 은행 계좌 관리 ([`src/routes/manager/managerBankAccount.js`](src/routes/manager/managerBankAccount.js))

- **GET** `/manager/bank-account` - 등록된 은행 계좌 조회
- **POST** `/manager/bank-account` - 은행 계좌 등록
- **PUT** `/manager/bank-account/:id` - 은행 계좌 정보 수정
- **DELETE** `/manager/bank-account/:id` - 은행 계좌 삭제

#### 3.11 통신 관리

- **이메일** ([`src/routes/manager/managerEmail.js`](src/routes/manager/managerEmail.js))
  - `POST /manager/email/send` - 이메일 발송
  - `GET /manager/email/history` - 이메일 발송 내역
- **SMS** ([`src/routes/manager/managerSMS.js`](src/routes/manager/managerSMS.js))
  - `POST /manager/sms/send` - SMS 발송
  - `GET /manager/sms/history` - SMS 발송 내역

### 4. 공통 API (`/common`) - [라우터 인덱스](src/routes/common/commonIndex.js)

#### 4.1 공지사항 ([`src/routes/common/noticeRoute.js`](src/routes/common/noticeRoute.js))

- **GET** `/common/notices` - 공개 공지사항 목록 조회
- **GET** `/common/notices/:id` - 공지사항 상세 조회

#### 4.2 인증 유지 ([`src/routes/common/authValidationRouter.js`](src/routes/common/authValidationRouter.js))

- **POST** `/common/auth/validate` - 토큰 유효성 검증
- **POST** `/common/auth/refresh` - 토큰 갱신

---

## 🗄️ 데이터베이스 마이그레이션

### 주요 마이그레이션 파일

- `20250107120001-create-fcm-tokens-table.cjs`: FCM 토큰 테이블 생성
- `20250107120002-create-notification-history-table.cjs`: 알림 이력 테이블 생성
- `20250127120000-add-funeral-payment-id-to-funeral-cash-history.cjs`: 결제 ID 필드 추가

### 마이그레이션 실행 방법

```bash
# 개발 환경
npx sequelize-cli db:migrate --env development

# 프로덕션 환경
npx sequelize-cli db:migrate --env production

# 마이그레이션 되돌리기
npx sequelize-cli db:migrate:undo --env development
```

---

## 🔧 서비스 계층 구조

### 1. 관리자 서비스 ([`src/services/admin/`](src/services/admin/))

#### 1.1 인증 서비스 ([`src/services/admin/adminAuthService.js`](src/services/admin/adminAuthService.js))

- **역할**: 관리자 계정 인증 및 세션 관리
- **주요 기능**:
  - JWT 토큰 생성 및 검증
  - 로그인/로그아웃 처리
  - 비밀번호 검증 및 해싱
  - 세션 관리 및 보안

#### 1.2 사용자 관리 서비스 ([`src/services/admin/adminUserService.js`](src/services/admin/adminUserService.js))

- **역할**: 관리자 및 직원 계정 관리
- **주요 기능**:
  - 계정 생성/수정/삭제
  - 권한 관리 및 할당
  - 계정 상태 관리
  - 보안 정책 적용

#### 1.3 승인 관리 서비스 ([`src/services/admin/adminApprovalService.js`](src/services/admin/adminApprovalService.js))

- **역할**: 회원가입 승인 프로세스 관리
- **주요 기능**:
  - 승인 대기 목록 관리
  - 승인/거절 처리
  - 승인 이력 추적
  - 자동 알림 발송

#### 1.4 현금 관리 서비스 ([`src/services/admin/adminCashService.js`](src/services/admin/adminCashService.js))

- **역할**: 시스템 전체 현금 및 포인트 관리
- **주요 기능**:
  - 현금 잔액 모니터링
  - 거래 내역 추적
  - 환급 요청 처리
  - 재무 리포트 생성

#### 1.5 환급 요청 서비스 ([`src/services/admin/adminCashRefundRequestService.js`](src/services/admin/adminCashRefundRequestService.js))

- **역할**: 캐시 환급 요청 처리 및 관리
- **주요 기능**:
  - 환급 요청 검토
  - 승인/거절 처리
  - 자동 정산 처리
  - 이력 관리

### 2. 장례식장 서비스 ([`src/services/funeral/`](src/services/funeral/))

#### 2.1 인증 서비스 ([`src/services/funeral/funeralAuthService.js`](src/services/funeral/funeralAuthService.js))

- **역할**: 장례식장 회원 인증 및 계정 관리
- **주요 기능**:
  - 회원가입 및 로그인
  - 비밀번호 관리
  - 계정 상태 관리
  - 보안 정책 적용

#### 2.2 현금 관리 서비스 ([`src/services/funeral/funeralCashService.js`](src/services/funeral/funeralCashService.js))

- **역할**: 장례식장 캐시 및 포인트 관리
- **주요 기능**:
  - 캐시 충전 및 출금
  - 포인트 적립 및 사용
  - 거래 내역 관리
  - 잔액 검증

#### 2.3 환급 요청 서비스 ([`src/services/funeral/funeralWithdrawalService.js`](src/services/funeral/funeralWithdrawalService.js))

- **역할**: 캐시 환급 요청 처리
- **주요 기능**:
  - 환급 요청 생성
  - 요청 상태 관리
  - 자동 검증 및 처리
  - 이력 추적

#### 2.4 파일 관리 서비스 ([`src/services/funeral/funeralFileService.js`](src/services/funeral/funeralFileService.js))

- **역할**: 장례식장 관련 파일 업로드 및 관리
- **주요 기능**:
  - 파일 업로드 처리
  - 파일 검증 및 보안
  - 저장소 관리
  - 접근 권한 제어

### 3. 상조팀장 서비스 ([`src/services/manager/`](src/services/manager/))

#### 3.1 인증 서비스 ([`src/services/manager/managerAuthService.js`](src/services/manager/managerAuthService.js))

- **역할**: 상조팀장 회원 인증 및 계정 관리
- **주요 기능**:
  - 회원가입 및 로그인
  - 비밀번호 관리
  - 계정 상태 관리
  - 보안 정책 적용

#### 3.2 견적서 관리 서비스 ([`src/services/manager/managerFormService.js`](src/services/manager/managerFormService.js))

- **역할**: 견적서 작성 및 관리
- **주요 기능**:
  - 견적서 생성/수정/삭제
  - 서비스 옵션 관리
  - 가격 설정 및 관리
  - 입찰 참여 지원

#### 3.3 장바구니 서비스 ([`src/services/manager/managerCartService.js`](src/services/manager/managerCartService.js))

- **역할**: 서비스 선택 및 주문 관리
- **주요 기능**:
  - 장바구니 관리
  - 서비스 선택 및 옵션
  - 주문 처리
  - 결제 연동

### 4. 공통 서비스 ([`src/services/common/`](src/services/common/))

#### 4.1 FCM 서비스 ([`src/services/common/fcmService.js`](src/services/common/fcmService.js))

- **역할**: Firebase Cloud Messaging을 통한 푸시 알림
- **주요 기능**:
  - 푸시 알림 발송
  - 토큰 관리
  - 알림 이력 추적
  - 다중 플랫폼 지원

#### 4.2 배차 요청 서비스 ([`src/services/common/dispatchRequestService.js`](src/services/common/dispatchRequestService.js))

- **역할**: 장례 배차 요청 처리 및 관리
- **주요 기능**:
  - 배차 요청 생성
  - 요청 상태 관리
  - 담당자 배정
  - 이력 추적

---

## 🛠️ 유틸리티 함수 구조

### 1. 인증 관련 유틸리티

#### 1.1 JWT 유틸리티 ([`src/utils/jwt.js`](src/utils/jwt.js))

- **역할**: JWT 토큰 생성, 검증, 갱신
- **주요 기능**:
  - 토큰 생성 (access, refresh)
  - 토큰 검증 및 디코딩
  - 토큰 갱신 처리
  - 보안 옵션 설정

#### 1.2 사용자 헬퍼 ([`src/utils/userHelper.js`](src/utils/userHelper.js))

- **역할**: 사용자 관련 공통 기능
- **주요 기능**:
  - 사용자 정보 검증
  - 권한 확인
  - 데이터 정제
  - 공통 유틸리티 함수

### 2. 결제 관련 유틸리티

#### 2.1 아임포트 클라이언트 ([`src/utils/iamportClient.js`](src/utils/iamportClient.js))

- **역할**: 아임포트 결제 시스템 연동
- **주요 기능**:
  - 결제 요청 처리
  - 결제 상태 확인
  - 환불 처리
  - 웹훅 처리

#### 2.2 포트원 클라이언트 ([`src/utils/portone.js`](src/utils/portone.js))

- **역할**: 포트원 결제 시스템 연동
- **주요 기능**:
  - 결제 요청 처리
  - 결제 상태 확인
  - 환불 처리
  - 웹훅 처리

### 3. 통신 관련 유틸리티

#### 3.1 메일건 발송기 ([`src/utils/mailgunSender.js`](src/utils/mailgunSender.js))

- **역할**: Mailgun을 통한 이메일 발송
- **주요 기능**:
  - 이메일 템플릿 관리
  - 대량 이메일 발송
  - 발송 이력 추적
  - 에러 처리 및 재시도

#### 3.2 알림 템플릿 ([`src/utils/notificationTemplates.js`](src/utils/notificationTemplates.js))

- **역할**: 이메일 및 SMS 알림 템플릿 관리
- **주요 기능**:
  - 템플릿 정의 및 관리
  - 동적 데이터 바인딩
  - 다국어 지원
  - 브랜딩 적용

### 4. 기타 유틸리티

#### 4.1 코드 생성기 ([`src/utils/codeGenerator.js`](src/utils/codeGenerator.js))

- **역할**: 고유 코드 및 식별자 생성
- **주요 기능**:
  - UUID 생성
  - 주문번호 생성
  - 참조번호 생성
  - 중복 방지

#### 4.2 이메일 저장소 ([`src/utils/emailStore.js`](src/utils/emailStore.js))

- **역할**: 이메일 주소 관리 및 검증
- **주요 기능**:
  - 이메일 주소 검증
  - 도메인 관리
  - 스팸 방지
  - 이메일 정규화

---

## 🔧 개발 환경 설정

### 1. 환경 변수 설정

#### 개발 환경 (`.env.development`)

```bash
# 서버 설정
NODE_ENV=development
PORT=3000
HOST=localhost

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=funeral_platform_dev
DB_USER=postgres
DB_PASSWORD=your_password

# AWS S3 설정
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-northeast-2

# JWT 설정
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# 결제 시스템 설정
IAMPORT_API_KEY=your-iamport-api-key
IAMPORT_API_SECRET=your-iamport-api-secret
PORTONE_API_KEY=your-portone-api-key
PORTONE_API_SECRET=your-portone-api-secret

# 이메일 설정 (Mailgun)
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain
MAILGUN_FROM_EMAIL=noreply@yourdomain.com

# SMS 설정
SMS_API_KEY=your-sms-api-key
SMS_API_SECRET=your-sms-api-secret

# FCM 설정
FCM_SERVER_KEY=your-fcm-server-key
FCM_PROJECT_ID=your-fcm-project-id
```

#### 프로덕션 환경 (`.env.production`)

```bash
# 서버 설정
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 데이터베이스 설정 (프로덕션 DB 정보)
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=funeral_platform_prod
DB_USER=your_production_user
DB_PASSWORD=your_production_password

# AWS S3 설정 (프로덕션 버킷)
AWS_S3_BUCKET_NAME=your-production-bucket
AWS_ACCESS_KEY_ID=your-production-access-key
AWS_SECRET_ACCESS_KEY=your-production-secret-key
AWS_REGION=ap-northeast-2

# 보안 강화된 JWT 설정
JWT_SECRET=your-very-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-very-secure-jwt-refresh-secret-key
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# 기타 프로덕션 전용 설정...
```

### 2. 의존성 설치 및 관리

#### 필수 의존성 설치

```bash
# 프로젝트 의존성 설치
npm install

# 개발 의존성만 설치
npm install --only=dev

# 특정 버전 설치
npm install express@4.18.2 sequelize@6.35.2

# 글로벌 패키지 설치 (필요시)
npm install -g sequelize-cli nodemon
```

#### 의존성 관리

```bash
# 의존성 업데이트 확인
npm outdated

# 보안 취약점 점검
npm audit

# 보안 취약점 자동 수정
npm audit fix

# 패키지 잠금 파일 업데이트
npm shrinkwrap
```

### 3. 데이터베이스 설정

#### Sequelize 설정 파일 ([`sequelize-config.cjs`](sequelize-config.cjs))

```javascript
module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log,
    timezone: '+09:00',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    timezone: '+09:00',
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  },
};
```

#### 데이터베이스 연결 테스트

```bash
# 연결 테스트
npx sequelize-cli db:version --env development

# 데이터베이스 생성
npx sequelize-cli db:create --env development

# 테이블 생성 (모델 기반)
npx sequelize-cli db:migrate --env development

# 시드 데이터 삽입
npx sequelize-cli db:seed:all --env development
```

### 4. 서버 실행 및 관리

#### 개발 모드 실행

```bash
# 기본 실행
npm start

# 개발 모드 (자동 재시작)
npm run dev

# 디버그 모드
npm run debug

# 프로덕션 모드
npm run prod
```

#### 프로세스 관리

```bash
# PM2를 사용한 프로세스 관리
npm install -g pm2

# 애플리케이션 시작
pm2 start ecosystem.config.js

# 프로세스 상태 확인
pm2 status

# 로그 확인
pm2 logs

# 프로세스 재시작
pm2 restart funeral-platform

# 프로세스 중지
pm2 stop funeral-platform
```

### 5. 로그 및 모니터링 설정

#### 로그 설정

```bash
# 로그 디렉토리 생성
mkdir -p logs

# 로그 파일 권한 설정
chmod 755 logs/

# 로그 로테이션 설정 (logrotate)
sudo nano /etc/logrotate.d/funeral-platform
```

#### 모니터링 도구

```bash
# 시스템 리소스 모니터링
npm install -g htop iotop

# 네트워크 모니터링
npm install -g netstat-nat

# 로그 분석 도구
npm install -g logstash
```

---

## 📝 코드 품질 및 표준

### 1. 코딩 컨벤션

#### ESLint 설정 ([`.eslintrc`](.eslintrc))

```json
{
  "env": {
    "node": true,
    "es2022": true
  },
  "extends": ["eslint:recommended", "plugin:prettier/recommended"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-var": "error",
    "prefer-const": "error",
    "no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "no-console": ["warn", { "allow": ["warn", "error", "info"] }],
    "no-duplicate-imports": "error",
    "semi": ["error", "always"],
    "quotes": ["error", "single"],
    "indent": "off",
    "comma-dangle": ["error", "always-multiline"],
    "prettier/prettier": "error"
  }
}
```

#### Prettier 설정 ([`.prettierrc`](.prettierrc))

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "useTabs": false
}
```

#### Husky 설정 (Git Hooks)

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### 2. 주석 표준

#### JSDoc 주석 형식

```javascript
/**
 * 사용자 인증 처리
 *
 * @param {Object} userData - 사용자 데이터
 * @param {string} userData.email - 사용자 이메일
 * @param {string} userData.password - 사용자 비밀번호
 * @returns {Promise<Object>} 인증 결과
 * @throws {Error} 인증 실패 시 에러
 *
 * @example
 * const result = await authenticateUser({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 */
async function authenticateUser(userData) {
  // 함수 구현
}
```

#### 주석 작성 가이드라인

- **파일 헤더**: 파일의 목적과 작성자 정보
- **클래스 주석**: 클래스의 역할과 주요 기능
- **메서드 주석**: 입력, 동작, 반환, 예외 정보
- **변수 주석**: 복잡한 변수나 상수의 의미 설명
- **로직 주석**: 복잡한 비즈니스 로직의 설명

### 3. 에러 처리

#### 표준 에러 응답 형식

```javascript
// 성공 응답
{
  "success": true,
  "data": { ... },
  "message": "처리되었습니다."
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "인증에 실패했습니다.",
    "details": "토큰이 만료되었습니다."
  },
  "timestamp": "2025-01-27T12:00:00Z"
}
```

#### 에러 코드 체계

```javascript
// 인증 관련 에러 (AUTH_XXX)
AUTH_001: "토큰 만료",
AUTH_002: "권한 부족",
AUTH_003: "잘못된 인증 정보",

// 사용자 관련 에러 (USER_XXX)
USER_001: "사용자를 찾을 수 없음",
USER_002: "중복된 이메일",
USER_003: "잘못된 비밀번호",

// 결제 관련 에러 (PAYMENT_XXX)
PAYMENT_001: "잔액 부족",
PAYMENT_002: "결제 실패",
PAYMENT_003: "환불 처리 실패"
```

#### 에러 로깅 시스템

```javascript
// 에러 로깅 예시
const logger = require('../utils/logger');

try {
  // 비즈니스 로직
} catch (error) {
  logger.error('사용자 인증 실패', {
    error: error.message,
    stack: error.stack,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'AUTH_001',
      message: '인증 처리 중 오류가 발생했습니다.',
    },
  });
}
```

### 4. 코드 구조 및 네이밍

#### 파일 및 폴더 명명 규칙

```
src/
├── models/           # 데이터베이스 모델
├── routes/           # API 라우트
├── services/         # 비즈니스 로직
├── middlewares/      # 미들웨어
├── utils/            # 유틸리티 함수
└── config/           # 설정 파일
```

#### 변수 및 함수 명명 규칙

```javascript
// 변수명: camelCase
const userName = '홍길동';
const userEmail = 'user@example.com';

// 상수명: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DEFAULT_PAGE_SIZE = 20;

// 함수명: camelCase, 동사로 시작
function getUserById(userId) { ... }
function createNewUser(userData) { ... }
function updateUserProfile(userId, profileData) { ... }

// 클래스명: PascalCase
class UserService { ... }
class PaymentProcessor { ... }
```

### 5. 테스트 코드 표준

#### 테스트 파일 명명

```
__tests__/
├── models/
│   ├── User.test.js
│   └── Payment.test.js
├── services/
│   ├── AuthService.test.js
│   └── PaymentService.test.js
└── routes/
    ├── auth.test.js
    └── payment.test.js
```

#### 테스트 작성 가이드라인

```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      // Given
      const userData = { email: 'test@example.com', password: 'password123' };

      // When
      const result = await userService.createUser(userData);

      // Then
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });

    it('should throw error with invalid email', async () => {
      // Given
      const invalidUserData = { email: 'invalid-email', password: 'password123' };

      // When & Then
      await expect(userService.createUser(invalidUserData)).rejects.toThrow('Invalid email format');
    });
  });
});
```

---

## 🚨 주의사항 및 권장사항

### 1. 보안 관련

#### 환경 변수 및 민감 정보 관리

- **절대 금지**: 코드에 직접 API 키, 비밀번호, 데이터베이스 정보 하드코딩
- **환경별 분리**: 개발/스테이징/프로덕션 환경별 .env 파일 분리
- **접근 권한 제한**: .env 파일에 대한 읽기 권한을 필요한 사용자만 부여
- **정기적 로테이션**: API 키, JWT 시크릿 등을 정기적으로 변경

#### API 보안 강화

```javascript
// 보안 미들웨어 적용 순서
app.use(helmet()); // 보안 헤더 설정
app.use(cors(corsOptions)); // CORS 정책
app.use(rateLimit()); // 요청 제한
app.use(express.json({ limit: '10mb' })); // 요청 크기 제한
```

#### 데이터 검증 및 방어

```javascript
// 입력 데이터 검증 예시
const { body, validationResult } = require('express-validator');

const validateUserInput = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('phone').matches(/^[0-9-+()\s]+$/),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
```

### 2. 성능 관련

#### 데이터베이스 최적화

```sql
-- 자주 조회되는 필드에 인덱스 추가
CREATE INDEX idx_funeral_username ON funerals(funeral_username);
CREATE INDEX idx_manager_email ON managers(manager_email);
CREATE INDEX idx_cash_history_date ON funeral_cash_histories(created_at);

-- 복합 인덱스 (여러 조건으로 조회하는 경우)
CREATE INDEX idx_funeral_status_approved ON funerals(is_approved, approved_at);

-- 부분 인덱스 (특정 조건의 데이터만 인덱싱)
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;
```

#### 쿼리 최적화

```javascript
// N+1 문제 해결을 위한 include 사용
const funerals = await Funeral.findAll({
  include: [
    { model: FuneralAddDocument, as: 'documents' },
    { model: FuneralCashHistory, as: 'cashHistory' },
  ],
  where: { isApproved: true },
});

// 페이지네이션 적용
const { page = 1, limit = 20 } = req.query;
const offset = (page - 1) * limit;

const users = await User.findAndCountAll({
  limit: parseInt(limit),
  offset: parseInt(offset),
  order: [['createdAt', 'DESC']],
});
```

#### 파일 업로드 최적화

```javascript
// 스트리밍 방식으로 대용량 파일 처리
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    key: (req, file, cb) => {
      const fileName = `${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
  },
});
```

#### 캐싱 전략

```javascript
// Redis를 활용한 캐싱 구현
const redis = require('redis');
const client = redis.createClient();

const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // 원본 응답을 가로채서 캐시에 저장
      const originalSend = res.json;
      res.json = function (data) {
        client.setex(key, duration, JSON.stringify(data));
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      next();
    }
  };
};
```

### 3. 확장성 관련

#### 마이크로서비스 아키텍처 고려사항

```javascript
// 서비스 분리 예시
// auth-service: 인증 및 권한 관리
// user-service: 사용자 정보 관리
// payment-service: 결제 처리
// notification-service: 알림 발송

// 서비스 간 통신 (HTTP 또는 메시지 큐)
const axios = require('axios');

class UserService {
  async getUserById(userId) {
    try {
      const response = await axios.get(`${process.env.USER_SERVICE_URL}/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error('사용자 정보 조회 실패');
    }
  }
}
```

#### 로드 밸런싱 및 스케일링

```javascript
// PM2 클러스터 모드로 멀티 프로세스 실행
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'funeral-platform',
      script: 'src/index.js',
      instances: 'max', // CPU 코어 수만큼 인스턴스 생성
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        instances: 4, // 프로덕션에서는 적절한 인스턴스 수 설정
      },
    },
  ],
};
```

#### 데이터베이스 샤딩 전략

```javascript
// 데이터베이스 연결 풀 설정
const sequelize = new Sequelize(database, username, password, {
  host: host,
  dialect: 'postgres',
  pool: {
    max: 20, // 최대 연결 수
    min: 5, // 최소 연결 수
    acquire: 30000, // 연결 획득 타임아웃
    idle: 10000, // 유휴 연결 타임아웃
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});
```

### 4. 모니터링 및 로깅

#### 애플리케이션 모니터링

```javascript
// Winston을 활용한 구조화된 로깅
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// 프로덕션 환경에서는 콘솔 출력 제외
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}
```

#### 성능 모니터링

```javascript
// 응답 시간 모니터링 미들웨어
const responseTime = require('response-time');

app.use(
  responseTime((req, res, time) => {
    if (time > 1000) {
      // 1초 이상 걸리는 요청 로깅
      logger.warn('Slow request detected', {
        url: req.originalUrl,
        method: req.method,
        responseTime: `${time}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    }
  }),
);
```

### 5. 백업 및 복구

#### 데이터베이스 백업 전략

```bash
#!/bin/bash
# daily-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/database"
DB_NAME="funeral_platform"

# PostgreSQL 백업
pg_dump -h localhost -U postgres $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# S3에 백업 파일 업로드
aws s3 cp $BACKUP_DIR/backup_$DATE.sql s3://your-backup-bucket/database/

# 30일 이상 된 로컬 백업 파일 삭제
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

#### 파일 백업 전략

```javascript
// AWS S3 크로스 리전 복제 설정
const s3 = new AWS.S3();

// 백업 버킷에 파일 복사
const copyToBackup = async (sourceKey, backupKey) => {
  try {
    await s3
      .copyObject({
        Bucket: process.env.AWS_S3_BACKUP_BUCKET,
        CopySource: `${process.env.AWS_S3_BUCKET_NAME}/${sourceKey}`,
        Key: backupKey,
      })
      .promise();

    logger.info('File backed up successfully', { sourceKey, backupKey });
  } catch (error) {
    logger.error('Backup failed', { sourceKey, backupKey, error: error.message });
  }
};
```

---

## 📞 기술 지원 및 문의

### 1. 개발자 연락처

- **이메일**: [개발자 이메일]
- **연락처**: [개발자 연락처]

### 2. 주요 기술 문서

- **Sequelize 공식 문서**: https://sequelize.org/
- **Express.js 공식 문서**: https://expressjs.com/
- **AWS S3 개발자 가이드**: https://docs.aws.amazon.com/s3/

### 3. 문제 해결 가이드

- **로그 확인**: `logs/` 폴더의 로그 파일 확인
- **데이터베이스 연결**: `config/database.js` 설정 확인
- **환경 변수**: `.env.{NODE_ENV}` 파일 설정 확인

---

## 📋 인계 체크리스트

### ✅ 완료된 작업

- [x] **백엔드 API 개발 완료**
  - [x] 관리자 API (8개 모듈, 20+ 엔드포인트)
  - [x] 장례식장 API (12개 모듈, 30+ 엔드포인트)
  - [x] 상조팀장 API (11개 모듈, 25+ 엔드포인트)
  - [x] 공통 API (2개 모듈, 5+ 엔드포인트)
- [x] **데이터베이스 모델 설계 및 구현**
  - [x] 관리자 계층 모델 (3개)
  - [x] 장례식장 계층 모델 (4개)
  - [x] 상조팀장 계층 모델 (3개)
  - [x] 공통 모델 (1개)
- [x] **파일 업로드 시스템 구현**
  - [x] AWS S3 연동
  - [x] 다중 파일 업로드 지원
  - [x] 파일 형식 검증 및 보안
  - [x] 사용자별 저장 경로 분리
- [x] **인증 및 권한 관리 시스템 구현**
  - [x] JWT 기반 인증
  - [x] bcrypt 비밀번호 해싱
  - [x] RBAC 권한 관리
  - [x] 계층적 권한 구조
- [x] **결제 및 재무 시스템 구현**
  - [x] 포인트 시스템
  - [x] 캐시 시스템
  - [x] 환급 요청 시스템
  - [x] 외부 결제 시스템 연동
- [x] **코드 주석 및 문서화 완료**
  - [x] JSDoc 형식 주석
  - [x] 한국어 설명
  - [x] 입력/동작/반환/예외 구조
  - [x] 파일별 상세 설명
- [x] **에러 처리 및 로깅 시스템 구현**
  - [x] 표준화된 에러 응답
  - [x] 구조화된 로깅
  - [x] 에러 코드 체계
  - [x] 사용자 친화적 메시지

### 🔄 진행 중인 작업

- [ ] **사용자 테스트 및 피드백 수집**
  - [ ] 관리자 사용자 테스트
  - [ ] 장례식장 사용자 테스트
  - [ ] 상조팀장 사용자 테스트
  - [ ] 피드백 반영 및 수정
- [ ] **성능 최적화 및 튜닝**
  - [ ] 데이터베이스 쿼리 최적화
  - [ ] API 응답 시간 개선
  - [ ] 메모리 사용량 최적화
  - [ ] 파일 업로드 성능 향상
- [ ] **보안 취약점 점검 및 보완**
  - [ ] 보안 스캔 실행
  - [ ] 의존성 패키지 보안 점검
  - [ ] API 보안 강화
  - [ ] 데이터 암호화 적용

### 📋 향후 개선 사항

#### 단기 개선 (1-3개월)

- [ ] **모니터링 및 알림 시스템 구축**
  - [ ] 애플리케이션 성능 모니터링
  - [ ] 에러 알림 시스템
  - [ ] 사용자 활동 추적
  - [ ] 시스템 리소스 모니터링
- [ ] **자동화된 테스트 코드 작성**
  - [ ] 단위 테스트 (Jest)
  - [ ] 통합 테스트
  - [ ] API 테스트 (Supertest)
  - [ ] 테스트 커버리지 측정

#### 중기 개선 (3-6개월)

- [ ] **CI/CD 파이프라인 구축**
  - [ ] GitHub Actions 설정
  - [ ] 자동 테스트 및 배포
  - [ ] 코드 품질 검사 자동화
  - [ ] 환경별 배포 전략
- [ ] **백업 및 복구 시스템 강화**
  - [ ] 자동 데이터베이스 백업
  - [ ] 파일 백업 시스템
  - [ ] 재해 복구 계획
  - [ ] 백업 검증 및 테스트

#### 장기 개선 (6개월 이상)

- [ ] **마이크로서비스 아키텍처 전환**
  - [ ] 서비스 분리 및 모듈화
  - [ ] API Gateway 구축
  - [ ] 서비스 간 통신 최적화
  - [ ] 독립적 배포 및 스케일링
- [ ] **고급 기능 추가**
  - [ ] 실시간 알림 시스템
  - [ ] 고급 분석 및 리포팅
  - [ ] 다국어 지원
  - [ ] 모바일 앱 API 최적화

### 🔍 품질 관리 체크리스트

#### 코드 품질

- [x] ESLint 규칙 적용
- [x] Prettier 포맷팅 적용
- [x] Husky Git hooks 설정
- [x] 일관된 코딩 스타일
- [x] JSDoc 주석 표준화

#### 보안 품질

- [x] 환경 변수 관리
- [x] JWT 토큰 보안
- [x] 비밀번호 해싱
- [x] CORS 설정
- [x] 입력 데이터 검증

#### 성능 품질

- [x] 데이터베이스 인덱싱
- [x] 쿼리 최적화
- [x] 파일 업로드 제한
- [x] 에러 처리 최적화
- [x] 로깅 시스템

#### 문서화 품질

- [x] API 문서화
- [x] 코드 주석
- [x] 인계서 작성
- [x] 설치 가이드
- [x] 운영 가이드

---

## 🎉 프로젝트 완료 및 인계

이 문서는 장례 서비스 플랫폼 백엔드 프로젝트의 완전한 인계서입니다. 모든 주요 기능이 구현되었으며, 상세한 코드 주석과 함께 제공됩니다.

**프로젝트 성공적인 완료를 축하드립니다! 🎊**

---

_문서 작성일: 2025년 1월_  
_문서 버전: 1.0_  
_작성자: [개발자명]_
