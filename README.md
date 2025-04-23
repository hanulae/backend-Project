# 장례 애플리케이션 백엔드

## 프로젝트 소개

이 프로젝트는 장례 서비스를 위한 애플리케이션의 백엔드 시스템입니다. RESTful API를 제공하여 장례 서비스를 지원합니다.

## 기술 스택

- **Node.js**: v18+
- **프레임워크**: Express.js
- **데이터베이스**: PostgreSQL
- **ORM**: Sequelize
- **인증**: JWT
- **보안**: Helmet
- **로깅**: Winston, Morgan
- **압축**: Compression
- **개발 도구**: ESLint, Prettier, Husky, lint-staged
- **테스트**: Jest

## 시작하기

### 사전 요구사항

- Node.js v18 이상
- PostgreSQL 데이터베이스
- npm 또는 yarn

### 설치 방법

```bash
# 저장소 클론
git clone https://github.com/hanulae/backend-Project.git
cd backend-Project

# 의존성 설치
npm install

# 개발 환경 설정
# 프로젝트 루트에 .env.development 파일 생성
```

### 환경 변수 설정

각 환경별로 다음과 같이 .env 파일을 설정해야 합니다:

**.env.development** (개발 환경)

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=funeralAppDev
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3000
```

**.env.production** (운영 환경)

```
DB_HOST=your_production_host
DB_PORT=5432
DB_NAME=funeralAppProd
DB_USER=your_production_user
DB_PASSWORD=your_production_password
PORT=3000
```

**.env.test** (테스트 환경)

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=funeralAppTest
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3000
```

### 데이터베이스 설정

PostgreSQL에서 다음 명령으로 데이터베이스를 생성하세요:

```sql
CREATE DATABASE "funeralAppDev";
```

### 개발 서버 실행

```bash
npm run dev
```

### 운영 서버 실행

```bash
npm start
```

### 테스트 실행

```bash
npm test
```

## 프로젝트 구조

```
src/
├── config/         # 설정 파일 (데이터베이스, 로거 등)
├── models/         # Sequelize 모델
├── controllers/    # API 컨트롤러
├── routes/         # API 라우트 정의
├── middleware/     # 미들웨어 함수들
├── utils/          # 유틸리티 함수
├── services/       # 비즈니스 로직
├── dao/            # 데이터 접근 객체
├── app.js          # Express 앱 설정
└── index.js        # 애플리케이션 진입점
```

## 개발 가이드라인

### 코드 스타일

- ESLint와 Prettier를 사용하여 코드 스타일 일관성 유지
- 커밋 전 자동으로 코드 포맷팅 및 린팅 수행 (Husky + lint-staged)

### 브랜치 전략

- `main`: 배포용 안정 버전
- `develop`: 개발 통합 브랜치
- `feature/*`: 새로운 기능 개발
- `bugfix/*`: 버그 수정
- `hotfix/*`: 긴급 수정

### 커밋 메시지 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 변경
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드
chore: 빌드 프로세스 변경
```

## 배포 가이드

### 패키지 빌드

```bash
npm run build
```

## 라이센스

ISC

## 참여자

- 이정현 (개발자)
- 김반석 (개발자)
- 김종진 (개발자)
