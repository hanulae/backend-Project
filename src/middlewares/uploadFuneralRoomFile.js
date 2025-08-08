import dotenv from 'dotenv';
import multer from 'multer';
import multerS3 from 'multer-s3';
import s3 from '../config/s3.js';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const uploadFuneralRoomFile = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    key: (req, file, cb) => {
      const filename = `funeral_room_files/${Date.now()}-${file.originalname}`;
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const isAllowed = allowedTypes.test(file.mimetype);
    if (isAllowed) cb(null, true);
    else cb(new Error('Only JPG, JPEG, PNG image files are allowed.'));
  },
});

export default uploadFuneralRoomFile.array('funeralRoomFiles', 10);
