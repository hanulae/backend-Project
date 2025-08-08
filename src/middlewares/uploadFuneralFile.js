import dotenv from 'dotenv';
import multer from 'multer';
import multerS3 from 'multer-s3';
import s3 from '../config/s3.js';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const uploadFuneralFile = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    key: (req, file, cb) => {
      const filename = `funeral_files/${Date.now()}-${file.originalname}`;
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log('🚀 ~ file:', file);
    const allowedExt = /\.(jpeg|jpg|png|pdf)$/i;
    const allowedMime = /jpeg|jpg|png|pdf/;
    const isMimeAllowed = allowedMime.test(file.mimetype);
    const isExtAllowed = allowedExt.test(file.originalname);

    if (isMimeAllowed || isExtAllowed) cb(null, true);
    else cb(new Error('Only PDF, JPG, JPEG, PNG files are allowed.'));
  },
});

export default uploadFuneralFile.array('funeralAddFile', 10);
