// src/config/s3.js
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
//import path from 'path';

//dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const s3 = new S3Client({
  region: process.env.AWS_REGION, // 예: 'ap-northeast-2'
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const deleteS3Object = async (s3Url) => {
  try {
    const key = s3Url.split('.amazonaws.com/')[1]; // key 추출
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });
    await s3.send(command);
    console.log(`🗑️ S3 삭제 완료: ${key}`);
  } catch (error) {
    console.error('❌ S3 삭제 실패:', error);
  }
};

export default s3;
