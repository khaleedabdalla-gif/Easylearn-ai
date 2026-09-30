const multer = require('multer');
const path = require('path');

// Store files on disk in the /uploads folder, with a unique filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Only allow the file types EasyLearn AI supports
const allowedTypes = ['.pdf', '.docx', '.txt', '.pptx'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file — adjust if needed
  },
});

// "documents" is the form field name the frontend must use
// 30 is the max files allowed in a single batch
module.exports = upload.array('documents', 30);