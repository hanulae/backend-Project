import dotenv from 'dotenv';
import multer from 'multer';
import multerS3 from 'multer-s3';
import s3 from '../config/s3.js'; // AWS S3 연결 모듈
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'public-read',
    key: (req, file, cb) => {
      const filename = `manager_files/${Date.now()}-${file.originalname}`;
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const isAllowed = allowedTypes.test(file.mimetype);
    if (isAllowed) cb(null, true);
    else cb(new Error('Only PDF, JPG, JPEG, PNG files are allowed.'));
  },
});

export default upload.single('managerAddFile');
