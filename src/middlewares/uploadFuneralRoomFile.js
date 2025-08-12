/**
 * 장례식장 룸 파일 업로드 미들웨어 (Funeral Room File Upload Middleware)
 * - Express.js 애플리케이션에서 장례식장의 개별 룸(방) 관련 이미지 파일 업로드를 처리하는 multer 미들웨어입니다.
 * - AWS S3 클라우드 스토리지에 이미지 파일을 안전하게 저장하며, 이미지 형식 검증과 용량 제한을 적용합니다.
 * - 다중 이미지 파일 업로드를 지원하고, 고유한 파일명으로 중복을 방지합니다.
 */

import dotenv from 'dotenv';
import multer from 'multer';
import multerS3 from 'multer-s3';
import s3 from '../config/s3.js';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

/**
 * 장례식장 룸 파일 업로드 미들웨어 설정
 *
 * 입력:
 * - req: Object — HTTP 요청 객체
 * - file: Object — 업로드할 이미지 파일 정보
 * - cb: Function — 콜백 함수
 *
 * 동작:
 * 1) AWS S3 스토리지 설정으로 클라우드에 이미지 파일 저장
 * 2) 고유한 파일명 생성으로 중복 방지
 * 3) 이미지 파일 형식 검증 (JPG, JPEG, PNG)
 * 4) 파일 크기 제한 (5MB)
 *
 * 반환:
 * - Object: multer 미들웨어 객체
 *
 * 예외:
 * - 파일 형식 오류: 이미지가 아닌 파일 형식 시 오류 발생
 * - 파일 크기 초과: 5MB 초과 시 오류 발생
 */
const uploadFuneralRoomFile = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    key: (req, file, cb) => {
      const filename = `funeral_room_files/${Date.now()}-${file.originalname}`;
      cb(null, filename);
    },
  }),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;

    const isAllowed = allowedTypes.test(file.mimetype);

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG image files are allowed.'));
    }
  },
});

/**
 * 미들웨어 내보내기
 *
 * 입력:
 * - fieldName: string — 파일 업로드 필드명 (기본값: 'funeralRoomFiles')
 * - maxCount: number — 최대 업로드 파일 개수 (기본값: 10)
 *
 * 동작:
 * 1) array() 메서드를 사용하여 다중 이미지 파일 업로드 지원
 * 2) 최대 파일 개수 제한 적용
 *
 * 반환:
 * - Function: Express.js 미들웨어 함수
 *
 * 참고:
 * - 다중 이미지 파일 업로드를 지원하며, 최대 10개 파일까지 동시 업로드 가능
 * - 업로드된 이미지 파일은 req.files 배열로 접근 가능
 * - 장례식장 룸 전용 폴더(funeral_room_files/)에 저장
 */
export default uploadFuneralRoomFile.array('funeralRoomFiles', 10);
