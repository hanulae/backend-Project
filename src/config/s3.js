/**
 * AWS S3 클라우드 스토리지 설정 및 관리
 * - Amazon Web Services(AWS)의 Simple Storage Service(S3)와의 연결을 설정하고 관리하는 설정 파일
 * - 클라우드 기반 객체 스토리지 서비스로 파일 업로드, 다운로드, 삭제 등의 기능 제공
 * - AWS SDK v3를 사용하여 S3 클라이언트를 구성하고 환경별 설정 관리 및 파일 삭제 기능 포함
 *
 * 주요 기능:
 * - AWS S3 클라이언트 설정 및 연결 관리
 * - 환경별 설정 파일 관리 (.env.development, .env.production 등)
 * - AWS 인증 정보 관리 (Access Key, Secret Key)
 * - AWS 리전 설정 및 관리
 * - S3 객체 삭제 기능 구현
 *
 * 환경 변수:
 * - NODE_ENV: 실행 환경 (development, production, test 등)
 * - AWS_REGION: AWS 리전 (ap-northeast-2, us-east-1 등)
 * - AWS_ACCESS_KEY_ID: AWS 액세스 키 ID
 * - AWS_SECRET_ACCESS_KEY: AWS 시크릿 액세스 키
 * - AWS_S3_BUCKET_NAME: S3 버킷 이름
 */

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

/**
 * AWS S3 클라이언트 인스턴스 생성
 *
 * 입력:
 * - region: String — AWS 서비스가 위치한 리전 (환경 변수에서 가져옴)
 * - credentials: Object — AWS 인증 정보 (Access Key, Secret Key)
 *
 * 동작:
 * 1) AWS SDK v3를 사용하여 S3 서비스와의 연결을 위한 클라이언트 생성
 * 2) 리전, 인증 정보 등을 환경 변수에서 가져와 설정
 * 3) 안전하고 효율적인 S3 서비스 접근을 보장
 *
 * 반환:
 * - S3Client: AWS S3 서비스와 연결된 클라이언트 인스턴스
 *
 * 예외:
 * - 연결 실패: AWS S3 서버 연결 오류 발생
 */
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * S3 객체 삭제 함수
 *
 * 입력:
 * - s3Url: String — 삭제할 S3 객체의 전체 URL
 *
 * 동작:
 * 1) S3 URL에서 객체 키 추출
 * 2) DeleteObjectCommand 생성 및 설정
 * 3) S3 클라이언트를 통한 삭제 명령 실행
 * 4) 성공/실패 결과 로깅
 * 5) 에러 발생 시 적절한 처리
 *
 * 반환:
 * - Promise<void>: 삭제 작업 완료를 나타내는 Promise
 *
 * 예외:
 * - 네트워크 연결 오류: S3 서버 연결 실패
 * - 인증 실패: AWS 인증 정보 오류
 * - 권한 부족: S3 객체 삭제 권한 없음
 * - 객체가 존재하지 않음: 삭제할 파일이 S3에 없음
 */
export const deleteS3Object = async (s3Url) => {
  try {
    const key = s3Url.split('.amazonaws.com/')[1];

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    await s3.send(command);

    console.log(`🗑️ S3 삭제 완료: ${key}`);
  } catch (error) {
    console.error('❌ S3 삭제 실패:', error);

    console.error('삭제 실패 상세 정보:', {
      s3Url,
      bucket: process.env.AWS_S3_BUCKET_NAME,
      errorMessage: error.message,
      errorCode: error.Code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
    });
  }
};

export default s3;
